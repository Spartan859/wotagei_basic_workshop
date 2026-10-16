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
