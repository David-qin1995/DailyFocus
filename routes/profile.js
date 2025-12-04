const express = require('express');
const { UserProfile, User, Message, AnalysisReport } = require('../models');
const { authMiddleware, asyncHandler } = require('../middleware');

const router = express.Router();

// 所有画像相关接口都需要认证
router.use(authMiddleware);

/**
 * 获取用户画像
 * GET /api/profile/get
 */
router.get('/get', asyncHandler(async (req, res) => {
  const userId = req.userId;

  let profile = await UserProfile.findOne({
    where: { userId },
    attributes: ['id', 'traits', 'longTermPatterns', 'historySnapshots', 'updatedAt']
  });

  if (!profile) {
    // 如果不存在,创建一个空画像
    profile = await UserProfile.create({ userId });
  }

  res.json({
    code: 0,
    data: profile
  });
}));

/**
 * 更新用户偏好设置
 * POST /api/profile/preferences
 * Body: { replyTone, analysisFrequency, languageStyle }
 */
router.post('/preferences', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { replyTone, analysisFrequency, languageStyle } = req.body;

  const user = await User.findByPk(userId);
  
  if (!user) {
    return res.status(404).json({
      code: 404,
      message: '用户不存在'
    });
  }

  const preferences = user.preferences || {};
  
  if (replyTone) preferences.replyTone = replyTone;
  if (analysisFrequency) preferences.analysisFrequency = analysisFrequency;
  if (languageStyle) preferences.languageStyle = languageStyle;

  user.preferences = preferences;
  await user.save();

  res.json({
    code: 0,
    data: preferences,
    message: '更新成功'
  });
}));

/**
 * 获取统计数据
 * GET /api/profile/stats
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // 获取消息总数
  const totalMessages = await Message.count({
    where: { userId, role: 'user' }
  });

  // 获取报告总数
  const totalReports = await AnalysisReport.count({
    where: { userId }
  });

  // 获取最近一次对话时间
  const lastMessage = await Message.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
    attributes: ['createdAt']
  });

  // 获取用户创建时间
  const user = await User.findByPk(userId, {
    attributes: ['createdAt']
  });

  // 计算使用天数
  const daysSinceJoin = user 
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  res.json({
    code: 0,
    data: {
      totalMessages,
      totalReports,
      daysSinceJoin,
      lastMessageAt: lastMessage ? lastMessage.createdAt : null
    }
  });
}));

/**
 * 清空所有数据
 * DELETE /api/profile/clear
 */
router.delete('/clear', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // 删除所有相关数据
  await Message.destroy({ where: { userId } });
  await AnalysisReport.destroy({ where: { userId } });
  await UserProfile.destroy({ where: { userId } });
  
  // 重新创建空画像
  await UserProfile.create({ userId });

  res.json({
    code: 0,
    message: '所有数据已清空'
  });
}));

/**
 * 导出数据
 * GET /api/profile/export
 */
router.get('/export', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // 获取用户所有数据
  const user = await User.findByPk(userId, {
    attributes: ['id', 'nickname', 'preferences', 'createdAt']
  });

  const messages = await Message.findAll({
    where: { userId },
    order: [['createdAt', 'ASC']],
    attributes: ['role', 'content', 'createdAt']
  });

  const reports = await AnalysisReport.findAll({
    where: { userId },
    order: [['createdAt', 'ASC']],
    attributes: ['periodType', 'startAt', 'endAt', 'summary', 'createdAt']
  });

  const profile = await UserProfile.findOne({
    where: { userId },
    attributes: ['traits', 'longTermPatterns', 'historySnapshots']
  });

  const exportData = {
    exportTime: new Date().toISOString(),
    user,
    messages,
    reports,
    profile
  };

  res.json({
    code: 0,
    data: exportData,
    message: '数据导出成功'
  });
}));

module.exports = router;

