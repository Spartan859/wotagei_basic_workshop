# Wota艺基础讲座交互式演示系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 Reveal.js 的交互式演示系统，支持现场斗舞投票、分组实操和抽奖功能

**Architecture:** 前后端分离架构。演示端使用 Reveal.js 呈现幻灯片和实时数据，移动端提供轻量级投票/分组/抽奖界面，Express 后端提供 REST API 和内存数据管理，演示端通过轮询获取最新数据。

**Tech Stack:** 
- 前端：Reveal.js 4.x, Chart.js 4.x, QRCode.js, Axios (演示端) / 原生 HTML/CSS/JavaScript (移动端)
- 后端：Node.js 16+, Express 4.x, CORS, body-parser, compression, express-rate-limit
- 部署：云服务器, PM2, Nginx (可选)

**Spec:** `docs/superpowers/specs/2026-10-16-wotagei-workshop-interactive-presentation-design.md`

## Global Constraints

- Node.js 最低版本：16.x
- 昵称长度：2-10 个字符
- deviceId 格式：UUID v4 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)
- 组数范围：1-20
- 抽奖人数范围：1-100
- 投票轮询间隔：3000ms
- 分组轮询间隔：5000ms
- 抽奖滚动间隔：50ms
- 移动端最小宽度：320px
- 按钮最小高度：48px
- 正文字体最小：16px
- API 限流：60 秒内最多 10 次请求

## Review Focus

1. **重复 deviceId 突破防重复机制** - 用户清除 localStorage 或更换浏览器后使用相同昵称，可能绕过防重复检查。预期行为：后端仅依赖 deviceId 判断，昵称可以重复，每个 deviceId 只能操作一次。测试：Task 3 后端路由测试中验证相同昵称不同 deviceId 允许重复操作。

2. **分组调整时成员丢失** - 主持人减少组数时，被删除组的成员未正确重新分配。预期行为：所有成员保留，负载均衡分配到剩余组。测试：Task 3 中添加组数调整测试，验证成员总数不变且均匀分布。

3. **抽奖重名处理** - 多人使用相同昵称参与抽奖时，中奖显示不明确。预期行为：允许重名，中奖显示时相同昵称加序号（"张三 (2)"）。测试：Task 6 演示端抽奖模块测试中验证重名显示逻辑。

4. **网络故障时数据丢失** - 移动端提交数据时网络中断，用户不知道是否成功。预期行为：显示明确错误提示，允许用户重试。测试：Task 7 移动端模块中验证 fetch 错误处理和用户提示。

5. **轮询期间页面切换导致多个轮询同时运行** - 快速切换幻灯片时未停止之前的轮询。预期行为：每次切换页面时停止所有现有轮询，仅启动当前页面需要的轮询。测试：Task 6 演示端主逻辑中验证 slidechanged 事件正确管理轮询生命周期。

---

### Task 1: 项目初始化和后端状态管理

**Files:**
- Create: `server/package.json`
- Create: `server/state.js`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: 无
- Produces: 
  - `getState()` → 返回全局 state 对象
  - `resetVote(battleId: string)` → void
  - `resetGroup()` → void
  - `resetLottery()` → void
  - `resetAll()` → void

- [ ] **Step 1: 创建 server/package.json**

