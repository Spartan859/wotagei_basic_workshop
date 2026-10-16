#!/bin/bash
# 部署脚本 - 在服务器上执行
# 用法: wotagei-compose-deploy <git-sha>

set -euo pipefail

RELEASE_ID="${1:?missing release ID}"
OWNER="spartan859"  # 修改为你的 GitHub 用户名（小写）
# 使用南京大学 GHCR 镜像加速
IMAGE="ghcr.nju.edu.cn/${OWNER}/wotagei-workshop:${RELEASE_ID}"

COMPOSE_PROJECT="wotagei-workshop"
DEPLOY_DIR="/opt/wotagei-workshop"
ENV_FILE="${DEPLOY_DIR}/.env"

echo "Deploying ${IMAGE}..."

# 拉取镜像
docker pull "${IMAGE}"

# 确保部署目录存在
mkdir -p "${DEPLOY_DIR}"

# 创建或更新 .env 文件
if [[ ! -f "${ENV_FILE}" ]]; then
    cat > "${ENV_FILE}" <<EOF
WOTAGEI_IMAGE=${IMAGE}
WOTAGEI_PORT=3000
ADMIN_TOKEN=$(openssl rand -hex 32)
EOF
    chmod 600 "${ENV_FILE}"
else
    # 更新镜像版本（如果存在则替换，否则添加）
    if grep -q "^WOTAGEI_IMAGE=" "${ENV_FILE}"; then
        sed -i "s|WOTAGEI_IMAGE=.*|WOTAGEI_IMAGE=${IMAGE}|" "${ENV_FILE}"
    else
        echo "WOTAGEI_IMAGE=${IMAGE}" >> "${ENV_FILE}"
    fi
    # 确保其他必需变量存在
    grep -q "^WOTAGEI_PORT=" "${ENV_FILE}" || echo "WOTAGEI_PORT=3000" >> "${ENV_FILE}"
fi

# 创建 docker-compose.yaml
cat > "${DEPLOY_DIR}/docker-compose.yaml" <<'EOF'
name: wotagei-workshop

services:
  app:
    image: ${WOTAGEI_IMAGE}
    environment:
      PORT: 3000
      NODE_ENV: production
      ADMIN_TOKEN: ${ADMIN_TOKEN}
    ports:
      - "127.0.0.1:${WOTAGEI_PORT:-3000}:3000"
    init: true
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    networks: [wotagei]

networks:
  wotagei:
    name: wotagei
EOF

# 部署
cd "${DEPLOY_DIR}"
docker compose --env-file "${ENV_FILE}" up -d --remove-orphans

echo "Deployment complete!"
echo "Service is running at http://localhost:${WOTAGEI_PORT:-3000}"
