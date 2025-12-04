# 🧪 部署测试指南

部署完成后,请按照以下步骤测试系统是否正常工作。

## 测试清单

### ✅ 后端服务测试

#### 1. 健康检查

```bash
# 替换为你的实际服务地址
curl https://your-service-id.bj.run.tcloudbase.com/api/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T..."
}
```

#### 2. 服务信息

```bash
curl https://your-service-id.bj.run.tcloudbase.com/
```

**预期响应**:
```json
{
  "name": "AI个人助手API",
  "version": "1.0.0",
  "description": "基于DeepSeek的私人AI助手后端服务",
  "status": "running"
}
```

#### 3. 登录接口测试

由于需要真实的微信code,建议通过小程序测试登录功能。

### ✅ 小程序测试

#### 1. 自动登录测试

1. 打开小程序
2. 观察控制台日志
3. 应该看到 "登录成功" 的提示

**检查项**:
- ✅ 自动调用登录接口
- ✅ 成功获取token
- ✅ token保存到本地存储

#### 2. 聊天功能测试

**测试步骤**:
1. 在聊天页面输入消息: "你好"
2. 点击发送
3. 等待AI回复

**检查项**:
- ✅ 消息成功发送
- ✅ 显示加载动画
- ✅ AI成功回复
- ✅ 消息正确显示
- ✅ 消息保存到数据库

**测试用例**:
```
测试1: 简单问候
输入: "你好,我是小明"
预期: AI友好回复,介绍自己的功能

测试2: 情绪表达
输入: "今天工作压力很大,感觉很累"
预期: AI表达理解和支持

测试3: 多轮对话
输入1: "我想学习编程"
输入2: "应该从哪里开始?"
预期: AI保持上下文,给出具体建议
```

#### 3. 分析报告测试

**前置条件**: 已有至少5-10条聊天记录

**测试步骤**:
1. 切换到"分析"页面
2. 选择"最近一周"
3. 点击"开始分析"
4. 等待报告生成

**检查项**:
- ✅ 分析按钮可点击
- ✅ 显示分析进度
- ✅ 成功生成报告
- ✅ 自动跳转到报告详情
- ✅ 四大模块内容正确

#### 4. 报告详情测试

**测试步骤**:
1. 在分析页面点击任一报告
2. 查看报告详情

**检查项**:
- ✅ 正确显示报告时间
- ✅ "我的问题"模块有内容
- ✅ "我的优点"模块有内容
- ✅ "需要改进"模块有内容
- ✅ "需要坚持"模块有内容
- ✅ 内容排版美观

#### 5. 个人画像测试

**测试步骤**:
1. 切换到"我的"页面
2. 查看各项数据

**检查项**:
- ✅ 统计数据正确
  - 聊天条数
  - 分析报告数
  - 使用天数
- ✅ 画像进度条显示
- ✅ 功能按钮可点击

#### 6. 数据导出测试

**测试步骤**:
1. 在"我的"页面点击"导出数据"
2. 等待导出完成

**检查项**:
- ✅ 导出成功提示
- ✅ 数据格式正确(JSON)

#### 7. 数据清空测试

⚠️ **警告**: 此操作不可逆,请在测试环境进行!

**测试步骤**:
1. 点击"清空所有数据"
2. 确认操作
3. 等待清空完成

**检查项**:
- ✅ 二次确认提示
- ✅ 清空成功提示
- ✅ 所有数据确实被清空
- ✅ 可以重新开始使用

### ✅ 数据库测试

#### 连接MySQL查看数据

```bash
# 使用云托管控制台提供的数据库信息连接
mysql -h your-mysql-host -u username -p ai_assistant
```

**检查表结构**:
```sql
-- 查看所有表
SHOW TABLES;

-- 应该看到:
-- users
-- conversations
-- messages
-- analysis_reports
-- user_profiles

-- 查看表结构
DESCRIBE users;
DESCRIBE messages;
```

**检查数据**:
```sql
-- 查看用户数
SELECT COUNT(*) FROM users;

-- 查看最近10条消息
SELECT * FROM messages ORDER BY createdAt DESC LIMIT 10;

-- 查看分析报告
SELECT * FROM analysis_reports;
```

## 🔍 常见问题排查

### 问题1: 小程序无法登录

**现象**: 点击按钮无反应或提示登录失败

**排查步骤**:
1. 检查网络连接
2. 查看控制台错误信息
3. 确认后端服务正常运行
4. 检查环境变量配置:
   - WECHAT_APPID
   - WECHAT_SECRET

