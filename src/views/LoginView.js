import LoginPage from '../pages/login/LoginPage.js';
import Router from '../services/router/Router.js';

export default class LoginView {
    constructor() {
        this.loginPage = null;
    }
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