```json
{
  "name": "wotagei-workshop",
  "version": "1.0.0",
  "description": "Wota艺基础讲座交互式演示系统",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

- [ ] **Step 2: 创建 server/state.js**

导出 `getState()` 返回规格中定义的 state 对象结构，包含 battles/grouping/lottery，初始化 battle1/battle2 舞者信息（name/avatar/votes），grouping 默认 3 组，lottery.drawCount 默认 3，adminToken 从环境变量读取或使用默认值。导出 resetVote/resetGroup/resetLottery/resetAll 函数清空对应数据。

- [ ] **Step 3: 创建 .env.example**

```
PORT=3000
NODE_ENV=development
ADMIN_TOKEN=change-this-to-a-secure-token
BASE_URL=http://localhost:3000
```

- [ ] **Step 4: 创建 .gitignore**

包含：`node_modules/`, `.env`, `.DS_Store`, `npm-debug.log`

- [ ] **Step 5: 创建 README.md**

包含项目简介、技术栈、安装步骤（`npm install`）、启动命令（`npm start` 或 `npm run dev`）、环境变量说明。

- [ ] **Step 6: 安装依赖**

Run: `cd server && npm install`
Expected: 所有依赖安装成功，生成 package-lock.json

- [ ] **Step 7: 提交**

```bash
git add server/package.json server/state.js .env.example .gitignore README.md
git commit -m "feat: initialize project and backend state management"
```

---

### Task 2: Express 应用和中间件配置

**Files:**
- Create: `server/app.js`

**Interfaces:**
- Consumes: `state.js` 的 `getState()`
- Produces: Express app 实例，监听指定端口

- [ ] **Step 1: 创建 server/app.js 骨架**

导入 express, cors, bodyParser, compression, express-rate-limit。创建 Express app，配置 cors()（允许所有来源），bodyParser.json()，compression()。配置 express.static('public')  提供静态文件。定义全局错误处理中间件（返回 500 和 Internal server error）。监听 PORT（从环境变量或默认 3000）并输出启动信息。

- [ ] **Step 2: 手动测试启动**

Run: `cd server && node app.js`
Expected: 控制台输出 "Server running on port 3000"，访问 http://localhost:3000 返回 404（因为还没有路由和静态文件）

- [ ] **Step 3: 提交**

```bash
git add server/app.js
git commit -m "feat: setup Express app with middleware"
```

---

### Task 3: 后端 API 路由

**Files:**
- Create: `server/routes/vote.js`
- Create: `server/routes/group.js`
- Create: `server/routes/lottery.js`
- Create: `server/routes/admin.js`
- Modify: `server/app.js` (添加路由引用)

**Interfaces:**
- Consumes: `state.js` 的 `getState()`, `resetVote()`, `resetGroup()`, `resetLottery()`, `resetAll()`
- Produces: 
  - `POST /api/vote` - 接收 `{battleId, dancer, deviceId}`，返回 `{success, votes}` 或错误
  - `GET /api/vote/:battleId` - 返回 `{dancer1: {name, avatar, votes}, dancer2: {...}}`
  - `POST /api/group/join` - 接收 `{nickname, deviceId}`，返回 `{success, groupId, alreadyJoined, groupMembers}`
  - `GET /api/group/status` - 返回 `{groupCount, groups: {...}}`
  - `PUT /api/group/config` - 接收 `{groupCount, adminToken}`，返回 `{success, groupCount}`
  - `POST /api/lottery/join` - 接收 `{nickname, deviceId}`，返回 `{success, alreadyJoined, participantCount}`
  - `POST /api/lottery/draw` - 接收 `{adminToken}`，返回 `{success, winners: [...]}`
  - `GET /api/lottery/status` - 返回 `{participantCount, winners, drawCount}`
  - `PUT /api/lottery/config` - 接收 `{drawCount, adminToken}`，返回 `{success, drawCount}`
  - `POST /api/reset/:module` - 接收 `{adminToken}`，返回 `{success, module}`

- [ ] **Step 1: 创建 server/routes/vote.js**

实现 `POST /` 和 `GET /:battleId`。POST 验证必填字段，检查 battle 和 dancer 存在性，防重复投票（battle.voters.has(deviceId) 返回 409），记录投票后返回两位舞者票数。GET 返回指定 battle 的舞者信息和票数，不存在返回 404。

- [ ] **Step 2: 创建 server/routes/group.js**

实现 `POST /join`, `GET /status`, `PUT /config`。JOIN 验证必填，检查防重复（返回已加入的组），否则找人数最少的组（遍历比较 members.length），添加成员（{nickname, deviceId, timestamp: Date.now()}），返回 groupId 和 groupMembers。STATUS 返回所有组的 members（昵称数组）和 count。CONFIG 验证 adminToken，验证 groupCount 范围（1-20），增加组时创建空组，减少组时收集被删组成员并负载均衡重新分配。

- [ ] **Step 3: 创建 server/routes/lottery.js**

实现 `POST /join`, `POST /draw`, `GET /status`, `PUT /config`。JOIN 验证必填，防重复（participantSet.has），添加参与者到 participants 数组和 participantSet。DRAW 验证 adminToken，过滤已中奖者，Fisher-Yates 洗牌（规格第 1405-1410 行），取前 drawCount 个，记录到 winners，返回中奖昵称数组。STATUS 返回参与人数、中奖者列表和抽奖人数。CONFIG 验证 adminToken 和 drawCount 范围（1-100）。

- [ ] **Step 4: 创建 server/routes/admin.js**

实现 `POST /reset/:module`。验证 adminToken，根据 module 参数（'vote'/'group'/'lottery'/'all'）调用对应的 reset 函数，vote 重置两个 battle，all 调用 resetAll()，无效 module 返回 400。

- [ ] **Step 5: 应用限流到敏感端点**

在 app.js 中创建 rate limiter（windowMs: 60000, max: 10），应用到 `/api/vote`, `/api/group/join`, `/api/lottery/join`。

- [ ] **Step 6: 在 app.js 中注册路由**

```javascript
const voteRoutes = require('./routes/vote');
const groupRoutes = require('./routes/group');
const lotteryRoutes = require('./routes/lottery');
const adminRoutes = require('./routes/admin');

