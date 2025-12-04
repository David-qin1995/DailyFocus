const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB } = require("./models");
const { errorHandler } = require("./middleware");

// 导入路由
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const analysisRoutes = require("./routes/analysis");
const profileRoutes = require("./routes/profile");

const logger = morgan("tiny");

const app = express();

// 中间件
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.json({
    name: "AI个人助手API",
    version: "1.0.0",
    description: "基于DeepSeek的私人AI助手后端服务",
    status: "running"
  });
});

// API路由
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/profile", profileRoutes);

// 健康检查接口
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: "接口不存在"
  });
});

const port = process.env.PORT || 80;

async function bootstrap() {
  try {
    // 初始化数据库
    await initDB();
    console.log("✅ 数据库初始化成功");
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`✅ 服务启动成功，端口: ${port}`);
      console.log(`🚀 API地址: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ 服务启动失败:", error);
    process.exit(1);
  }
}

bootstrap();
