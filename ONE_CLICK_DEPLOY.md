# 🚀 微信云托管一键部署指南

## 快速开始

### 三步完成部署

```bash
# 1. 赋予执行权限
chmod +x deploy.sh

# 2. 运行部署脚本
./deploy.sh

# 或直接指定环境ID
./deploy.sh your-env-id
```

就这么简单！ ✨

---

## 📋 部署前准备

### 1. 安装云开发CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 准备配置信息

需要准备以下信息:
- ✅ **DeepSeek API Key** - 从 https://platform.deepseek.com/ 获取
- ✅ **微信小程序 AppID** - 从微信公众平台获取
- ✅ **微信小程序 AppSecret** - 从微信公众平台获取
- ✅ **云托管环境ID** - 从微信云托管控制台获取

### 3. 获取环境ID

1. 登录 [微信云托管控制台](https://cloud.weixin.qq.com/)
2. 创建或选择环境
3. 复制环境ID (格式: `env-xxxxx`)

---

## 🎯 部署步骤

### 第一步: 登录云开发

```bash
tcb login
```

会打开浏览器进行微信扫码登录。

### 第二步: 运行部署脚本

```bash
./deploy.sh
```

脚本会自动:
- ✅ 检查环境
- ✅ 验证登录
- ✅ 上传代码
- ✅ 构建镜像
- ✅ 部署服务

**预计耗时**: 3-5分钟

### 第三步: 配置环境变量

部署完成后，在云托管控制台配置:

**路径**: 服务设置 > 环境变量

**必需配置**:
```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
WECHAT_APPID=wxxxxxxxxxxx
WECHAT_SECRET=xxxxxxxxxxxxxxxx
JWT_SECRET=your-strong-random-secret-key
PORT=80
NODE_ENV=production
```

**数据库配置** (云托管自动注入，无需手动配置):
```
MYSQL_ADDRESS=xx.xx.xx.xx:3306
MYSQL_USERNAME=username
MYSQL_PASSWORD=password
```

---

## 🔧 配置文件说明

### Dockerfile

定义了容器构建过程:
- 基于Alpine Linux
- 安装Node.js和npm
- 使用国内镜像源加速
- 暴露80端口

### container.config.json

定义了服务配置:
```json
{
  "containerPort": 80,      // 容器端口
  "minNum": 0,              // 最小实例数（无访问时缩容到0）
  "maxNum": 5,              // 最大实例数
  "cpu": 0.5,               // CPU配额（0.5核）
  "mem": 1,                 // 内存配额（1GB）
  "policyType": "cpu",      // 扩缩容策略
  "policyThreshold": 60     // CPU > 60%时扩容
}
```

---

## 📱 小程序配置

### 1. 配置服务器域名

在微信公众平台:
- 路径: 开发 > 开发管理 > 服务器域名
- 添加request合法域名: `https://your-service-id.bj.run.tcloudbase.com`

### 2. 更新API地址

编辑 `miniprogram/app.js`:
```javascript
globalData: {
  apiBaseUrl: 'https://your-service-id.bj.run.tcloudbase.com'
}
```

### 3. 上传小程序

使用微信开发者工具上传代码并提交审核。

---

## 🧪 部署验证

### 1. 检查服务状态

```bash
# 查看服务列表
tcb run service list --env-id your-env-id

# 查看服务日志
tcb run logs --env-id your-env-id --follow
```

### 2. 测试健康检查

```bash
curl https://your-service-id.bj.run.tcloudbase.com/api/health
```

预期返回:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T..."
}
```

### 3. 功能测试

详细测试步骤请参考: [TESTING.md](./TESTING.md)

---

## 🔄 更新部署

修改代码后重新部署:

```bash
./deploy.sh your-env-id
```

---

## 📊 监控和日志

### 实时日志

```bash
tcb run logs --env-id your-env-id --follow
```

### 查看最近日志

```bash
tcb run logs --env-id your-env-id --tail 100
```

### 服务详情

```bash
tcb run service info --env-id your-env-id --service-name ai-assistant
```

---

## 🔍 常见问题

### Q1: 登录失败

**解决方案**:
```bash
tcb logout
tcb login
```

### Q2: 构建失败

**检查项**:
- 网络连接是否正常
- Dockerfile语法是否正确
- 依赖包是否可访问

**查看日志**:
```bash
tcb run logs --env-id your-env-id
```

### Q3: 服务无法访问

**检查清单**:
- [ ] 服务是否部署成功
- [ ] 环境变量是否配置
- [ ] 端口是否正确（必须是80）
- [ ] 小程序域名是否配置

### Q4: 数据库连接失败

**解决方案**:
1. 确认MySQL服务已开通
2. 检查环境变量:
   - MYSQL_ADDRESS
   - MYSQL_USERNAME
   - MYSQL_PASSWORD
3. 在控制台查看数据库状态

### Q5: AI回复失败

**检查项**:
- DEEPSEEK_API_KEY是否正确
- API Key是否有余额
- 网络能否访问DeepSeek API

**查看详细错误**:
```bash
tcb run logs --env-id your-env-id --follow
```

---

## 💰 成本优化

### 1. 资源配置优化

起步可以使用更小的配置:
```json
{
  "cpu": 0.25,
  "mem": 0.5,
  "minNum": 0,
  "maxNum": 3
}
```

### 2. API调用优化

- 控制上下文消息数量（建议20条以内）
- 设置合理的max_tokens（建议2000以内）
- 避免频繁重复分析

### 3. 自动扩缩容

确保 `minNum: 0`，无访问时自动缩容到0，节省成本。

---

## 🔒 安全建议

### 1. 环境变量安全

- ❌ 不要在代码中硬编码密钥
- ✅ 使用云托管环境变量管理
- ✅ JWT_SECRET使用强随机字符串

### 2. 定期更换密钥

建议每3-6个月更换一次:
- JWT_SECRET
- DeepSeek API Key

### 3. 监控异常访问

在云托管控制台查看:
- 请求频率
- 错误率
- 异常IP

---

## 📈 性能监控

### 关键指标

在云托管控制台监控:
- **CPU使用率**: < 70%
- **内存使用率**: < 80%
- **请求响应时间**: < 3秒
- **错误率**: < 1%

### 扩容策略

当CPU持续 > 60%时会自动扩容。如果经常扩容，考虑:
- 增加基础配置
- 优化代码性能
- 增加缓存

---

## 🎯 快速命令参考

```bash
# 登录
tcb login

# 部署
./deploy.sh your-env-id

# 查看日志
tcb run logs --env-id your-env-id --follow

# 查看服务
tcb run service list --env-id your-env-id

# 查看版本
tcb run version list --env-id your-env-id --service-name ai-assistant

# 登出
tcb logout
```

---

## 📞 获取帮助

- 📖 查看 [TESTING.md](./TESTING.md) 进行测试
- 📚 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细配置
- 🐛 [微信云托管文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/)
- 💬 提交Issue反馈问题

---

## ✅ 部署检查清单

部署完成后，请确认:

- [ ] 服务部署成功
- [ ] 环境变量配置完成
- [ ] 数据库连接正常
- [ ] 健康检查接口返回正常
- [ ] 小程序域名已配置
- [ ] 小程序API地址已更新
- [ ] 基础功能测试通过

---

**准备好了吗? 开始一键部署!** 🚀

```bash
chmod +x deploy.sh
./deploy.sh
```
