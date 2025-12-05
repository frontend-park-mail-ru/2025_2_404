import type { Routes, RouteMatch, PageComponent, PageConstructor } from '../src/types';

export default class Router {
  routes: Routes;
  rootElement: HTMLElement;
  private onRouteChangeCallback: ((path: string) => void) | null = null;

  constructor(routes: Routes, rootElement: HTMLElement) {
    this.routes = routes;
    this.rootElement = rootElement;
    this.initEventListeners();
  }

  onRouteChange(callback: (path: string) => void): void {
    this.onRouteChangeCallback = callback;
  }

  private initEventListeners(): void {
    window.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement | null;
      
      if (!link || !link.hasAttribute('href') || 
          link.getAttribute('href')?.startsWith('http') || 
          link.target === '_blank') {
        return;
      }
      
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        this.navigate(href);
      }
    });
    
    window.addEventListener('popstate', () => this.loadRoute());
  }

  navigate(path: string): void {
    if (window.location.pathname === path) {
      return;
    }
    history.pushState({}, '', path);
    this.loadRoute();
  }

  async loadRoute(): Promise<void> {
    const currentPath = window.location.pathname;
    let routeFound: RouteMatch | null = null;
    
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
      const PageClass = routeFound.component as PageConstructor;
      const page: PageComponent = new PageClass(this, ...routeFound.params);
      
      try {
        const html = await page.render();
        this.rootElement.innerHTML = html;
        if (typeof page.attachEvents === 'function') {
          page.attachEvents();
        }
      } catch (error) {
        console.error("Ошибка при рендеринге маршрута:", error);
        this.rootElement.innerHTML = '<h1>Произошла ошибка при загрузке страницы</h1>';
      }
    } else {
      this.rootElement.innerHTML = '<div class="error-page"><h1>404: Страница не найдена</h1></div>';
    }

    if (this.onRouteChangeCallback) {
      this.onRouteChangeCallback(currentPath);
    }
  }
}
