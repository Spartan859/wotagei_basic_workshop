# Wota艺基础讲座交互式演示系统 — 协作约定

> **本文件面向 Claude Code 会话和潜在的协作 AI。**
> 定义项目结构、技术栈、工作流程和实施规范。

---

## 通用约定

### 仓库结构

单体应用，前后端分离：

| 目录 | 内容 | 技术栈 |
|---|---|---|
| `server/` | 后端：Express + 内存状态管理 + REST API | Node.js 16+, Express 4.x |
| `public/presentation/` | 演示端：Reveal.js 幻灯片 + 实时数据展示 | Reveal.js 4.x, Chart.js, QRCode.js, Axios |
| `public/mobile/` | 移动端：轻量级投票/分组/抽奖界面 | 原生 HTML/CSS/JavaScript |
| `docs/superpowers/` | 设计文档（`specs/`）与实施计划（`plans/`） | Markdown |

- **设计规格**：`docs/superpowers/specs/2026-10-16-wotagei-workshop-interactive-presentation-design.md`
- **实施计划**：`docs/superpowers/plans/2026-10-16-wotagei-workshop-implementation.md`

**动手前先读 spec 与 plan。**

### 技术栈

**后端：**
- Node.js 16.x 或更高
- Express 4.18.2
- 中间件：cors, body-parser, compression, express-rate-limit
- 数据存储：内存（单次活动使用）
- 开发工具：nodemon

**演示端：**
- Reveal.js 4.5.0（演示框架）
- Chart.js 4.3.0（投票可视化）
- QRCode.js 1.0.0（二维码生成）
- Axios 1.4.0（API 请求）
- 原生 JavaScript

**移动端：**
- 原生 HTML5/CSS3/JavaScript
- localStorage（昵称持久化）
- Fetch API（数据提交）

### 工程约定

- **包管理器**：npm（Node.js 自带）
- **代码风格**：
  - JavaScript：2 空格缩进，单引号，分号结尾
  - 文件编码：UTF-8
  - 换行符：LF（Unix 风格）
- **命名约定**：
  - 文件名：kebab-case（`vote.js`, `mobile.css`）
  - 函数名：camelCase（`startVotePolling`, `generateDeviceId`）
  - 常量：UPPER_SNAKE_CASE（`API_BASE_URL`, `ADMIN_TOKEN`）
  - CSS 类名：kebab-case（`.dancer-info`, `.vote-container`）
- **API 约定**：
  - REST 风格
  - 请求体：JSON
  - 响应体：JSON `{success: boolean, ...data}` 或 `{error: string}`
  - 错误码：400（参数错误）、404（未找到）、409（冲突/重复）、403（权限）、500（服务器错误）
- **数据格式**：
  - deviceId：UUID v4 格式
  - timestamp：`Date.now()` 返回的毫秒时间戳
  - 昵称长度：2-10 个字符
  - 组数范围：1-20
  - 抽奖人数范围：1-100

### 多端兼容

**移动端友好是硬性要求。** 所有移动端页面必须：
- 最小宽度支持：320px（iPhone SE）
- 按钮最小高度：48px（易于触摸）
- 正文字体最小：16px（无需缩放可读）
- 无横向滚动
- 响应式布局（320px - 768px）

### Git 工作流程

**开工前**

- **每次动手前先同步（如果配置了 remote）**：
  ```bash
  git fetch origin && git pull --ff-only origin main
  ```
- 从 `main` 建分支：`feat/<short-name>` 或 `fix/<short-name>`
- **不要直接在 `main` 上改代码**

**提交**

- **每个独立改动通过测试后立即提交**，不要攒成巨型提交
- 提交前检查：`git status` 和 `git diff --cached`
- 排除文件：`.env`, `node_modules/`, `.DS_Store`, `npm-debug.log`, `.claude/`
- 使用显式路径：`git add <paths>`，**不要** `git add -A`
- 提交信息格式：
  ```
  type: 简短摘要（中文，50字内）
  
  详细说明（可选）：
  - 为什么改
  - 影响面
  - 配置变更
  ```
  type 取值：`feat`（新功能）/ `fix`（修复）/ `docs`（文档）/ `chore`（杂项）/ `refactor`（重构）/ `test`（测试）
- 提交后回报：`git log -1 --format='%h %s'`

**合并**

- 分支完成后合并回 `main`
- 如果配置了 remote 且有 PR 流程，在平台上完成合并
- 否则本地合并：`git checkout main && git merge <branch> --no-ff`
- 合并后验证：重新运行所有测试
- 合并结果用 `git log --oneline -3` 回报

---

## 实施规范

### 任务执行流程

按照 `docs/superpowers/plans/2026-10-16-wotagei-workshop-implementation.md` 的任务顺序执行：

1. **读取任务**：理解任务目标、文件清单、接口约定
2. **实现功能**：按步骤创建/修改文件
3. **测试验证**：每个 Step 都有对应的测试命令和预期结果
4. **提交代码**：通过验证后立即提交
5. **侧边浏览器预览**：每次修改完成后，必须在 Codex 侧边浏览器打开最新演示页；默认使用 `http://localhost:3000/presentation/index.html`，服务器使用其他端口时改用对应地址。页面已经打开时也要刷新到最新版本。

