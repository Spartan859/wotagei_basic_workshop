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

// 生成二维码
function generateQRCodes() {
  // 投票二维码
  new QRCode(document.getElementById('qr-vote-battle1'), {
    text: `${QR_BASE_URL}/vote.html?battle=battle1`,
    width: 256,
    height: 256,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  new QRCode(document.getElementById('qr-vote-battle2'), {
    text: `${QR_BASE_URL}/vote.html?battle=battle2`,
    width: 256,
    height: 256,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  // 分组二维码
  new QRCode(document.getElementById('qr-group'), {
    text: `${QR_BASE_URL}/group.html`,
    width: 256,
    height: 256,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  // 抽奖二维码
  new QRCode(document.getElementById('qr-lottery'), {
    text: `${QR_BASE_URL}/lottery.html`,
    width: 256,
    height: 256,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

// 停止所有轮询
function stopAllPolling() {
  stopVotePolling();
  stopGroupPolling();
}

// 监听幻灯片切换
Reveal.on('slidechanged', (event) => {
  const slideId = event.currentSlide.id;

  // 停止所有轮询
  stopAllPolling();

  // 根据当前页面启动对应轮询
  if (slideId === 'vote-battle1') {
    startVotePolling('battle1');
  } else if (slideId === 'vote-battle2') {
    startVotePolling('battle2');
  } else if (slideId === 'grouping') {
    startGroupPolling();
  } else if (slideId === 'lottery') {
    updateLotteryCount();
  }
});

// 自定义键盘事件
document.addEventListener('keydown', (e) => {
  const currentSlide = Reveal.getCurrentSlide();
  const slideId = currentSlide ? currentSlide.id : '';

  switch(e.key.toLowerCase()) {
    case 'g':
      // 分组配置
      const groupCount = prompt('请输入组数（1-20）：', '3');
      if (groupCount && !isNaN(groupCount)) {
        const count = parseInt(groupCount);
        if (count >= 1 && count <= 20) {
          axios.put(`${API_BASE_URL}/group/config`, {
            groupCount: count,
            adminToken: ADMIN_TOKEN
          })
            .then(() => {
              alert('组数配置成功！');
              if (slideId === 'grouping') {
                startGroupPolling();
              }
            })
            .catch(error => alert('配置失败：' + error.message));
        } else {
          alert('组数必须在 1-20 之间');
        }
      }
      break;

    case 'l':
      // 抽奖配置
      const drawCount = prompt('请输入抽奖人数（1-100）：', '3');
      if (drawCount && !isNaN(drawCount)) {
        const count = parseInt(drawCount);
        if (count >= 1 && count <= 100) {
          axios.put(`${API_BASE_URL}/lottery/config`, {
            drawCount: count,
            adminToken: ADMIN_TOKEN
          })
            .then(() => alert('抽奖人数配置成功！'))
            .catch(error => alert('配置失败：' + error.message));
        } else {
          alert('抽奖人数必须在 1-100 之间');
        }
      }
      break;

    case 'r':
      // 重置数据
      let module = '';
      if (slideId.includes('vote')) {
        module = 'vote';
      } else if (slideId === 'grouping') {
        module = 'group';
      } else if (slideId === 'lottery') {
        module = 'lottery';
      } else {
        alert('当前页面无法重置');
        return;
      }

      if (confirm(`确定要重置${module === 'vote' ? '投票' : module === 'group' ? '分组' : '抽奖'}数据吗？此操作不可恢复！`)) {
        axios.post(`${API_BASE_URL}/reset/${module}`, {
          adminToken: ADMIN_TOKEN
        })
          .then(() => {
            alert('重置成功');
            location.reload();
          })
          .catch(error => alert('重置失败：' + error.message));
      }
      break;

    case ' ':
      // 空格键控制抽奖
      if (slideId === 'lottery') {
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

// 页面加载完成后生成二维码
window.addEventListener('load', () => {
  generateQRCodes();
});
