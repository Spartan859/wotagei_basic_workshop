const express = require('express');
const router = express.Router();
const { getState } = require('../state');

function buildResult(battle) {
  if (battle.dancer1.votes === battle.dancer2.votes) {
    return { type: 'tie', winner: null };
  }

  return {
    type: 'winner',
    winner: battle.dancer1.votes > battle.dancer2.votes ? 'dancer1' : 'dancer2'
  };
}

function buildSnapshot(battle) {
  return {
    dancer1: {
      name: battle.dancer1.name,
      avatar: battle.dancer1.avatar,
      votes: battle.dancer1.votes
    },
    dancer2: {
      name: battle.dancer2.name,
      avatar: battle.dancer2.avatar,
      votes: battle.dancer2.votes
    },
    locked: battle.locked,
    result: battle.locked ? buildResult(battle) : null
  };
}

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

  if (battle.locked) {
    return res.status(409).json({ error: '投票已结束', code: 'VOTE_LOCKED' });
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

// 截票：管理员冻结当前票数，重复调用保持幂等
router.post('/:battleId/lock', (req, res) => {
  const { battleId } = req.params;
  const { adminToken } = req.body;
  const state = getState();

  if (adminToken !== state.adminToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const battle = state.battles[battleId];
  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' });
  }

  battle.locked = true;
  res.json({ success: true, ...buildSnapshot(battle) });
});

// 获取投票结果
router.get('/:battleId', (req, res) => {
  const { battleId } = req.params;
  const state = getState();
  const battle = state.battles[battleId];

  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' });
  }

  res.json(buildSnapshot(battle));
});

module.exports = router;
