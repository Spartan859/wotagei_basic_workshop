# Wota艺基础讲座交互式演示系统设计规格

## 项目概述

为 wota 艺（荧光棒舞蹈）基础讲座制作一个交互式 HTML 演示系统，支持现场斗舞投票、分组实操、抽奖等互动功能。

### 核心目标

- 提供专业的演示体验，类似 PowerPoint 的操作方式
- 支持观众通过移动设备扫码参与互动（投票、分组、抽奖）
- 实时数据同步，演示端展示互动结果
- 部署到云服务器，支持互联网访问

### 技术选型

- **前端框架：** Reveal.js（演示端）+ 原生 HTML/CSS/JavaScript（移动端）
- **后端：** Node.js + Express
- **数据存储：** 内存存储（单次活动使用）
- **部署：** 云服务器部署

## 用户需求

### 演示流程

1. **封面页** - 讲座标题和介绍
2. **BATTLE 1 准备** - 展示两位舞者昵称和头像
3. **BATTLE 1 音乐** - 黑背景，嵌入音乐播放器（可控制播放/暂停/进度）
4. **BATTLE 1 投票** - 二维码投票，实时显示票数
5. **视频播放** - 播放离线视频文件（可控制）
6. **流派对比** - 展示 wota 艺两大流派：关西 vs 火把
7. **BATTLE 2 准备** - 第二组舞者信息
8. **BATTLE 2 音乐** - 同 BATTLE 1
9. **BATTLE 2 投票** - 同 BATTLE 1
10. **上手实操** - 扫码分组，自动分配到人数最少的组（组数可配置）
11. **抽奖** - 扫码参与，滚动动画抽奖，展示中奖者
12. **结束页** - 感谢参与

### 功能需求

#### 演示端功能

- 键盘方向键或点击背景切换幻灯片（类似 MS PowerPoint）
- 全屏演示模式
- 音乐和视频嵌入 HTML5 原生播放器，支持手动控制
- 实时显示投票结果（柱状图或数字）
- 实时显示分组人数和成员
- 抽奖滚动动画，一次抽取多人
- 管理控制面板：
  - 配置分组数量
  - 配置抽奖人数
  - 重置环节数据

#### 移动端功能

- 扫码访问功能页面（投票/分组/抽奖）
- 首次访问输入昵称，存储到 localStorage
- 已输入昵称的用户自动识别，无需重复输入
- 投票页面：选择支持的舞者，提交投票
- 分组页面：点击加入，自动分配到人数最少的组
- 抽奖页面：点击参与抽奖
- 防止重复操作（重复投票、重复加入分组等）

#### 后端功能

- REST API 提供数据接口
- 内存存储活动数据（投票、分组、抽奖）
- 防重复逻辑（基于设备标识）
- 分组负载均衡算法
- 随机抽奖算法

### 约束条件

- 云服务器部署，支持互联网访问
- 音乐和视频文件本地存储
- 数据仅在内存中，服务器重启后清空
- 昵称存储在用户浏览器 localStorage
- 使用开源方案，避免重复造轮子

## 系统架构

### 整体架构

```
┌─────────────────────┐         ┌──────────────────────┐
│   演示端页面         │         │   观众移动端页面      │
│   (Reveal.js)       │◄────────┤   (投票/分组/抽奖)    │
│   - 演示幻灯片      │  轮询    │   - 扫码访问          │
│   - 实时数据展示    │         │   - 提交数据          │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           │         HTTP REST API         │
           ▼                               ▼
      ┌─────────────────────────────────────────┐
      │       Express 后端服务器                 │
      │   - REST API 路由                       │
      │   - 内存数据管理                        │
      │   - 防重复逻辑                          │
      │   - 分组/抽奖算法                       │
      └─────────────────────────────────────────┘
```

### 数据流

1. **投票流程：**
   - 观众扫码 → 移动端投票页 → 提交投票到 API → 后端记录投票
   - 演示端每 3 秒轮询 API → 获取最新票数 → 更新图表

2. **分组流程：**
   - 观众扫码 → 移动端分组页 → 提交昵称到 API → 后端分配到人数最少的组
   - 演示端每 5 秒轮询 API → 获取各组成员 → 更新显示

3. **抽奖流程：**
   - 观众扫码 → 移动端抽奖页 → 提交参与到 API → 后端记录参与者
   - 主持人按空格键 → 演示端调用抽奖 API → 后端随机抽取 → 返回中奖者
   - 演示端展示滚动动画和中奖结果

4. **昵称持久化：**
   - 首次访问 → 重定向到昵称设置页 → 输入昵称 → 存储到 localStorage + 生成 deviceId
   - 后续访问 → 检查 localStorage → 自动填充昵称 → 直接进入功能页

### 核心模块

#### 演示端模块

- **Reveal.js 配置模块** - 幻灯片初始化和导航控制
- **投票展示模块** - 实时投票结果可视化（Chart.js）
- **分组展示模块** - 各组成员列表和人数统计
- **抽奖模块** - 滚动动画和中奖者展示
- **二维码生成模块** - 使用 QRCode.js 生成二维码
- **API 通信模块** - Axios 处理数据轮询和提交

#### 移动端模块

- **路由模块** - 根据 URL 加载不同功能页
- **昵称管理模块** - localStorage 读写和验证
- **投票模块** - 投票界面和提交逻辑
- **分组模块** - 分组界面和加入逻辑
- **抽奖模块** - 抽奖界面和参与逻辑
- **API 通信模块** - Fetch API 处理数据提交

#### 后端模块

- **路由模块** - Express 路由定义
- **状态管理模块** - 内存数据存储和操作
- **投票服务** - 投票数据管理和防重复
- **分组服务** - 负载均衡分组算法
- **抽奖服务** - 随机抽奖算法
- **CORS 中间件** - 跨域请求支持

## 数据模型

### 后端内存存储结构

```javascript
const state = {
  // BATTLE 投票数据
  battles: {
    battle1: {
      dancer1: {
        name: '',           // 舞者昵称
        avatar: '',         // 头像 URL
        votes: 0            // 票数
      },
      dancer2: {
        name: '',
        avatar: '',
        votes: 0
      },
      locked: false,           // 截票后拒绝新票，直到重置该 battle
      voters: new Set()     // 已投票的 deviceId，防重复
    },
    battle2: {
      // 同上
    }
  },
  
  // 分组数据
  grouping: {
    groupCount: 3,          // 可配置的组数
    groups: {
      '1': {
        members: []         // [{nickname, deviceId, timestamp}]
      },
      '2': { members: [] },
      '3': { members: [] }
    },
    participants: new Set() // 已加入的 deviceId，防重复
  },
  
  // 抽奖数据
  lottery: {
    participants: [],       // [{nickname, deviceId, timestamp}]
    winners: [],            // 已抽中的昵称数组
    participantSet: new Set(), // 已参与的 deviceId，防重复
    drawCount: 3            // 可配置的抽奖人数
  }
};
```

### 前端 localStorage 结构

