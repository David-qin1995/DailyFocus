# 项目目录结构

```
wxcloudrun-express/
│
├── 📁 后端核心代码
│   ├── index.js                    # 🚀 服务器入口文件
│   │
│   ├── 📁 models/                  # 数据库模型
│   │   └── index.js               # 5个Sequelize模型定义
│   │                               # - Users (用户)
│   │                               # - Conversations (会话)
│   │                               # - Messages (消息)
│   │                               # - AnalysisReports (报告)
│   │                               # - UserProfiles (画像)
│   │
│   ├── 📁 routes/                  # API路由
│   │   ├── auth.js                # 🔐 认证接口 (2个)
│   │   ├── chat.js                # 💬 聊天接口 (5个)
│   │   ├── analysis.js            # 📊 分析接口 (4个)
│   │   └── profile.js             # 👤 画像接口 (4个)
│   │
│   ├── 📁 utils/                   # 工具函数
│   │   ├── jwt.js                 # 🔑 JWT认证工具
│   │   └── deepseek.js            # 🤖 DeepSeek API封装
│   │
│   └── 📁 middleware/              # 中间件
│       └── index.js               # 认证、错误处理、异步包装
│
├── 📁 小程序前端代码
│   └── miniprogram/
│       ├── app.js                  # 📱 小程序入口
│       ├── app.json                # ⚙️ 小程序配置
│       ├── app.wxss                # 🎨 全局样式
│       ├── project.config.json     # 🔧 项目配置
│       ├── sitemap.json            # 🗺️ 站点地图
│       │
│       └── 📁 pages/               # 页面目录
│           │
│           ├── 📁 chat/            # 💬 聊天页面
│           │   ├── chat.js
│           │   ├── chat.wxml
│           │   ├── chat.wxss
│           │   └── chat.json
│           │
│           ├── 📁 analysis/        # 📊 分析页面
│           │   ├── analysis.js
│           │   ├── analysis.wxml
│           │   ├── analysis.wxss
│           │   └── analysis.json
│           │
│           ├── 📁 profile/         # 👤 个人页面
│           │   ├── profile.js
│           │   ├── profile.wxml
│           │   ├── profile.wxss
│           │   └── profile.json
│           │
│           └── 📁 report-detail/   # 📄 报告详情页
│               ├── report-detail.js
│               ├── report-detail.wxml
│               ├── report-detail.wxss
│               └── report-detail.json
│
├── 📁 配置文件
│   ├── package.json                # 📦 Node.js依赖配置
│   ├── container.config.json       # ☁️ 云托管配置
│   ├── Dockerfile                  # 🐳 Docker配置
│   ├── .gitignore                  # 🚫 Git忽略规则
│   └── .env.example                # 🔐 环境变量模板
│
├── 📁 文档
│   ├── README.md                   # 📖 项目介绍
│   ├── DEPLOYMENT.md               # 🚀 部署指南
│   ├── QUICKSTART.md               # ⚡ 快速开始
│   ├── PROJECT_OVERVIEW.md         # 🏗️ 架构详解
│   ├── COMPLETION_SUMMARY.md       # ✅ 完成总结
│   ├── CHECKLIST.md                # 📋 交付清单
│   └── LICENSE                     # 📜 开源协议
│
├── 📁 工具脚本
│   └── test-api.sh                 # 🧪 API测试脚本
│
└── 📁 遗留文件 (可删除)
    ├── db.js                       # 旧的数据库配置
    └── index.html                  # 旧的首页

```

## 📊 项目统计

### 代码文件
- **后端**: 8个核心文件
  - 1个入口 (index.js)
  - 1个模型文件 (5个模型)
  - 4个路由文件 (14个接口)
  - 2个工具文件
  - 1个中间件文件

- **前端**: 17个小程序文件
  - 5个配置文件
  - 4个页面 × 4个文件/页 = 16个页面文件

### 配置文件
- 5个配置文件
- 1个环境变量模板

### 文档
- 7份完整文档
- 1个开源协议

### 总计
- **约35个核心文件**
- **约3000+行代码**
- **14个API接口**
- **5个数据库表**
- **4个小程序页面**

## 🎯 核心模块说明

### 后端模块

