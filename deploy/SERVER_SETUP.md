# 服务器部署配置

## 前置要求

服务器需要安装：
- Docker
- Docker Compose

## 服务器配置步骤

### 1. 创建部署用户

```bash
# 在服务器上执行
sudo useradd -m -s /bin/bash wotagei-deploy
sudo usermod -aG docker wotagei-deploy
```

### 2. 安装部署脚本

```bash
# 复制部署脚本到服务器
sudo cp deploy/wotagei-compose-deploy.sh /usr/local/sbin/wotagei-compose-deploy
sudo chmod 755 /usr/local/sbin/wotagei-compose-deploy
sudo chown root:root /usr/local/sbin/wotagei-compose-deploy
```

### 3. 配置 sudo 权限

```bash
# 创建 sudoers 配置
sudo tee /etc/sudoers.d/wotagei-deploy <<EOF
wotagei-deploy ALL=(ALL) NOPASSWD: /usr/local/sbin/wotagei-compose-deploy
EOF

sudo chmod 440 /etc/sudoers.d/wotagei-deploy
```

### 4. 设置 SSH 密钥

在本地生成部署密钥：

```bash
ssh-keygen -t ed25519 -C "wotagei-deploy" -f ~/.ssh/wotagei-deploy
```

将公钥添加到服务器：

```bash
# 在服务器上执行
sudo -u wotagei-deploy mkdir -p /home/wotagei-deploy/.ssh
sudo tee /home/wotagei-deploy/.ssh/authorized_keys <<EOF
<粘贴公钥内容>
EOF
sudo chown -R wotagei-deploy:wotagei-deploy /home/wotagei-deploy/.ssh
sudo chmod 700 /home/wotagei-deploy/.ssh
sudo chmod 600 /home/wotagei-deploy/.ssh/authorized_keys
```

### 5. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **DEPLOY_SSH_KEY**: 私钥内容（`~/.ssh/wotagei-deploy` 的内容）
2. **DEPLOY_KNOWN_HOSTS**: 服务器指纹
   ```bash
   ssh-keyscan -H 120.77.57.144 > known_hosts
   cat known_hosts
   ```

### 6. 配置 Nginx 反向代理（可选）

如果要配置域名 `wotagei.satintin.com`：

```nginx
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
```

然后启用 HTTPS：

```bash
sudo certbot --nginx -d wotagei.satintin.com
```

## 手动部署测试

```bash
# 测试 SSH 连接
ssh -i ~/.ssh/wotagei-deploy wotagei-deploy@120.77.57.144

# 测试部署命令
sudo /usr/local/sbin/wotagei-compose-deploy <git-sha>
```

## 环境变量

部署脚本会在 `/opt/wotagei-workshop/.env` 创建配置文件，包含：

- `WOTAGEI_IMAGE`: Docker 镜像地址
- `WOTAGEI_PORT`: 服务端口（默认 3000）
- `ADMIN_TOKEN`: 管理员令牌（自动生成）

## 查看日志

```bash
cd /opt/wotagei-workshop
docker compose logs -f app
```

## 故障排查

### 查看服务状态

```bash
cd /opt/wotagei-workshop
docker compose ps
```

### 重启服务

```bash
cd /opt/wotagei-workshop
docker compose restart
```

### 查看配置

```bash
cat /opt/wotagei-workshop/.env
```
