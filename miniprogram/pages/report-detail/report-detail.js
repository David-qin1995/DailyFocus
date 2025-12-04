const app = getApp();

Page({
  data: {
    reportId: null,
    report: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ reportId: options.id });
      this.loadReport();
    }
  },

  async loadReport() {
    try {
      this.setData({ loading: true });

      const result = await app.request({
        url: `/api/analysis/report/${this.data.reportId}`,
        method: 'GET'
      });

      if (result.code === 0) {
        this.setData({
          report: result.data,
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

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
});

