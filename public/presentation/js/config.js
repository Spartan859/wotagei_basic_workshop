// API 与二维码地址按当前访问来源推导。
// 演示端与移动端同域部署（server/app.js 的 express.static('public')），
// 所以生产域名打开自动得到 https://<域名>/mobile/...，本机调试自动得到
// http://localhost:3000/mobile/...。写死 localhost 会让生产上扫出来的
// 二维码指向观众手机自己，必然打不开。
const API_BASE_URL = window.location.origin + '/api';
const QR_BASE_URL = window.location.origin + '/mobile';

// 管理令牌不放在这里：见 js/admin.js 的 getAdminToken()
// （生产环境的令牌是部署时随机生成的，硬编码值不可能匹配）
