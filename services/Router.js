import AuthService from './ServiceAuthentification.js';

export default class Router {
  constructor(routes, rootElement) {
    this.routes = routes;
    this.rootElement = rootElement;
    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link || !link.hasAttribute('href') || link.getAttribute('href').startsWith('http') || link.target === '_blank') {
        return;
      }
      e.preventDefault();
      this.navigate(link.getAttribute('href'));
    });
    window.addEventListener('popstate', () => this.loadRoute());
  }

  navigate(path) {
    if (window.location.pathname === path) {
      return;
    }
    history.pushState({}, '', path);
    this.loadRoute();
  }

  async loadRoute() {
    const currentPath = window.location.pathname;
    const publicRoutes = ['/']; 
    if (!publicRoutes.includes(currentPath) && !AuthService.isAuthenticated()) {
        console.warn("Попытка доступа без авторизации. Перенаправление на главную.");
        this.navigate('/'); 
        return;
    }

    let routeFound = null;
    for (const routePath in this.routes) {
      const routeRegex = new RegExp(`^${routePath.replace(/:\w+/g, '([^/]+)')}$`);
      const match = currentPath.match(routeRegex);

      if (match) {
        routeFound = {
          component: this.routes[routePath],
          params: match.slice(1)
        };
        break;
      }
    }

    if (routeFound) {
      const page = new routeFound.component(this, ...routeFound.params);
      
      try {
        const html = await page.render();
        
        if (!html) {
             this.rootElement.innerHTML = '<div class="error-page">Ошибка: Страница пуста</div>';
             return;
        }

        this.rootElement.innerHTML = html;
        
        if (typeof page.attachEvents === 'function') {
          page.attachEvents();
        }
      } catch (error) {
        console.error("Ошибка при рендеринге маршрута:", error);
        this.rootElement.innerHTML = `<div class="error-page"><h1>Произошла ошибка</h1><p>${error.message}</p></div>`;
      }
    } else {
      this.rootElement.innerHTML = '<div class="error-page"><h1>404: Страница не найдена</h1><a href="/projects">Вернуться</a></div>';
    }
  }
}