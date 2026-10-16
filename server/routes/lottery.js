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
