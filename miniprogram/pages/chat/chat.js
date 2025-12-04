const app = getApp();
const cache = require('../../utils/cache.js');

Page({
  data: {
    messages: [],
    conversations: [],
    currentConversationId: null,
    currentTitle: '新对话',
    inputText: '',
    loading: false,
    scrollIntoView: '',
    showSidebar: false,
    enableWebSearch: false // 联网搜索开关
  },

  // Markdown转HTML
  formatMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // 转义HTML特殊字符
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // 代码块 ```code```
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background:#f6f8fa;padding:10px;border-radius:6px;margin:6px 0;overflow-x:auto;"><code>$2</code></pre>');
    
    // 行内代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background:#f6f8fa;padding:2px 6px;border-radius:3px;font-family:Consolas,Monaco,monospace;font-size:0.9em;">$1</code>');
    
    // 分隔线 ---
    html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e1e4e8;margin:10px 0;"/>');
    
    // 粗体 **text**
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong style="font-weight:600;">$1</strong>');
    
    // 斜体 *text*
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    // 标题 # ## ###
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:1.05em;font-weight:600;margin:8px 0 4px;line-height:1.3;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:1.1em;font-weight:600;margin:8px 0 4px;line-height:1.3;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:1.15em;font-weight:600;margin:8px 0 4px;line-height:1.3;">$1</h1>');
    
    // 无序列表 - item 或 * item
    html = html.replace(/^[\-\*] (.+)$/gm, '<li style="margin:2px 0 2px 20px;">$1</li>');
    
    // 有序列表 1. item
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0 2px 20px;list-style-type:decimal;">$1</li>');
    
    // 链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" style="color:#1890ff;text-decoration:underline;">$1</a>');
    
    // 换行符转换（减少连续换行）
    html = html.replace(/\n\n+/g, '<br/><br/>'); // 多个换行变成一个段落间距
    html = html.replace(/\n/g, '<br/>');
    
    // 包装在div中，设置基础样式
    html = `<div style="line-height:1.65;color:#333;word-break:break-word;">${html}</div>`;
    
    return html;
  },

  onLoad(options) {
    this.loadConversations();
    if (options.conversationId) {
      this.switchConversation({
        currentTarget: {
          dataset: {
            id: options.conversationId
          }
        }
      });
    }
  },

  onShow() {
    this.loadConversations();
  },

  // 加载会话列表
  async loadConversations() {
    try {
      // 先从缓存加载
      const cachedData = cache.get('conversations', false); // 不检查过期，先显示
      if (cachedData) {
        // 确保有timeText字段
        const conversations = cachedData.map(item => ({
          ...item,
          timeText: item.timeText || this.formatConversationTime(item.updatedAt)
        }));
        
        this.setData({
          conversations: conversations
        });

        // 如果当前没有会话且列表不为空，自动选择第一个
        if (!this.data.currentConversationId && conversations.length > 0) {
          this.setData({
            currentConversationId: conversations[0].id,
            currentTitle: conversations[0].title
          });
          this.loadHistory(conversations[0].id);
        }
      }

      // 后台请求最新数据
      const result = await app.request({
        url: '/api/chat/conversations',
        method: 'GET'
      });

      if (result.code === 0) {
        // 预处理数据：添加时间文本
        const conversations = result.data.map(item => ({
          ...item,
          timeText: this.formatConversationTime(item.updatedAt)
        }));

        // 更新缓存
        cache.set('conversations', conversations, 3 * 60 * 1000); // 3分钟过期

        this.setData({
          conversations: conversations
        });

        // 如果当前没有会话且列表不为空，自动选择第一个
        if (!this.data.currentConversationId && conversations.length > 0) {
          this.setData({
            currentConversationId: conversations[0].id,
            currentTitle: conversations[0].title
          });
          this.loadHistory(conversations[0].id);
        }
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  },

  // 加载聊天历史
  async loadHistory(conversationId) {
    if (!conversationId) return;

    const cacheKey = `chat_history_${conversationId}`;

    try {
      // 先从缓存加载
      const cachedMessages = cache.get(cacheKey, false);
      if (cachedMessages && cachedMessages.length > 0) {
        this.setData({
          messages: cachedMessages
        });
        this.scrollToBottom();
      }

      // 后台请求最新数据
      const result = await app.request({
        url: '/api/chat/history',
        method: 'GET',
        data: {
          conversationId: conversationId,
          page: 1,
          limit: 100
        }
      });

      if (result.code === 0) {
        // 格式化消息内容
        const messages = result.data.messages.map(msg => {
          if (msg.role === 'assistant') {
            return {
              ...msg,
              formattedContent: this.formatMarkdown(msg.content)
            };
          }
          return msg;
        });
        
        // 更新缓存
        cache.set(cacheKey, messages, 5 * 60 * 1000); // 5分钟过期
        
        this.setData({
          messages: messages
        });
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('加载历史失败:', error);
    }
  },

  // 创建新会话
  async createNewChat() {
    try {
      wx.showLoading({ title: '创建中...' });

      const result = await app.request({
        url: '/api/chat/conversation',
        method: 'POST',
        data: {
          title: '新对话'
        }
      });

      wx.hideLoading();

      if (result.code === 0) {
        // 刷新会话列表
        await this.loadConversations();
        
        // 切换到新会话
        this.setData({
          currentConversationId: result.data.id,
          currentTitle: result.data.title,
          messages: [],
          showSidebar: false
        });

        wx.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 1500
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('创建会话失败:', error);
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  },

  // 切换会话
  async switchConversation(e) {
    const conversationId = e.currentTarget.dataset.id;
    const conversation = this.data.conversations.find(c => c.id === conversationId);

    if (!conversation) return;

    this.setData({
      currentConversationId: conversationId,
      currentTitle: conversation.title,
      messages: [],
      showSidebar: false
    });

    await this.loadHistory(conversationId);
  },

  // 删除会话
  async deleteConversation(e) {
    const conversationId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个对话吗？',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });

            const result = await app.request({
              url: `/api/chat/conversation/${conversationId}`,
              method: 'DELETE'
            });

            wx.hideLoading();

            if (result.code === 0) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });

              // 如果删除的是当前会话，清空消息
              if (this.data.currentConversationId === conversationId) {
                this.setData({
                  currentConversationId: null,
                  currentTitle: '新对话',
                  messages: []
                });
              }

              // 刷新会话列表
              await this.loadConversations();
            }
          } catch (error) {
            wx.hideLoading();
            console.error('删除会话失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 切换侧边栏
  toggleSidebar() {
    this.setData({
      showSidebar: !this.data.showSidebar
    });
  },

  // 输入框变化
  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 切换联网搜索
  toggleWebSearch() {
    this.setData({
      enableWebSearch: !this.data.enableWebSearch
    });
    
    wx.showToast({
      title: this.data.enableWebSearch ? '已开启联网搜索' : '已关闭联网搜索',
      icon: 'none',
      duration: 1500
    });
  },

  // 发送消息
  async sendMessage() {
    const content = this.data.inputText.trim();
    
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    if (this.data.loading) {
      return;
    }

    // 如果没有当前会话，先创建一个
    if (!this.data.currentConversationId) {
      await this.createNewChat();
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
          conversationId: this.data.currentConversationId,
          enableWebSearch: this.data.enableWebSearch
        }
      });

      if (result.code === 0) {
        // 更新消息列表
        const messages = this.data.messages.slice(0, -1);
        messages.push({
          ...result.data.userMessage,
          role: 'user'
        });
        
        // 格式化AI消息
        const assistantMsg = {
          ...result.data.assistantMessage,
          role: 'assistant',
          formattedContent: this.formatMarkdown(result.data.assistantMessage.content),
          meta: result.data.assistantMessage.meta
        };
        messages.push(assistantMsg);

        this.setData({
          messages: messages,
          loading: false
        });

        this.scrollToBottom();

        // 更新当前会话的消息缓存
        const cacheKey = `chat_history_${this.data.currentConversationId}`;
        cache.set(cacheKey, messages, 5 * 60 * 1000);

        // 如果是新会话的第一条消息，自动生成标题
        if (this.data.currentTitle === '新对话' && messages.length === 2) {
          this.generateConversationTitle();
        }

        // 刷新会话列表（更新时间戳）
        this.loadConversations();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('发送失败:', error);
      
      // 移除临时消息
      const messages = this.data.messages.slice(0, -1);
      this.setData({
        messages: messages,
        loading: false
      });

      wx.showToast({
        title: '发送失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 滚动到底部
  scrollToBottom() {
    setTimeout(() => {
      if (this.data.messages.length > 0) {
        this.setData({
          scrollIntoView: `msg-${this.data.messages.length - 1}`
        });
      }
    }, 100);
  },

  // 自动生成会话标题
  async generateConversationTitle() {
    if (!this.data.currentConversationId) return;

    try {
      const result = await app.request({
        url: `/api/chat/conversation/${this.data.currentConversationId}/generate-title`,
        method: 'POST'
      });

      if (result.code === 0 && result.data.title) {
        // 更新当前标题
        this.setData({
          currentTitle: result.data.title
        });

        // 清除会话列表缓存，确保刷新
        cache.remove('conversations');
        
        // 刷新会话列表
        this.loadConversations();
      }
    } catch (error) {
      console.error('生成标题失败:', error);
      // 失败不影响用户使用，静默处理
    }
  },

  // 显示会话菜单（长按）
  showConversationMenu(e) {
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title;

    wx.showActionSheet({
      itemList: ['重命名', '删除会话'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 重命名
          this.renameConversation(id, title);
        } else if (res.tapIndex === 1) {
          // 删除
          this.deleteConversation(e);
        }
      }
    });
  },

  // 重命名会话
  renameConversation(id, currentTitle) {
    wx.showModal({
      title: '重命名会话',
      editable: true,
      placeholderText: '请输入新标题',
      content: currentTitle,
      confirmText: '确定',
      success: async (res) => {
        if (res.confirm && res.content) {
          const newTitle = res.content.trim();
          if (!newTitle) {
            wx.showToast({
              title: '标题不能为空',
              icon: 'none'
            });
            return;
          }

          try {
            const result = await app.request({
              url: `/api/chat/conversation/${id}`,
              method: 'PUT',
              data: { title: newTitle }
            });

            if (result.code === 0) {
              wx.showToast({
                title: '重命名成功',
                icon: 'success'
              });

              // 如果是当前会话，更新标题
              if (this.data.currentConversationId === id) {
                this.setData({
                  currentTitle: newTitle
                });
              }

              // 清除缓存并刷新列表
              cache.remove('conversations');
              this.loadConversations();
            }
          } catch (error) {
            wx.showToast({
              title: '重命名失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 格式化会话时间
  formatConversationTime(timeStr) {
    if (!timeStr) return '';
    
    const time = new Date(timeStr);
    const now = new Date();
    const diff = now - time;

    // 一分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    // 一小时内
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    // 今天
    if (time.toDateString() === now.toDateString()) {
      return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
    }
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (time.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      return `周${days[time.getDay()]}`;
    }
    // 更早
    return `${time.getMonth() + 1}/${time.getDate()}`;
  }
});


