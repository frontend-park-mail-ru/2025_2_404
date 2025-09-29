import MainPage from '../pages/main/MainPage.js';

/**
 * View для главной страницы
 * @class
 */
export default class MainAdvertisementView {
    /**
     * Создает экземпляр MainAdvertisementView
     * @constructor
     */
    constructor() {
        this.mainPage = new MainPage();
    }

    /**
     * Рендерит главную страницу
     * @async
     */
    async render() {
        await this.mainPage.loadTemplate();
        const app = document.getElementById('app');
        app.innerHTML = this.mainPage.render();
    }

    /**
     * Очищает View
     */
    clear() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
        }
    }
}