app.use('/api/vote', limiter, voteRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api', adminRoutes);
```

- [ ] **Step 7: 测试投票 API**

Run: 启动服务器，使用 curl 或 Postman
```bash
# 提交投票
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"battleId":"battle1","dancer":"dancer1","deviceId":"test-device-1"}'

# 获取投票结果
curl http://localhost:3000/api/vote/battle1
```
Expected: POST 返回 success:true 和 votes，GET 返回 dancer1/dancer2 信息，重复 POST 返回 409 错误。验证相同昵称不同 deviceId 允许重复投票（Review Focus #1）。

- [ ] **Step 8: 测试分组 API**

```bash
# 加入分组
curl -X POST http://localhost:3000/api/group/join \
  -H "Content-Type: application/json" \
  -d '{"nickname":"张三","deviceId":"device-1"}'

# 获取分组状态
curl http://localhost:3000/api/group/status

# 调整组数（需要 adminToken）
curl -X PUT http://localhost:3000/api/group/config \
  -H "Content-Type: application/json" \
  -d '{"groupCount":2,"adminToken":"change-this-to-a-secure-token"}'
```
Expected: JOIN 返回 groupId 和成员列表，重复加入返回已加入的组。验证减少组数后成员总数不变且均匀分布（Review Focus #2）。

- [ ] **Step 9: 测试抽奖 API**

```bash
# 参与抽奖
curl -X POST http://localhost:3000/api/lottery/join \
  -H "Content-Type: application/json" \
  -d '{"nickname":"李四","deviceId":"device-2"}'

# 执行抽奖
curl -X POST http://localhost:3000/api/lottery/draw \
  -H "Content-Type: application/json" \
  -d '{"adminToken":"change-this-to-a-secure-token"}'

# 获取抽奖状态
curl http://localhost:3000/api/lottery/status
```
Expected: JOIN 返回参与成功和人数，DRAW 返回中奖者数组，重复抽奖不会重复抽中同一人。

- [ ] **Step 10: 测试限流**

Run: 快速连续发送 11 次 POST /api/vote 请求
Expected: 第 11 次请求返回 429 Too Many Requests

- [ ] **Step 11: 提交**

```bash
git add server/routes/ server/app.js
git commit -m "feat: implement all API routes with rate limiting"
```

---

### Task 4: 演示端项目结构和静态资源

**Files:**
- Create: `public/presentation/index.html`
- Create: `public/presentation/css/custom.css`
- Create: `public/presentation/js/config.js`
- Create: `public/presentation/js/utils.js`
- Create: `public/presentation/assets/images/.gitkeep`
- Create: `public/presentation/assets/music/.gitkeep`
- Create: `public/presentation/assets/videos/.gitkeep`

**Interfaces:**
- Consumes: 无
- Produces:
  - `config.js` 导出 `API_BASE_URL`, `ADMIN_TOKEN`, `QR_BASE_URL`
  - `utils.js` 导出 `escapeHtml(text)` → string

- [ ] **Step 1: 创建 public/presentation/index.html**

基础 HTML5 结构，head 中引入：
- Reveal.js CSS: `https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css`
- Reveal.js 主题: `https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/black.css`
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.js`
- Axios: `https://cdn.jsdelivr.net/npm/axios@1.4.0/dist/axios.min.js`
- QRCode.js: `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`
- 自定义 CSS: `css/custom.css`

body 包含 `<div class="reveal"><div class="slides"></div></div>` 结构，暂时只放一个 `<section>封面</section>`。

script 部分引入：
- Reveal.js: `https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js`
- config.js, utils.js（本地文件，稍后创建其他模块）

- [ ] **Step 2: 创建 public/presentation/css/custom.css**

定义基础样式：
- `.qrcode` 容器：`display: inline-block; padding: 20px; background: white;`
- `.vote-container` 布局：`display: flex; justify-content: space-around; align-items: center;`
- `.dancer-info` 样式：`text-align: center;`
- `.lottery-winners` 样式：`font-size: 2em; margin-top: 20px;`
- `.winner` 样式：`display: inline-block; margin: 0 10px; color: #ffd700;`
- 分组显示：`.group-column` flexbox 列布局

- [ ] **Step 3: 创建 public/presentation/js/config.js**

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'change-this-to-a-secure-token'; // 生产环境应从环境变量读取
const QR_BASE_URL = 'http://localhost:3000/mobile';
```

- [ ] **Step 4: 创建 public/presentation/js/utils.js**

```javascript
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

- [ ] **Step 5: 创建占位目录**

