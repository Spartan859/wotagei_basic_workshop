#!/bin/bash
# 服务器快速部署脚本
# 在 satintin 服务器上以 root 身份运行

set -e

echo "=== 开始配置 Wotagei Workshop 部署环境 ==="

# 1. 创建部署用户
echo "[1/6] 创建部署用户..."
if ! id wotagei-deploy &>/dev/null; then
    useradd -m -s /bin/bash wotagei-deploy
    usermod -aG docker wotagei-deploy
    echo "✓ 用户 wotagei-deploy 已创建"
else
    echo "✓ 用户 wotagei-deploy 已存在"
fi

# 2. 创建部署脚本
echo "[2/6] 安装部署脚本..."
cat > /usr/local/sbin/wotagei-compose-deploy << 'SCRIPT_EOF'
#!/bin/bash
set -euo pipefail

RELEASE_ID="${1:?missing release ID}"
OWNER="spartan859"
IMAGE="ghcr.io/${OWNER}/wotagei-workshop:${RELEASE_ID}"

COMPOSE_PROJECT="wotagei-workshop"
DEPLOY_DIR="/opt/wotagei-workshop"
ENV_FILE="${DEPLOY_DIR}/.env"

echo "Deploying ${IMAGE}..."

docker pull "${IMAGE}"

mkdir -p "${DEPLOY_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
    cat > "${ENV_FILE}" <<EOF
WOTAGEI_IMAGE=${IMAGE}
WOTAGEI_PORT=3000
ADMIN_TOKEN=$(openssl rand -hex 32)
EOF
    chmod 600 "${ENV_FILE}"
else
    sed -i "s|WOTAGEI_IMAGE=.*|WOTAGEI_IMAGE=${IMAGE}|" "${ENV_FILE}"
fi

cat > "${DEPLOY_DIR}/docker-compose.yaml" <<'COMPOSE_EOF'
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
COMPOSE_EOF

cd "${DEPLOY_DIR}"
docker compose --env-file "${ENV_FILE}" up -d --remove-orphans

echo "Deployment complete!"
echo "Service is running at http://localhost:${WOTAGEI_PORT:-3000}"
SCRIPT_EOF

chmod 755 /usr/local/sbin/wotagei-compose-deploy
chown root:root /usr/local/sbin/wotagei-compose-deploy
echo "✓ 部署脚本已安装到 /usr/local/sbin/wotagei-compose-deploy"

# 3. 配置 sudo 权限
echo "[3/6] 配置 sudo 权限..."
cat > /etc/sudoers.d/wotagei-deploy << 'EOF'
wotagei-deploy ALL=(ALL) NOPASSWD: /usr/local/sbin/wotagei-compose-deploy
EOF
chmod 440 /etc/sudoers.d/wotagei-deploy
echo "✓ sudo 权限已配置"

# 4. 生成 SSH 密钥（如果不存在）
echo "[4/6] 配置 SSH..."
if [[ ! -f /home/wotagei-deploy/.ssh/authorized_keys ]]; then
    mkdir -p /home/wotagei-deploy/.ssh
    chmod 700 /home/wotagei-deploy/.ssh
    touch /home/wotagei-deploy/.ssh/authorized_keys
    chmod 600 /home/wotagei-deploy/.ssh/authorized_keys
    chown -R wotagei-deploy:wotagei-deploy /home/wotagei-deploy/.ssh
    echo "✓ SSH 目录已创建，请添加部署公钥到 /home/wotagei-deploy/.ssh/authorized_keys"
else
    echo "✓ SSH 已配置"
fi

# 5. 配置 Nginx（如果已安装）
echo "[5/6] 配置 Nginx..."
if command -v nginx &>/dev/null; then
    cat > /etc/nginx/sites-available/wotagei << 'NGINX_EOF'
server {
    listen 80;
    server_name wotagei.satintin.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

    if [[ ! -e /etc/nginx/sites-enabled/wotagei ]]; then
        ln -s /etc/nginx/sites-available/wotagei /etc/nginx/sites-enabled/
    fi

    nginx -t && systemctl reload nginx
    echo "✓ Nginx 配置已更新"
else
    echo "⚠ Nginx 未安装，跳过 Nginx 配置"
fi

# 6. 显示后续步骤
echo "[6/6] 配置完成！"
echo ""
echo "=== 后续步骤 ==="
echo ""
echo "1. 添加 GitHub 部署密钥："
echo "   在本地运行: ssh-keygen -t ed25519 -C 'wotagei-deploy' -f ~/.ssh/wotagei-deploy"
echo "   然后添加公钥: cat ~/.ssh/wotagei-deploy.pub"
echo "   粘贴到: /home/wotagei-deploy/.ssh/authorized_keys"
echo ""
echo "2. 配置 GitHub Secrets:"
echo "   DEPLOY_SSH_KEY: ~/.ssh/wotagei-deploy 的内容"
echo "   DEPLOY_KNOWN_HOSTS: 运行 ssh-keyscan -H 120.77.57.144"
echo ""
echo "3. 推送代码到 GitHub 触发部署"
echo ""
echo "4. 或者手动测试部署:"
echo "   sudo /usr/local/sbin/wotagei-compose-deploy <git-sha>"
echo ""
echo "5. 查看生成的 ADMIN_TOKEN:"
echo "   cat /opt/wotagei-workshop/.env | grep ADMIN_TOKEN"
echo ""
