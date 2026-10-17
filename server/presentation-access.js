const crypto = require('crypto');

const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000;

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createPresentationAccess({ token, ttlMs = DEFAULT_TTL_MS, now = Date.now } = {}) {
  const sessions = new Map();

  function issueSession() {
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, now() + ttlMs);
    return sessionId;
  }

  function hasSession(sessionId) {
    if (typeof sessionId !== 'string' || !sessionId) return false;

    const expiresAt = sessions.get(sessionId);
    if (!expiresAt) return false;
    if (expiresAt <= now()) {
      sessions.delete(sessionId);
      return false;
    }

    return true;
  }

  return {
    isValidToken: (candidate) => safeEqual(candidate, token),
    issueSession,
    hasSession
  };
}

module.exports = { createPresentationAccess };
