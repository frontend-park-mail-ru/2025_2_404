import LoginView from '../views/LoginView.js';
import RegisterView from '../views/RegisterView.js';
import MainAdvertisementView from '../views/MainView.js';

export class Router {
  #views = new Map();
  #currentView = null;
  isLoading = false;

  constructor() {
    this.#views.set('/', MainAdvertisementView);
    this.#views.set('/login', LoginView);
    this.#views.set('/register', RegisterView);
    window.router = this;
  }
  navigate(path) {
    window.location.hash = path;
  }
  async open(path, data = {}) {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    if (this.#currentView?.clear) {
      this.#currentView.clear();
    }
    const isModal = path === '/login' || path === '/register';
    const viewPath = isModal ? '/' : path;
    const TypeView = this.#views.get(viewPath);
    if (!TypeView) {
      console.error(`не найдено по адресу: ${viewPath}`);
      this.isLoading = false;
      return;
    }
    this.#currentView = new TypeView();
    await this.#currentView.render(data);
    this.isLoading = false;
  }

  start() {
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.slice(1) || '/';
      if (window.app) {
        window.app.handleRouteChange();
      }
    });
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.pathname) {
        e.preventDefault();
        this.navigate(link.pathname);
      }
    });
    const initHash = window.location.hash.slice(1) || '/';
    this.open('/');
    if (window.app) {
      window.app.handleRouteChange();
    } else {
      setTimeout(() => window.app.handleRouteChange(), 100);
    }
  }
}

export default new Router();
