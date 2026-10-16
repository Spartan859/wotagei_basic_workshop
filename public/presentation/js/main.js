// 初始化 Reveal.js
Reveal.initialize({
  controls: false,
  progress: true,
  center: true,
  hash: false,
  keyboard: true,
  overview: true,
  transition: 'slide',
  transitionSpeed: 'default',
  backgroundTransition: 'fade'
});

// 监听幻灯片切换事件（Review Focus #5）
Reveal.on('slidechanged', (event) => {
  const slideId = event.currentSlide.id;

  // 停止所有轮询
  stopVotePolling();
  stopGroupPolling();

  // 根据页面启动对应轮询
  if (slideId === 'vote-battle1') {
    startVotePolling('battle1');
  } else if (slideId === 'vote-battle2') {
    startVotePolling('battle2');
  } else if (slideId === 'grouping') {
    startGroupPolling();
    updateGroupDisplay({ groupCount: 3, groups: { '1': { members: [], count: 0 }, '2': { members: [], count: 0 }, '3': { members: [], count: 0 } } });
  } else if (slideId === 'lottery') {
    updateLotteryCount();
  }
});

// 自定义键盘事件
document.addEventListener('keydown', (e) => {
  switch(e.key.toLowerCase()) {
    case 'g':
      openGroupConfigModal();
      break;
    case 'l':
      openLotteryConfigModal();
      break;
    case 'r':
      confirmAndResetData();
      break;
    case ' ':
      if (Reveal.getCurrentSlide().id === 'lottery') {
        e.preventDefault();
        if (isDrawing) {
          stopLotteryAnimation();
        } else {
          startLotteryAnimation();
        }
      }
      break;
  }
});

// 点击背景切换幻灯片
document.querySelector('.reveal').addEventListener('click', (e) => {
  // 检查是否点击了交互元素
  if (e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'INPUT' ||
      e.target.closest('.qrcode') ||
      e.target.closest('audio') ||
      e.target.closest('video') ||
      e.target.closest('canvas')) {
    return;
  }

  // 点击左半边上一页，右半边下一页
  if (e.clientX < window.innerWidth / 2) {
    Reveal.prev();
  } else {
    Reveal.next();
  }
});

// 分组配置
function openGroupConfigModal() {
  const newCount = prompt('请输入新的组数 (1-20):', '3');
  if (newCount === null) return;

  const count = parseInt(newCount);
  if (isNaN(count) || count < 1 || count > 20) {
    alert('组数必须是 1-20 之间的整数');
    return;
  }

  axios.put(`${API_BASE_URL}/group/config`, {
    groupCount: count,
    adminToken: ADMIN_TOKEN
  }).then(() => {
    alert('组数配置成功');
    if (Reveal.getCurrentSlide().id === 'grouping') {
      stopGroupPolling();
      startGroupPolling();
    }
  }).catch(error => {
    alert('配置失败: ' + (error.response?.data?.error || error.message));
  });
}

// 抽奖配置
function openLotteryConfigModal() {
  const newCount = prompt('请输入抽奖人数 (1-100):', '3');
  if (newCount === null) return;

  const count = parseInt(newCount);
  if (isNaN(count) || count < 1 || count > 100) {
    alert('抽奖人数必须是 1-100 之间的整数');
    return;
  }

  axios.put(`${API_BASE_URL}/lottery/config`, {
    drawCount: count,
    adminToken: ADMIN_TOKEN
  }).then(() => {
    alert('抽奖人数配置成功');
  }).catch(error => {
    alert('配置失败: ' + (error.response?.data?.error || error.message));
  });
}

// 重置数据
function confirmAndResetData() {
  const currentSlide = Reveal.getCurrentSlide();
  const slideId = currentSlide.id;

  let moduleName = '';
  let moduleKey = '';

  if (slideId.includes('vote')) {
    moduleName = '投票数据';
    moduleKey = 'vote';
  } else if (slideId.includes('group')) {
    moduleName = '分组数据';
    moduleKey = 'group';
  } else if (slideId.includes('lottery')) {
    moduleName = '抽奖数据';
    moduleKey = 'lottery';
  } else {
    alert('当前页面无法重置');
    return;
  }

  if (confirm(`确定要重置${moduleName}吗？此操作不可恢复！`)) {
    axios.post(`${API_BASE_URL}/reset/${moduleKey}`, {
      adminToken: ADMIN_TOKEN
    }).then(() => {
      alert('重置成功');
      location.reload();
    }).catch(error => {
      alert('重置失败: ' + (error.response?.data?.error || error.message));
    });
  }
}

// 页面加载时生成二维码
window.addEventListener('DOMContentLoaded', () => {
  // 投票二维码
  if (document.getElementById('qr-vote-battle1')) {
    new QRCode(document.getElementById('qr-vote-battle1'), {
      text: `${QR_BASE_URL}/vote.html?battle=battle1`,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  if (document.getElementById('qr-vote-battle2')) {
    new QRCode(document.getElementById('qr-vote-battle2'), {
      text: `${QR_BASE_URL}/vote.html?battle=battle2`,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // 分组二维码
  if (document.getElementById('qr-group')) {
    new QRCode(document.getElementById('qr-group'), {
      text: `${QR_BASE_URL}/group.html`,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // 抽奖二维码
  if (document.getElementById('qr-lottery')) {
    new QRCode(document.getElementById('qr-lottery'), {
      text: `${QR_BASE_URL}/lottery.html`,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
});
