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
      console.warn('SerpAPI Key 未配置');
      return null;
    }

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: apiKey,
        engine: 'google',
        num: count,
        hl: 'zh-cn',
        gl: 'cn'
      },
      timeout: 10000
    });

    if (response.data && response.data.organic_results) {
      return response.data.organic_results.map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet
      }));
    }

    return [];
  } catch (error) {
    console.error('SerpAPI搜索失败:', error.message);
    return null;
  }
}

/**
 * 简单的DuckDuckGo搜索（无需API Key）
 */
async function duckDuckGoSearch(query, count = 5) {
  try {
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

    if (response.data && response.data.RelatedTopics) {
      const results = response.data.RelatedTopics
        .filter(item => item.FirstURL && item.Text)
        .slice(0, count)
        .map(item => ({
          title: item.Text.split(' - ')[0],
          url: item.FirstURL,
          snippet: item.Text
        }));
      
      return results.length > 0 ? results : null;
    }

    return null;
  } catch (error) {
    console.error('DuckDuckGo搜索失败:', error.message);
    return null;
  }
}

/**
 * 通用搜索函数，自动尝试多个搜索引擎
 */
async function webSearch(query, count = 5) {
  console.log(`开始搜索: ${query}`);

  // 按优先级尝试不同的搜索引擎
  let results = null;

  // 1. 尝试 SerpAPI (Google)
  if (process.env.SERPAPI_KEY) {
    results = await serpApiSearch(query, count);
    if (results && results.length > 0) {
      console.log(`使用 SerpAPI 找到 ${results.length} 个结果`);
      return { source: 'Google', results };
    }
  }

  // 2. 尝试 Bing Search
  if (process.env.BING_SEARCH_KEY) {
    results = await bingSearch(query, count);
    if (results && results.length > 0) {
      console.log(`使用 Bing 找到 ${results.length} 个结果`);
      return { source: 'Bing', results };
    }
  }

  // 3. 最后尝试 DuckDuckGo (无需API Key)
  results = await duckDuckGoSearch(query, count);
  if (results && results.length > 0) {
    console.log(`使用 DuckDuckGo 找到 ${results.length} 个结果`);
    return { source: 'DuckDuckGo', results };
  }

  console.log('所有搜索引擎都未能返回结果');
  return null;
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
  duckDuckGoSearch
};

