const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const SERVER_DIR = path.join(__dirname, '..');

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('服务器启动超时')), 5000);
    child.once('error', reject);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`服务器提前退出: ${code}`));
    });
    child.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Server running on port')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

test('投票读取轮询不消耗写操作限流', { timeout: 10000 }, async (t) => {
  const port = await reservePort();
  const child = spawn(process.execPath, ['app.js'], {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      ADMIN_TOKEN: 'polling-test-token',
      NODE_ENV: 'test'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill('SIGTERM'));

  await waitForServer(child);

  const statuses = [];
  for (let i = 0; i < 12; i += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/api/vote/battle1`);
    statuses.push(response.status);
  }

  assert.deepEqual(statuses, Array(12).fill(200));
});
