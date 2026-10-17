// 初始化状态
const state = {
  battles: {
    battle1: {
      dancer1: {
        name: '暂定',
        avatar: '/presentation/assets/images/battle1-dancer1.jpg',
        votes: 0
      },
      dancer2: {
        name: '僵尸',
        avatar: '/presentation/assets/images/battle1-dancer2.jpg',
        votes: 0
      },
      locked: false,
      voters: new Set()
    },
    battle2: {
      dancer1: {
        name: '舞者 C',
        avatar: '/presentation/assets/images/dancer-c.jpg',
        votes: 0
      },
      dancer2: {
        name: '舞者 D',
        avatar: '/presentation/assets/images/dancer-d.jpg',
        votes: 0
      },
      locked: false,
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
      state.battles[battleId].locked = false;
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