```javascript
{
  "userNickname": "张三",     // 用户昵称
  "deviceId": "uuid-xxx"      // 设备唯一标识（UUID v4）
}
```

### API 端点

#### 投票相关

```
POST   /api/vote
Body:  { battleId: 'battle1', dancer: 'dancer1', deviceId: 'uuid' }
Return: { success: true, votes: { dancer1: 10, dancer2: 8 } }

GET    /api/vote/:battleId
Return: {
  dancer1: { name, avatar, votes },
  dancer2: { ... },
  locked: false,
  result: null
}

POST   /api/vote/:battleId/lock
Body:  { adminToken: '...' }
Return: {
  success: true,
  dancer1: { ... },
  dancer2: { ... },
  locked: true,
  result: { type: 'winner' | 'tie', winner: 'dancer1' | 'dancer2' | null }
}

截票后 POST /api/vote 返回 409：
{ error: '投票已结束', code: 'VOTE_LOCKED' }

重复截票幂等返回同一冻结结果；重置投票会清零票数并解除冻结。
```

#### 分组相关

```
POST   /api/group/join
Body:  { nickname: '张三', deviceId: 'uuid' }
Return: { success: true, groupId: 2, groupMembers: [...] }

GET    /api/group/status
Return: { 
  groupCount: 3,
  groups: {
    '1': { members: [...], count: 5 },
    '2': { members: [...], count: 4 },
    '3': { members: [...], count: 4 }
  }
}

PUT    /api/group/config
Body:  { groupCount: 5, adminToken: 'xxx' }
Return: { success: true, groupCount: 5 }
```

#### 抽奖相关

```
POST   /api/lottery/join
Body:  { nickname: '张三', deviceId: 'uuid' }
Return: { success: true, participantCount: 50 }

POST   /api/lottery/draw
Body:  { adminToken: 'xxx' }
Return: { success: true, winners: ['张三', '李四', '王五'] }

GET    /api/lottery/status
Return: { 
  participantCount: 50, 
  winners: [...],
  drawCount: 3 
}

PUT    /api/lottery/config
Body:  { drawCount: 5, adminToken: 'xxx' }
Return: { success: true, drawCount: 5 }
```

#### 管理相关

```
POST   /api/reset/:module
Body:  { adminToken: 'xxx', module: 'vote|group|lottery|all' }
Return: { success: true }
```

## 用户界面设计

### 演示端界面

#### 幻灯片结构

```html
<!-- Reveal.js 标准结构 -->
<div class="reveal">
  <div class="slides">
    <section>封面页</section>
    <section>BATTLE 1 准备</section>
    <section data-background="#000">BATTLE 1 音乐（黑背景）</section>
    <section>BATTLE 1 投票</section>
    <section>视频播放</section>
    <section>流派对比</section>
    <section>BATTLE 2 准备</section>
    <section data-background="#000">BATTLE 2 音乐</section>
    <section>BATTLE 2 投票</section>
    <section>上手实操</section>
    <section>抽奖</section>
    <section>结束页</section>
  </div>
</div>
```

#### 关键页面设计

**投票页面：**
```
┌─────────────────────────────────────────┐
│           BATTLE 1 投票                  │
├──────────────┬──────────────┬───────────┤
│  舞者 A      │              │  舞者 B    │
│  [头像]      │   [二维码]   │  [头像]    │
│  票数: 15    │   扫码投票   │  票数: 12  │
│  ████████    │              │  ██████    │
└──────────────┴──────────────┴───────────┘
```

**音乐页面（黑背景）：**
```
┌─────────────────────────────────────────┐
│                                          │
│                                          │
│          [HTML5 音频播放器]              │
│     ▶️ ━━━━━━━━━●━━━━ 🔊  2:30/3:45    │
│                                          │
│                                          │
└─────────────────────────────────────────┘
```

**分组页面：**
```
┌─────────────────────────────────────────┐
│         上手实操 - 扫码分组              │
├─────────────────────────────────────────┤
│              [二维码]                    │
│           扫码加入分组                   │
├───────────┬───────────┬─────────────────┤
│ 第 1 组   │ 第 2 组   │ 第 3 组         │
│ (5人)     │ (4人)     │ (4人)           │
│ - 张三    │ - 赵六    │ - 钱九          │
│ - 李四    │ - 孙七    │ - 周十          │
│ - 王五    │ - 李八    │ - 吴十一        │
│ ...       │ ...       │ ...             │
└───────────┴───────────┴─────────────────┘
```

**抽奖页面：**
```
┌─────────────────────────────────────────┐
│               抽奖环节                    │
├─────────────────────────────────────────┤
│          [二维码]（参与阶段）            │
│         扫码参与抽奖                     │
│       已参与人数: 50                     │
├─────────────────────────────────────────┤
│  [滚动区域 - 快速滚动显示所有参与者]    │
│  张三 李四 王五 赵六 孙七 ...           │
├─────────────────────────────────────────┤
│  按空格键开始/停止抽奖                   │
│                                          │
│  🎉 中奖者：                             │
│  ⭐ 张三  ⭐ 王五  ⭐ 孙七              │
└─────────────────────────────────────────┘
```

#### 快捷键

- `←/→` 或 点击非控件区域 - 切换幻灯片
- `F` - 全屏/退出全屏
- `Esc` - 退出全屏，显示幻灯片缩略图
- `G` - 打开分组配置面板（输入组数）
- `L` - 打开抽奖配置面板（输入抽取人数）
- `Space` - 在抽奖页面开始/停止抽奖
- `R` - 重置当前环节数据（弹出确认框）

### 移动端界面

#### 页面路由

```
/                      - 入口页面（自动检测昵称并跳转）
/nickname              - 昵称设置页面
/vote/battle1          - BATTLE 1 投票页面
/vote/battle2          - BATTLE 2 投票页面
/group                 - 分组页面
/lottery               - 抽奖页面
```

#### 昵称设置页

```
┌─────────────────────┐
│  欢迎参与 Wota 艺    │
│     基础讲座        │
├─────────────────────┤
│                     │
│  请输入您的昵称：    │
│  ┌───────────────┐  │
│  │               │  │
│  └───────────────┘  │
│                     │
│   [  确认  ]        │
│                     │
└─────────────────────┘
```

#### 投票页

