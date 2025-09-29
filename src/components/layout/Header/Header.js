import AuthService from '../../../services/api/ServiceAuthentification.js';

export default class Header {
    constructor() {
        this.header = document.createElement('header');
        document.body.prepend(this.header);
    }

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
    render() {
        const user = AuthService.getUser();
        const context = {
            isAuthenticated: AuthService.isAuthenticated(),
            user: user
        };
        this.header.innerHTML = this.template(context);
        this.attachEvents();
    }
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