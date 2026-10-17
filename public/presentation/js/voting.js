let votePolling = null;
let voteCharts = {};
const lastSuccessfulData = {};

function startVotePolling(battleId) {
  stopVotePolling();

  const refresh = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vote/${battleId}`);
      updateVoteChart(response.data, battleId);
      lastSuccessfulData[battleId] = response.data;
      if (response.data.locked) stopVotePolling();
    } catch (error) {
      console.error('投票数据获取失败:', error);
      if (lastSuccessfulData[battleId]) {
        updateVoteChart(lastSuccessfulData[battleId], battleId);
      }
    }
  };

  refresh();
  votePolling = setInterval(refresh, 3000);
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

  const stage = ctx.closest('.vote-stage');
  const lockButton = stage.querySelector('.vote-lock-button');
  const avatar1 = document.getElementById(`vote-avatar-dancer1-${battleId}`);
  const avatar2 = document.getElementById(`vote-avatar-dancer2-${battleId}`);
  const name1 = document.getElementById(`vote-name-dancer1-${battleId}`);
  const name2 = document.getElementById(`vote-name-dancer2-${battleId}`);
  const total = data.dancer1.votes + data.dancer2.votes;

  avatar1.src = data.dancer1.avatar;
  avatar1.alt = data.dancer1.name;
  avatar2.src = data.dancer2.avatar;
  avatar2.alt = data.dancer2.name;
  name1.textContent = data.dancer1.name;
  name2.textContent = data.dancer2.name;
  document.getElementById(`votes-dancer1-${battleId}`).textContent = `${data.dancer1.votes} 票`;
  document.getElementById(`votes-dancer2-${battleId}`).textContent = `${data.dancer2.votes} 票`;
  document.getElementById(`vote-total-${battleId}`).textContent = `共 ${total} 票`;

  stage.classList.toggle('is-locked', data.locked);
  lockButton.disabled = data.locked;
  renderVoteResult(stage, data);

  if (voteCharts[battleId]) {
    voteCharts[battleId].data.labels = [data.dancer1.name, data.dancer2.name];
    voteCharts[battleId].data.datasets[0].data = [data.dancer1.votes, data.dancer2.votes];
    voteCharts[battleId].options.scales.x.max = Math.max(1, data.dancer1.votes, data.dancer2.votes) + 1;
    voteCharts[battleId].update();
  } else {
    voteCharts[battleId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [data.dancer1.name, data.dancer2.name],
        datasets: [{
          label: '票数',
          data: [data.dancer1.votes, data.dancer2.votes],
          backgroundColor: ['#FB921A', '#7890D8'],
          borderRadius: 10,
          borderSkipped: false,
          barThickness: 34
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: 'rgba(255, 255, 255, 0.72)',
              precision: 0
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            max: Math.max(1, data.dancer1.votes, data.dancer2.votes) + 1
          },
          y: {
            ticks: {
              color: '#ffffff',
              font: { size: 18, family: 'HYWenHei-85W' }
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const votes = context.raw;
                const currentTotal = context.chart.data.datasets[0].data
                  .reduce((sum, value) => sum + value, 0);
                const percent = currentTotal === 0 ? 0 : Math.round(votes / currentTotal * 100);
                return `${votes} 票 · ${percent}%`;
              }
            }
          }
        }
      }
    });
  }
}

function renderVoteResult(stage, data) {
  const result = stage.querySelector('.vote-result');
  if (!result) return;

  if (!data.locked || !data.result) {
    result.hidden = true;
    result.innerHTML = '';
    stage.classList.remove('has-result');
    return;
  }

  if (data.result.type === 'tie') {
    result.innerHTML = `
      <p class="vote-result-kicker">最终结果</p>
      <h3 class="vote-result-title">平票</h3>
      <div class="vote-result-tie">
        ${voteResultContestant(data.dancer1)}
        <span class="vote-result-divider">平</span>
        ${voteResultContestant(data.dancer2)}
      </div>
    `;
  } else {
    const winner = data[data.result.winner];
    const loserKey = data.result.winner === 'dancer1' ? 'dancer2' : 'dancer1';
    const loser = data[loserKey];
    result.innerHTML = `
      <p class="vote-result-kicker">最终胜者</p>
      <article class="vote-result-winner">
        <img src="${escapeHtml(winner.avatar)}" alt="${escapeHtml(winner.name)}">
        <h3>${escapeHtml(winner.name)}</h3>
        <p>${winner.votes} 票</p>
      </article>
      <p class="vote-result-score">
        ${escapeHtml(winner.name)} ${winner.votes}
        <span>:</span>
        ${loser.votes} ${escapeHtml(loser.name)}
      </p>
    `;
  }

  result.hidden = false;
  stage.classList.add('has-result');
}

function voteResultContestant(dancer) {
  return `
    <article class="vote-result-contestant">
      <img src="${escapeHtml(dancer.avatar)}" alt="${escapeHtml(dancer.name)}">
      <h4>${escapeHtml(dancer.name)}</h4>
      <p>${dancer.votes} 票</p>
    </article>
  `;
}

async function lockBattleVote(battleId) {
  if (!confirm('确定截票吗？截票后将停止接收新票，直到重置本场投票。')) return;

  const adminToken = getAdminToken();
  if (!adminToken) return;

  const button = document.querySelector(`[data-vote-lock="${battleId}"]`);
  if (button) button.disabled = true;

  try {
    const response = await axios.post(`${API_BASE_URL}/vote/${battleId}/lock`, {
      adminToken
    });
    lastSuccessfulData[battleId] = response.data;
    updateVoteChart(response.data, battleId);
    stopVotePolling();
  } catch (error) {
    alert('截票失败: ' + describeAdminError(error));
    if (button) button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-vote-lock]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      lockBattleVote(button.dataset.voteLock);
    });
  });
});