```
┌─────────────────────┐
│  BATTLE 1 投票      │
├─────────────────────┤
│                     │
│  ┌───────────────┐  │
│  │   舞者 A      │  │
│  │   [头像]      │  │
│  │  投 TA 一票   │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │   舞者 B      │  │
│  │   [头像]      │  │
│  │  投 TA 一票   │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

#### 分组页

```
┌─────────────────────┐
│  上手实操分组       │
├─────────────────────┤
│                     │
│  欢迎，张三！       │
│                     │
│   [  加入分组  ]    │
│                     │
│  ─────────────────  │
│                     │
│  您已加入第 2 组    │
│                     │
│  当前组员：         │
│  · 赵六             │
│  · 孙七             │
│  · 李八             │
│  · 张三 (你)        │
│                     │
└─────────────────────┘
```

#### 抽奖页

```
┌─────────────────────┐
│  抽奖环节           │
├─────────────────────┤
│                     │
│  张三，参与抽奖     │
│                     │
│   [  参与抽奖  ]    │
│                     │
│  ─────────────────  │
│                     │
│  ✅ 已参与          │
│  请关注大屏幕       │
│                     │
│  当前参与人数: 50   │
│                     │
└─────────────────────┘
```

#### 响应式设计

- 最小支持宽度：320px（iPhone SE）
- 最大宽度：768px（平板适配）
- 按钮高度：48px 以上，易于点击
- 字体大小：16px 以上（正文），14px（辅助文字）
- 间距：按钮间距 16px，页面边距 20px

## 核心算法

### 负载均衡分组算法

**目标：** 将新加入的成员分配到人数最少的组，保持各组人数平衡。

**算法逻辑：**

```javascript
function assignToGroup(nickname, deviceId) {
  // 检查是否已经加入
  if (state.grouping.participants.has(deviceId)) {
    // 查找用户所在组
    for (let groupId in state.grouping.groups) {
      const group = state.grouping.groups[groupId];
      if (group.members.some(m => m.deviceId === deviceId)) {
        return { groupId: parseInt(groupId), alreadyJoined: true };
      }
    }
  }
  
  // 找到人数最少的组
  let minGroupId = 1;
  let minCount = state.grouping.groups['1'].members.length;
  
  for (let i = 2; i <= state.grouping.groupCount; i++) {
    const count = state.grouping.groups[i.toString()].members.length;
    if (count < minCount) {
      minCount = count;
      minGroupId = i;
    }
  }
  
  // 添加成员到该组
  const member = {
    nickname,
    deviceId,
    timestamp: Date.now()
  };
  
  state.grouping.groups[minGroupId.toString()].members.push(member);
  state.grouping.participants.add(deviceId);
  
  return { groupId: minGroupId, alreadyJoined: false };
}
```

**时间复杂度：** O(n)，n 为组数  
**空间复杂度：** O(1)

### 动态调整组数

**场景：** 主持人在演示端调整组数（增加或减少）

**增加组数逻辑：**

```javascript
function increaseGroupCount(newCount) {
  const oldCount = state.grouping.groupCount;
  
  // 创建新的空组
  for (let i = oldCount + 1; i <= newCount; i++) {
    state.grouping.groups[i.toString()] = { members: [] };
  }
  
  state.grouping.groupCount = newCount;
}
```

**减少组数逻辑：**

```javascript
function decreaseGroupCount(newCount) {
  const oldCount = state.grouping.groupCount;
  
  // 收集被删除组的成员
  const membersToReassign = [];
  for (let i = newCount + 1; i <= oldCount; i++) {
    const group = state.grouping.groups[i.toString()];
    membersToReassign.push(...group.members);
    delete state.grouping.groups[i.toString()];
  }
  
  // 重新分配这些成员到剩余的组（负载均衡）
  membersToReassign.forEach(member => {
    // 找人数最少的组
    let minGroupId = 1;
    let minCount = state.grouping.groups['1'].members.length;
    
    for (let i = 2; i <= newCount; i++) {
      const count = state.grouping.groups[i.toString()].members.length;
      if (count < minCount) {
        minCount = count;
        minGroupId = i;
      }
    }
    
    state.grouping.groups[minGroupId.toString()].members.push(member);
  });
  
  state.grouping.groupCount = newCount;
}
```

### 随机抽奖算法

**目标：** 从参与者中随机抽取指定数量的中奖者，避免重复抽取。

**算法逻辑：**

```javascript
function drawWinners(count) {
  // 过滤掉已经中奖的参与者
  const pool = state.lottery.participants.filter(
    p => !state.lottery.winners.includes(p.nickname)
  );
  
  // 实际抽取数量不超过剩余参与者数量
  const actualCount = Math.min(count, pool.length);
  
  // Fisher-Yates 洗牌算法
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // 取前 actualCount 个作为中奖者
  const winners = shuffled.slice(0, actualCount).map(p => p.nickname);
  
  // 记录中奖者
  state.lottery.winners.push(...winners);
  
  return winners;
}
```

**时间复杂度：** O(n)，n 为参与者数量  
**空间复杂度：** O(n)（创建副本）

**公平性保证：**
- 使用 Fisher-Yates 洗牌算法，保证每个参与者中奖概率相等
- 已中奖者不会被重复抽取
- 支持多轮抽奖

### 防重复机制

**deviceId 生成：**

```javascript
// 移动端首次访问时生成
function generateDeviceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

**防重复投票：**

```javascript
function vote(battleId, dancer, deviceId) {
  const battle = state.battles[battleId];
  
  // 检查是否已投票
  if (battle.voters.has(deviceId)) {
    return { success: false, error: 'already_voted' };
  }
  
  // 记录投票
  battle[dancer].votes++;
  battle.voters.add(deviceId);
  
  return { success: true };
}
```

**防重复加入分组：**  
见"负载均衡分组算法"中的 `participants` Set 检查

**防重复参与抽奖：**

```javascript
function joinLottery(nickname, deviceId) {
  // 检查是否已参与
  if (state.lottery.participantSet.has(deviceId)) {
    return { success: false, error: 'already_joined' };
  }
  
  // 添加参与者
  state.lottery.participants.push({ nickname, deviceId, timestamp: Date.now() });
  state.lottery.participantSet.add(deviceId);
  
  return { success: true };
}
```

## 前端技术实现

### Reveal.js 配置

**基础配置：**

```javascript
Reveal.initialize({
  // 控制
  controls: false,           // 不显示控制按钮（使用键盘）
  progress: true,            // 显示进度条
  center: true,              // 垂直居中
  hash: false,               // 不使用 URL hash
  
  // 导航
  keyboard: true,            // 启用键盘导航
  overview: true,            // 启用 ESC 缩略图模式
  
  // 过渡效果
  transition: 'slide',       // 切换动画
  transitionSpeed: 'default',
  
  // 背景过渡
  backgroundTransition: 'fade'
});
```

**自定义键盘事件：**

```javascript
// 添加自定义快捷键
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'g':
    case 'G':
      openGroupConfigModal();
      break;
    case 'l':
    case 'L':
      openLotteryConfigModal();
      break;
    case 'r':
    case 'R':
      confirmAndResetData();
      break;
  }
});

// 点击背景切换幻灯片
document.querySelector('.reveal').addEventListener('click', (e) => {
  // 检查是否点击了交互元素
  if (e.target.tagName === 'BUTTON' || 
      e.target.tagName === 'INPUT' ||
      e.target.closest('.qrcode') ||
      e.target.closest('audio') ||
      e.target.closest('video')) {
    return; // 不处理
  }
  
  // 点击左半边上一页，右半边下一页
  if (e.clientX < window.innerWidth / 2) {
    Reveal.prev();
  } else {
    Reveal.next();
  }
});
```

