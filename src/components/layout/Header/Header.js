import AuthService from '../../../services/api/ServiceAuthentification.js';

/**
 * Компонент хедера с авторизацией
 * @class
 */
export default class Header {
    /**
     * Создает экземпляр хедера
     * @constructor
     */
    constructor() {
        this.header = document.createElement('header');
        document.body.prepend(this.header);
    }

    /**
     * Загружает шаблон хедера
     * @async
     * @throws {Error} Если не удалось загрузить шаблон
     */
    async loadTemplate() {
        try {
            const response = await fetch('/src/components/layout/Header/header.hbs');
            if (!response.ok){
                throw new Error('Не удалось загрузить хедер');
            }
            const templateText = await response.text();
            this.template = Handlebars.compile(templateText);
        } catch (error) {
            console.error('Ошибка загрузки хедера:', error);
        }
    }

    /**
     * Рендерит хедер с учетом статуса авторизации
     */
    render() {
        const user = AuthService.getUser();
        const context = {
            isAuthenticated: AuthService.isAuthenticated(),
            user: user
        };
        this.header.innerHTML = this.template(context);
        this.attachEvents();
    }

    /**
     * Прикрепляет обработчики событий (выход из системы)
     */
    attachEvents() {
        const logoutButton = this.header.querySelector('#logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                AuthService.logout();
            });
        }
    }
}