在 `public/presentation/assets/images/`, `music/`, `videos/` 中各创建 `.gitkeep` 文件以保留目录结构。

- [ ] **Step 6: 测试页面加载**

Run: 启动服务器，访问 http://localhost:3000/presentation/index.html
Expected: 页面加载成功，显示 Reveal.js 封面，控制台无错误。

- [ ] **Step 7: 提交**

```bash
git add public/presentation/
git commit -m "feat: setup presentation structure and static assets"
```

---

### Task 5: 演示端幻灯片内容

**Files:**
- Modify: `public/presentation/index.html` (添加所有幻灯片)

**Interfaces:**
- Consumes: 无
- Produces: 完整的 Reveal.js 幻灯片结构，每个 section 有唯一 id

- [ ] **Step 1: 在 index.html 的 .slides 中添加所有幻灯片**

按规格第 283-297 行定义，创建 12 个 section：
1. `<section id="cover">` - 封面：标题 "Wota艺基础讲座"
2. `<section id="battle1-intro">` - BATTLE 1 准备：两列布局，左右各一个舞者（占位图片和昵称）
3. `<section id="battle1-music" data-background="#000">` - BATTLE 1 音乐：黑背景，`<audio controls>` 标签，src 指向 `assets/music/battle1.mp3`（占位）
4. `<section id="vote-battle1">` - BATTLE 1 投票：三列布局（舞者A信息 + 二维码容器`<div id="qr-vote-battle1"></div>` + 舞者B信息），下方 `<canvas id="vote-chart-battle1"></canvas>` 用于 Chart.js
5. `<section id="video">` - 视频播放：`<video controls>` 标签，src 指向 `assets/videos/demo.mp4`（占位）
6. `<section id="styles-comparison">` - 流派对比：两列布局，左侧"关西"，右侧"火把"，各配占位图片
7. `<section id="battle2-intro">` - BATTLE 2 准备：同 battle1-intro
8. `<section id="battle2-music" data-background="#000">` - BATTLE 2 音乐：同 battle1-music
9. `<section id="vote-battle2">` - BATTLE 2 投票：同 vote-battle1，id 改为 `qr-vote-battle2` 和 `vote-chart-battle2`
10. `<section id="grouping">` - 上手实操：顶部二维码容器 `<div id="qr-group"></div>`，下方 `<div id="group-display"></div>` 用于显示各组成员
11. `<section id="lottery">` - 抽奖：顶部二维码容器 `<div id="qr-lottery"></div>`，中间滚动显示区 `<div id="lottery-rolling"></div>`，底部中奖者显示 `<div id="lottery-winners"></div>`
12. `<section id="end">` - 结束页："感谢参与！"

- [ ] **Step 2: 测试幻灯片切换**

Run: 刷新 http://localhost:3000/presentation/index.html，使用键盘方向键切换
Expected: 12 个幻灯片按顺序显示，黑背景页面正确应用，audio 和 video 标签显示控制条（即使文件不存在）

- [ ] **Step 3: 提交**

```bash
git add public/presentation/index.html
git commit -m "feat: add all presentation slides"
```

---

### Task 6: 演示端交互逻辑

**Files:**
- Create: `public/presentation/js/main.js`
- Create: `public/presentation/js/voting.js`
- Create: `public/presentation/js/grouping.js`
- Create: `public/presentation/js/lottery.js`
- Modify: `public/presentation/index.html` (引入新 JS 文件)

**Interfaces:**
- Consumes: 
  - `config.js` 的 `API_BASE_URL`, `ADMIN_TOKEN`, `QR_BASE_URL`
  - `utils.js` 的 `escapeHtml()`
  - Task 3 的所有 API 端点
- Produces:
  - `voting.js` 导出 `startVotePolling(battleId)`, `stopVotePolling()`
  - `grouping.js` 导出 `startGroupPolling()`, `stopGroupPolling()`
  - `lottery.js` 导出 `startLotteryAnimation()`, `stopLotteryAnimation()`

- [ ] **Step 1: 创建 public/presentation/js/main.js**

初始化 Reveal.js（规格第 684-701 行配置），监听 slidechanged 事件，根据 currentSlide.id 启动/停止对应轮询（Review Focus #5）：
- `vote-battle1` → startVotePolling('battle1')
- `vote-battle2` → startVotePolling('battle2')
- `grouping` → startGroupPolling()
- 其他 → stopVotePolling(), stopGroupPolling()

添加自定义键盘事件（规格第 707-743 行）：
- `g/G` → 弹出 prompt 输入组数，调用 `/api/group/config`
- `l/L` → 弹出 prompt 输入抽奖人数，调用 `/api/lottery/config`
- `r/R` → 根据当前 slide id 确定要重置的模块，弹出 confirm，调用 `/api/reset/:module`
- `Space` → 如果在抽奖页面，调用 startLotteryAnimation() 或 stopLotteryAnimation()

