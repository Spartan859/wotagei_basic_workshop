const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const voteRoutes = require('../routes/vote');
const { getState, resetVote } = require('../state');

let server;
let baseUrl;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/vote', voteRoutes);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(() => {
  resetVote('battle1');
  resetVote('battle2');
});

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

async function castVote(dancer, deviceId) {
  return request('/api/vote', {
    method: 'POST',
    body: JSON.stringify({ battleId: 'battle1', dancer, deviceId })
  });
}

async function lockBattle(adminToken) {
  return request('/api/vote/battle1/lock', {
    method: 'POST',
    body: JSON.stringify({ adminToken })
  });
}

async function unlockBattle(battleId, adminToken) {
  return request(`/api/vote/${battleId}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ adminToken })
  });
}

async function resetBattle(battleId, adminToken) {
  return request(`/api/vote/${battleId}/reset`, {
    method: 'POST',
    body: JSON.stringify({ adminToken })
  });
}

test('投票接口默认返回未冻结状态', async () => {
  const response = await request('/api/vote/battle1');

  assert.equal(response.status, 200);
  assert.match(response.body.dancer1.avatar, /battle1-dancer2\.jpg$/);
  assert.match(response.body.dancer2.avatar, /battle1-dancer1\.jpg$/);
  assert.equal(response.body.locked, false);
  assert.equal(response.body.result, null);
});

test('错误的 adminToken 不能截票', async () => {
  const response = await lockBattle('wrong-token');
  const snapshot = await request('/api/vote/battle1');

  assert.equal(response.status, 403);
  assert.equal(snapshot.body.locked, false);
});

test('截票后固定票数并生成胜者结果', async () => {
  await castVote('dancer1', 'device-a');
  await castVote('dancer1', 'device-b');

  const locked = await lockBattle(getState().adminToken);
  const rejected = await castVote('dancer2', 'device-c');
  const snapshot = await request('/api/vote/battle1');

  assert.equal(locked.status, 200);
  assert.deepEqual(locked.body.result, { type: 'winner', winner: 'dancer1' });
  assert.equal(rejected.status, 409);
  assert.equal(rejected.body.code, 'VOTE_LOCKED');
  assert.equal(snapshot.body.dancer1.votes, 2);
  assert.equal(snapshot.body.dancer2.votes, 0);
  assert.equal(snapshot.body.locked, true);
});

test('重复截票保持同一结果', async () => {
  await castVote('dancer2', 'device-a');

  const first = await lockBattle(getState().adminToken);
  const second = await lockBattle(getState().adminToken);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(second.body.result, first.body.result);
  assert.equal(second.body.dancer2.votes, 1);
});

test('零票或等票截票时返回平票', async () => {
  const zeroVoteResult = await lockBattle(getState().adminToken);

  assert.equal(zeroVoteResult.status, 200);
  assert.deepEqual(zeroVoteResult.body.result, { type: 'tie', winner: null });

  resetVote('battle1');
  await castVote('dancer1', 'device-a');
  await castVote('dancer2', 'device-b');
  const tiedResult = await lockBattle(getState().adminToken);

  assert.deepEqual(tiedResult.body.result, { type: 'tie', winner: null });
});

test('重置投票会清空票数并解除冻结', async () => {
  await castVote('dancer1', 'device-a');
  await lockBattle(getState().adminToken);

  resetVote('battle1');
  const snapshot = await request('/api/vote/battle1');

  assert.equal(snapshot.body.locked, false);
  assert.equal(snapshot.body.result, null);
  assert.equal(snapshot.body.dancer1.votes, 0);
  assert.equal(snapshot.body.dancer2.votes, 0);
});

test('取消截票会保留票数和已投票设备并恢复接收新票', async () => {
  await castVote('dancer1', 'device-a');
  await lockBattle(getState().adminToken);

  const unlocked = await unlockBattle('battle1', getState().adminToken);
  const repeatedVote = await castVote('dancer2', 'device-a');
  const freshVote = await castVote('dancer2', 'device-b');

  assert.equal(unlocked.status, 200);
  assert.equal(unlocked.body.locked, false);
  assert.equal(unlocked.body.result, null);
  assert.equal(unlocked.body.dancer1.votes, 1);
  assert.equal(repeatedVote.status, 409);
  assert.equal(freshVote.status, 200);
  assert.deepEqual(freshVote.body.votes, { dancer1: 1, dancer2: 1 });
});

test('错误的 adminToken 不能取消截票或重置投票', async () => {
  await lockBattle(getState().adminToken);

  const unlockResponse = await unlockBattle('battle1', 'wrong-token');
  const resetResponse = await resetBattle('battle1', 'wrong-token');
  const snapshot = await request('/api/vote/battle1');

  assert.equal(unlockResponse.status, 403);
  assert.equal(resetResponse.status, 403);
  assert.equal(snapshot.body.locked, true);
});

test('重置本场投票会清空并解锁本场，同时保留另一场', async () => {
  await castVote('dancer1', 'battle1-device');
  await request('/api/vote', {
    method: 'POST',
    body: JSON.stringify({
      battleId: 'battle2',
      dancer: 'dancer2',
      deviceId: 'battle2-device'
    })
  });
  await lockBattle(getState().adminToken);

  const resetResponse = await resetBattle('battle1', getState().adminToken);
  const battle2 = await request('/api/vote/battle2');

  assert.equal(resetResponse.status, 200);
  assert.equal(resetResponse.body.locked, false);
  assert.equal(resetResponse.body.dancer1.votes, 0);
  assert.equal(resetResponse.body.dancer2.votes, 0);
  assert.equal(battle2.body.dancer2.votes, 1);
});
