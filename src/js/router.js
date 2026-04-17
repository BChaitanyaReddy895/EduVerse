// ============================================
// EduVerse — SPA Router
// ============================================

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    window.addEventListener('hashchange', () => this.navigate());
  }

  register(path, renderFn) {
    this.routes.set(path, renderFn);
  }

  navigate() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes.get(hash);

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${hash}`);
    });

    if (route) {
      this.currentRoute = hash;
      const container = document.getElementById('page-container');
      
      // Clear container first
      container.innerHTML = '';
      container.style.opacity = '0';
      container.style.transform = 'translateY(10px)';

      setTimeout(() => {
        route(container);
        container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 150);
    }
  }

  start() {
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    this.navigate();
  }
}
