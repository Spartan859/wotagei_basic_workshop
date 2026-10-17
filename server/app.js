const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const voteRoutes = require('./routes/vote');
const groupRoutes = require('./routes/group');
const lotteryRoutes = require('./routes/lottery');
const adminRoutes = require('./routes/admin');
const { getState } = require('./state');
const { createPresentationAccess } = require('./presentation-access');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PRESENTATION_SESSION_COOKIE = 'wotagei_presentation_access';
const presentationAccess = createPresentationAccess({ token: getState().adminToken });

// 限流配置
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10,             // 最多 10 次请求
  message: { error: 'Too many requests, please try again later' }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(compression());

// 演示端必须先通过令牌门禁。会话只放行当前进程中的演示资源，服务器重启后自动失效。
app.use('/presentation', (req, res, next) => {
  const cookies = Object.fromEntries(
    (req.get('cookie') || '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name, value]) => name && value)
  );

  if (!presentationAccess.hasSession(cookies[PRESENTATION_SESSION_COOKIE])) {
    if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
      return res.redirect('/');
    }
    return res.status(401).send('Presentation access requires a valid token.');
  }

  next();
}, express.static(path.join(PUBLIC_DIR, 'presentation')));

// 根页面和移动端保持公开访问。
app.use(express.static(PUBLIC_DIR));

// 根页面提交令牌后才签发演示端会话 Cookie。
app.post('/api/presentation/access', (req, res) => {
  const candidate = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!presentationAccess.isValidToken(candidate)) {
    return res.status(403).json({ error: 'Invalid presentation token' });
  }

  const sessionId = presentationAccess.issueSession();
  const secure = req.secure || req.get('x-forwarded-proto') === 'https';
  const cookie = [
    `${PRESENTATION_SESSION_COOKIE}=${sessionId}`,
    'Path=/presentation',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=28800',
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
  res.json({ success: true });
});

// 路由
app.use('/api/vote', limiter, voteRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api', adminRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