### 媒体嵌入

**音频播放器：**

```html
<section data-background="#000">
  <h2 style="color: white;">BATTLE 1 音乐</h2>
  <audio controls style="width: 80%; margin-top: 50px;">
    <source src="assets/music/battle1.mp3" type="audio/mpeg">
    您的浏览器不支持音频播放。
  </audio>
</section>
```

**视频播放器：**

```html
<section>
  <h2>Wota 艺演示视频</h2>
  <video controls style="width: 80%; max-height: 70vh;">
    <source src="assets/videos/demo.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</section>
```

**优势：**
- HTML5 原生控制条，支持播放/暂停/进度条/音量/全屏
- 无需额外开发，浏览器兼容性好
- 主持人完全手动控制，灵活性高

### 二维码生成

**使用 QRCode.js：**

```javascript
// 投票二维码
function generateVoteQR(battleId) {
  const url = `https://your-domain.com/mobile/vote.html?battle=${battleId}`;
  const container = document.getElementById(`qr-${battleId}`);
  
  new QRCode(container, {
    text: url,
    width: 256,
    height: 256,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

// 分组二维码
function generateGroupQR() {
  const url = `https://your-domain.com/mobile/group.html`;
  // 同上
}

// 抽奖二维码
function generateLotteryQR() {
  const url = `https://your-domain.com/mobile/lottery.html`;
  // 同上
}
```

### 实时数据更新

**轮询机制：**

```javascript
// 投票页面轮询
let votePolling = null;

function startVotePolling(battleId) {
  stopVotePolling(); // 停止之前的轮询
  
  votePolling = setInterval(async () => {
    try {
      const response = await axios.get(`/api/vote/${battleId}`);
      updateVoteChart(response.data);
    } catch (error) {
      console.error('投票数据获取失败:', error);
    }
  }, 3000); // 每 3 秒更新一次
}

function stopVotePolling() {
  if (votePolling) {
    clearInterval(votePolling);
    votePolling = null;
  }
}

// 监听幻灯片切换事件
Reveal.on('slidechanged', (event) => {
  const slideId = event.currentSlide.id;
  
  if (slideId === 'vote-battle1') {
    startVotePolling('battle1');
  } else if (slideId === 'vote-battle2') {
    startVotePolling('battle2');
  } else {
    stopVotePolling();
  }
});
```

**分组页面轮询：** 同上，间隔 5 秒

**抽奖页面：** 不需要轮询，点击抽奖按钮时调用 API

### 投票结果可视化

**使用 Chart.js：**

```javascript
let voteChart = null;

function updateVoteChart(data) {
  const ctx = document.getElementById('vote-chart').getContext('2d');
  
  if (voteChart) {
    // 更新现有图表
    voteChart.data.datasets[0].data = [data.dancer1.votes, data.dancer2.votes];
    voteChart.update();
  } else {
    // 创建新图表
    voteChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [data.dancer1.name, data.dancer2.name],
        datasets: [{
          label: '票数',
          data: [data.dancer1.votes, data.dancer2.votes],
          backgroundColor: ['#FF6384', '#36A2EB']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }
}
```

**BATTLE 1 现场稿补充：**

- 音乐页头像可点击切换回合聚焦；选中一位后隐藏另一位并放大高亮，再次点击恢复双人对阵，离开页面时自动复位。
- 投票页同时展示两位选手头像、票数、中央二维码和下方横向双行柱状图。
- 演示端投票中隐藏票数与图表；右上角“截票”按钮调用管理员接口后统一公布双方票数，再点击“查看胜负”展示胜者，等票时展示平票。
- 手机端进入已截票页面时禁用投票按钮，并显示胜者或平票结果。

### 抽奖滚动动画

**实现逻辑：**

```javascript
let lotteryAnimation = null;
let isDrawing = false;

function startLotteryAnimation() {
  if (isDrawing) {
    stopLotteryAnimation();
    return;
  }
  
  isDrawing = true;
  const display = document.getElementById('lottery-rolling');
  const participants = state.lottery.participants.map(p => p.nickname);
  
  let index = 0;
  lotteryAnimation = setInterval(() => {
    display.textContent = participants[index % participants.length];
    index++;
  }, 50); // 每 50ms 切换一次，制造滚动效果
}

async function stopLotteryAnimation() {
  if (!isDrawing) return;
  
  clearInterval(lotteryAnimation);
  isDrawing = false;
  
  // 调用抽奖 API
  try {
    const response = await axios.post('/api/lottery/draw', {
      adminToken: getAdminToken()
    });
    
    displayWinners(response.data.winners);
  } catch (error) {
    console.error('抽奖失败:', error);
  }
}

function displayWinners(winners) {
  const container = document.getElementById('lottery-winners');
  container.innerHTML = winners.map(name => 
    `<span class="winner">⭐ ${name}</span>`
  ).join(' ');
}

// 空格键控制
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && isOnLotterySlide()) {
    e.preventDefault();
    if (isDrawing) {
      stopLotteryAnimation();
    } else {
      startLotteryAnimation();
    }
  }
});
```

### 移动端路由

**简单路由实现：**

```javascript
// mobile.js
window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  
  // 检查昵称
  const nickname = localStorage.getItem('userNickname');
  const deviceId = localStorage.getItem('deviceId');
  
  if (!nickname && path !== '/mobile/nickname.html') {
    // 重定向到昵称设置页，记住目标页面
    localStorage.setItem('redirectAfterNickname', window.location.href);
    window.location.href = '/mobile/nickname.html';
    return;
  }
  
  // 根据路径加载对应功能
  if (path.includes('vote.html')) {
    const battleId = params.get('battle');
    initVotePage(battleId, deviceId);
  } else if (path.includes('group.html')) {
    initGroupPage(nickname, deviceId);
  } else if (path.includes('lottery.html')) {
    initLotteryPage(nickname, deviceId);
  } else if (path.includes('nickname.html')) {
    initNicknamePage();
  }
});
```

**昵称设置：**

```javascript
function initNicknamePage() {
  const form = document.getElementById('nickname-form');
  const input = document.getElementById('nickname-input');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nickname = input.value.trim();
    
    // 验证
    if (!nickname || nickname.length < 2 || nickname.length > 10) {
      alert('昵称长度应为 2-10 个字符');
      return;
    }
    
    // 保存
    const deviceId = generateDeviceId();
    localStorage.setItem('userNickname', nickname);
    localStorage.setItem('deviceId', deviceId);
    
    // 跳转到目标页面
    const redirectUrl = localStorage.getItem('redirectAfterNickname') || '/mobile/';
    localStorage.removeItem('redirectAfterNickname');
    window.location.href = redirectUrl;
  });
}
```

## 后端技术实现

### Express 应用结构

**主文件 (app.js):**

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const voteRoutes = require('./routes/vote');
const groupRoutes = require('./routes/group');
const lotteryRoutes = require('./routes/lottery');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 路由
app.use('/api/vote', voteRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api', adminRoutes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 状态管理模块

**state.js:**

```javascript
// 初始化状态
const state = {
  battles: {
    battle1: {
      dancer1: { name: '舞者 A', avatar: '/assets/images/dancer-a.jpg', votes: 0 },
      dancer2: { name: '舞者 B', avatar: '/assets/images/dancer-b.jpg', votes: 0 },
      voters: new Set()
    },
    battle2: {
      dancer1: { name: '舞者 C', avatar: '/assets/images/dancer-c.jpg', votes: 0 },
      dancer2: { name: '舞者 D', avatar: '/assets/images/dancer-d.jpg', votes: 0 },
      voters: new Set()
    }
  },
  
  grouping: {
    groupCount: 3,
    groups: {
      '1': { members: [] },
      '2': { members: [] },
      '3': { members: [] }
    },
    participants: new Set()
  },
  
  lottery: {
    participants: [],
    winners: [],
    participantSet: new Set(),
    drawCount: 3
  },
  
  adminToken: process.env.ADMIN_TOKEN || 'default-admin-token-change-me'
};

