/**
 * 缓存工具类
 * 实现"先显示缓存，后台更新"策略
 */

class CacheManager {
  constructor() {
    this.prefix = 'cache_';
    this.defaultExpire = 5 * 60 * 1000; // 默认5分钟过期
  }

  /**
   * 生成缓存key
   */
  getCacheKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} data 缓存数据
   * @param {number} expire 过期时间（毫秒），0表示永不过期
   */
  set(key, data, expire = this.defaultExpire) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        expire: expire
      };
      wx.setStorageSync(this.getCacheKey(key), cacheData);
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @param {boolean} checkExpire 是否检查过期（false则返回过期数据）
   * @returns {any} 缓存数据，不存在或过期返回null
   */
  get(key, checkExpire = true) {
    try {
      const cacheData = wx.getStorageSync(this.getCacheKey(key));
      
      if (!cacheData) {
        return null;
      }

      // 不检查过期，直接返回
      if (!checkExpire) {
        return cacheData.data;
      }

      // 永不过期
      if (cacheData.expire === 0) {
        return cacheData.data;
      }

      // 检查是否过期
      const now = Date.now();
      if (now - cacheData.timestamp > cacheData.expire) {
        // 过期了，删除缓存
        this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  remove(key) {
    try {
      wx.removeStorageSync(this.getCacheKey(key));
      return true;
    } catch (error) {
      console.error('删除缓存失败:', error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    try {
      const info = wx.getStorageInfoSync();
      info.keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          wx.removeStorageSync(key);
        }
      });
      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 获取缓存时间戳
   */
  getTimestamp(key) {
    try {
      const cacheData = wx.getStorageSync(this.getCacheKey(key));
      return cacheData ? cacheData.timestamp : null;
    } catch (error) {
      return null;
    }
  }
}

// 导出单例
const cache = new CacheManager();

module.exports = cache;

