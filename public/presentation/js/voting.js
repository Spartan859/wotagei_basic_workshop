let votePolling = null;
const lastSuccessfulData = {};

function startVotePolling(battleId) {
  stopVotePolling();

  votePolling = setInterval(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vote/${battleId}`);
      updateVoteChart(response.data, battleId);
      lastSuccessfulData[battleId] = response.data;
    } catch (error) {
      console.error('投票数据获取失败:', error);
      // 使用缓存数据
      if (lastSuccessfulData[battleId]) {
        updateVoteChart(lastSuccessfulData[battleId], battleId);
      }
    }
  }, 3000);

  // 立即获取一次数据
  axios.get(`${API_BASE_URL}/vote/${battleId}`)
    .then(response => {
      updateVoteChart(response.data, battleId);
      lastSuccessfulData[battleId] = response.data;
    })
    .catch(error => console.error('初始投票数据获取失败:', error));
}

function stopVotePolling() {
  if (votePolling) {
    clearInterval(votePolling);
    votePolling = null;
  }
}

let voteCharts = {};

function updateVoteChart(data, battleId) {
  const canvasId = `vote-chart-${battleId}`;
  const ctx = document.getElementById(canvasId);

  if (!ctx) return;

  // 更新票数显示
  const votes1 = document.getElementById(`votes-dancer1-${battleId}`);
  const votes2 = document.getElementById(`votes-dancer2-${battleId}`);
  if (votes1) votes1.textContent = `票数: ${data.dancer1.votes}`;
  if (votes2) votes2.textContent = `票数: ${data.dancer2.votes}`;

  if (voteCharts[battleId]) {
    // 更新现有图表
    voteCharts[battleId].data.datasets[0].data = [data.dancer1.votes, data.dancer2.votes];
    voteCharts[battleId].update();
  } else {
    // 创建新图表
    voteCharts[battleId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [data.dancer1.name, data.dancer2.name],
        datasets: [{
          label: '票数',
          data: [data.dancer1.votes, data.dancer2.votes],
          backgroundColor: ['#FF6384', '#36A2EB']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}
