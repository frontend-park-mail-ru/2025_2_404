/**
 * Компонент футера
 * @class
 */
export default class Footer {
    /**
     * Создает экземпляр футера
     * @constructor
     */
    constructor() {
        this.footer = document.createElement('footer');
    }

    /**
     * Загружает шаблон футера
     * @async
     * @throws {Error} Если не удалось загрузить шаблон
     */
    async loadTemplate() {
        try {
            const response = await fetch('/src/components/layout/Footer/footer.hbs');
            if (!response.ok){
                throw new Error('Не удалось загрузить футтер');
            }
            const templateText = await response.text();
            this.template = Handlebars.compile(templateText);
        } catch (error) {
            console.error('Ошибка загрузки футтера', error);
        }
    }

    /**
     * Рендерит футер
     * @returns {HTMLElement} DOM элемент футера
     */
    render() {
        if (this.template) {
            this.footer.innerHTML = this.template();
        }
        return this.footer;
    }
}