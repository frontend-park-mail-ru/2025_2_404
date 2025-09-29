import RegisterPage from './src/pages/register/Register.js';
import LoginPage from './src/pages/login/LoginPage.js';
import AuthService from './src/services/api/ServiceAuthentification.js';
import Header from './src/components/layout/Header/Header.js';
import Footer from './src/components/layout/Footer/Footer.js';
import Router from './src/services/router/Router.js';
/**
 * Главный класс приложения, управляющий инициализацией и маршрутизацией
 * @class
 * @example
 * const app = new App();
 * app.start();
 */
class App {
    /**
     * Создает экземпляр приложения
     * @constructor
     */
    constructor() {
        this.header = new Header();
        this.modals = {};
        this.footer = new Footer();
        this.currentMod = null;
        window.app = this;
    }
    /**
     * Запускает приложение
     * @async
     */
    async start() {
        await this.header.loadTemplate();
        this.header.render();
        AuthService.onAuthChange(() => {
            this.header.render();
            if (!AuthService.isAuthenticated()) {
                this.closeMod();
            }
        });
        this.modals.register = new RegisterPage(() => Router.navigate('/'));
        this.modals.login = new LoginPage(() => Router.navigate('/'));
        await this.modals.register.init();
        await this.modals.login.init();

        Router.start();

        await this.footer.loadTemplate();
        const footerElement = this.footer.render();
        document.body.appendChild(footerElement);
    }
    /**
     * Обрабатывает изменение маршрута
     */
    handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/';
        
        if (this.currentMod) {
            this.currentMod.hide();
            this.currentMod = null;
        }

        if (hash === '/register') {
            this.currentMod = this.modals.register;
            this.currentMod.show();
        } else if (hash === '/login') {
            this.currentMod = this.modals.login;
            this.currentMod.show();
        }
    }
    /**
     * Закрывает текущее модальное окно
     */
    closeMod() {
        Router.navigate('/');
    }
}

window.addEventListener('error', (event) => {
    console.error('Ошибка:', event.error);
});

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.start().then(() => {
        if (!window.location.hash) {
            Router.navigate('/register');
        }
    });
});