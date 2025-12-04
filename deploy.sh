#!/bin/bash

# AI个人助手 - 微信云托管一键部署脚本
# 使用方法: ./deploy.sh [环境ID]

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "================================"
echo "  AI个人助手 - 一键部署"
echo "================================"
echo ""

# 检查tcb CLI
if ! command -v tcb &> /dev/null; then
    echo -e "${RED}❌ 未安装腾讯云开发CLI${NC}"
    echo ""
    echo "请先安装: npm install -g @cloudbase/cli"
    exit 1
fi
echo -e "${GREEN}✓ CLI工具已安装${NC}"

# 检查登录
echo -e "${BLUE}检查登录状态...${NC}"
if ! tcb login --status &> /dev/null; then
    echo -e "${YELLOW}未登录，启动登录流程...${NC}"
    tcb login
fi
echo -e "${GREEN}✓ 已登录${NC}"

# 获取环境ID
ENV_ID=$1
if [ -z "$ENV_ID" ]; then
    echo ""
    echo -e "${YELLOW}请输入云托管环境ID:${NC}"
    read ENV_ID
fi

if [ -z "$ENV_ID" ]; then
    echo -e "${RED}❌ 环境ID不能为空${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}环境ID: ${ENV_ID}${NC}"

# 检查必需文件
echo ""
echo -e "${BLUE}检查配置文件...${NC}"
if [ ! -f "Dockerfile" ] || [ ! -f "container.config.json" ]; then
    echo -e "${RED}❌ 缺少必需文件${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 配置文件完整${NC}"

# 开始部署
echo ""
echo -e "${BLUE}===== 开始部署 =====${NC}"
echo -e "${YELLOW}⏳ 正在上传代码并构建镜像，预计需要3-5分钟...${NC}"
echo ""

# 执行部署
tcb run deploy \
    --env-id "$ENV_ID" \
    --name "ai-assistant" \
    --container-port 80 \
    --dockerfile-path ./Dockerfile \
    --build-dir ./ \
    --cpu 0.5 \
    --mem 1 \
    --min-num 0 \
    --max-num 5 \
    --policy-type cpu \
    --policy-threshold 60

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  ✓ 部署成功！${NC}"
    echo -e "${GREEN}================================${NC}"
else
    echo ""
    echo -e "${RED}❌ 部署失败${NC}"
    echo "查看日志: tcb run logs --env-id $ENV_ID"
    exit 1
fi

# 配置提示
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}重要: 请立即配置环境变量${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. 登录云托管控制台"
echo "2. 进入: 服务设置 > 环境变量"
echo "3. 添加以下配置:"
echo ""
echo "   DEEPSEEK_API_KEY=你的API密钥"
echo "   WECHAT_APPID=小程序AppID"
echo "   WECHAT_SECRET=小程序密钥"
echo "   JWT_SECRET=随机字符串"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 获取服务信息
echo ""
echo -e "${BLUE}服务信息:${NC}"
tcb run service list --env-id "$ENV_ID" 2>/dev/null || true

echo ""
echo "下一步:"
echo "  1. 配置环境变量"
echo "  2. 配置小程序域名"
echo "  3. 测试服务 (参考 TESTING.md)"
echo ""
echo "详细文档: ONE_CLICK_DEPLOY.md"
echo ""
