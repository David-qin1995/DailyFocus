App({
  globalData: {
    token: '',
    userId: null,
    // 修改为你的云托管API地址（注意：末尾不要加斜杠）
    apiBaseUrl: 'https://express-041i-205191-6-1390387111.sh.run.tcloudbase.com'
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.userId = wx.getStorageSync('userId');
    } else {
      // 自动登录
      this.login();
    }
  },

  // 登录方法
  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端登录接口
          wx.request({
            url: `${this.globalData.apiBaseUrl}/api/auth/login`,
            method: 'POST',
            data: {
              code: res.code
            },
            success: (response) => {
              if (response.data.code === 0) {
                const { token, userId } = response.data.data;
                this.globalData.token = token;
                this.globalData.userId = userId;
                
                // 保存到本地存储
                wx.setStorageSync('token', token);
                wx.setStorageSync('userId', userId);
                
                console.log('登录成功');
              } else {
                wx.showToast({
                  title: '登录失败',
                  icon: 'none'
                });
              }
            },
            fail: (error) => {
              console.error('登录失败:', error);
              wx.showToast({
                title: '登录失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 通用请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      // 智能拼接URL，处理可能的双斜杠问题
      let url = options.url;
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      
      wx.request({
        url: `${this.globalData.apiBaseUrl}${url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 401) {
            // token过期,重新登录
            this.login();
            reject(new Error('请重新登录'));
          } else {
            resolve(res.data);
          }
        },
        fail: reject
      });
    });
  }
});