// 导出状态和操作方法
module.exports = {
  getState: () => state,
  
  // 重置功能
  resetVote: (battleId) => {
    if (state.battles[battleId]) {
      state.battles[battleId].dancer1.votes = 0;
      state.battles[battleId].dancer2.votes = 0;
      state.battles[battleId].voters.clear();
    }
  },
  
  resetGroup: () => {
    for (let key in state.grouping.groups) {
      state.grouping.groups[key].members = [];
    }
    state.grouping.participants.clear();
  },
  
  resetLottery: () => {
    state.lottery.participants = [];
    state.lottery.winners = [];
    state.lottery.participantSet.clear();
  },
  
  resetAll: () => {
    module.exports.resetVote('battle1');
    module.exports.resetVote('battle2');
    module.exports.resetGroup();
    module.exports.resetLottery();
  }
};
```

### 路由实现

**routes/vote.js:**

```javascript
const express = require('express');
const router = express.Router();
const { getState } = require('../state');

// 提交投票
router.post('/', (req, res) => {
  const { battleId, dancer, deviceId } = req.body;
  
  // 验证
  if (!battleId || !dancer || !deviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const state = getState();
  const battle = state.battles[battleId];
  
  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' });
  }
  
  if (!battle[dancer]) {
    return res.status(400).json({ error: 'Invalid dancer' });
  }
  
  // 防重复投票
  if (battle.voters.has(deviceId)) {
    return res.status(409).json({ error: 'Already voted' });
  }
  
  // 记录投票
  battle[dancer].votes++;
  battle.voters.add(deviceId);
  
  res.json({
    success: true,
    votes: {
      dancer1: battle.dancer1.votes,
      dancer2: battle.dancer2.votes
    }
  });
});

// 获取投票结果
router.get('/:battleId', (req, res) => {
  const { battleId } = req.params;
  const state = getState();
  const battle = state.battles[battleId];
  
  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' });
  }
  
  res.json({
    dancer1: {
      name: battle.dancer1.name,
      avatar: battle.dancer1.avatar,
      votes: battle.dancer1.votes
    },
    dancer2: {
      name: battle.dancer2.name,
      avatar: battle.dancer2.avatar,
      votes: battle.dancer2.votes
    }
  });
});

module.exports = router;
```

**routes/group.js:**

```javascript
const express = require('express');
const router = express.Router();
const { getState } = require('../state');

