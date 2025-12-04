# AI个人助手 - 部署指南

## 项目概述

这是一个基于微信小程序和微信云托管的私人AI助手系统,使用DeepSeek大模型提供智能对话和自我成长分析功能。

### 核心功能

- ✅ **智能对话**: 与AI进行多轮对话,AI会逐渐了解你
- ✅ **成长分析**: 自动分析聊天内容,生成自我成长报告
- ✅ **个人画像**: 基于长期对话建立个人特质画像
- ✅ **隐私保护**: 所有数据仅用户本人可见

## 🚀 快速部署 (推荐)

### 一键部署脚本

我们提供了自动化部署脚本,大大简化部署流程:

#### Linux / macOS

```bash
# 1. 赋予执行权限
chmod +x deploy.sh

# 2. 运行脚本
./deploy.sh

# 或直接指定环境ID
./deploy.sh your-env-id
```

#### Windows

```batch
# 直接运行
deploy.bat

# 或指定环境ID
deploy.bat your-env-id
```

**一键部署的详细说明**: 请查看 [ONE_CLICK_DEPLOY.md](./ONE_CLICK_DEPLOY.md)

---

## 📋 手动部署指南

## 技术栈

### 后端
- Node.js + Express
- MySQL (Sequelize ORM)
- DeepSeek API
- 微信云托管

### 前端
- 微信小程序原生开发
- WXML + WXSS + JavaScript

## 部署准备

### 1. 环境要求

- Node.js >= 12.0.0
- MySQL >= 5.7
- 微信小程序账号
- DeepSeek API Key

### 2. 获取必要的密钥和配置

#### 2.1 微信小程序配置

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 注册或选择你的小程序
3. 获取以下信息:
   - AppID (小程序ID)
   - AppSecret (小程序密钥)

#### 2.2 DeepSeek API Key

