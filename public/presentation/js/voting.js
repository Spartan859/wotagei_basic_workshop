let votePolling = null;
let voteCharts = {};
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
}

function stopVotePolling() {
  if (votePolling) {
    clearInterval(votePolling);
    votePolling = null;
  }
}

function updateVoteChart(data, battleId) {
  const ctx = document.getElementById(`vote-chart-${battleId}`);
  if (!ctx) return;

  // 更新票数显示
  document.getElementById(`votes-dancer1-${battleId}`).textContent = `${data.dancer1.votes} 票`;
  document.getElementById(`votes-dancer2-${battleId}`).textContent = `${data.dancer2.votes} 票`;

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
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  }
}