添加点击背景切换逻辑（规格第 726-743 行）：点击非交互元素时，左半屏 prev，右半屏 next。

页面加载时为每个需要二维码的 section 生成二维码：
- `qr-vote-battle1` → `${QR_BASE_URL}/vote.html?battle=battle1`
- `qr-vote-battle2` → `${QR_BASE_URL}/vote.html?battle=battle2`
- `qr-group` → `${QR_BASE_URL}/group.html`
- `qr-lottery` → `${QR_BASE_URL}/lottery.html`

使用 QRCode.js（规格第 786-793 行配置）。

- [ ] **Step 2: 创建 public/presentation/js/voting.js**

定义 `votePolling` 变量和 `lastSuccessfulData` 缓存。

`startVotePolling(battleId)`: 停止现有轮询，使用 setInterval 每 3000ms 调用 `axios.get(`${API_BASE_URL}/vote/${battleId}`)`，成功后调用 `updateVoteChart(response.data, battleId)`，失败时使用缓存数据（规格第 1533-1546 行）。

`stopVotePolling()`: clearInterval。

`updateVoteChart(data, battleId)`: 找到对应 canvas（`vote-chart-${battleId}`），使用 Chart.js 创建或更新柱状图（规格第 860-894 行），labels 为两位舞者名字，data 为票数，beginAtZero, stepSize: 1。

- [ ] **Step 3: 创建 public/presentation/js/grouping.js**

定义 `groupPolling` 变量。

`startGroupPolling()`: 停止现有轮询，setInterval 每 5000ms 调用 `axios.get(`${API_BASE_URL}/group/status`)`，成功后调用 `updateGroupDisplay(response.data)`。

`stopGroupPolling()`: clearInterval。

`updateGroupDisplay(data)`: 更新 `#group-display`，根据 data.groupCount 创建 N 列，每列显示"第 X 组 (Y人)"标题和成员昵称列表（用 escapeHtml 转义）。使用 flexbox 布局。

- [ ] **Step 4: 创建 public/presentation/js/lottery.js**

定义 `lotteryAnimation`, `isDrawing` 变量。

`startLotteryAnimation()`: 如果正在抽奖则先停止。设置 isDrawing=true，获取所有参与者昵称，setInterval 每 50ms 在 `#lottery-rolling` 中循环显示昵称（规格第 900-919 行）。

`stopLotteryAnimation()`: clearInterval，设置 isDrawing=false，调用 `axios.post(`${API_BASE_URL}/lottery/draw`, {adminToken: ADMIN_TOKEN})`，成功后调用 `displayWinners(response.data.winners)`。

`displayWinners(winners)`: 处理重名（Review Focus #3），相同昵称加序号，更新 `#lottery-winners` 显示所有中奖者，每个包裹在 `<span class="winner">⭐ 昵称</span>`（规格第 1617-1635 行）。

- [ ] **Step 5: 在 index.html 中引入新 JS 文件**

在 `</body>` 前按顺序引入：config.js, utils.js, voting.js, grouping.js, lottery.js, main.js。

- [ ] **Step 6: 测试 Reveal.js 初始化和导航**

Run: 访问 http://localhost:3000/presentation/index.html
Expected: 页面正常显示，方向键和点击背景可切换幻灯片，F 键全屏，Esc 显示缩略图。

- [ ] **Step 7: 测试二维码生成**

Expected: 投票、分组、抽奖页面各显示正确的二维码，扫码可跳转到对应移动端 URL（即使页面还不存在）。

- [ ] **Step 8: 测试投票轮询和图表**

手动通过 API 提交几票，切换到投票页面，Expected: 3 秒内图表显示最新票数，切换到其他页面轮询停止（检查 Network 面板）。

- [ ] **Step 9: 测试分组轮询**

手动通过 API 加入几个成员，切换到分组页面，Expected: 5 秒内显示各组成员，切换页面轮询停止。

- [ ] **Step 10: 测试快捷键**

Expected: 
- G 键弹出输入框，输入新组数后分组更新
- L 键弹出输入框，输入新抽奖人数后配置更新
- R 键在投票/分组/抽奖页面弹出确认框，确认后数据重置
- 其他页面按 R 提示无法重置

- [ ] **Step 11: 测试抽奖动画**

手动通过 API 添加几个参与者，切换到抽奖页面，按空格键，Expected: 昵称快速滚动，再按空格停止并显示中奖者。测试重名显示正确（添加两个同名参与者）。

- [ ] **Step 12: 提交**

