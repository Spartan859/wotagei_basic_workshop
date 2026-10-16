let lotteryAnimation = null;
let isDrawing = false;

function startLotteryAnimation() {
  if (isDrawing) {
    stopLotteryAnimation();
    return;
  }

  isDrawing = true;
  const display = document.getElementById('lottery-rolling');

  // 获取所有参与者
  axios.get(`${API_BASE_URL}/lottery/status`).then(response => {
    const participants = response.data.participantCount > 0 ?
      Array(response.data.participantCount).fill(0).map((_, i) => `参与者 ${i + 1}`) :
      ['等待参与...'];

    let index = 0;
    lotteryAnimation = setInterval(() => {
      display.textContent = participants[index % participants.length];
      index++;
    }, 50);
  }).catch(error => {
    console.error('获取参与者失败:', error);
    isDrawing = false;
  });
}

async function stopLotteryAnimation() {
  if (!isDrawing) return;

  clearInterval(lotteryAnimation);
  isDrawing = false;

  // 调用抽奖 API
  try {
    const response = await axios.post(`${API_BASE_URL}/lottery/draw`, {
      adminToken: ADMIN_TOKEN
    });

    displayWinners(response.data.winners);
  } catch (error) {
    console.error('抽奖失败:', error);
    alert('抽奖失败: ' + (error.response?.data?.error || error.message));
  }
}

function displayWinners(winners) {
  // 处理重名（Review Focus #3）
  const winnerCounts = {};
  const displayNames = [];

  winners.forEach(name => {
    if (winnerCounts[name]) {
      winnerCounts[name]++;
      displayNames.push(`${escapeHtml(name)} (${winnerCounts[name]})`);
    } else {
      winnerCounts[name] = 1;
      displayNames.push(escapeHtml(name));
    }
  });

  const container = document.getElementById('lottery-winners');
  container.innerHTML = displayNames.map(name =>
    `<span class="winner">⭐ ${name}</span>`
  ).join(' ');

  // 清空滚动显示
  document.getElementById('lottery-rolling').textContent = '';
}

// 更新参与人数
async function updateLotteryCount() {
  try {
    const response = await axios.get(`${API_BASE_URL}/lottery/status`);
    document.getElementById('lottery-count').textContent = response.data.participantCount;
  } catch (error) {
    console.error('获取抽奖人数失败:', error);
  }
}