### 验收标准

**后端验收：**
```bash
cd server
npm install  # 首次或依赖变更时
node app.js  # 启动测试，Ctrl+C 停止
```
- 服务器正常启动
- API 端点返回符合规格的响应
- 限流和错误处理正常工作

**演示端验收：**
- 访问 `http://localhost:3000/presentation/index.html`
- 幻灯片正常切换
- 二维码正确生成
- 轮询机制正常工作
- 图表和动画正确显示
- 快捷键响应正常

**移动端验收：**
- 访问移动端页面（直接访问或扫描二维码）
- 昵称管理正常（首次输入、持久化、自动识别）
- 投票/分组/抽奖功能正常
- 防重复机制生效
- 错误处理友好
- 在多种设备尺寸下显示正常

### 不要做的事

- **不要跳过测试步骤** - 每个 Step 的测试是质量保证
- **不要修改已通过的测试来让代码通过** - 如果测试失败，修复代码而非测试
- **不要硬编码敏感信息** - ADMIN_TOKEN 等应从环境变量读取
- **不要提交临时文件** - `.env`, `node_modules/`, 数据库文件等
- **不要偏离规格** - 所有实现必须符合设计规格的要求

### 常见陷阱

1. **CORS 问题**：确保后端配置了 `cors()` 中间件
2. **路径问题**：静态资源路径要相对于 `public/` 目录
3. **轮询泄漏**：切换页面时必须停止之前的轮询
4. **XSS 风险**：显示用户输入的昵称时使用 `escapeHtml()` 或 `textContent`
5. **防重复失效**：后端必须用 deviceId 而非昵称判断重复
6. **分组不平衡**：减少组数时必须重新分配被删除组的成员

---

## 部署与运维

### 本地开发

```bash
# 1. 安装依赖
cd server && npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 ADMIN_TOKEN

# 3. 启动开发服务器
npm run dev

# 4. 访问
# 演示端：http://localhost:3000/presentation/index.html
# 移动端：http://localhost:3000/mobile/
```

### 生产部署

参考 `README.md` 的部署章节：
- 使用 PM2 管理进程
- 配置 Nginx 反向代理（可选）
- 启用 HTTPS（Let's Encrypt）
- 域名无需配置（`config.js` 按 `window.location.origin` 推导）；ADMIN_TOKEN 在演示端运行时输入

### 环境变量

必需：
- `PORT`：服务器端口（默认 3000）
- `ADMIN_TOKEN`：管理功能的密钥（必须修改）

可选：
- `NODE_ENV`：`development` 或 `production`
- `BASE_URL`：基础 URL（用于文档）

---

## 协作注意事项

### 文件归属

| 文件/目录 | 负责方 | 说明 |
|---|---|---|
| `server/**` | 后端实现者 | Express 应用、路由、状态管理 |
| `public/presentation/**` | 演示端实现者 | Reveal.js 幻灯片、交互逻辑 |
| `public/mobile/**` | 移动端实现者 | 移动端界面和逻辑 |
| `docs/**` | 设计/文档维护者 | 规格、计划、测试清单 |
| `README.md`, `TESTING.md` | 所有人 | 项目文档 |

### 接口约定

后端和前端之间通过 REST API 通信，接口在 `docs/superpowers/specs/` 中定义。

**修改接口时必须：**
1. 先更新规格文档
2. 通知所有依赖方
3. 向后兼容或提供迁移路径

### 代码审查关注点

**后端审查：**
- API 错误处理是否完整
- 防重复逻辑是否正确（基于 deviceId）
- 分组算法是否负载均衡
- 抽奖算法是否公平（Fisher-Yates）
- 限流配置是否合理

**前端审查：**
- 轮询是否正确启动和停止
- XSS 防护是否到位（escapeHtml）
- 二维码 URL 是否正确
- 错误处理是否用户友好
- 响应式布局是否正常

**全局审查：**
- 是否符合设计规格
- Review Focus 中的边界情况是否覆盖
- 提交信息是否清晰
- 文档是否同步更新

---

## 附录

### 常用命令

```bash
# 后端开发
cd server
npm install          # 安装依赖
npm run dev         # 开发模式（nodemon 自动重启）
npm start           # 生产模式

# 测试
curl http://localhost:3000/api/vote/battle1  # 测试 API

# Git
git status          # 查看状态
git diff            # 查看未暂存的改动
git log --oneline -5  # 查看最近 5 次提交
```

### 问题排查

**服务器启动失败：**
- 检查端口是否被占用：`lsof -i :3000`
- 检查环境变量是否配置：`cat .env`
- 查看错误日志

**API 403 错误：**
- 检查 ADMIN_TOKEN 是否正确
- 确认请求头包含正确的 token

**轮询不工作：**
- 检查浏览器控制台的网络面板
- 确认 API_BASE_URL 配置正确
- 检查 CORS 是否配置

**移动端扫码后 404：**
- 确认 QR_BASE_URL 指向正确的移动端 URL
- 检查静态文件是否正确提供

### 参考资源

- [Reveal.js 文档](https://revealjs.com/)
- [Chart.js 文档](https://www.chartjs.org/)
- [Express 文档](https://expressjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