**解决方法**:
```javascript
// 检查 miniprogram/app.js 中的 apiBaseUrl
globalData: {
  apiBaseUrl: 'https://正确的服务地址'
}
```

### 问题2: AI无法回复

**现象**: 发送消息后长时间无响应或报错

**排查步骤**:
1. 查看后端日志:
```bash
tcb run logs --env-id your-env-id --follow
```

2. 检查环境变量:
```bash
# 确认 DEEPSEEK_API_KEY 已配置
```

3. 验证DeepSeek API:
```bash
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**解决方法**:
- 确认API Key有效且有余额
- 检查网络能否访问DeepSeek API
- 查看具体错误信息调整

### 问题3: 分析报告生成失败

**现象**: 点击"开始分析"后提示失败

**排查步骤**:
1. 确认有足够的聊天记录(至少5条)
2. 检查时间范围是否正确
3. 查看后端日志获取详细错误

**常见原因**:
- 聊天记录太少
- DeepSeek API调用失败
- JSON解析错误

**解决方法**:
- 先多聊几轮再生成报告
- 检查API配置
- 查看详细错误信息

### 问题4: 数据库连接失败

**现象**: 服务启动失败或无法保存数据

**排查步骤**:
1. 检查MySQL服务状态
2. 验证环境变量:
   - MYSQL_ADDRESS
   - MYSQL_USERNAME
   - MYSQL_PASSWORD

3. 测试数据库连接:
```bash
mysql -h host -u username -p
```

**解决方法**:
- 确认数据库已开通
- 检查连接信息是否正确
- 确认网络连通性

### 问题5: 服务无法访问

**现象**: 小程序请求超时或404

**排查步骤**:
1. 检查服务是否正常运行:
```bash
tcb run service list --env-id your-env-id
```

2. 检查服务域名配置
3. 测试服务是否可访问:
```bash
curl https://your-service-id.bj.run.tcloudbase.com/api/health
```

**解决方法**:
- 确认服务已成功部署
- 检查小程序域名配置
- 验证API地址是否正确

## 📊 性能测试

### API响应时间测试

```bash
# 健康检查响应时间
time curl https://your-service-id.bj.run.tcloudbase.com/api/health

# 预期: < 200ms
```

### AI对话响应时间

**测试方法**:
1. 在小程序发送消息
2. 记录从点击发送到收到回复的时间

**预期响应时间**:
- 简单对话: 2-5秒
- 复杂对话: 5-10秒
- 分析报告: 10-30秒

### 并发测试

```bash
# 使用 Apache Bench 进行压力测试
ab -n 100 -c 10 https://your-service-id.bj.run.tcloudbase.com/api/health

# 预期: 99%请求成功
```

## ✅ 验收标准

### 功能性

- ✅ 所有API接口正常工作
- ✅ 登录注册功能正常
- ✅ 聊天对话流畅
- ✅ 分析报告生成正确
- ✅ 数据保存和读取正常

### 性能

- ✅ API响应时间 < 3秒
- ✅ 页面加载流畅
- ✅ 无明显卡顿

### 稳定性

- ✅ 长时间运行无崩溃
- ✅ 错误处理正确
- ✅ 日志记录完整

### 用户体验

- ✅ 界面美观
- ✅ 操作直观
- ✅ 反馈及时
- ✅ 错误提示清晰

## 📝 测试报告模板

```
测试日期: 2025-12-04
测试人员: XXX
环境: 生产环境

【功能测试】
✅ 登录功能: 通过
✅ 聊天功能: 通过
✅ 分析报告: 通过
✅ 数据管理: 通过

【性能测试】
- API响应时间: 平均 150ms
- AI对话延迟: 平均 3.5秒
- 分析报告生成: 平均 15秒

【问题记录】
1. 问题描述
   - 解决方案

【测试结论】
系统运行正常,可以发布使用。

【备注】
无
```

## 🎯 自动化测试 (可选)

### 编写测试脚本

```javascript
// test/api.test.js
const axios = require('axios');

const API_BASE = 'https://your-service-id.bj.run.tcloudbase.com';

describe('API Tests', () => {
  test('Health Check', async () => {
    const res = await axios.get(`${API_BASE}/api/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
  });
  
  // 更多测试...
});
```

### 运行测试

```bash
npm test
```

---

**测试完成后,你的AI个人助手就可以正式上线使用了!** 🎉

如有问题,请查看详细日志或参考文档中的故障排除部分。

