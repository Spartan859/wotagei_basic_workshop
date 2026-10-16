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
