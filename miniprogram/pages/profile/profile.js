const app = getApp();
const cache = require('../../utils/cache.js');

Page({
  data: {
    profile: null,
    stats: null,
    loading: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      // 先从缓存加载
      const cachedProfile = cache.get('user_profile', false);
      const cachedStats = cache.get('user_stats', false);
      
      if (cachedProfile && cachedStats) {
        this.setData({
          profile: cachedProfile,
          stats: cachedStats,
          loading: false
        });
      } else {
        this.setData({ loading: true });
      }

      // 后台请求最新数据
      const [profileResult, statsResult] = await Promise.all([
        app.request({ url: '/api/profile/get', method: 'GET' }),
        app.request({ url: '/api/profile/stats', method: 'GET' })
      ]);

      if (profileResult.code === 0 && statsResult.code === 0) {
        // 处理画像数据，添加百分比字段
        const profile = profileResult.data;
        if (profile.traits && profile.traits.abilities) {
          profile.traits.abilities = profile.traits.abilities.map(item => ({
            ...item,
            scorePercent: (item.score * 100).toFixed(0)
          }));
        }

        // 更新缓存
        cache.set('user_profile', profile, 10 * 60 * 1000); // 10分钟过期
        cache.set('user_stats', statsResult.data, 10 * 60 * 1000);

        this.setData({
          profile: profile,
          stats: statsResult.data,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setData({ loading: false });
    }
  },

  // 导出数据
  async exportData() {
    wx.showLoading({ title: '导出中...' });

    try {
      const result = await app.request({
        url: '/api/profile/export',
        method: 'GET'
      });

      wx.hideLoading();

      if (result.code === 0) {
        // 将数据保存到本地
        const filePath = `${wx.env.USER_DATA_PATH}/ai_assistant_export_${Date.now()}.json`;
        wx.getFileSystemManager().writeFile({
          filePath: filePath,
          data: JSON.stringify(result.data, null, 2),
          encoding: 'utf8',
          success: () => {
            wx.showModal({
              title: '导出成功',
              content: '数据已保存到本地',
              showCancel: false
            });
          },
          fail: () => {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  },

  // 清空数据
  clearData() {
    wx.showModal({
      title: '确认清空数据',
      content: '将清空所有聊天记录、分析报告和用户画像,此操作无法撤销!',
      confirmText: '确认清空',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清空中...', mask: true });

          try {
            const result = await app.request({
              url: '/api/profile/clear',
              method: 'DELETE'
            });

            wx.hideLoading();

            if (result.code === 0) {
              wx.showToast({
                title: '清空成功',
                icon: 'success'
              });

              // 清除所有缓存
              cache.clear();

              setTimeout(() => {
                this.loadData();
                // 刷新其他页面
                wx.reLaunch({
                  url: '/pages/chat/chat'
                });
              }, 1500);
            }
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 查看画像详情
  viewProfileDetail() {
    const profile = this.data.profile;
    
    let content = '';
    
    if (profile.longTermPatterns && profile.longTermPatterns.length > 0) {
      content = profile.longTermPatterns.join('\n\n');
    } else {
      content = '暂无长期画像数据,多聊天并生成分析报告后会逐渐建立您的个人画像。';
    }

    wx.showModal({
      title: '我的画像',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
});


