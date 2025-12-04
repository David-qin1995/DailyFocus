const jwt = require('jsonwebtoken');

// JWT密钥,生产环境应该从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 生成JWT token
 * @param {Object} payload - 载荷数据
 * @param {String} expiresIn - 过期时间,默认7天
 * @returns {String} token
 */
function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证JWT token
 * @param {String} token 
 * @returns {Object} 解码后的payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = {
  generateToken,
  verifyToken
};

