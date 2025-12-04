/**
 * 联网搜索工具
 * 支持多个搜索引擎
 */

const axios = require('axios');

/**
 * 使用 Bing Search API 进行搜索
 * 注意：需要在环境变量中配置 BING_SEARCH_KEY
 */
async function bingSearch(query, count = 5) {
  try {
    const apiKey = process.env.BING_SEARCH_KEY;
    if (!apiKey) {
      console.warn('Bing Search API Key 未配置');
      return null;
    }

    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
      params: {
        q: query,
        count: count,
        textDecorations: false,
        textFormat: 'Raw'
      },
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      },
      timeout: 10000
    });

    if (response.data && response.data.webPages) {
      return response.data.webPages.value.map(item => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet
      }));
    }

    return [];
  } catch (error) {
    console.error('Bing搜索失败:', error.message);
    return null;
  }
}

/**
 * 使用 SerpAPI 进行搜索
 * 注意：需要在环境变量中配置 SERPAPI_KEY
 */
async function serpApiSearch(query, count = 5) {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      console.warn('⚠️ SerpAPI Key 未配置');
      return null;
    }

    console.log(`🔍 正在使用 SerpAPI 搜索: "${query}"`);
    console.log(`📌 API Key: ${apiKey.substring(0, 10)}...`);

    const params = {
      q: query,
      api_key: apiKey,
      engine: 'google',
      num: count,
      hl: 'zh-cn',
      gl: 'cn',
      tbm: 'nws'  // 新闻搜索
    };

    console.log('📤 请求参数:', { ...params, api_key: '***' });

    const response = await axios.get('https://serpapi.com/search', {
      params: params,
      timeout: 15000
    });

    console.log('📥 SerpAPI响应状态:', response.status);
    console.log('📊 返回数据:', JSON.stringify(response.data, null, 2).substring(0, 500));

    // 优先使用新闻结果
    if (response.data && response.data.news_results && response.data.news_results.length > 0) {
      console.log(`✅ 找到 ${response.data.news_results.length} 条新闻结果`);
      return response.data.news_results.map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || item.title,
        date: item.date || '最近'
      }));
    }

    // 其次使用普通搜索结果
    if (response.data && response.data.organic_results && response.data.organic_results.length > 0) {
      console.log(`✅ 找到 ${response.data.organic_results.length} 条搜索结果`);
      return response.data.organic_results.map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || item.title
      }));
    }

    console.log('⚠️ SerpAPI 未返回有效结果');
    return null;
  } catch (error) {
    console.error('❌ SerpAPI搜索失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.status, error.response.data);
    }
    return null;
  }
}

/**
 * 使用百度搜索（临时方案，用于测试）
 * 注意：这只是模拟搜索，返回示例数据
 */
async function baiduSearch(query, count = 5) {
  console.log(`使用模拟搜索: ${query}`);
  
  // 返回模拟的搜索结果
  const mockResults = [
    {
      title: `关于"${query}"的最新信息`,
      url: 'https://www.baidu.com/s?wd=' + encodeURIComponent(query),
      snippet: `这是关于"${query}"的最新搜索结果。由于API配置问题，当前显示的是模拟数据。请配置 SERPAPI_KEY 或 BING_SEARCH_KEY 以获取真实的搜索结果。`
    }
  ];
  
  return mockResults;
}

/**
 * 简单的DuckDuckGo搜索（无需API Key）
 */
async function duckDuckGoSearch(query, count = 5) {
  try {
    // DuckDuckGo的Instant Answer API
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_html: 1,
        skip_disambig: 1
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DailyFocus/1.0)'
      }
    });

    const results = [];

    // 处理 Abstract
    if (response.data.Abstract && response.data.AbstractURL) {
      results.push({
        title: response.data.Heading || query,
        url: response.data.AbstractURL,
        snippet: response.data.Abstract
      });
    }

    // 处理 RelatedTopics
    if (response.data.RelatedTopics) {
      const topics = response.data.RelatedTopics
        .filter(item => item.FirstURL && item.Text)
        .slice(0, count - results.length)
        .map(item => ({
          title: item.Text.split(' - ')[0] || item.Text.substring(0, 50),
          url: item.FirstURL,
          snippet: item.Text
        }));
      
      results.push(...topics);
    }
      
    return results.length > 0 ? results : null;
  } catch (error) {
    console.error('DuckDuckGo搜索失败:', error.message);
    return null;
  }
}

