const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * 身份验证中间件
 */
async function authMiddleware(req, res, next) {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证token
    const decoded = verifyToken(token);
    
    // 查询用户
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    // 更新最后活跃时间
    user.lastActiveAt = new Date();
    await user.save();

    // 将用户信息附加到请求对象
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '认证失败: ' + error.message
    });
  }
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('错误:', err);
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

/**
 * 包装异步路由处理器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  authMiddleware,
  errorHandler,
  asyncHandler
};