// 加入分组
router.post('/join', (req, res) => {
  const { nickname, deviceId } = req.body;
  
  if (!nickname || !deviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const state = getState();
  
  // 防重复加入
  if (state.grouping.participants.has(deviceId)) {
    // 查找已加入的组
    for (let groupId in state.grouping.groups) {
      const group = state.grouping.groups[groupId];
      const member = group.members.find(m => m.deviceId === deviceId);
      if (member) {
        return res.json({
          success: true,
          groupId: parseInt(groupId),
          alreadyJoined: true,
          groupMembers: group.members.map(m => m.nickname)
        });
      }
    }
  }
  
  // 找人数最少的组
  let minGroupId = 1;
  let minCount = state.grouping.groups['1'].members.length;
  
  for (let i = 2; i <= state.grouping.groupCount; i++) {
    const count = state.grouping.groups[i.toString()].members.length;
    if (count < minCount) {
      minCount = count;
      minGroupId = i;
    }
  }
  
  // 添加成员
  const member = { nickname, deviceId, timestamp: Date.now() };
  state.grouping.groups[minGroupId.toString()].members.push(member);
  state.grouping.participants.add(deviceId);
  
  res.json({
    success: true,
    groupId: minGroupId,
    alreadyJoined: false,
    groupMembers: state.grouping.groups[minGroupId.toString()].members.map(m => m.nickname)
  });
});

// 获取分组状态
router.get('/status', (req, res) => {
  const state = getState();
  
  const groups = {};
  for (let groupId in state.grouping.groups) {
    const group = state.grouping.groups[groupId];
    groups[groupId] = {
      members: group.members.map(m => m.nickname),
      count: group.members.length
    };
  }
  
  res.json({
    groupCount: state.grouping.groupCount,
    groups
  });
});

// 配置组数（管理功能）
router.put('/config', (req, res) => {
  const { groupCount, adminToken } = req.body;
  const state = getState();
  
  if (adminToken !== state.adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  if (!groupCount || groupCount < 1 || groupCount > 20) {
    return res.status(400).json({ error: 'Invalid group count' });
  }
  
  const oldCount = state.grouping.groupCount;
  
  if (groupCount > oldCount) {
    // 增加组数
    for (let i = oldCount + 1; i <= groupCount; i++) {
      state.grouping.groups[i.toString()] = { members: [] };
    }
  } else if (groupCount < oldCount) {
    // 减少组数，重新分配成员
    const membersToReassign = [];
    for (let i = groupCount + 1; i <= oldCount; i++) {
      const group = state.grouping.groups[i.toString()];
      membersToReassign.push(...group.members);
      delete state.grouping.groups[i.toString()];
    }
    
    // 负载均衡重新分配
    membersToReassign.forEach(member => {
      let minGroupId = 1;
      let minCount = state.grouping.groups['1'].members.length;
      
      for (let i = 2; i <= groupCount; i++) {
        const count = state.grouping.groups[i.toString()].members.length;
        if (count < minCount) {
          minCount = count;
          minGroupId = i;
        }
      }
      
      state.grouping.groups[minGroupId.toString()].members.push(member);
    });
  }
  
  state.grouping.groupCount = groupCount;
  
  res.json({ success: true, groupCount });
});

module.exports = router;
```

**routes/lottery.js:**

```javascript
const express = require('express');
const router = express.Router();
const { getState } = require('../state');

// 参与抽奖
router.post('/join', (req, res) => {
  const { nickname, deviceId } = req.body;
  
  if (!nickname || !deviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const state = getState();
  
  // 防重复参与
  if (state.lottery.participantSet.has(deviceId)) {
    return res.json({
      success: true,
      alreadyJoined: true,
      participantCount: state.lottery.participants.length
    });
  }
  
  // 添加参与者
  state.lottery.participants.push({ nickname, deviceId, timestamp: Date.now() });
  state.lottery.participantSet.add(deviceId);
  
  res.json({
    success: true,
    alreadyJoined: false,
    participantCount: state.lottery.participants.length
  });
});

// 执行抽奖（管理功能）
router.post('/draw', (req, res) => {
  const { adminToken } = req.body;
  const state = getState();
  
  if (adminToken !== state.adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // 过滤已中奖者
  const pool = state.lottery.participants.filter(
    p => !state.lottery.winners.includes(p.nickname)
  );
  
  if (pool.length === 0) {
    return res.status(400).json({ error: 'No participants available' });
  }
  
  const count = Math.min(state.lottery.drawCount, pool.length);
  
  // Fisher-Yates 洗牌
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // 抽取中奖者
  const winners = shuffled.slice(0, count).map(p => p.nickname);
  state.lottery.winners.push(...winners);
  
  res.json({ success: true, winners });
});

// 获取抽奖状态
router.get('/status', (req, res) => {
  const state = getState();
  
  res.json({
    participantCount: state.lottery.participants.length,
    winners: state.lottery.winners,
    drawCount: state.lottery.drawCount
  });
});

// 配置抽奖人数（管理功能）
router.put('/config', (req, res) => {
  const { drawCount, adminToken } = req.body;
  const state = getState();
  
  if (adminToken !== state.adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  if (!drawCount || drawCount < 1 || drawCount > 100) {
    return res.status(400).json({ error: 'Invalid draw count' });
  }
  
  state.lottery.drawCount = drawCount;
  
  res.json({ success: true, drawCount });
});

module.exports = router;
```

**routes/admin.js:**

```javascript
const express = require('express');
const router = express.Router();
const { getState, resetVote, resetGroup, resetLottery, resetAll } = require('../state');

// 重置数据
router.post('/reset/:module', (req, res) => {
  const { module } = req.params;
  const { adminToken } = req.body;
  const state = getState();
  
  if (adminToken !== state.adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  switch (module) {
    case 'vote':
      resetVote('battle1');
      resetVote('battle2');
      break;
    case 'group':
      resetGroup();
      break;
    case 'lottery':
      resetLottery();
      break;
    case 'all':
      resetAll();
      break;
    default:
      return res.status(400).json({ error: 'Invalid module' });
  }
  
  res.json({ success: true, module });
});

module.exports = router;
```

## 错误处理与边界情况

### 网络错误处理

**移动端：**

```javascript
async function submitVote(battleId, dancer, deviceId) {
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中...';
  
  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ battleId, dancer, deviceId })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showSuccess('投票成功！');
    } else if (response.status === 409) {
      showError('您已经投过票了');
    } else {
      showError(data.error || '投票失败，请重试');
      submitBtn.disabled = false;
      submitBtn.textContent = '重新投票';
    }
  } catch (error) {
    console.error('网络错误:', error);
    showError('网络连接失败，请检查网络后重试');
    submitBtn.disabled = false;
    submitBtn.textContent = '重新投票';
  }
}
```

**演示端：**

```javascript
async function fetchVoteData(battleId) {
  try {
    const response = await axios.get(`/api/vote/${battleId}`);
    updateVoteChart(response.data);
    lastSuccessfulData[battleId] = response.data; // 缓存最后成功的数据
  } catch (error) {
    console.error('获取投票数据失败:', error);
    // 使用缓存的数据继续显示
    if (lastSuccessfulData[battleId]) {
      updateVoteChart(lastSuccessfulData[battleId]);
    }
  }
}
```

### 并发问题

**分组并发：**

使用 JavaScript 单线程特性，天然避免竞态条件。但需要注意：

```javascript
// 确保原子操作
router.post('/join', (req, res) => {
  // 在单个请求处理函数内完成所有操作
  // 不使用异步操作（如数据库查询），保持同步执行
  // ...
});
```

**抽奖并发：**

抽奖只能由演示端触发，不存在并发问题。

### 数据重置

**重置确认弹窗：**

```javascript
function confirmAndResetData() {
  const currentSlide = Reveal.getCurrentSlide();
  const slideId = currentSlide.id;
  
  let moduleName = '';
  let moduleKey = '';
  
  if (slideId.includes('vote')) {
    moduleName = '投票数据';
    moduleKey = 'vote';
  } else if (slideId.includes('group')) {
    moduleName = '分组数据';
    moduleKey = 'group';
  } else if (slideId.includes('lottery')) {
    moduleName = '抽奖数据';
    moduleKey = 'lottery';
  } else {
    alert('当前页面无法重置');
    return;
  }
  
  if (confirm(`确定要重置${moduleName}吗？此操作不可恢复！`)) {
    resetData(moduleKey);
  }
}

async function resetData(module) {
  try {
    await axios.post(`/api/reset/${module}`, {
      adminToken: getAdminToken()
    });
    alert('重置成功');
    location.reload(); // 刷新页面
  } catch (error) {
    alert('重置失败，请重试');
  }
}
```

### 昵称冲突

**策略：** 允许重复昵称，使用 deviceId 作为唯一标识。

**抽奖时显示：**

```javascript
// 如果有重名，在抽奖结果中加上序号
function displayWinners(winners) {
  const winnerCounts = {};
  const displayNames = [];
  
  winners.forEach(name => {
    if (winnerCounts[name]) {
      winnerCounts[name]++;
      displayNames.push(`${name} (${winnerCounts[name]})`);
    } else {
      winnerCounts[name] = 1;
      displayNames.push(name);
    }
  });
  
  // 显示 displayNames
}
```

### 组数动态调整

**平滑调整：**

- 增加组数：创建空组，新成员自动分配到新组
- 减少组数：被删除组的成员重新负载均衡到剩余组
- 调整过程中不影响已加入的成员，只是改变分布

## 性能优化

### 前端优化

**轮询优化：**

```javascript
// 只在对应页面轮询
Reveal.on('slidechanged', (event) => {
  stopAllPolling(); // 停止所有轮询
  
  const slideId = event.currentSlide.id;
  if (slideId === 'vote-battle1') {
    startVotePolling('battle1');
  } else if (slideId === 'group') {
    startGroupPolling();
  }
  // 其他页面不轮询
});
```

**二维码缓存：**

```javascript
const qrCodeCache = {};

function getOrCreateQRCode(url, containerId) {
  if (qrCodeCache[url]) {
    document.getElementById(containerId).innerHTML = qrCodeCache[url];
  } else {
    new QRCode(document.getElementById(containerId), {
      text: url,
      width: 256,
      height: 256
    });
    qrCodeCache[url] = document.getElementById(containerId).innerHTML;
  }
}
```

**资源优化：**

- 图片压缩（头像、背景图）
- 音视频文件压缩（保持合理质量）
- 使用 CDN 加载第三方库（Reveal.js, Chart.js, QRCode.js, Axios）

### 后端优化

**内存存储：**

- 读写速度极快，无需优化
- 数据量小（最多几百条记录），内存占用可忽略

**响应优化：**

```javascript
// 只返回必要字段
router.get('/status', (req, res) => {
  const state = getState();
  
  // 不返回完整对象，只返回必要信息
  const groups = {};
  for (let groupId in state.grouping.groups) {
    groups[groupId] = {
      count: state.grouping.groups[groupId].members.length
      // 不返回完整成员列表，除非需要
    };
  }
  
  res.json({ groupCount: state.grouping.groupCount, groups });
});
```

**GZIP 压缩：**

```javascript
const compression = require('compression');
app.use(compression());
```

### 移动端优化

**减少 HTTP 请求：**

- 合并 CSS 文件
- 内联小图标（Base64）
- 使用雪碧图（如果有多个小图标）

**异步加载：**

```javascript
// localStorage 异步读写
async function getNickname() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(localStorage.getItem('userNickname'));
    }, 0);
  });
}
```

## 部署方案

### 云服务器部署

**环境要求：**

- Node.js 16.x 或以上
- npm 或 yarn
- PM2（进程管理）
- Nginx（可选，用于反向代理和 HTTPS）

**部署步骤：**

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
git clone https://your-repo-url wotagei-workshop
cd wotagei-workshop

# 5. 安装依赖
npm install

# 6. 配置环境变量
nano .env
# PORT=3000
# NODE_ENV=production
# ADMIN_TOKEN=your-secure-admin-token
# BASE_URL=https://your-domain.com

# 7. 启动应用
pm2 start server/app.js --name wotagei-workshop

# 8. 设置开机自启
pm2 startup
pm2 save
```

