const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const voteRoutes = require('./routes/vote');
const groupRoutes = require('./routes/group');
const lotteryRoutes = require('./routes/lottery');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.static('public'));

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
