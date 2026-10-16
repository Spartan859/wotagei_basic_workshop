let lotteryAnimation = null;
let isDrawing = false;
let allParticipants = [];

function startLotteryAnimation() {
  if (isDrawing) {
    stopLotteryAnimation();
    return;
  }

  isDrawing = true;
  const display = document.getElementById('lottery-rolling');

  // 获取参与者列表
  axios.get(`${API_BASE_URL}/lottery/status`)
    .then(response => {
      allParticipants = response.data.participantCount > 0
        ? Array(response.data.participantCount).fill(0).map((_, i) => `参与者 ${i + 1}`)
        : ['暂无参与者'];

      let index = 0;
      lotteryAnimation = setInterval(() => {
        display.textContent = allParticipants[index % allParticipants.length];
        index++;
      }, 50);
    })
    .catch(error => {
      console.error('获取参与者失败:', error);
      display.textContent = '获取数据失败';
      isDrawing = false;
    });
}

function stopLotteryAnimation() {
  if (!isDrawing) return;

  clearInterval(lotteryAnimation);
  isDrawing = false;

  const display = document.getElementById('lottery-rolling');
  display.textContent = '抽奖中...';

  // 调用抽奖 API
  axios.post(`${API_BASE_URL}/lottery/draw`, {
    adminToken: ADMIN_TOKEN
  })
    .then(response => {
      displayWinners(response.data.winners);
    })
    .catch(error => {
      console.error('抽奖失败:', error);
      display.textContent = '抽奖失败，请重试';
    });
}

function displayWinners(winners) {
  const container = document.getElementById('lottery-winners');

  if (winners.length === 0) {
    container.innerHTML = '<p>暂无中奖者</p>';
    return;
  }

  // 处理重名：相同昵称加序号
  const nameCounts = {};
  const displayNames = [];

  winners.forEach(name => {
    if (nameCounts[name]) {
      nameCounts[name]++;
      displayNames.push(`${escapeHtml(name)} (${nameCounts[name]})`);
    } else {
      nameCounts[name] = 1;
      displayNames.push(escapeHtml(name));
    }
  });

  container.innerHTML = '<h3>🎉 中奖者 🎉</h3>' +
    displayNames.map(name => `<span class="winner">⭐ ${name}</span>`).join(' ');
}

// 更新抽奖参与人数
function updateLotteryCount() {
  axios.get(`${API_BASE_URL}/lottery/status`)
    .then(response => {
      const countEl = document.getElementById('lottery-count');
      if (countEl) {
        countEl.textContent = `已参与人数: ${response.data.participantCount}`;
      }
    })
    .catch(error => console.error('获取抽奖状态失败:', error));
}
