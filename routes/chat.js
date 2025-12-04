const express = require('express');
const { Message, Conversation, UserProfile } = require('../models');
const { chatCompletion, buildSystemPrompt } = require('../utils/deepseek');
const { authMiddleware, asyncHandler } = require('../middleware');
const { Op } = require('sequelize');
const { webSearch, formatSearchResults, needsWebSearch } = require('../utils/search');

const router = express.Router();

// 所有聊天相关接口都需要认证
router.use(authMiddleware);

/**
 * 发送消息
 * POST /api/chat/send
 * Body: { content: "消息内容", conversationId: 可选, enableWebSearch: 可选(布尔值) }
 */
router.post('/send', asyncHandler(async (req, res) => {
  const { content, conversationId, enableWebSearch = false } = req.body;
  const userId = req.userId;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      code: 400,
      message: '消息内容不能为空'
    });
  }

  // 获取或创建会话
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({
      where: { id: conversationId, userId }
    });
    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在'
      });
    }
  } else {
    // 获取默认会话
    conversation = await Conversation.findOne({
      where: { userId },
      order: [['createdAt', 'ASC']]
    });
    
    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        title: '默认对话'
      });
    }
  }

  // 保存用户消息
  const userMessage = await Message.create({
    userId,
    conversationId: conversation.id,
    role: 'user',
    content: content.trim()
  });

  try {
    // 获取最近的对话历史(最近20条)
    const recentMessages = await Message.findAll({
      where: {
        userId,
        conversationId: conversation.id,
        id: { [Op.lte]: userMessage.id }
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // 反转为正序
    recentMessages.reverse();

    // 获取用户画像
    const userProfile = await UserProfile.findOne({
      where: { userId }
    });

    // 构建消息数组
    const messages = [];
    
    // 添加系统提示
    messages.push({
      role: 'system',
      content: buildSystemPrompt(userProfile, req.user.preferences)
    });

    // 添加历史对话(排除最后一条,即当前用户消息)
    for (let i = 0; i < recentMessages.length - 1; i++) {
      const msg = recentMessages[i];
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // 检查是否需要联网搜索
    let searchResults = null;
    let searchInfo = null;
    const shouldSearch = enableWebSearch || needsWebSearch(content.trim());

    console.log('=== 联网搜索调试信息 ===');
    console.log('enableWebSearch:', enableWebSearch);
    console.log('用户问题:', content.trim());
    console.log('是否需要搜索:', shouldSearch);

    if (shouldSearch) {
      console.log('✅ 开始执行联网搜索...');
      try {
        searchResults = await webSearch(content.trim(), 5);
        console.log('搜索结果:', searchResults);
        
        if (searchResults && searchResults.results) {
          searchInfo = {
            source: searchResults.source,
            count: searchResults.results.length,
            urls: searchResults.results.map(r => r.url)
          };
          
          console.log(`✅ 搜索成功! 来源: ${searchInfo.source}, 结果数: ${searchInfo.count}`);
          
          // 将搜索结果添加到上下文
          const searchContext = formatSearchResults(searchResults);
          messages.push({
            role: 'system',
            content: `以下是从${searchResults.source}获取的最新搜索结果，请基于这些实时信息回答用户的问题：${searchContext}\n\n重要：请在回答中引用这些搜索结果，并特别注明这些是来自搜索引擎的最新信息。`
          });
        } else {
          console.log('⚠️ 搜索未返回有效结果');
        }
      } catch (error) {
        console.error('❌ 联网搜索失败:', error);
      }
    } else {
      console.log('⏭️ 跳过联网搜索');
    }
    console.log('=== 搜索调试结束 ===\n');

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: content.trim()
    });

    // 调用DeepSeek
    const aiResponse = await chatCompletion(messages, {
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error);
    }

    // 保存AI回复
    const assistantMessage = await Message.create({
      userId,
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.content,
      meta: {
        model: aiResponse.model,
        usage: aiResponse.usage,
        webSearch: searchInfo // 保存搜索信息
      }
    });

    // 更新会话时间
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      code: 0,
      data: {
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          createdAt: userMessage.createdAt
        },
        assistantMessage: {
          id: assistantMessage.id,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt,
          meta: assistantMessage.meta
        }
      },
      message: '发送成功'
    });

  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      code: 500,
      message: 'AI回复失败: ' + error.message
    });
  }
}));

