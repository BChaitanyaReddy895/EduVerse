import { getPlatformUser, platformApi, getToken } from './platform-api.js';

export function refreshSidebarAuthUI() {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const actionBtn = document.getElementById('sidebar-auth-action');

  const user = getPlatformUser();
  const token = getToken();

  const displayName = user?.display_name || 'Student';
  const avatar = (displayName || 'S').trim().slice(0, 1).toUpperCase();

  if (nameEl) nameEl.textContent = token ? displayName : 'Guest';
  if (roleEl) roleEl.textContent = token ? `Lang: ${user?.preferred_language || 'en'}` : 'Not logged in';
  if (avatarEl) avatarEl.textContent = token ? avatar : 'G';

  if (actionBtn) {
    actionBtn.textContent = token ? 'Logout' : 'Login';
    actionBtn.onclick = () => {
      if (token) {
        platformApi.logout();
        refreshSidebarAuthUI();
        window.location.hash = '#/auth';
      } else {
        window.location.hash = '#/auth';
      }
    };
  }
}