/**
 * 通用搜索函数，自动尝试多个搜索引擎
 */
async function webSearch(query, count = 5) {
  console.log(`\n========== 开始搜索 ==========`);
  console.log(`🔎 搜索关键词: "${query}"`);
  console.log(`📊 请求结果数: ${count}`);
  console.log(`🔧 环境变量检查:`);
  console.log(`   - SERPAPI_KEY: ${process.env.SERPAPI_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   - BING_SEARCH_KEY: ${process.env.BING_SEARCH_KEY ? '✅ 已配置' : '❌ 未配置'}`);

  // 按优先级尝试不同的搜索引擎
  let results = null;

  // 1. 尝试 SerpAPI (Google)
  if (process.env.SERPAPI_KEY) {
    console.log('\n📍 尝试方案1: SerpAPI (Google)');
    results = await serpApiSearch(query, count);
    if (results && results.length > 0) {
      console.log(`✅ SerpAPI 成功! 找到 ${results.length} 个结果`);
      console.log(`========== 搜索完成 ==========\n`);
      return { source: 'Google', results };
    } else {
      console.log('⚠️ SerpAPI 未返回结果，尝试下一个方案...');
    }
  } else {
    console.log('\n⏭️ 跳过 SerpAPI (未配置)');
  }

  // 2. 尝试 Bing Search
  if (process.env.BING_SEARCH_KEY) {
    console.log('\n📍 尝试方案2: Bing Search');
    results = await bingSearch(query, count);
    if (results && results.length > 0) {
      console.log(`✅ Bing Search 成功! 找到 ${results.length} 个结果`);
      console.log(`========== 搜索完成 ==========\n`);
      return { source: 'Bing', results };
    } else {
      console.log('⚠️ Bing Search 未返回结果，尝试下一个方案...');
    }
  } else {
    console.log('\n⏭️ 跳过 Bing Search (未配置)');
  }

  // 3. 尝试 DuckDuckGo (无需API Key)
  console.log('\n📍 尝试方案3: DuckDuckGo (免费)');
  results = await duckDuckGoSearch(query, count);
  if (results && results.length > 0) {
    console.log(`✅ DuckDuckGo 成功! 找到 ${results.length} 个结果`);
    console.log(`========== 搜索完成 ==========\n`);
    return { source: 'DuckDuckGo', results };
  } else {
    console.log('⚠️ DuckDuckGo 未返回结果');
  }

  // 4. 最后使用模拟搜索（用于测试）
  console.log('\n📍 使用方案4: 模拟搜索（兜底）');
  console.log('❌ 所有真实搜索引擎都未能返回结果');
  results = await baiduSearch(query, count);
  console.log(`========== 搜索完成 ==========\n`);
  return { source: '模拟搜索（请检查API配置）', results };
}

/**
 * 格式化搜索结果为文本
 */
function formatSearchResults(searchData) {
  if (!searchData || !searchData.results || searchData.results.length === 0) {
    return '未找到相关搜索结果。';
  }

  const { source, results } = searchData;
  let text = `\n\n**搜索结果 (来自 ${source}):**\n\n`;

  results.forEach((result, index) => {
    text += `${index + 1}. **${result.title}**\n`;
    text += `   ${result.snippet}\n`;
    text += `   来源: ${result.url}\n\n`;
  });

  return text;
}

/**
 * 判断查询是否需要联网搜索
 */
function needsWebSearch(query) {
  // 关键词匹配
  const timeKeywords = ['今天', '最新', '现在', '当前', '实时', '最近', '今年', '2024', '2025'];
  const searchKeywords = ['搜索', '查找', '找一下', '帮我找', '查询'];
  const newsKeywords = ['新闻', '消息', '事件', '发生', '报道'];
  const priceKeywords = ['价格', '多少钱', '报价', '股价'];
  
  const allKeywords = [...timeKeywords, ...searchKeywords, ...newsKeywords, ...priceKeywords];
  
  return allKeywords.some(keyword => query.includes(keyword));
}

module.exports = {
  webSearch,
  formatSearchResults,
  needsWebSearch,
  bingSearch,
  serpApiSearch,
  duckDuckGoSearch,
  baiduSearch
};