1. 访问[DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册账号并获取API Key

#### 2.3 微信云托管

1. 在微信公众平台开通云托管服务
2. 创建云托管环境
3. 开通MySQL数据库服务

## 部署步骤

### 一、后端部署 (微信云托管)

#### 1. 配置环境变量

在微信云托管控制台配置以下环境变量:

```bash
# 数据库配置 (云托管会自动注入)
MYSQL_ADDRESS=数据库地址:端口
MYSQL_USERNAME=数据库用户名
MYSQL_PASSWORD=数据库密码

# DeepSeek配置
DEEPSEEK_API_KEY=your-deepseek-api-key

# 微信小程序配置
WECHAT_APPID=your-appid
WECHAT_SECRET=your-appsecret

# JWT密钥 (自定义,建议使用强密码)
JWT_SECRET=your-jwt-secret-key

# 运行端口 (默认80)
PORT=80

# Node环境
NODE_ENV=production
```

#### 2. 本地测试

```bash
# 安装依赖
npm install

# 配置本地环境变量
cp .env.example .env
# 编辑.env文件填入配置

# 启动服务
npm start
```

#### 3. 部署到云托管

方法一: 使用微信开发者工具

1. 打开微信开发者工具
2. 选择"云托管"标签
3. 点击"上传代码"
4. 填写版本号和备注
5. 点击"确定"上传

方法二: 使用命令行工具

```bash
# 安装微信云托管CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署
tcb run deploy --name ai-assistant
```

#### 4. 配置服务

在云托管控制台:
- 设置服务端口: 80
- 配置CPU和内存 (推荐: 0.5核1GB起)
- 开启日志收集
- 配置自动扩缩容

### 二、前端部署 (微信小程序)

#### 1. 配置小程序

编辑 `miniprogram/project.config.json`:

```json
{
  "appid": "你的小程序AppID"
}
```

编辑 `miniprogram/app.js`:

```javascript
globalData: {
  apiBaseUrl: 'https://你的云托管服务域名'
}
```

#### 2. 配置服务器域名

在微信公众平台 > 开发 > 开发管理 > 服务器域名中添加:

- request合法域名: `https://你的云托管服务域名`
- request合法域名: `https://api.deepseek.com` (如需前端直连)

#### 3. 上传小程序代码

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 点击"上传"按钮
3. 填写版本号和项目备注
4. 上传成功后,在微信公众平台提交审核

#### 4. 发布小程序

1. 在微信公众平台查看审核状态
2. 审核通过后,点击"发布"
3. 设置体验版供测试使用

## 数据库初始化

首次部署时,服务会自动创建所需的数据库表结构(使用Sequelize的sync功能)。

如需手动初始化:

```sql
CREATE DATABASE ai_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

系统会自动创建以下表:
- `users` - 用户表
- `conversations` - 会话表
- `messages` - 消息表
- `analysis_reports` - 分析报告表
- `user_profiles` - 用户画像表

## API文档

### 认证接口

#### POST /api/auth/login
登录/注册

请求:
```json
{
  "code": "微信登录code"
}
```

响应:
```json
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "userId": 1,
    "isNewUser": false
  }
}
```

### 聊天接口

#### POST /api/chat/send
发送消息

请求头: `Authorization: Bearer <token>`

请求:
```json
{
  "content": "消息内容",
  "conversationId": 1
}
```

#### GET /api/chat/history
获取历史消息

参数: `page`, `limit`, `conversationId`

### 分析接口

#### POST /api/analysis/generate
生成分析报告

请求:
```json
{
  "type": "weekly|monthly",
  "startAt": "2025-01-01",
  "endAt": "2025-01-07"
}
```

#### GET /api/analysis/report/:id
获取报告详情

#### GET /api/analysis/reports
获取报告列表

### 画像接口

#### GET /api/profile/get
获取用户画像

#### GET /api/profile/stats
获取统计数据

#### DELETE /api/profile/clear
清空所有数据

#### GET /api/profile/export
导出数据

## 监控和维护

### 日志查看

在云托管控制台可以查看:
- 应用日志
- 访问日志
- 错误日志

### 性能监控

建议监控指标:
- API响应时间
- DeepSeek API调用次数和耗时
- 数据库查询性能
- 内存和CPU使用率

### 数据备份

定期备份MySQL数据库:
1. 在云托管控制台设置自动备份
2. 或使用mysqldump手动备份

### 成本优化

1. **DeepSeek API**: 
   - 控制每次对话的历史消息数量
   - 设置合理的max_tokens限制
   
2. **云托管资源**:
   - 根据实际使用配置合适的规格
   - 开启自动缩容
   
3. **数据库**:
   - 定期清理过期消息
   - 添加合适的索引

## 常见问题

### 1. 登录失败

- 检查WECHAT_APPID和WECHAT_SECRET是否正确
- 确认小程序服务器域名配置正确
- 在云托管环境,会自动从请求头获取openid

### 2. AI回复失败

- 检查DEEPSEEK_API_KEY是否正确
- 确认DeepSeek账户余额充足
- 查看后端日志的详细错误信息

### 3. 数据库连接失败

- 检查数据库环境变量配置
- 确认数据库服务正常运行
- 检查网络连接和防火墙设置

### 4. 分析报告生成失败

- 确保有足够的聊天记录
- 检查时间范围设置
- 查看DeepSeek API返回的错误

## 安全建议

1. **JWT密钥**: 使用强随机字符串,不要泄露
2. **API密钥**: 妥善保管DeepSeek API Key
3. **数据隔离**: 系统已实现用户数据隔离,每个用户只能访问自己的数据
4. **HTTPS**: 云托管默认支持HTTPS,确保启用
5. **输入验证**: 系统已实现基本的输入验证,可根据需要加强

## 后续优化方向

1. **功能增强**:
   - 支持语音输入
   - 添加情绪识别
   - 支持导出PDF报告
   - 添加提醒和定时分析功能

2. **性能优化**:
   - 实现消息缓存
   - 优化数据库查询
   - 使用消息队列处理异步任务

3. **体验优化**:
   - 添加消息重发功能
   - 支持富文本消息
   - 优化加载动画

## 技术支持

如遇到问题:
1. 查看后端日志
2. 检查环境变量配置
3. 参考微信云托管和DeepSeek官方文档

## 开源协议

本项目采用 Apache-2.0 License

---

开发完成时间: 2025年12月
版本: v1.0.0

