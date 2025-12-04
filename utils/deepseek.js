const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 调用DeepSeek聊天API
 * @param {Array} messages - 消息数组
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} API响应
 */
async function chatCompletion(messages, options = {}) {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: options.model || 'deepseek-chat',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model
    };
  } catch (error) {
    console.error('DeepSeek API调用失败:', error.response?.data || error.message);
    
    // 处理特定的错误类型
    let errorMessage = error.message;
    
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      errorMessage = apiError.message || apiError.type || errorMessage;
      
      // 处理内容风险错误
      if (errorMessage.includes('Content Exists Risk') || apiError.type === 'content_policy_violation') {
        console.warn('⚠️ 内容风险检测触发');
        errorMessage = '抱歉，这个问题可能涉及敏感内容，请换个方式提问';
      }
      
      // 处理速率限制
      if (errorMessage.includes('rate_limit') || apiError.type === 'rate_limit_exceeded') {
        errorMessage = '请求过于频繁，请稍后再试';
      }
      
      // 处理API密钥错误
      if (errorMessage.includes('invalid_api_key') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'API密钥配置错误，请联系管理员';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 构建系统提示词
 * @param {Object} userProfile - 用户画像
 * @param {Object} preferences - 用户偏好
 * @returns {String} 系统提示词
 */
function buildSystemPrompt(userProfile = null, preferences = {}) {
  const tone = preferences.replyTone || 'gentle';
  const toneDescriptions = {
    gentle: '温和、理解、支持',
    direct: '直接、简洁、高效',
    professional: '专业、客观、理性'
  };

  let prompt = `你是一个友好的AI助手，帮助用户解答问题和提供建议。

回复风格: ${toneDescriptions[tone]}

注意事项:
1. 提供准确、有用的信息
2. 回答要具体、实用
3. 保持友好和专业的态度

`;

  if (userProfile && userProfile.traits) {
    prompt += `\n以下是截至目前的用户画像摘要(仅供参考,不要机械复述给用户):\n`;
    
    if (userProfile.traits.personality && userProfile.traits.personality.length > 0) {
      const personalityDesc = userProfile.traits.personality
        .map(p => `${p.name}(${(p.score * 100).toFixed(0)}%)`)
        .join('、');
      prompt += `性格倾向: ${personalityDesc}\n`;
    }
    
    if (userProfile.longTermPatterns && userProfile.longTermPatterns.length > 0) {
      prompt += `长期关注的主题: ${userProfile.longTermPatterns.slice(0, 2).join('; ')}\n`;
    }
  }

  return prompt;
}

/**
 * 构建分析提示词
 * @param {String} messagesText - 用户消息文本
 * @returns {String} 分析提示词
 */
function buildAnalysisPrompt(messagesText) {
  return `你将看到一个用户在一段时间内对AI说的话(只包含用户的表达)。请你扮演一个温和、理性、尊重隐私的"自我成长助手",分析这些内容,并输出一个JSON,包含以下字段:

questions: 用户在这段时间里反复关注的"核心问题"列表
  每个元素包含:
    topic: 用4~10个字概括的主题(例如"职业方向犹豫")
    description: 用几句话描述这个主题下用户在纠结什么

strengths: 从语言和行为中可以看出的优势、优点或有价值的特质(字符串数组)

improvements: 用户在行为、思考或习惯上可以改进的地方(字符串数组)

keepDoing: 用户已经在做、并且值得继续坚持的行为或思路(字符串数组)

要求:
1. 用简洁的中文表达
2. 尽量具体,避免空泛的鸡汤
3. 不做任何疾病诊断或严重负面标签
4. JSON顶层字段必须是: questions, strengths, improvements, keepDoing
5. 每个数组至少包含1-3个元素

以下是用户在本周期的聊天内容:
"""
${messagesText}
"""

请直接输出JSON格式的分析结果:`;
}

module.exports = {
  chatCompletion,
  buildSystemPrompt,
  buildAnalysisPrompt
};

