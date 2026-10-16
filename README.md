# Wota艺基础讲座交互式演示系统

一个基于 Reveal.js 的交互式演示系统，支持现场斗舞投票、分组实操和抽奖功能。

## 技术栈

- **后端**: Node.js 16+ + Express 4.x
- **演示端**: Reveal.js 4.x + Chart.js + QRCode.js + Axios
- **移动端**: 原生 HTML/CSS/JavaScript
- **数据存储**: 内存（单次活动使用）

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
cd server
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，修改 ADMIN_TOKEN 为安全的随机字符串

# 3. 启动开发服务器
npm run dev

# 4. 访问
# 演示端: http://localhost:3000/presentation/index.html
# 移动端: http://localhost:3000/mobile/
```

### 生产环境

```bash
cd server
npm start
```

## 部署到云服务器

### 环境要求

- Node.js 16.x 或更高
- PM2（进程管理）
- Nginx（可选，用于反向代理和 HTTPS）

### 部署步骤

```bash
# 1. 连接到服务器
ssh user@your-server-ip

# 2. 安装 Node.js（如果未安装）
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 PM2
sudo npm install -g pm2

# 4. 克隆项目
cd /var/www
git clone <your-repo-url> wotagei-workshop
cd wotagei-workshop

# 5. 安装依赖
cd server
npm install

# 6. 配置环境变量
cp .env.example .env
nano .env
# 修改：
# ADMIN_TOKEN=your-very-secure-random-token-here
# BASE_URL=https://your-domain.com

# 7. 启动应用
pm2 start app.js --name wotagei-workshop

# 8. 设置开机自启
pm2 startup
pm2 save
```

### PM2 常用命令

```bash
pm2 list                    # 查看所有进程
pm2 logs wotagei-workshop   # 查看日志
pm2 restart wotagei-workshop # 重启应用
pm2 stop wotagei-workshop    # 停止应用
pm2 delete wotagei-workshop  # 删除进程
```

### Nginx 配置（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL 证书（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run  # 测试自动续期
```

### 生产环境配置

修改 `public/presentation/js/config.js`：

```javascript
const API_BASE_URL = 'https://your-domain.com/api';
const QR_BASE_URL = 'https://your-domain.com/mobile';
```

## 功能特性

- ✅ Reveal.js 演示幻灯片，类似 PowerPoint 操作
- ✅ 实时投票系统（斗舞 BATTLE）
- ✅ 自动负载均衡分组（分配到人数最少的组）
- ✅ 公平随机抽奖（Fisher-Yates 算法）
- ✅ 二维码扫码参与
- ✅ 移动端友好设计（320px-768px）
- ✅ 防重复机制（基于 deviceId）
- ✅ 数据重置功能
- ✅ API 限流保护

## 使用说明

### 演示端快捷键

- `←/→` 或 点击背景 - 切换幻灯片
- `F` - 全屏/退出全屏
- `Esc` - 显示幻灯片缩略图
- `G` - 打开分组配置面板（输入组数）
- `L` - 打开抽奖配置面板（输入抽取人数）
- `R` - 重置当前环节数据（需确认）
- `Space` - 在抽奖页面开始/停止抽奖

### 添加音乐和视频

将资源文件放到对应目录：

- 音乐：`public/presentation/assets/music/`
  - `battle1.mp3` - BATTLE 1 音乐
  - `battle2.mp3` - BATTLE 2 音乐
- 视频：`public/presentation/assets/videos/`
  - `demo.mp4` - 演示视频
- 支持格式：MP3/AAC（音频），MP4/WebM（视频）

### 修改舞者信息

编辑 `server/state.js`，修改 `battles` 对象中的舞者信息：

```javascript
dancer1: { 
  name: '舞者名称', 
  avatar: '/presentation/assets/images/舞者头像.jpg', 
  votes: 0 
}
```

## 项目结构

```
wotagei-basic-workshop/
├── server/                 # 后端
│   ├── app.js             # Express 主文件
│   ├── state.js           # 状态管理
│   ├── routes/            # API 路由
│   │   ├── vote.js        # 投票
│   │   ├── group.js       # 分组
│   │   ├── lottery.js     # 抽奖
│   │   └── admin.js       # 管理
│   └── package.json
├── public/
│   ├── presentation/      # 演示端
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── mobile/           # 移动端
│       ├── *.html
│       ├── css/
│       └── js/
├── docs/
│   └── superpowers/      # 设计文档和实施计划
├── AGENTS.md             # 协作约定
└── README.md
```

## 常见问题

**Q: 如何修改管理员密码？**  
A: 修改服务器端的 `.env` 文件中的 `ADMIN_TOKEN`，然后重启服务。

**Q: 忘记 ADMIN_TOKEN 怎么办？**  
A: 在服务器上查看 `.env` 文件或 `server/state.js` 中的默认值。

**Q: 如何添加更多 BATTLE？**  
A: 1) 在 `state.js` 中添加新的 battle 对象，2) 在 `index.html` 中复制幻灯片，3) 在 `main.js` 中添加对应的轮询逻辑。

**Q: 移动端扫码后显示 404？**  
A: 检查 `config.js` 中的 `QR_BASE_URL` 是否配置正确，确保指向移动端页面的实际 URL。

**Q: API 返回 403 Forbidden？**  
A: 检查请求中的 `adminToken` 是否与服务器端配置的 `ADMIN_TOKEN` 一致。

## 文档

- 设计规格: `docs/superpowers/specs/2026-10-16-wotagei-workshop-interactive-presentation-design.md`
- 实施计划: `docs/superpowers/plans/2026-10-16-wotagei-workshop-implementation.md`
- 协作约定: `AGENTS.md`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
