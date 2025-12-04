const app = getApp();
const cache = require('../../utils/cache.js');

Page({
  data: {
    reports: [],
    loading: false,
    generating: false,
    periodType: 'weekly',
    periodOptions: [
      { label: '最近一周', value: 'weekly' },
      { label: '最近一月', value: 'monthly' }
    ]
  },

  onLoad() {
    this.loadReports();
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadReports();
  },

  // 加载报告列表
  async loadReports() {
    try {
      // 先从缓存加载
      const cachedReports = cache.get('analysis_reports', false);
      if (cachedReports) {
        this.setData({
          reports: cachedReports,
          loading: false
        });
      } else {
        this.setData({ loading: true });
      }

      // 后台请求最新数据
      const result = await app.request({
        url: '/api/analysis/reports',
        method: 'GET',
        data: {
          page: 1,
          limit: 20
        }
      });

      if (result.code === 0) {
        // 更新缓存
        cache.set('analysis_reports', result.data.reports, 5 * 60 * 1000); // 5分钟过期

        this.setData({
          reports: result.data.reports,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载报告失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 选择周期
  selectPeriod(e) {
    this.setData({
      periodType: e.currentTarget.dataset.value
    });
  },

  // 生成分析报告
  async generateReport() {
    if (this.data.generating) {
      return;
    }

    wx.showModal({
      title: '生成分析报告',
      content: `将分析您${this.data.periodType === 'weekly' ? '最近一周' : '最近一月'}的聊天内容,生成自我成长报告`,
      confirmText: '开始分析',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ generating: true });
          wx.showLoading({ title: '分析中...', mask: true });

          try {
            const result = await app.request({
              url: '/api/analysis/generate',
              method: 'POST',
              data: {
                type: this.data.periodType
              }
            });

            wx.hideLoading();

            if (result.code === 0) {
              wx.showToast({
                title: '分析完成',
                icon: 'success'
              });

              // 跳转到报告详情页
              setTimeout(() => {
                wx.navigateTo({
                  url: `/pages/report-detail/report-detail?id=${result.data.reportId}`
                });
              }, 1500);

              // 清除缓存并刷新列表
              cache.remove('analysis_reports');
              this.loadReports();
            } else {
              throw new Error(result.message);
            }
          } catch (error) {
            wx.hideLoading();
            console.error('生成报告失败:', error);
            wx.showModal({
              title: '分析失败',
              content: error.message || '请稍后重试',
              showCancel: false
            });
          } finally {
            this.setData({ generating: false });
          }
        }
      }
    });
  },

  // 查看报告详情
  viewReport(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/report-detail/report-detail?id=${id}`
    });
  },

  // 删除报告
  deleteReport(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/api/analysis/report/${id}`,
              method: 'DELETE'
            });

            if (result.code === 0) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              // 清除缓存并刷新列表
              cache.remove('analysis_reports');
              this.loadReports();
            }
          } catch (error) {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  },

  // 获取周期文本
  getPeriodText(type) {
    const map = {
      'weekly': '周报告',
      'monthly': '月报告',
      'custom': '自定义'
    };
    return map[type] || type;
  }
});