```bash
git add public/presentation/js/ public/presentation/index.html
git commit -m "feat: implement presentation interactive logic"
```

---

### Task 7: 移动端页面

**Files:**
- Create: `public/mobile/index.html`
- Create: `public/mobile/nickname.html`
- Create: `public/mobile/vote.html`
- Create: `public/mobile/group.html`
- Create: `public/mobile/lottery.html`
- Create: `public/mobile/css/mobile.css`
- Create: `public/mobile/js/mobile.js`

**Interfaces:**
- Consumes: Task 3 的所有 API 端点
- Produces: 完整的移动端用户界面

- [ ] **Step 1: 创建 public/mobile/css/mobile.css**

响应式设计：
- `body`: `font-family: sans-serif; max-width: 768px; margin: 0 auto; padding: 20px; background: #f5f5f5;`
- `.container`: `background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);`
- `h1, h2`: `text-align: center;`
- `input[type="text"]`: `width: 100%; padding: 12px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;`
- `button`: `width: 100%; min-height: 48px; font-size: 18px; margin-top: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;`
- `button:hover`: `background: #0056b3;`
- `button:disabled`: `background: #ccc; cursor: not-allowed;`
- `.dancer-btn`: `margin: 16px 0;`
- `.message`: `margin-top: 16px; padding: 12px; border-radius: 4px; text-align: center;`
- `.success`: `background: #d4edda; color: #155724;`
- `.error`: `background: #f8d7da; color: #721c24;`

- [ ] **Step 2: 创建 public/mobile/js/mobile.js**

`generateDeviceId()`: 生成 UUID v4（规格第 628-636 行）。

`checkNickname()`: 从 localStorage 读取 userNickname 和 deviceId，如果不存在且当前不在 nickname.html，则保存 redirectAfterNickname 并跳转到 nickname.html。

`showMessage(text, type)`: 在页面中显示消息（success 或 error 样式）。

`fetchWithErrorHandling(url, options)`: 包装 fetch，处理网络错误和非 2xx 响应，显示用户友好错误提示（Review Focus #4），返回 json 或 null。

- [ ] **Step 3: 创建 public/mobile/index.html**

简单的入口页面：标题"Wota艺基础讲座"，说明"请扫描大屏幕二维码参与互动"。加载 mobile.css 和 mobile.js，调用 checkNickname()。

- [ ] **Step 4: 创建 public/mobile/nickname.html**

表单：输入框（placeholder "请输入您的昵称 (2-10个字符)"）+ 确认按钮。

加载 mobile.js，监听表单提交：
- 验证昵称长度（2-10）
- 生成 deviceId 并保存到 localStorage
- 跳转到 redirectAfterNickname 或 index.html

- [ ] **Step 5: 创建 public/mobile/vote.html**

从 URL 参数获取 battleId（`?battle=battle1`），调用 checkNickname()。

从 API 获取 `/api/vote/${battleId}` 显示两位舞者信息和头像。

两个按钮对应两位舞者，点击后调用 `POST /api/vote`，传递 battleId, dancer, deviceId。成功显示"投票成功"并禁用按钮，409 显示"已投票"，其他错误显示"投票失败，请重试"并保持按钮可用（Review Focus #4）。

- [ ] **Step 6: 创建 public/mobile/group.html**

调用 checkNickname()，显示"欢迎，{nickname}！"。

"加入分组"按钮，点击后调用 `POST /api/group/join`，传递 nickname 和 deviceId。

成功显示"您已加入第 X 组"和当前组员列表，重复加入显示已加入的组信息。

- [ ] **Step 7: 创建 public/mobile/lottery.html**

调用 checkNickname()，显示"{nickname}，参与抽奖"。

"参与抽奖"按钮，点击后调用 `POST /api/lottery/join`，传递 nickname 和 deviceId。

成功显示"✅ 已参与，请关注大屏幕"和当前参与人数，重复参与显示"已参与"。

- [ ] **Step 8: 测试移动端入口和昵称设置**

Run: 清除 localStorage，访问 http://localhost:3000/mobile/index.html
Expected: 自动跳转到 nickname.html，输入昵称后保存并跳转回 index.html，再次访问无需重新输入。

- [ ] **Step 9: 测试投票页面**

Run: 访问 http://localhost:3000/mobile/vote.html?battle=battle1
Expected: 显示两位舞者，点击投票成功后按钮禁用，重新打开页面提示已投票。断开网络测试显示友好错误（Review Focus #4）。

- [ ] **Step 10: 测试分组页面**

Run: 访问 http://localhost:3000/mobile/group.html
Expected: 显示欢迎信息，点击加入显示分配的组号和成员，重复加入显示已加入的组。

- [ ] **Step 11: 测试抽奖页面**

