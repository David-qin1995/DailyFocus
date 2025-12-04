const app = getApp();

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    scrollIntoView: '',
    conversationId: null
  },

  onLoad(options) {
    if (options.conversationId) {
      this.setData({
        conversationId: options.conversationId
      });
    }
    this.loadHistory();
  },

  // 加载聊天历史
  async loadHistory() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await app.request({
        url: '/api/chat/history',
        method: 'GET',
        data: {
          conversationId: this.data.conversationId,
          page: 1,
          limit: 100
        }
      });

      if (result.code === 0) {
        this.setData({
          messages: result.data.messages
        });
        this.scrollToBottom();
      }
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('加载历史失败:', error);
    }
  },

  // 输入框变化
  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 发送消息
  async sendMessage() {
    const content = this.data.inputText.trim();
    
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    if (this.data.loading) {
      return;
    }

    // 添加用户消息到界面
    const userMessage = {
      role: 'user',
      content: content,
      createdAt: new Date().toISOString()
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputText: '',
      loading: true
    });

    this.scrollToBottom();

    try {
      const result = await app.request({
        url: '/api/chat/send',
        method: 'POST',
        data: {
          content: content,
          conversationId: this.data.conversationId
        }
      });

      if (result.code === 0) {
        // 移除临时消息,添加服务器返回的消息
        const messages = this.data.messages.slice(0, -1);
        messages.push(result.data.userMessage);
        messages.push(result.data.assistantMessage);

        this.setData({
          messages: messages,
          loading: false
        });

        this.scrollToBottom();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('发送失败:', error);
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });

      this.setData({
        loading: false
      });
    }
  },

  // 滚动到底部
  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollIntoView: `msg-${this.data.messages.length - 1}`
      });
    }, 100);
  },

  // 格式化时间
  formatTime(time) {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  }
});


