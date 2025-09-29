/**
 * Компонент кнопки
 * @class
 */
export default class Button{
    /**
     * Создает экземпляр кнопки
     * @param {Object} config - Конфигурация кнопки
     * @param {string} config.id - ID кнопки
     * @param {string} config.text - Текст кнопки
     * @param {Function} config.onClick - Обработчик клика
     * @param {string} [config.variant="primary"] - Вариант стиля
     */
    constructor({id, text, onClick, variant = "primary"}){
        this.id = id;
        this.text = text;
        this.onClick = onClick;
        this.variant = variant;
    }

    /**
     * Рендерит HTML кнопки
     * @returns {string} HTML строка
     */
    render(){
        return `<button class="btn btn-${this.variant}" id="${this.id}" type="submit">${this.text}</button>`;
    }
    
    /**
     * Прикрепляет обработчики событий
     */
    attachEvents() {
        const button = document.querySelector(`.btn-${this.variant}`);
        if (button && this.onClick) {
            button.addEventListener('click', this.onClick);
        }
    }
}