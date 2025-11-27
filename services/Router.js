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
      // ИСПРАВЛЕНИЕ: Передаем router (this) первым аргументом, 
      // так как SlotDetailPage(router, id) ждет его.
      const page = new routeFound.component(this, ...routeFound.params);
      
      try {
        const html = await page.render();
        // Защита от пустого рендера
        if (!html) {
             this.rootElement.innerHTML = '<div class="error-page">Ошибка: Страница пуста</div>';
             return;
        }
        this.rootElement.innerHTML = html;
        if (typeof page.attachEvents === 'function') {
          page.attachEvents();
        }
      } catch (error) {
        console.error("Ошибка при рендеринге:", error);
        // Выводим ошибку на экран, чтобы вы ее видели
        this.rootElement.innerHTML = `<div class="error-page"><h1>Ошибка JS: ${error.message}</h1></div>`;
      }
    } else {
      this.rootElement.innerHTML = '<div class="error-page"><h1>404: Страница не найдена</h1><a href="/projects">Перейти к проектам</a></div>';
    }
  }
}
      
