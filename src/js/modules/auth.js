import { platformApi, getPlatformUser } from '../utils/platform-api.js';
import { showToast } from '../utils/helpers.js';
import { refreshSidebarAuthUI } from '../utils/platform-ui.js';

export function renderAuth(container) {
  const user = getPlatformUser();
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-shell">
        <div class="auth-brand">
          <div class="auth-logo">EduVerse</div>
          <div class="auth-tagline">Equitable AR + AI learning, with peer practice.</div>
        </div>

        <div class="auth-card glass-card">
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Login</button>
            <button class="auth-tab" data-tab="signup">Sign up</button>
          </div>

          <div class="auth-body">
            <div class="auth-panel" data-panel="login">
              <div class="auth-title">Welcome back</div>
              <div class="auth-subtitle">Continue your AR learning + communication coaching journey.</div>
              <div class="auth-grid">
                <div class="input-group">
                  <label class="input-label">Email</label>
                  <input class="input-field" id="login-email" placeholder="you@example.com" autocomplete="email">
                </div>
                <div class="input-group">
                  <label class="input-label">Password</label>
                  <input class="input-field" id="login-password" type="password" placeholder="••••••••" autocomplete="current-password">
                </div>
              </div>
              <button class="btn btn-primary auth-cta" id="btn-login">Login</button>
              <div class="auth-hint">New here? Switch to <strong>Sign up</strong>.</div>
            </div>

            <div class="auth-panel" data-panel="signup" style="display:none;">
              <div class="auth-title">Create your account</div>
              <div class="auth-subtitle">Join peer rooms, get coaching, and track progress.</div>
              <div class="auth-grid">
                <div class="input-group">
                  <label class="input-label">Display name</label>
                  <input class="input-field" id="signup-name" placeholder="Student">
                </div>
                <div class="input-group">
                  <label class="input-label">Preferred language</label>
                  <select class="input-field" id="signup-lang">
                    <option value="en" selected>English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                    <option value="ta">Tamil</option>
                    <option value="kn">Kannada</option>
                    <option value="ml">Malayalam</option>
                    <option value="mr">Marathi</option>
                    <option value="bn">Bengali</option>
                  </select>
                </div>
                <div class="input-group">
                  <label class="input-label">Email</label>
                  <input class="input-field" id="signup-email" placeholder="you@example.com" autocomplete="email">
                </div>
                <div class="input-group">
                  <label class="input-label">Password</label>
                  <input class="input-field" id="signup-password" type="password" placeholder="Min 8 characters" autocomplete="new-password">
                </div>
              </div>
              <button class="btn btn-primary auth-cta" id="btn-signup">Create account</button>
              <div class="auth-hint">Already have an account? Switch to <strong>Login</strong>.</div>
            </div>
          </div>
        </div>

        <div class="auth-footer">
          <div class="badge badge-primary">Research-grade</div>
          <div class="auth-footer-text">No expensive lab hardware required. Works on commodity devices.</div>
        </div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.auth-tab');
  const panels = container.querySelectorAll('.auth-panel');
  const setTab = (tab) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    panels.forEach((p) => (p.style.display = p.dataset.panel === tab ? 'block' : 'none'));
  };
  tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));

  container.querySelector('#btn-login')?.addEventListener('click', async () => {
    try {
      const email = container.querySelector('#login-email')?.value?.trim();
      const password = container.querySelector('#login-password')?.value || '';
      if (!email || !password) return showToast('Enter email and password.', 'warning');
      await platformApi.login({ email, password });
      showToast('✅ Logged in', 'success');
      refreshSidebarAuthUI();
      window.location.hash = '#/peer';
    } catch (e) {
      showToast(e.message || String(e), 'error');
    }
  });

  container.querySelector('#btn-signup')?.addEventListener('click', async () => {
    try {
      const display_name = container.querySelector('#signup-name')?.value?.trim() || 'Student';
      const preferred_language = container.querySelector('#signup-lang')?.value || 'en';
      const email = container.querySelector('#signup-email')?.value?.trim();
      const password = container.querySelector('#signup-password')?.value || '';
      if (!email || !password) return showToast('Enter email and password.', 'warning');
      await platformApi.signup({ email, password, display_name, preferred_language });
      showToast('✅ Account created', 'success');
      refreshSidebarAuthUI();
      window.location.hash = '#/peer';
    } catch (e) {
      showToast(e.message || String(e), 'error');
    }
  });
}

