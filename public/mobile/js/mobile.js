const API_BASE_URL = 'http://localhost:3000/api';

// 生成 UUID v4
function generateDeviceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 检查昵称
function checkNickname() {
  const nickname = localStorage.getItem('userNickname');
  const deviceId = localStorage.getItem('deviceId');

  if (!nickname && !window.location.pathname.includes('nickname.html')) {
    // 保存目标页面
    localStorage.setItem('redirectAfterNickname', window.location.href);
    window.location.href = '/mobile/nickname.html';
  }

  return { nickname, deviceId };
}

// 显示消息
function showMessage(text, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;

  const container = document.querySelector('.container');
  if (container) {
    container.appendChild(messageDiv);
  }
}

// Fetch 封装，带错误处理
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('网络错误:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showMessage('网络连接失败，请检查网络后重试', 'error');
    } else {
      showMessage(error.message, 'error');
    }

    return null;
  }
}
