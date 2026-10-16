# Wota艺基础讲座交互式演示系统

一个基于 Reveal.js 的交互式演示系统，支持现场斗舞投票、分组实操和抽奖功能。

## 技术栈

- **后端**: Node.js 16+ + Express 4.x
- **演示端**: Reveal.js 4.x + Chart.js + QRCode.js + Axios
- **移动端**: 原生 HTML/CSS/JavaScript
- **数据存储**: 内存（单次活动使用）

## 快速开始

### 安装

```bash
cd server
npm install
```

### 配置

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改 `ADMIN_TOKEN` 为安全的随机字符串。

### 开发

```bash
cd server
npm run dev
```

### 生产

```bash
cd server
npm start
```

### 访问

- 演示端: http://localhost:3000/presentation/index.html
- 移动端: http://localhost:3000/mobile/

## 功能特性

- ✅ Reveal.js 演示幻灯片
- ✅ 实时投票系统（斗舞 BATTLE）
- ✅ 自动负载均衡分组
- ✅ 公平随机抽奖（Fisher-Yates 算法）
- ✅ 二维码扫码参与
- ✅ 移动端友好设计
- ✅ 防重复机制
- ✅ 数据重置功能

## 项目结构

```
wotagei-basic-workshop/
├── server/                 # 后端
│   ├── app.js             # Express 主文件
│   ├── state.js           # 状态管理
│   ├── routes/            # API 路由
│   └── package.json
├── public/
│   ├── presentation/      # 演示端
│   └── mobile/           # 移动端
├── docs/
│   └── superpowers/      # 设计文档和实施计划
├── AGENTS.md             # 协作约定
└── README.md
```

## 文档

- 设计规格: `docs/superpowers/specs/2026-10-16-wotagei-workshop-interactive-presentation-design.md`
- 实施计划: `docs/superpowers/plans/2026-10-16-wotagei-workshop-implementation.md`
- 协作约定: `AGENTS.md`

## 许可证

MIT
