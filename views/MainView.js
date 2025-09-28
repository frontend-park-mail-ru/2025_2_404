import MainPage from '../pages/main/MainPage.js';

export default class MainAdvertisementView {
    constructor() {
        this.mainPage = new MainPage();
    }
    async render() {
        await this.mainPage.loadTemplate();
        const app = document.getElementById('app');
        app.innerHTML = this.mainPage.render();
    }
    clear() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
        }
    }
}