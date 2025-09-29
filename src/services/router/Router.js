import LoginView from "../../views/LoginView.js";
import RegisterView from "../../views/RegisterView.js";
import MainAdvertisementView from "../../views/MainView.js";

/**
 * Маршрутизатор для Single Page Application
 * @class
 */
export class Router {
    #views = new Map();
    #currentView = null;
    isLoading = false;

    /**
     * Создает экземпляр маршрутизатора
     * @constructor
     */
    constructor() {
        this.#views.set('/', MainAdvertisementView);
        this.#views.set('/login', LoginView);
        this.#views.set('/register', RegisterView);
        window.router = this;
    }

    /**
     * Переход по указанному пути
     * @param {string} path - Путь для навигации
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Открывает View по указанному пути
     * @param {string} path - Путь
     * @param {Object} [data={}] - Данные для передачи во View
     * @async
     */
    async open(path, data = {}) {
        if (this.isLoading){
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

    /**
     * Запускает маршрутизатор
     */
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