const test = require('node:test');
const assert = require('node:assert/strict');
const { createPresentationAccess } = require('../presentation-access');

test('正确令牌可发放会话，错误令牌不能通过门禁', () => {
  const access = createPresentationAccess({ token: 'secret-token', ttlMs: 1000 });

  assert.equal(access.isValidToken('wrong-token'), false);
  assert.equal(access.isValidToken('secret-token'), true);

  const sessionId = access.issueSession();
  assert.equal(typeof sessionId, 'string');
  assert.equal(access.hasSession(sessionId), true);
});

test('会话超过有效期后失效', () => {
  let now = 1000;
  const access = createPresentationAccess({
    token: 'secret-token',
    ttlMs: 100,
    now: () => now
  });

  const sessionId = access.issueSession();
  now = 1101;

  assert.equal(access.hasSession(sessionId), false);
});
