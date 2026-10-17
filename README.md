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
# 1. 克隆项目
git clone <repository-url>
cd wotagei_basic_workshop

# 2. 安装依赖
cd server
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改 ADMIN_TOKEN 为安全的随机字符串（至少 32 字符）

# 4. 启动开发服务器
npm run dev
```

### 访问

- 统一入口: http://localhost:3000/
- 演示端：电脑访问统一入口并输入 `ADMIN_TOKEN` 后进入 PPT
- 移动端: http://localhost:3000/mobile/

统一入口会根据设备判断访问方式：手机端只显示“请用 PC 访问”，电脑端必须先通过管理员令牌校验。未通过校验时，直接访问 `/presentation/index.html` 也不会返回 PPT 内容。

### 生产环境注意事项

1. **修改 ADMIN_TOKEN**：在 `.env` 中设置强密码
2. **域名无需配置**：演示端与移动端的 API 地址、二维码地址都按 `window.location.origin` 推导，
   用什么域名打开演示端，二维码就指向同一个域名。
3. **管理员令牌运行时输入**：演示端第一次使用 `G` / `L` / `R` / 抽奖时会弹框询问 `ADMIN_TOKEN`
   （填服务器 `.env` 里的值），本标签页内缓存，令牌错误会自动清除并重新询问。不要把令牌写进代码。
4. **启用 HTTPS**：使用 Nginx + Let's Encrypt

## 功能特性

- ✅ Reveal.js 演示幻灯片（12 页）
- ✅ 实时投票系统（斗舞 BATTLE）
- ✅ 自动负载均衡分组（分配到人数最少的组）
- ✅ 公平随机抽奖（Fisher-Yates 算法）
- ✅ 二维码扫码参与
- ✅ 移动端友好设计（支持 320px 宽度）
- ✅ 防重复机制（基于 deviceId）
- ✅ 数据重置功能
- ✅ XSS 防护（escapeHtml）

## 部署到云服务器

### 环境要求

- Node.js 16.x 或更高
- PM2（进程管理）
- Nginx（可选，用于反向代理）

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
git clone <repository-url> wotagei-workshop
cd wotagei-workshop

# 5. 安装依赖
cd server
npm install

# 6. 配置环境变量
cp .env.example .env
nano .env
# 修改：
# PORT=3000
# NODE_ENV=production
# ADMIN_TOKEN=<强密码，至少32字符>
# BASE_URL=https://your-domain.com

# 7. 启动应用
pm2 start app.js --name wotagei-workshop

# 8. 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理（可选）

创建 `/etc/nginx/sites-available/wotagei-workshop`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/wotagei-workshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

### PM2 管理

```bash
pm2 list                    # 查看所有进程
pm2 logs wotagei-workshop   # 查看日志
pm2 restart wotagei-workshop # 重启应用
pm2 stop wotagei-workshop    # 停止应用
pm2 delete wotagei-workshop  # 删除进程
```

### 更新部署

```bash
cd /var/www/wotagei-workshop
git pull
cd server
npm install
pm2 restart wotagei-workshop
```

## 音视频文件

将音乐和视频文件放到对应目录：

- **音乐文件**: `public/presentation/assets/music/`
  - `battle1.mp3` - BATTLE 1 背景音乐
  - `battle2.mp3` - BATTLE 2 背景音乐
  - 支持格式：MP3, AAC

- **视频文件**: `public/presentation/assets/videos/`
  - `demo.mp4` - Wota 艺演示视频
  - 支持格式：MP4, WebM

- **舞者头像**: `public/presentation/assets/images/`
  - `dancer-a.jpg`, `dancer-b.jpg`, `dancer-c.jpg`, `dancer-d.jpg`
  - 建议尺寸：200x200px

- **流派 Logo**: `public/presentation/assets/images/`
  - `kansai-logo.png` - 关西流派
  - `torch-logo.png` - 火把流派
  - 建议尺寸：400x300px

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
│       ├── index.html
│       ├── nickname.html
│       ├── vote.html
│       ├── group.html
│       ├── lottery.html
│       ├── css/
│       └── js/
├── docs/
│   └── superpowers/      # 设计文档和实施计划
├── AGENTS.md             # 协作约定
└── README.md
```

## 常见问题

### 如何修改舞者信息？

编辑 `server/state.js` 中的初始化数据：

```javascript
battles: {
  battle1: {
    dancer1: { 
      name: '你的舞者名称', 
      avatar: '/presentation/assets/images/your-image.jpg', 
      votes: 0 
    },
    // ...
  }
}
```

### 如何添加更多 BATTLE？

1. 在 `state.js` 中添加新的 battle 数据
2. 在 `presentation/index.html` 中复制一组 BATTLE 幻灯片（准备/音乐/投票）
3. 修改对应的 id（如 `battle3-intro`, `vote-battle3`）
4. 在 `main.js` 的 slidechanged 事件中添加对应的轮询逻辑

### 忘记 ADMIN_TOKEN 怎么办？

在服务器上查看 `.env` 文件：

```bash
cat /var/www/wotagei-workshop/server/.env
```

### 如何重置所有数据？

1. 演示端按 `R` 键
2. 或重启服务器（数据存储在内存中）

### 移动端扫码后显示 404

检查：
1. `config.js` 中的 `QR_BASE_URL` 是否正确
2. 服务器是否正常运行
3. 移动端文件是否正确部署到 `public/mobile/`

## 文档

- 设计规格: `docs/superpowers/specs/2026-10-16-wotagei-workshop-interactive-presentation-design.md`
- 实施计划: `docs/superpowers/plans/2026-10-16-wotagei-workshop-implementation.md`
- 协作约定: `AGENTS.md`

## 许可证

MIT