Run: 访问 http://localhost:3000/mobile/lottery.html
Expected: 点击参与显示确认信息和人数，重复参与显示已参与。

- [ ] **Step 12: 测试响应式布局**

Run: 使用浏览器开发者工具切换到不同手机尺寸（iPhone SE 320px, iPhone 12 390px, iPad 768px）
Expected: 所有页面布局正常，按钮易于点击，文字清晰可读。

- [ ] **Step 13: 提交**

```bash
git add public/mobile/
git commit -m "feat: implement mobile pages with nickname management"
```

---

### Task 8: 环境变量和部署文档

**Files:**
- Modify: `README.md` (添加部署说明)
- Create: `.env` (本地开发用，不提交)

**Interfaces:**
- Consumes: 无
- Produces: 完整的部署文档和配置

- [ ] **Step 1: 更新 README.md**

添加"部署到云服务器"章节（规格第 1757-1791 行）：
- 环境要求：Node.js 16+, PM2
- 部署步骤：克隆代码 → npm install → 配置 .env → pm2 start
- PM2 常用命令
- Nginx 反向代理配置（可选）
- SSL 证书配置（Let's Encrypt）

添加"本地开发"章节：
- 复制 .env.example 为 .env
- 修改 ADMIN_TOKEN 为安全值
- npm install && npm run dev
- 访问 http://localhost:3000/presentation/

- [ ] **Step 2: 创建本地 .env 文件**

复制 .env.example，修改 ADMIN_TOKEN 为一个随机字符串（至少 32 字符）。

- [ ] **Step 3: 测试环境变量加载**

Run: 在 state.js 中验证 adminToken 从 process.env.ADMIN_TOKEN 读取
Expected: 使用 .env 中的值，而非默认值。

- [ ] **Step 4: 添加生产环境注意事项**

在 README 中说明：
- 生产环境必须修改 ADMIN_TOKEN
- 修改 config.js 中的 API_BASE_URL 和 QR_BASE_URL 为实际域名
- 启用 HTTPS
- 配置 CORS 允许的来源

- [ ] **Step 5: 提交**

```bash
git add README.md .env.example
git commit -m "docs: add deployment instructions and environment setup"
```

---

### Task 9: 资源占位和 UI 优化

**Files:**
- Create: `public/presentation/assets/images/dancer-placeholder.jpg` (4 张)
- Create: `public/presentation/assets/images/kansai-logo.png`
- Create: `public/presentation/assets/images/torch-logo.png`
- Modify: `public/presentation/index.html` (使用占位资源)
- Modify: `public/presentation/css/custom.css` (UI 优化)

**Interfaces:**
- Consumes: 无
- Produces: 完整的视觉呈现

- [ ] **Step 1: 创建占位图片**

使用在线工具（如 placeholder.com）或简单的纯色图片创建：
- 4 张舞者头像占位图（200x200，不同颜色标识 A/B/C/D）
- 2 张流派 logo 占位图（400x300，标注"关西"和"火把"）

保存到 `public/presentation/assets/images/`。

- [ ] **Step 2: 更新 index.html 引用占位图片**

在 battle1-intro, battle2-intro 中添加 `<img>` 标签指向对应舞者图片。
在 styles-comparison 中添加两张 logo 图片。

- [ ] **Step 3: 优化 custom.css 样式**

添加：
- `.dancer-info img`: `width: 150px; height: 150px; border-radius: 50%; object-fit: cover;`
- `.styles-comparison`: `display: flex; justify-content: space-around;`
- `.style-column`: `text-align: center;`
- `.style-column img`: `max-width: 300px;`
- 为投票图表添加最小高度：`#vote-chart-battle1, #vote-chart-battle2`: `min-height: 300px;`
- 抽奖滚动区域：`#lottery-rolling`: `font-size: 3em; font-weight: bold; min-height: 100px; display: flex; align-items: center; justify-content: center;`

- [ ] **Step 4: 测试视觉效果**

Run: 访问演示端，浏览所有幻灯片
Expected: 所有页面布局美观，图片正确显示，图表和动画区域有合适的大小。

- [ ] **Step 5: 添加音视频文件说明到 README**

在 README 中说明：
- 将音乐文件放到 `public/presentation/assets/music/`，命名为 `battle1.mp3` 和 `battle2.mp3`
- 将视频文件放到 `public/presentation/assets/videos/`，命名为 `demo.mp4`
- 支持的格式：MP3/AAC（音频），MP4/WebM（视频）

- [ ] **Step 6: 提交**

```bash
git add public/presentation/assets/images/ public/presentation/index.html public/presentation/css/custom.css README.md
git commit -m "feat: add placeholder assets and optimize UI"
```