#### 1️⃣ 入口模块 (index.js)
- Express服务器配置
- 路由整合
- 中间件配置
- 错误处理
- 数据库初始化

#### 2️⃣ 数据模型 (models/)
- User: 用户基础信息和偏好
- Conversation: 对话会话管理
- Message: 聊天消息记录
- AnalysisReport: 分析报告数据
- UserProfile: 用户画像信息

#### 3️⃣ 路由模块 (routes/)
- **auth**: 登录、用户信息
- **chat**: 发送消息、历史记录、会话管理
- **analysis**: 生成报告、查询报告、删除报告
- **profile**: 画像查询、数据管理、导出

#### 4️⃣ 工具模块 (utils/)
- **jwt**: Token生成和验证
- **deepseek**: API调用、Prompt构建

#### 5️⃣ 中间件 (middleware/)
- 身份认证
- 错误处理
- 异步包装

### 前端模块

#### 1️⃣ 应用层 (app.*)
- 全局状态管理
- 自动登录
- API请求封装
- 全局样式

#### 2️⃣ 页面层 (pages/)
- **chat**: 智能对话界面
- **analysis**: 报告生成和列表
- **profile**: 个人信息和画像
- **report-detail**: 报告详情展示

## 📦 依赖关系图

```
index.js
  ├── models/        → MySQL数据库
  ├── routes/
  │   ├── auth       → jwt, models
  │   ├── chat       → deepseek, jwt, models
  │   ├── analysis   → deepseek, jwt, models
  │   └── profile    → jwt, models
  ├── middleware/    → jwt
  └── utils/
      ├── jwt
      └── deepseek   → axios, DeepSeek API
```

```
miniprogram/
  ├── app.js         → wx.login, wx.request
  └── pages/
      ├── chat       → app.request
      ├── analysis   → app.request
      ├── profile    → app.request
      └── report-detail → app.request
```

## 🔄 数据流向

```
用户操作
  ↓
小程序界面 (miniprogram/pages/)
  ↓
全局请求方法 (app.request)
  ↓
后端API (routes/)
  ↓
中间件验证 (middleware/)
  ↓
业务逻辑处理
  ↓
数据库操作 (models/)
  ↓
DeepSeek API (utils/deepseek)
  ↓
返回结果
  ↓
小程序显示
```

## 🎨 UI层级结构

```
TabBar (底部导航)
├── 💬 聊天 (chat)
│   ├── 消息列表
│   ├── 输入框
│   └── 发送按钮
│
├── 📊 分析 (analysis)
│   ├── 生成报告区域
│   │   ├── 周期选择
│   │   └── 生成按钮
│   └── 报告列表
│       └── 报告卡片 → 详情页
│
└── 👤 我的 (profile)
    ├── 用户信息卡片
    ├── 统计数据
    ├── 个人画像
    └── 功能菜单
        ├── 导出数据
        └── 清空数据
```

## 📝 关键文件说明

### 必须配置的文件
1. **.env** - 环境变量配置 (从.env.example复制)
2. **miniprogram/app.js** - API地址配置
3. **miniprogram/project.config.json** - 小程序AppID

### 可以删除的文件
- **db.js** - 旧的数据库配置 (已被models/index.js替代)
- **index.html** - 旧的演示页面 (不再需要)

### 核心入口文件
- **后端**: `index.js`
- **前端**: `miniprogram/app.js`
- **部署**: `container.config.json` + `Dockerfile`

## 🚀 启动流程

### 后端启动
```
npm install
  ↓
读取环境变量 (.env)
  ↓
连接MySQL数据库
  ↓
同步数据库模型
  ↓
启动Express服务器 (端口80)
  ↓
注册路由和中间件
  ↓
✅ 服务就绪
```

### 前端启动
```
打开微信开发者工具
  ↓
导入miniprogram目录
  ↓
配置AppID
  ↓
自动执行app.onLaunch
  ↓
调用wx.login获取code
  ↓
请求后端/api/auth/login
  ↓
保存token到本地
  ↓
✅ 小程序就绪
```

---

**项目结构清晰、模块化设计、易于维护!** 🎉

查看各个文件的详细说明,请参考相应的文档:
- 代码逻辑: 查看文件内注释
- API接口: 查看 DEPLOYMENT.md
- 架构设计: 查看 PROJECT_OVERVIEW.md

