# GitHub 和部署配置指南

## 第一步：推送到 GitHub

```bash
# 1. 在 GitHub 创建新仓库 wotagei_basic_workshop
# 2. 添加 remote 并推送
git remote add origin https://github.com/Spartan859/wotagei_basic_workshop.git
git push -u origin main --tags
```

## 第二步：配置 GitHub Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：

### 1. DEPLOY_SSH_KEY

在本地生成部署密钥：
```bash
ssh-keygen -t ed25519 -C "wotagei-deploy" -f ~/.ssh/wotagei-deploy
cat ~/.ssh/wotagei-deploy  # 复制私钥内容
```

### 2. DEPLOY_KNOWN_HOSTS

获取服务器指纹：
```bash
ssh-keyscan -H 120.77.57.144
```

## 第三步：配置服务器

按照 `deploy/SERVER_SETUP.md` 的步骤配置服务器：

1. 创建 `wotagei-deploy` 用户
2. 安装部署脚本到 `/usr/local/sbin/wotagei-compose-deploy`
3. 配置 sudo 权限
4. 添加 SSH 公钥到服务器
5. 配置 Nginx 反向代理（可选）

## 第四步：触发部署

### 自动部署
推送到 main 分支会自动触发：
```bash
git push origin main
```

### 手动部署
在 GitHub Actions 页面点击 "Deploy" workflow 的 "Run workflow"

## 第五步：验证部署

```bash
# 检查健康状态
curl https://wotagei.satintin.com/presentation/index.html

# 或者如果还没配置域名
curl http://120.77.57.144:3000/presentation/index.html
```

## 注意事项

1. **修改部署脚本中的 GitHub 用户名**：
   编辑 `deploy/wotagei-compose-deploy.sh`，将 `OWNER="spartan859"` 改为你的用户名（小写）

2. **配置域名**：
   如果要使用 `wotagei.satintin.com`，需要：
   - DNS 解析指向 120.77.57.144
   - Nginx 反向代理配置
   - SSL 证书（Let's Encrypt）

3. **管理员令牌**：
   首次部署后，查看服务器上的 ADMIN_TOKEN：
   ```bash
   ssh wotagei-deploy@120.77.57.144
   cat /opt/wotagei-workshop/.env | grep ADMIN_TOKEN
   ```
   
   演示端第一次使用管理功能（G / L / R / 抽奖）时会弹框询问，填入该值即可，无需改代码。

## 本地 Docker 测试

```bash
# 构建镜像
docker build -t wotagei-workshop:local .

# 运行
docker compose up

# 访问
open http://localhost:3000/presentation/index.html
```

## 故障排查

### CI 失败
- 检查 GitHub Actions 日志
- 确认 Node.js 16 和依赖安装成功

### 部署失败
- 检查 SSH 连接：`ssh -i ~/.ssh/wotagei-deploy wotagei-deploy@120.77.57.144`
- 检查 secrets 配置是否正确
- 查看服务器日志：`docker compose logs -f`

### 服务无法访问
- 检查防火墙规则
- 确认端口 3000 或 Nginx 配置正确
- 查看 Docker 容器状态：`docker compose ps`
