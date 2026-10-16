# 🚀 立即部署指南

## ✅ 服务器配置已完成！

服务器上已经配置好：
- ✓ 用户 `wotagei-deploy` 已创建
- ✓ 部署脚本已安装到 `/usr/local/sbin/wotagei-compose-deploy`
- ✓ sudo 权限已配置
- ✓ SSH 密钥已配置
- ✓ Nginx 反向代理已配置

## 📋 接下来的 3 步操作

### 步骤 1: 推送代码到 GitHub

```bash
cd /Users/dijkstra0x3/Github/wotagei_basic_workshop

# 添加 remote（如果还没有）
git remote add origin https://github.com/Spartan859/wotagei_basic_workshop.git

# 推送代码和标签
git push -u origin main --tags
```

### 步骤 2: 配置 GitHub Secrets

访问: https://github.com/Spartan859/wotagei_basic_workshop/settings/secrets/actions

添加以下两个 secrets：

#### Secret 1: DEPLOY_SSH_KEY

获取私钥内容：
```bash
cat ~/.ssh/wotagei-deploy
```

复制**完整内容**（包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）到 GitHub Secret

#### Secret 2: DEPLOY_KNOWN_HOSTS

获取服务器指纹：
```bash
ssh-keyscan -H 120.77.57.144
```

复制输出到 GitHub Secret

### 步骤 3: 触发部署

推送到 GitHub 后会自动触发 CI/CD：

1. **CI 阶段**：构建 Docker 镜像并推送到 GHCR
2. **Deploy 阶段**：自动部署到 satintin 服务器

或者手动触发：
- 访问 https://github.com/Spartan859/wotagei_basic_workshop/actions
- 点击 "Deploy" workflow
- 点击 "Run workflow"

## 🔍 验证部署

### 方法 1: 通过域名访问
```bash
curl https://wotagei.satintin.com/presentation/index.html
```

### 方法 2: 在浏览器中打开
```
https://wotagei.satintin.com/presentation/index.html
```

### 方法 3: 检查服务器状态
```bash
ssh wotagei-deploy@120.77.57.144 "cd /opt/wotagei-workshop && docker compose ps"
```

## 📝 查看 ADMIN_TOKEN

部署后查看自动生成的管理员令牌：
```bash
ssh satintin "cat /opt/wotagei-workshop/.env | grep ADMIN_TOKEN"
```

然后更新 `public/presentation/js/config.js` 中的 `ADMIN_TOKEN` 值。

## 🎯 快速命令

```bash
# 推送到 GitHub
cd /Users/dijkstra0x3/Github/wotagei_basic_workshop
git push -u origin main --tags

# 获取 DEPLOY_SSH_KEY
cat ~/.ssh/wotagei-deploy

# 获取 DEPLOY_KNOWN_HOSTS  
ssh-keyscan -H 120.77.57.144

# 查看部署状态
ssh wotagei-deploy@120.77.57.144 "cd /opt/wotagei-workshop && docker compose logs -f"

# 查看 ADMIN_TOKEN
ssh satintin "cat /opt/wotagei-workshop/.env | grep ADMIN_TOKEN"
```

## ℹ️ 注意事项

1. **首次推送**：GitHub 可能需要您输入用户名和密码/token
2. **GHCR 权限**：确保 GitHub 仓库的 Actions 有权限推送到 Container Registry
3. **域名解析**：确保 `wotagei.satintin.com` 已经解析到 `120.77.57.144`

## 🎉 完成后

访问演示系统：
- 演示端: https://wotagei.satintin.com/presentation/index.html
- 移动端: https://wotagei.satintin.com/mobile/

享受您的 Wota 艺互动演示系统！
