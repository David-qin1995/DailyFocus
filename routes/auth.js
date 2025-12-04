const express = require('express');
const axios = require('axios');
const { User, Conversation, UserProfile } = require('../models');
const { generateToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware');

const router = express.Router();

const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

/**
 * 微信小程序登录
 * POST /api/auth/login
 * Body: { code: "微信登录code" }
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      code: 400,
      message: '缺少登录code'
    });
  }

  // 调用微信接口获取openid
  let openid;
  
  // 如果在微信云托管环境,可以直接从请求头获取
  if (req.headers['x-wx-source'] && req.headers['x-wx-openid']) {
    openid = req.headers['x-wx-openid'];
  } else {
    // 否则调用微信API
    try {
      const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: WECHAT_APPID,
          secret: WECHAT_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      if (wxResponse.data.errcode) {
        return res.status(400).json({
          code: 400,
          message: '微信登录失败: ' + wxResponse.data.errmsg
        });
      }

      openid = wxResponse.data.openid;
    } catch (error) {
      console.error('微信登录失败:', error);
      return res.status(500).json({
        code: 500,
        message: '微信登录失败'
      });
    }
  }

  // 查找或创建用户
  let user = await User.findOne({ where: { openid } });
  
  if (!user) {
    // 创建新用户
    user = await User.create({
      openid,
      lastActiveAt: new Date()
    });

    // 创建默认会话
    await Conversation.create({
      userId: user.id,
      title: '默认对话'
    });

    // 创建用户画像
    await UserProfile.create({
      userId: user.id
    });
  } else {
    // 更新最后活跃时间
    user.lastActiveAt = new Date();
    await user.save();
  }

  // 生成token
  const token = generateToken({ userId: user.id, openid: user.openid });

  res.json({
    code: 0,
    data: {
      token,
      userId: user.id,
      isNewUser: !user.createdAt
    },
    message: '登录成功'
  });
}));

/**
 * 获取用户信息
 * GET /api/auth/userinfo
 */
router.get('/userinfo', asyncHandler(async (req, res) => {
  // 从请求头获取token并验证
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌'
    });
  }

  const token = authHeader.substring(7);
  const { verifyToken } = require('../utils/jwt');
  
  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'nickname', 'preferences', 'createdAt', 'lastActiveAt']
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: user
    });
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '认证失败'
    });
  }
}));

module.exports = router;

