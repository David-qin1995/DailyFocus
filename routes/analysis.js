const express = require('express');
const { Message, AnalysisReport, UserProfile } = require('../models');
const { chatCompletion, buildAnalysisPrompt } = require('../utils/deepseek');
const { authMiddleware, asyncHandler } = require('../middleware');
const { Op } = require('sequelize');

const router = express.Router();

// 所有分析相关接口都需要认证
router.use(authMiddleware);

/**
 * 生成分析报告
 * POST /api/analysis/generate
 * Body: { type: "weekly|monthly|custom", startAt: 开始时间, endAt: 结束时间 }
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const userId = req.userId;
  let { type = 'weekly', startAt, endAt } = req.body;

  // 如果没有指定时间范围,根据type自动计算
  if (!startAt || !endAt) {
    const now = new Date();
    endAt = now.toISOString();
    
    if (type === 'weekly') {
      // 最近7天
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startAt = start.toISOString();
    } else if (type === 'monthly') {
      // 最近30天
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startAt = start.toISOString();
    }
  }

  // 获取时间范围内的用户消息
  const messages = await Message.findAll({
    where: {
      userId,
      role: 'user',
      createdAt: {
        [Op.between]: [new Date(startAt), new Date(endAt)]
      }
    },
    order: [['createdAt', 'ASC']],
    attributes: ['content', 'createdAt']
  });

  if (messages.length === 0) {
    return res.status(400).json({
      code: 400,
      message: '该时间段内没有聊天记录'
    });
  }

  // 构建消息文本
  const messagesText = messages.map(msg => {
    const date = new Date(msg.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    return `[${date}] ${msg.content}`;
  }).join('\n\n');

  try {
    // 调用DeepSeek进行分析
    const analysisPrompt = buildAnalysisPrompt(messagesText);
    
    const aiResponse = await chatCompletion([
      {
        role: 'user',
        content: analysisPrompt
      }
    ], {
      temperature: 0.3,  // 降低温度以获得更稳定的输出
      max_tokens: 3000
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error);
    }

    // 解析JSON结果
    let summary;
    try {
      // 尝试提取JSON
      const content = aiResponse.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        summary = JSON.parse(content);
      }

      // 验证必需字段
      if (!summary.questions || !summary.strengths || !summary.improvements || !summary.keepDoing) {
        throw new Error('分析结果缺少必需字段');
      }
    } catch (parseError) {
      console.error('JSON解析失败:', aiResponse.content);
      throw new Error('分析结果格式错误');
    }

    // 保存分析报告
    const report = await AnalysisReport.create({
      userId,
      periodType: type,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      summary,
      rawModelInfo: {
        model: aiResponse.model,
        usage: aiResponse.usage,
        promptVersion: 'analysis-v1'
      }
    });

    // 更新用户画像
    await updateUserProfile(userId, summary);

    res.json({
      code: 0,
      data: {
        reportId: report.id,
        summary: report.summary,
        period: {
          type,
          startAt,
          endAt
        },
        messageCount: messages.length
      },
      message: '分析完成'
    });

  } catch (error) {
    console.error('生成分析报告失败:', error);
    res.status(500).json({
      code: 500,
      message: '分析失败: ' + error.message
    });
  }
}));

/**
 * 获取报告详情
 * GET /api/analysis/report/:id
 */
router.get('/report/:id', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const reportId = req.params.id;

  const report = await AnalysisReport.findOne({
    where: { id: reportId, userId },
    attributes: ['id', 'periodType', 'startAt', 'endAt', 'summary', 'createdAt']
  });

  if (!report) {
    return res.status(404).json({
      code: 404,
      message: '报告不存在'
    });
  }

  res.json({
    code: 0,
    data: report
  });
}));

/**
 * 获取报告列表
 * GET /api/analysis/reports
 * Query: { page, limit }
 */
router.get('/reports', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows: reports } = await AnalysisReport.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: offset,
    attributes: ['id', 'periodType', 'startAt', 'endAt', 'createdAt']
  });

  res.json({
    code: 0,
    data: {
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  });
}));

/**
 * 删除报告
 * DELETE /api/analysis/report/:id
 */
router.delete('/report/:id', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const reportId = req.params.id;

  const report = await AnalysisReport.findOne({
    where: { id: reportId, userId }
  });

  if (!report) {
    return res.status(404).json({
      code: 404,
      message: '报告不存在'
    });
  }

  await report.destroy();

  res.json({
    code: 0,
    message: '删除成功'
  });
}));

/**
 * 更新用户画像(内部函数)
 */
async function updateUserProfile(userId, analysisData) {
  try {
    let profile = await UserProfile.findOne({ where: { userId } });
    
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    const traits = profile.traits || { personality: [], abilities: [], values: [] };
    const longTermPatterns = profile.longTermPatterns || [];
    const historySnapshots = profile.historySnapshots || [];

    // 从分析结果中提取特征并更新
    // 这里做简单的累积,实际可以更复杂
    
    // 更新能力评分
    const abilityMapping = {
      '自我反思': analysisData.strengths.filter(s => s.includes('反思') || s.includes('思考')).length > 0,
      '执行力': analysisData.improvements.filter(i => i.includes('拖延') || i.includes('行动')).length === 0,
      '规划能力': analysisData.keepDoing.filter(k => k.includes('计划') || k.includes('规划')).length > 0
    };

    // 简单的评分更新(可以更精细)
    if (abilityMapping['自我反思']) {
      updateOrAddTrait(traits.abilities, '自我反思能力', 0.05);
    }
    if (abilityMapping['执行力']) {
      updateOrAddTrait(traits.abilities, '执行力', 0.03);
    }
    if (abilityMapping['规划能力']) {
      updateOrAddTrait(traits.abilities, '规划能力', 0.03);
    }

    // 添加长期模式
    if (analysisData.questions && analysisData.questions.length > 0) {
      const mainTopics = analysisData.questions.map(q => q.topic).join('、');
      const patternText = `持续关注: ${mainTopics}`;
      
      if (!longTermPatterns.some(p => p.includes(mainTopics))) {
        longTermPatterns.push(patternText);
        // 只保留最近5条
        if (longTermPatterns.length > 5) {
          longTermPatterns.shift();
        }
      }
    }

    // 添加历史快照
    historySnapshots.push({
      date: new Date().toISOString().split('T')[0],
      keyChanges: analysisData.questions.length > 0 
        ? `关注: ${analysisData.questions[0].topic}` 
        : '持续成长中'
    });
    
    // 只保留最近10条快照
    if (historySnapshots.length > 10) {
      historySnapshots.shift();
    }

    profile.traits = traits;
    profile.longTermPatterns = longTermPatterns;
    profile.historySnapshots = historySnapshots;
    
    await profile.save();
    
  } catch (error) {
    console.error('更新用户画像失败:', error);
  }
}

/**
 * 更新或添加特质
 */
function updateOrAddTrait(traitsArray, name, increment) {
  const existing = traitsArray.find(t => t.name === name);
  
  if (existing) {
    // 平滑更新: new = 0.8 * old + 0.2 * (old + increment)
    existing.score = Math.min(1, existing.score * 0.8 + (existing.score + increment) * 0.2);
  } else {
    traitsArray.push({
      name,
      score: 0.5 + increment
    });
  }
}

module.exports = router;