**Nginx 配置（HTTPS）：**

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

**SSL 证书（Let's Encrypt）：**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run  # 测试自动续期
```

### PM2 管理

**常用命令：**

```bash
pm2 list                    # 查看所有进程
pm2 logs wotagei-workshop   # 查看日志
pm2 restart wotagei-workshop # 重启应用
pm2 stop wotagei-workshop    # 停止应用
pm2 delete wotagei-workshop  # 删除进程
```

**更新部署：**

```bash
cd /var/www/wotagei-workshop
git pull
npm install
pm2 restart wotagei-workshop
```

## 安全考虑

### HTTPS 加密

使用 SSL/TLS 加密所有通信，防止中间人攻击和数据窃听。

### 管理功能保护

**管理员令牌：**

```javascript
// 环境变量设置强密码
ADMIN_TOKEN=your-very-secure-random-token-here-12345678

// 前端保存（不暴露给观众）
const ADMIN_TOKEN = 'your-very-secure-random-token-here-12345678';

function getAdminToken() {
  return ADMIN_TOKEN;
}
```

**访问控制：**

- 重置、配置等管理 API 需要 adminToken
- 移动端页面不包含 adminToken
- 仅演示端（主持人控制的浏览器）可调用管理 API

### 输入验证

**后端验证：**

```javascript
// 昵称验证
function validateNickname(nickname) {
  if (typeof nickname !== 'string') return false;
  if (nickname.length < 2 || nickname.length > 10) return false;
  // 可选：过滤特殊字符、HTML 标签
  return true;
}

// deviceId 验证（UUID v4 格式）
function validateDeviceId(deviceId) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(deviceId);
}
```

**XSS 防护：**

```javascript
// 前端显示昵称时转义 HTML
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

// 使用
element.textContent = nickname; // 自动转义
// 或
element.innerHTML = escapeHtml(nickname);
```

### API 限流

**防刷票/刷注册：**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10,             // 最多 10 次请求
  message: 'Too many requests, please try again later'
});

// 应用到敏感端点
app.use('/api/vote', limiter);
app.use('/api/group/join', limiter);
app.use('/api/lottery/join', limiter);
```

### CORS 限制

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
```

**生产环境：**

```bash
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## 测试策略

### 单元测试

**测试框架：** Jest

**测试内容：**

```javascript
// tests/grouping.test.js
const { assignToGroup } = require('../server/grouping');

describe('负载均衡分组算法', () => {
  beforeEach(() => {
    // 重置状态
  });
  
  test('应该分配到人数最少的组', () => {
    // 组1: 0人，组2: 0人，组3: 0人
    const result1 = assignToGroup('张三', 'device-1');
    expect(result1.groupId).toBe(1);
    
    // 组1: 1人，组2: 0人，组3: 0人
    const result2 = assignToGroup('李四', 'device-2');
    expect(result2.groupId).toBe(2);
    
    // 组1: 1人，组2: 1人，组3: 0人
    const result3 = assignToGroup('王五', 'device-3');
    expect(result3.groupId).toBe(3);
  });
  
  test('应该防止重复加入', () => {
    assignToGroup('张三', 'device-1');
    const result = assignToGroup('张三', 'device-1');
    expect(result.alreadyJoined).toBe(true);
  });
});

// tests/lottery.test.js
describe('随机抽奖算法', () => {
  test('应该抽取指定数量的中奖者', () => {
    // 添加 10 个参与者
    // ...
    
    const winners = drawWinners(3);
    expect(winners.length).toBe(3);
    expect(new Set(winners).size).toBe(3); // 无重复
  });
  
  test('应该避免重复抽取同一人', () => {
    // 第一次抽奖
    const winners1 = drawWinners(2);
    
    // 第二次抽奖
    const winners2 = drawWinners(2);
    
    // 确保无重复
    const allWinners = [...winners1, ...winners2];
    expect(new Set(allWinners).size).toBe(4);
  });
});
```

### 集成测试

**测试工具：** Supertest

```javascript
const request = require('supertest');
const app = require('../server/app');

describe('API 集成测试', () => {
  test('POST /api/vote 应该成功提交投票', async () => {
    const response = await request(app)
      .post('/api/vote')
      .send({
        battleId: 'battle1',
        dancer: 'dancer1',
        deviceId: 'test-device-1'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.votes.dancer1).toBe(1);
  });
  
  test('重复投票应该被拒绝', async () => {
    // 第一次投票
    await request(app).post('/api/vote').send({
      battleId: 'battle1',
      dancer: 'dancer1',
      deviceId: 'test-device-2'
    });
    
    // 第二次投票（重复）
    const response = await request(app).post('/api/vote').send({
      battleId: 'battle1',
      dancer: 'dancer1',
      deviceId: 'test-device-2'
    });
    
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Already voted');
  });
});
```

### 手动测试清单

#### 演示端测试

