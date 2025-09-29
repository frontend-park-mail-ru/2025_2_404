import LoginPage from '../pages/login/LoginPage.js';
import Router from '../services/router/Router.js';

/**
 * View для страницы входа
 * @class
 */
export default class LoginView {
    /**
     * Создает экземпляр LoginView
     * @constructor
     */
    constructor() {
        this.loginPage = null;
    }

    /**
     * Рендерит View входа
     * @async
     */
    async render() {
        this.loginPage = new LoginPage(() => {
            Router.navigate('/');
        });
        await this.loginPage.init();
        this.loginPage.show();
        const mainPage = new MainPage();
        await mainPage.loadTemplate();
        const app = document.getElementById('app');
        app.innerHTML = mainPage.render();
    }

    /**
     * Очищает View
     */
    clear() {
        if (this.loginPage) {
            this.loginPage.hide();
        }
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
        }
    }
}