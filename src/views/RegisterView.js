import RegisterPage from '../pages/register/Register.js';
import MainPage from '../pages/main/MainPage.js';
import Router from '../services/router/Router.js';

/**
 * View для страницы регистрации
 * @class
 */
export default class RegisterView {
    /**
     * Создает экземпляр RegisterView
     * @constructor
     */
    constructor() {
        this.registerPage = null;
    }

    /**
     * Рендерит View регистрации
     * @async
     */
    async render() {
        this.registerPage = new RegisterPage(() => {
            Router.navigate('/');
        });
        await this.registerPage.init();
        this.registerPage.show();
        const mainPage = new MainPage();
        await mainPage.loadTemplate();
        const app = document.getElementById('app');
        app.innerHTML = mainPage.render();
    }

    /**
     * Очищает View
     */
    clear() {
        if (this.registerPage) {
            this.registerPage.hide();
        }
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
        }
    }
}