---

### Task 10: 端到端集成测试

**Files:**
- Create: `TESTING.md` (手动测试清单)

**Interfaces:**
- Consumes: 所有已完成的任务
- Produces: 完整的测试文档

- [ ] **Step 1: 创建 TESTING.md**

从规格第 2064-2121 行复制手动测试清单，包括：
- 演示端测试（17 项）
- 移动端测试（13 项）
- 并发测试（4 项）
- 边界情况测试（7 项）

每项前添加 `- [ ]` 复选框。

- [ ] **Step 2: 执行演示端测试**

逐项测试演示端功能，在 TESTING.md 中勾选完成项，记录任何发现的问题。

- [ ] **Step 3: 执行移动端测试**

使用真实手机或模拟器测试所有移动端页面，验证扫码流程。

- [ ] **Step 4: 执行并发测试**

打开多个浏览器窗口/设备同时操作：
- 多人同时投票，验证票数正确
- 多人同时加入分组，验证负载均衡
- 多人同时参与抽奖，验证无重复

- [ ] **Step 5: 执行边界情况测试**

- 0 人参与时点击抽奖
- 参与人数少于抽取人数时抽奖
- 组数调整为极端值（1, 20）
- 昵称包含 `<script>` 等特殊字符，验证正确转义
- 重复昵称的操作和显示

- [ ] **Step 6: 修复发现的问题**

根据测试结果修复 bug，重新测试直到所有项通过。

- [ ] **Step 7: 提交测试文档**

```bash
git add TESTING.md
git commit -m "test: add manual testing checklist and results"
```

---

### Task 11: 最终打包和文档完善

**Files:**
- Modify: `README.md` (添加功能截图、常见问题)
- Create: `LICENSE` (MIT)
- Modify: `package.json` (添加 repository, keywords)

**Interfaces:**
- Consumes: 所有已完成的任务
- Produces: 完整的项目文档

- [ ] **Step 1: 完善 README.md**

添加：
- 项目 Logo/截图（可选）
- 功能特性列表
- 技术架构图（文字描述或简单 ASCII 图）
- 常见问题（FAQ）：
  - 如何修改舞者信息？（修改 state.js）
  - 如何添加更多 BATTLE？（复制幻灯片和路由）
  - 忘记 ADMIN_TOKEN 怎么办？（服务器端查看 .env）
- 贡献指南（欢迎 PR, Issue）

- [ ] **Step 2: 创建 LICENSE 文件**

使用 MIT License，填写年份和作者信息。

- [ ] **Step 3: 更新 server/package.json**

添加：
```json
"repository": {
  "type": "git",
  "url": "https://github.com/yourusername/wotagei-workshop"
},
"keywords": ["wota", "presentation", "vote", "lottery", "reveal.js"],
"author": "Your Name",
"license": "MIT"
```

- [ ] **Step 4: 验证所有文档链接**

检查 README 和 TESTING.md 中的链接是否有效。

- [ ] **Step 5: 最终提交**

```bash
git add README.md LICENSE server/package.json
git commit -m "docs: complete project documentation"
git tag v1.0.0
```

## 自查报告

**规格覆盖检查：**
- ✅ 演示流程 12 个页面：Task 5
- ✅ 演示端功能（键盘导航、媒体播放、实时显示、管理面板）：Task 6
- ✅ 移动端功能（扫码、昵称、投票、分组、抽奖、防重复）：Task 7
- ✅ 后端功能（REST API、内存存储、算法）：Task 3
- ✅ 部署方案：Task 8

**步骤扫描：**
- 每个步骤明确单一行动：创建文件、实现函数、运行测试、提交
- 测试步骤包含具体命令和预期输出
- 实现步骤提供签名和关键值，函数体留给实施者

**类型一致性：**
- API 端点签名在 Task 3 Interfaces 定义，Task 6-7 引用保持一致
- config.js 导出的常量名称在所有任务中统一使用
- state 结构在 Task 1 定义，所有后续任务遵循

**Review Focus 覆盖：**
1. 重复 deviceId - Task 3 Step 7 测试验证
2. 分组调整时成员丢失 - Task 3 Step 8 测试验证
3. 抽奖重名处理 - Task 6 Step 4 实现和 Step 11 测试
4. 网络故障数据丢失 - Task 7 Step 2 和 Step 9 实现和测试
5. 轮询生命周期 - Task 6 Step 1 实现和 Step 8 测试

**比例检查：**
- 规格 2268 行，计划约 500 行（含结构）
- 任务侧重接口、测试和关键决策
- 无重复规格中的完整代码实现
- 算法步骤仅引用规格行号，不重写代码

---

实施计划完成，准备交付执行。