- [ ] 页面加载正常，所有资源加载成功
- [ ] 键盘方向键可以切换幻灯片
- [ ] 点击背景区域可以切换幻灯片
- [ ] 点击控件（按钮、音频、视频）不会触发切换
- [ ] F 键可以全屏/退出全屏
- [ ] Esc 键显示幻灯片缩略图
- [ ] 音频播放器控制正常（播放/暂停/进度条/音量）
- [ ] 视频播放器控制正常
- [ ] 二维码清晰可扫描
- [ ] 投票页面实时显示票数更新
- [ ] 分组页面实时显示各组成员
- [ ] G 键打开分组配置面板，可以调整组数
- [ ] L 键打开抽奖配置面板，可以调整抽取人数
- [ ] 空格键在抽奖页面启动/停止抽奖
- [ ] 抽奖滚动动画流畅
- [ ] 中奖者正确显示
- [ ] R 键弹出重置确认框，确认后数据清空

#### 移动端测试

- [ ] 扫码正确跳转到对应功能页
- [ ] 首次访问提示输入昵称
- [ ] 昵称验证正常（长度、非空）
- [ ] 昵称保存到 localStorage
- [ ] 二次访问自动识别昵称，不再提示
- [ ] 投票页面显示正常，按钮可点击
- [ ] 投票成功后显示提示，按钮禁用
- [ ] 重复投票显示"已投票"提示
- [ ] 分组页面显示正常
- [ ] 点击加入分组后显示分配的组号
- [ ] 重复加入显示已加入的组号
- [ ] 抽奖页面显示正常
- [ ] 点击参与后显示确认信息
- [ ] 重复参与显示"已参与"提示
- [ ] 各页面在不同手机尺寸下显示正常
- [ ] 网络断开时显示友好错误提示

#### 并发测试

- [ ] 多人同时投票，票数统计正确
- [ ] 多人同时加入分组，各组人数平衡
- [ ] 多人同时参与抽奖，无重复记录
- [ ] 演示端轮询期间移动端提交数据，无冲突

#### 边界情况测试

- [ ] 0 人参与抽奖时，点击抽奖显示提示
- [ ] 参与人数少于抽取人数时，抽取所有参与者
- [ ] 调整组数为 1 时，所有成员在一组
- [ ] 调整组数为很大值（如 20）时，正常创建空组
- [ ] 昵称包含特殊字符时，正确转义显示
- [ ] 昵称重复时，可以正常操作
- [ ] 服务器重启后，数据清空

## 项目文件结构

```
wotagei-basic-workshop/
├── server/                      # 后端
│   ├── app.js                   # Express 主文件
│   ├── state.js                 # 状态管理
│   ├── routes/                  # 路由
│   │   ├── vote.js
│   │   ├── group.js
│   │   ├── lottery.js
│   │   └── admin.js
│   └── package.json
│
├── public/                      # 前端静态资源
│   ├── presentation/            # 演示端
│   │   ├── index.html           # 主页面
│   │   ├── css/
│   │   │   ├── reveal.css       # Reveal.js 主题
│   │   │   └── custom.css       # 自定义样式
│   │   ├── js/
│   │   │   ├── reveal.js        # Reveal.js 核心
│   │   │   ├── main.js          # 主逻辑
│   │   │   ├── config.js        # 配置（adminToken 等）
│   │   │   ├── voting.js        # 投票模块
│   │   │   ├── grouping.js      # 分组模块
│   │   │   ├── lottery.js       # 抽奖模块
│   │   │   └── utils.js         # 工具函数
│   │   ├── lib/                 # 第三方库
│   │   │   ├── qrcode.min.js
│   │   │   ├── chart.min.js
│   │   │   └── axios.min.js
│   │   └── assets/              # 资源文件
│   │       ├── music/
│   │       │   ├── battle1.mp3
│   │       │   └── battle2.mp3
│   │       ├── videos/
│   │       │   └── demo.mp4
│   │       └── images/
│   │           ├── dancer-a.jpg
│   │           ├── dancer-b.jpg
│   │           ├── dancer-c.jpg
│   │           ├── dancer-d.jpg
│   │           ├── kansai-logo.png
│   │           └── torch-logo.png
│   │
│   └── mobile/                  # 移动端
│       ├── index.html           # 入口页（检测昵称并跳转）
│       ├── nickname.html        # 昵称设置页
│       ├── vote.html            # 投票页
│       ├── group.html           # 分组页
│       ├── lottery.html         # 抽奖页
│       ├── css/
│       │   └── mobile.css       # 移动端样式
│       └── js/
│           ├── mobile.js        # 通用逻辑（路由、昵称管理）
│           ├── vote.js          # 投票逻辑
│           ├── group.js         # 分组逻辑
│           └── lottery.js       # 抽奖逻辑
│
├── docs/                        # 文档
│   └── superpowers/
│       └── specs/
│           └── 2025-01-16-wotagei-workshop-interactive-presentation-design.md
│
├── tests/                       # 测试
│   ├── grouping.test.js
│   ├── lottery.test.js
│   └── api.test.js
│
├── .env.example                 # 环境变量示例
├── .gitignore
├── package.json                 # 项目依赖
└── README.md                    # 项目说明
```

## 依赖清单

### 后端依赖 (package.json)

```json
{
  "name": "wotagei-workshop",
  "version": "1.0.0",
  "description": "Wota艺基础讲座交互式演示系统",
  "main": "server/app.js",
  "scripts": {
    "start": "node server/app.js",
    "dev": "nodemon server/app.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  }
}
```

### 前端依赖（CDN 加载）

**演示端：**
- Reveal.js 4.x - https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/
- Chart.js 4.x - https://cdn.jsdelivr.net/npm/chart.js@4.3.0/
- QRCode.js - https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/
- Axios - https://cdn.jsdelivr.net/npm/axios@1.4.0/

**移动端：**
- 原生 JavaScript，无需额外依赖

## 后续扩展可能性

### 短期扩展（可选）

1. **实时通知：** 使用 WebSocket 替代轮询，实现演示端实时更新
2. **数据导出：** 导出投票结果、分组名单、中奖者名单为 CSV/Excel
3. **历史记录：** 添加 SQLite 数据库，保存历史活动数据
4. **多语言支持：** 中英文切换
5. **主题定制：** 多种演示主题（颜色、字体、布局）

### 长期扩展

1. **管理后台：** Web 管理界面，配置舞者信息、音乐、视频等
2. **多场活动管理：** 支持创建多个活动，每个活动独立数据
3. **评论互动：** 观众可以发送弹幕或评论，实时显示在演示端
4. **投票分析：** 投票趋势图、时间分布分析
5. **移动端 PWA：** 将移动端封装为 PWA，可离线使用

## 总结

本设计规格详细定义了 Wota 艺基础讲座交互式演示系统的完整实现方案，包括：

- **架构设计：** 前后端分离，Reveal.js 演示端 + Express 后端 + 移动端网页
- **核心功能：** 斗舞投票、音视频播放、分组实操、抽奖
- **关键算法：** 负载均衡分组、随机抽奖、防重复机制
- **用户体验：** 类 PowerPoint 操作、二维码扫码互动、昵称持久化
- **安全性：** HTTPS、管理员令牌、输入验证、API 限流
- **部署方案：** 云服务器 + PM2 + Nginx + SSL

该系统设计遵循开源最佳实践，使用成熟技术栈，避免重复造轮子，实现简单高效且易于维护。
