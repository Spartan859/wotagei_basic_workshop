# 🚀 下一步操作

项目已完成开发并配置好 CI/CD，现在可以推送到 GitHub 并部署了！

## ✅ 已完成的工作

1. ✅ 完整的功能实现（11个任务全部完成）
2. ✅ Docker 容器化配置
3. ✅ GitHub Actions CI/CD
4. ✅ 服务器部署脚本
5. ✅ 完整的文档

## 📋 立即执行的步骤

### 1. 推送到 GitHub

```bash
# 添加 remote（如果还没有）
git remote add origin https://github.com/Spartan859/wotagei_basic_workshop.git

# 推送代码和标签
git push -u origin main --tags
```

### 2. 配置 GitHub Secrets

在 https://github.com/Spartan859/wotagei_basic_workshop/settings/secrets/actions 添加：

#### DEPLOY_SSH_KEY
```bash
# 生成密钥对
ssh-keygen -t ed25519 -C "wotagei-deploy" -f ~/.ssh/wotagei-deploy

# 显示私钥（复制整个内容到 GitHub Secret）
cat ~/.ssh/wotagei-deploy

# 显示公钥（稍后添加到服务器）
cat ~/.ssh/wotagei-deploy.pub
```

#### DEPLOY_KNOWN_HOSTS
```bash
# 获取服务器指纹（复制输出到 GitHub Secret）
ssh-keyscan -H 120.77.57.144
```

### 3. 配置服务器

SSH 到服务器：
```bash
ssh root@120.77.57.144
```

执行以下命令：

```bash
# 1. 创建部署用户
useradd -m -s /bin/bash wotagei-deploy
usermod -aG docker wotagei-deploy

# 2. 设置 SSH 密钥
mkdir -p /home/wotagei-deploy/.ssh
nano /home/wotagei-deploy/.ssh/authorized_keys
# 粘贴上面生成的公钥（wotagei-deploy.pub 的内容）
chown -R wotagei-deploy:wotagei-deploy /home/wotagei-deploy/.ssh
chmod 700 /home/wotagei-deploy/.ssh
chmod 600 /home/wotagei-deploy/.ssh/authorized_keys

# 3. 创建部署脚本
nano /usr/local/sbin/wotagei-compose-deploy
# 粘贴 deploy/wotagei-compose-deploy.sh 的内容
# 修改第 8 行：OWNER="spartan859" 改为你的 GitHub 用户名（小写）
chmod 755 /usr/local/sbin/wotagei-compose-deploy

# 4. 配置 sudo 权限
nano /etc/sudoers.d/wotagei-deploy
# 添加以下内容：
# wotagei-deploy ALL=(ALL) NOPASSWD: /usr/local/sbin/wotagei-compose-deploy
chmod 440 /etc/sudoers.d/wotagei-deploy

# 5. 测试 SSH 连接（在本地执行）
ssh -i ~/.ssh/wotagei-deploy wotagei-deploy@120.77.57.144
```

### 4. 配置 Nginx（可选但推荐）

如果要使用域名 `wotagei.satintin.com`：

```bash
# 在服务器上创建 Nginx 配置
nano /etc/nginx/sites-available/wotagei

# 粘贴以下内容：
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

# 启用配置
ln -s /etc/nginx/sites-available/wotagei /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 配置 HTTPS
certbot --nginx -d wotagei.satintin.com
```

### 5. 触发首次部署

#### 方式 A：自动部署（推荐）
```bash
# 推送到 main 分支会自动触发 CI 和部署
git push origin main
```

#### 方式 B：手动部署
1. 访问 https://github.com/Spartan859/wotagei_basic_workshop/actions
2. 选择 "Deploy" workflow
3. 点击 "Run workflow"
4. 选择 "main" 分支
5. 点击 "Run workflow"

### 6. 验证部署

```bash
# 检查健康状态
curl https://wotagei.satintin.com/presentation/index.html

# 或者直接访问 IP（如果还没配置域名）
curl http://120.77.57.144:3000/presentation/index.html

# 在浏览器中打开
open https://wotagei.satintin.com/presentation/index.html
```

### 7. 配置演示端管理员令牌

首次部署后：

```bash
# 1. 在服务器上查看自动生成的 ADMIN_TOKEN
ssh wotagei-deploy@120.77.57.144
cat /opt/wotagei-workshop/.env | grep ADMIN_TOKEN

# 2. 在演示端第一次按 G / L / R（或抽奖）时，把这个值填进弹出的输入框
#    （本标签页内缓存；不需要、也不要改代码提交令牌）
```

## 🎯 首次使用

1. **演示端**: https://wotagei.satintin.com/presentation/index.html
   - 按方向键或点击切换幻灯片
   - 按 G 配置分组数
   - 按 L 配置抽奖人数
   - 按 R 重置数据
   - 按空格键（在抽奖页）开始/停止抽奖

2. **移动端**: 扫描大屏幕二维码参与互动
   - 首次访问设置昵称
   - 投票/分组/抽奖

3. **替换资源文件**:
   - 音乐：上传到 `public/presentation/assets/music/`
   - 视频：上传到 `public/presentation/assets/videos/`
   - 图片：上传到 `public/presentation/assets/images/`

## 📚 相关文档

- **DEPLOYMENT.md**: 详细部署指南
- **deploy/SERVER_SETUP.md**: 服务器配置步骤
- **README.md**: 项目说明和功能介绍
- **TESTING.md**: 测试清单
- **AGENTS.md**: 协作约定

## 🆘 遇到问题？

查看故障排查文档：
- CI 失败：检查 GitHub Actions 日志
- 部署失败：检查 SSH 连接和 secrets 配置
- 服务无法访问：检查防火墙和端口配置

祝使用愉快！🎉
