const express = require('express');
const { Message, Conversation, UserProfile } = require('../models');
const { chatCompletion, buildSystemPrompt } = require('../utils/deepseek');
const { authMiddleware, asyncHandler } = require('../middleware');
const { Op } = require('sequelize');

const router = express.Router();

// 所有聊天相关接口都需要认证
router.use(authMiddleware);

/**
 * 发送消息
 * POST /api/chat/send
 * Body: { content: "消息内容", conversationId: 可选 }
 */
router.post('/send', asyncHandler(async (req, res) => {
  const { content, conversationId } = req.body;
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
        usage: aiResponse.usage
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
          createdAt: assistantMessage.createdAt
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

