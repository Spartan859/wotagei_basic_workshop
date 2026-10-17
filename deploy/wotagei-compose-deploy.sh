#!/bin/bash
# 部署脚本 - 在服务器上执行
# 用法:
#   wotagei-compose-deploy <git-sha>        部署指定版本
#   wotagei-compose-deploy --install-self   从 stdin 读取新版本并覆盖自身（供 CI 更新脚本）

set -euo pipefail

SELF_PATH="/usr/local/sbin/wotagei-compose-deploy"

# 自更新模式：CI 通过 ssh 把最新的部署脚本写到 stdin
if [[ "${1:-}" == "--install-self" ]]; then
    tmp_file="$(mktemp "${SELF_PATH}.XXXXXX")"
    trap 'rm -f "${tmp_file}"' EXIT
    cat > "${tmp_file}"
    chmod 755 "${tmp_file}"
    mv -f "${tmp_file}" "${SELF_PATH}"
    trap - EXIT
    echo "deploy script installed to ${SELF_PATH}"
    exit 0
fi

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
# 注意：历史版本可能残留 PORT/NODE_ENV/ADMIN_TOKEN 格式的 .env，
# 这里必须保证 WOTAGEI_IMAGE 一定存在且指向本次发布版本，否则
# docker compose 会以 "variable is not set" / "invalid compose project" 失败。
touch "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

set_env() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "${ENV_FILE}"; then
        sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
    else
        printf '%s=%s\n' "${key}" "${value}" >> "${ENV_FILE}"
    fi
}

set_env WOTAGEI_IMAGE "${IMAGE}"
set_env WOTAGEI_PORT "3000"

if ! grep -q "^ADMIN_TOKEN=" "${ENV_FILE}"; then
    printf 'ADMIN_TOKEN=%s\n' "$(openssl rand -hex 32)" >> "${ENV_FILE}"
fi

WOTAGEI_PORT_VALUE="$(sed -n 's/^WOTAGEI_PORT=//p' "${ENV_FILE}" | tail -n 1)"
WOTAGEI_PORT_VALUE="${WOTAGEI_PORT_VALUE:-3000}"

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

# 等待服务就绪（最多 30s），失败时直接让流水线红掉
for _ in $(seq 1 15); do
    if curl -fsS --max-time 5 "http://127.0.0.1:${WOTAGEI_PORT_VALUE}/" >/dev/null 2>&1; then
        ready=1
        break
    fi
    sleep 2
done

if [[ "${ready:-0}" != "1" ]]; then
    echo "ERROR: service did not become ready on port ${WOTAGEI_PORT_VALUE}" >&2
    docker compose --env-file "${ENV_FILE}" ps >&2
    docker compose --env-file "${ENV_FILE}" logs --tail 50 app >&2
    exit 1
fi

docker compose --env-file "${ENV_FILE}" ps

echo "Deployment complete!"
echo "Service is running at http://localhost:${WOTAGEI_PORT_VALUE}"
