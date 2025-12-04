# DailyFocus

> 基于DeepSeek的AI个人成长助手小程序

## ✨ 主要功能

### 💬 智能对话
- ChatGPT风格的现代化聊天界面
- 会话管理（创建、切换、删除、重命名）
- **AI自动生成会话标题**
- Markdown格式渲染支持
- 消息缓存，秒开页面

### 🌐 联网搜索（新功能）
- **实时获取互联网信息**
- 手动开关 + 智能自动检测
- 支持多个搜索引擎（Google/Bing/DuckDuckGo）
- 显示搜索来源和引用
- 就像ChatGPT一样！

### 📊 自我分析
- 周报告/月报告生成
- 个人画像分析
- 成长追踪

### 👤 个人中心
- 使用统计
- 数据导出
- 画像查看

---

## 🚀 快速开始

### 1. 环境要求
- Node.js >= 14
- MySQL >= 5.7
- 微信开发者工具

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# DeepSeek API Key（必需）
DEEPSEEK_API_KEY=your_deepseek_key

# 数据库配置（必需）
MYSQL_ADDRESS=localhost:3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password

# 联网搜索配置（可选，至少配置一个或使用默认的DuckDuckGo）
SERPAPI_KEY=your_serpapi_key          # Google搜索（推荐）
BING_SEARCH_KEY=your_bing_key         # Bing搜索

# JWT密钥（必需）
JWT_SECRET=your_random_secret_key
```

**联网搜索说明：**
- 如果不配置搜索API，系统会自动使用免费的 DuckDuckGo
- 推荐配置 SerpAPI 获得最佳搜索体验
- 详细配置请参考 [联网搜索配置指南](./WEBSEARCH_CONFIG.md)

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 配置小程序

1. 用微信开发者工具打开 `miniprogram` 目录
2. 修改 `miniprogram/app.js` 中的 `apiBaseUrl` 为你的服务器地址
3. 编译运行

---

## 📖 详细文档

- [联网搜索配置指南](./WEBSEARCH_CONFIG.md) - 如何配置联网搜索功能
- [项目结构](./STRUCTURE.md)
- [快速开始](./QUICKSTART.md)
- [部署指南](./DEPLOYMENT.md)

---

## 🎨 界面预览

### 聊天界面
- 类ChatGPT设计
- 侧边栏会话管理
- 联网搜索开关
- Markdown渲染

### 联网搜索
- 🌐 一键开启联网搜索
- 显示搜索来源（Google/Bing/DuckDuckGo）
- AI基于最新信息回答
- 引用来源链接

---

## 🛠️ 技术栈

### 后端
- Node.js + Express
- Sequelize ORM
- DeepSeek API
- 搜索引擎集成（SerpAPI/Bing/DuckDuckGo）

### 前端（小程序）
- 微信小程序原生开发
- 智能缓存系统
- Markdown渲染
- 现代化UI设计

---

## 📝 许可证

MIT License

