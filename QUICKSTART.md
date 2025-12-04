# AI个人助手 - 快速开始指南

## 第一步: 获取必要的密钥

### 1. DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录账号
3. 进入"API Keys"页面
4. 创建新的API Key并复制保存

### 2. 微信小程序配置

1. 访问 https://mp.weixin.qq.com/
2. 注册小程序账号(个人或企业)
3. 进入"开发" > "开发管理" > "开发设置"
4. 获取AppID和AppSecret

## 第二步: 配置环境变量

1. 复制环境变量模板:
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件,填入你的配置:

```bash
# DeepSeek配置 (必填)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 微信配置 (必填)
WECHAT_APPID=wxxxxxxxxxxx
WECHAT_SECRET=xxxxxxxxxxxxxxxx

# JWT密钥 (必填,请修改为随机字符串)
JWT_SECRET=请改成一个复杂的随机字符串

# 数据库配置
# 本地开发:
MYSQL_ADDRESS=localhost:3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password

# 微信云托管会自动注入数据库配置,无需手动设置
```

## 第三步: 初始化数据库

### 本地MySQL

1. 确保MySQL服务已启动
2. 创建数据库:
```sql
CREATE DATABASE ai_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 微信云托管MySQL

在云托管控制台直接开通MySQL服务即可,系统会自动创建表结构。

## 第四步: 安装依赖

```bash
npm install
```

## 第五步: 启动服务

### 本地开发

```bash
npm start
```

服务将在 http://localhost:80 启动

### 测试接口

访问 http://localhost:80 应该看到:
```json
{
  "name": "AI个人助手API",
  "version": "1.0.0",
  "status": "running"
}
```

## 第六步: 配置并运行小程序

### 1. 配置API地址

编辑 `miniprogram/app.js`:

```javascript
globalData: {
  // 本地开发
  apiBaseUrl: 'http://localhost:80'
  
  // 或者使用云托管地址
  // apiBaseUrl: 'https://your-service.bj.run.tcloudbase.com'
}
```

### 2. 配置AppID

编辑 `miniprogram/project.config.json`:

```json
{
  "appid": "你的小程序AppID"
}
```

### 3. 配置服务器域名(正式环境)

在微信公众平台 > 开发 > 开发管理 > 服务器域名:

添加request合法域名:
- https://你的云托管服务域名
- https://api.deepseek.com

### 4. 使用微信开发者工具

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开工具,选择"导入项目"
3. 选择 `miniprogram` 目录
4. 填入AppID
5. 点击"导入"

本地开发时需要:
- 勾选"不校验合法域名"
- 开启调试模式

## 第七步: 测试功能

### 1. 测试登录

打开小程序,系统会自动登录

### 2. 测试对话

在聊天页面输入消息,AI应该会回复

### 3. 测试分析

发送多条消息后,到"分析"页面生成报告

### 4. 查看画像

在"我的"页面查看个人画像和统计数据

## 部署到生产环境

详细部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

简要流程:
1. 在微信云托管控制台配置环境变量
2. 上传代码到云托管
3. 配置小程序服务器域名
4. 上传小程序代码
5. 提交审核和发布

## 常见问题

### Q1: 数据库连接失败
- 检查MySQL服务是否启动
- 确认数据库配置是否正确
- 检查数据库用户权限

### Q2: AI回复失败
- 检查DEEPSEEK_API_KEY是否正确
- 确认DeepSeek账户有余额
- 查看后端日志的错误信息

### Q3: 小程序登录失败
- 确认AppID和AppSecret正确
- 检查request域名配置
- 本地调试时勾选"不校验合法域名"

### Q4: 小程序无法访问后端
- 检查apiBaseUrl配置是否正确
- 确认后端服务已启动
- 查看控制台网络请求错误

## 获取帮助

- 查看 [README.md](./README.md) 了解项目详情
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解部署细节
- 提交Issue反馈问题

## 开发建议

1. **本地开发**:
   - 使用nodemon自动重启: `npm install -g nodemon && nodemon index.js`
   - 使用微信开发者工具的实时编译功能

2. **调试技巧**:
   - 查看后端控制台日志
   - 使用微信开发者工具的console
   - 开启详细的错误信息显示

3. **代码规范**:
   - 遵循JavaScript标准代码风格
   - 添加适当的注释
   - 保持代码结构清晰

祝你开发顺利! 🚀


