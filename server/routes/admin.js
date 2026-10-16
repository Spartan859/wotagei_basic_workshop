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
