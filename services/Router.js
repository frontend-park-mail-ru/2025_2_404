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
      const page = new routeFound.component(this, ...routeFound.params);
      this.rootElement.innerHTML = '<div>Загрузка...</div>';
      if (typeof page.loadTemplate === 'function') {
        await page.loadTemplate();
      }
      this.rootElement.innerHTML = await page.render();
      if (typeof page.attachEvents === 'function') {
        page.attachEvents();
      }
    } else {
      this.rootElement.innerHTML = '<h1> 404: Страница не найдена</h1>';
    }
  }
}
