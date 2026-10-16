let groupPolling = null;

function startGroupPolling() {
  stopGroupPolling();

  groupPolling = setInterval(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/group/status`);
      updateGroupDisplay(response.data);
    } catch (error) {
      console.error('分组数据获取失败:', error);
    }
  }, 5000);

  // 立即获取一次数据
  axios.get(`${API_BASE_URL}/group/status`)
    .then(response => updateGroupDisplay(response.data))
    .catch(error => console.error('初始分组数据获取失败:', error));
}

function stopGroupPolling() {
  if (groupPolling) {
    clearInterval(groupPolling);
    groupPolling = null;
  }
}

function updateGroupDisplay(data) {
  const container = document.getElementById('group-display');
  if (!container) return;

  let html = '';
  for (let i = 1; i <= data.groupCount; i++) {
    const group = data.groups[i.toString()];
    html += `
      <div class="group-column">
        <h3>第 ${i} 组 (${group.count}人)</h3>
        <ul>
          ${group.members.map(name => `<li>· ${escapeHtml(name)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}