/**
 * 获取聊天历史
 * GET /api/chat/history
 * Query: { conversationId: 可选, page: 页码, limit: 每页数量 }
 */
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { conversationId, page = 1, limit = 50 } = req.query;

  const where = { userId };
  if (conversationId) {
    where.conversationId = conversationId;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows: messages } = await Message.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: offset,
    attributes: ['id', 'role', 'content', 'createdAt', 'conversationId']
  });

  // 反转消息顺序,使其按时间正序
  messages.reverse();

  res.json({
    code: 0,
    data: {
      messages,
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
 * 获取会话列表
 * GET /api/chat/conversations
 */
router.get('/conversations', asyncHandler(async (req, res) => {
  const userId = req.userId;

  const conversations = await Conversation.findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']],
    attributes: ['id', 'title', 'createdAt', 'updatedAt']
  });

  res.json({
    code: 0,
    data: conversations
  });
}));

/**
 * 创建新会话
 * POST /api/chat/conversation
 * Body: { title: "会话标题" }
 */
router.post('/conversation', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { title = '新对话' } = req.body;

  const conversation = await Conversation.create({
    userId,
    title
  });

  res.json({
    code: 0,
    data: conversation,
    message: '创建成功'
  });
}));

/**
 * 更新会话标题
 * PUT /api/chat/conversation/:id
 * Body: { title: "新标题" }
 */
router.put('/conversation/:id', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const conversationId = req.params.id;
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      code: 400,
      message: '标题不能为空'
    });
  }

  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId }
  });

  if (!conversation) {
    return res.status(404).json({
      code: 404,
      message: '会话不存在'
    });
  }

  conversation.title = title.trim();
  await conversation.save();

  res.json({
    code: 0,
    data: conversation,
    message: '更新成功'
  });
}));

/**
 * 生成会话标题
 * POST /api/chat/conversation/:id/generate-title
 */
router.post('/conversation/:id/generate-title', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const conversationId = req.params.id;

  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId }
  });

  if (!conversation) {
    return res.status(404).json({
      code: 404,
      message: '会话不存在'
    });
  }

  // 获取会话的前几条消息
  const messages = await Message.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    limit: 4,
    attributes: ['role', 'content']
  });

  if (messages.length === 0) {
    return res.json({
      code: 0,
      data: { title: '新对话' },
      message: '暂无消息'
    });
  }

  try {
    // 使用AI生成标题
    const prompt = {
      role: 'system',
      content: '你是一个标题生成助手。根据用户和AI的对话内容，生成一个简短、准确、有吸引力的对话标题。标题应该：1）不超过20个字 2）概括对话主题 3）使用中文 4）不要加引号。只返回标题文本，不要其他内容。'
    };

    const conversationContext = messages.map(m => 
      `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`
    ).join('\n');

    const aiResponse = await chatCompletion([
      prompt,
      { role: 'user', content: `请为以下对话生成标题：\n\n${conversationContext}` }
    ], {
      temperature: 0.7,
      max_tokens: 50
    });

    if (aiResponse.success) {
      let title = aiResponse.content.trim();
      // 移除可能的引号
      title = title.replace(/^["']|["']$/g, '');
      // 限制长度
      if (title.length > 30) {
        title = title.substring(0, 30) + '...';
      }

      // 更新会话标题
      conversation.title = title;
      await conversation.save();

      res.json({
        code: 0,
        data: { title },
        message: '生成成功'
      });
    } else {
      throw new Error('AI生成标题失败');
    }
  } catch (error) {
    console.error('生成标题失败:', error);
    res.json({
      code: 0,
      data: { title: '新对话' },
      message: '使用默认标题'
    });
  }
}));

/**
 * 删除会话
 * DELETE /api/chat/conversation/:id
 */
router.delete('/conversation/:id', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const conversationId = req.params.id;

  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId }
  });

  if (!conversation) {
    return res.status(404).json({
      code: 404,
      message: '会话不存在'
    });
  }

  // 删除会话及其消息
  await Message.destroy({
    where: { conversationId }
  });

  await conversation.destroy();

  res.json({
    code: 0,
    message: '删除成功'
  });
}));

module.exports = router;

