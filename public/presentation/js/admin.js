/* ==========================================================================
   管理令牌：运行时输入，不写进源码/仓库
   生产环境的 ADMIN_TOKEN 由部署脚本随机生成（openssl rand -hex 32），
   硬编码占位值必然与之不匹配，导致 G / L / R 三个功能全部 403。
   这里改为首次使用时向操作者索取一次，存在 sessionStorage（关闭标签页即失效）。
   ========================================================================== */

const ADMIN_TOKEN_STORAGE_KEY = 'wotagei_admin_token';

/** 取管理令牌；没有就问一次。用户取消返回 null。 */
function getAdminToken() {
  let token = null;
  try {
    token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch (e) {
    // 隐私模式下 sessionStorage 可能不可用，退化为每次都问
  }
  if (token) return token;

  const input = prompt('请输入管理员令牌（ADMIN_TOKEN）：');
  if (input === null) return null;

  token = input.trim();
  if (!token) return null;

  try {
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } catch (e) {
    // 存不了就只在本次调用内有效
  }
  return token;
}

/** 令牌被服务端拒绝时调用，清掉缓存以便重新输入 */
function clearAdminToken() {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch (e) {
    // 忽略
  }
}

/**
 * 统一的 401/403 处理：清掉缓存并提示，避免操作者对着一个错令牌反复失败。
 * 返回给用户看的错误文案。
 */
function describeAdminError(error) {
  const status = error.response?.status;
  const serverError = error.response?.data?.error;
  if (status === 401 || status === 403) {
    clearAdminToken();
    return '管理员令牌错误，请重试（已清除缓存，下次会重新询问）';
  }
  return serverError || error.message;
}
