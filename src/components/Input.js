/**
 * Компонент input с валидацией и переключением видимости пароля
 * @class
 */
export default class Input{
    /**
     * Создает экземпляр input
     * @param {Object} config - Конфигурация input
     * @param {string} config.id - ID элемента
     * @param {string} [config.type="text"] - Тип input
     * @param {string} config.label - Текст label
     * @param {string} config.placeholder - Placeholder
     * @param {boolean} [config.showPasswordToggle=false] - Показывать ли переключатель видимости пароля
     * @param {Function} [config.validationFn] - Функция валидации
     */
    constructor({id, type = "text", label, placeholder, showPasswordToggle = false, validationFn}) {
        this.id = id; 
        this.type = showPasswordToggle ? 'password' : type; 
        this.label = label;
        this.placeholder = placeholder;
        this.showPasswordToggle = showPasswordToggle; 
        this.validationFn = validationFn;
    }
    
    /**
     * Рендерит HTML компонента
     * @returns {string} HTML строка
     */
    render(){
        const initialIcon = '👁'; 
        return `
            <div class="form-group">
                <label for="${this.id}">${this.label}</label>
                <div class="input-wrapper">
                    <input type="${this.type}" id="${this.id}" placeholder="${this.placeholder}">
                    ${this.showPasswordToggle ? `<span class="password-toggle" role="button" aria-controls="${this.id}">${initialIcon}</span>` : ''}
                </div>
                <div class="error-message" id="error-${this.id}"></div>
            </div>
        `;
    }

    /**
     * Валидирует значение
     * @param {string} value - Значение для валидации
     * @returns {string|null} Сообщение об ошибке или null если валидно
     */
    validate(value){
        if (!this.validationFn){
            return null;
        }
        const errorMessage = this.validationFn(value);
        const inputEl = document.getElementById(this.id);
        if (!inputEl){
            return errorMessage;
        } 
        inputEl.classList.remove('input-valid', 'input-error');
        
        if (errorMessage) {
            this.showError(errorMessage);
            inputEl.classList.add('input-error');
        } else {
            this.clearError();
            inputEl.classList.add('input-valid');
        }
        return errorMessage;
    }

    /**
     * Показывает сообщение об ошибке
     * @param {string} message - Текст ошибки
     */
    showError(message) {
        const errorEl = document.getElementById(`error-${this.id}`);
        const inputEl = document.getElementById(this.id);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.color = 'red';
        }
        if (inputEl) {
             inputEl.classList.add('input-error');
             inputEl.classList.remove('input-valid');
        }
    }

    /**
     * Очищает сообщение об ошибке
     */
    clearError() {
        const errorEl = document.getElementById(`error-${this.id}`);
        const inputEl = document.getElementById(this.id);
        if (errorEl) {
            errorEl.textContent = '';
        }
        if (inputEl) {
             inputEl.classList.remove('input-error');
        }
    }

    /**
     * Добавляет функциональность переключения видимости пароля
     */
    PasswordToggle() {
    const toggle = document.querySelector(`#${this.id} + .password-toggle`); 
    if (toggle) {
        toggle.addEventListener('click', () => {
            const inputEl = document.getElementById(this.id);
            if (inputEl.type === 'password') {
                inputEl.type = 'text';
                toggle.textContent = '👁'; 
            } else {
                inputEl.type = 'password';
                toggle.textContent = '👁'; 
            }
        });
    }
    }

    /**
     * Прикрепляет обработчики валидации и событий
     */
    attachValidationEvent() {
        const inputEl = document.getElementById(this.id);
        if (inputEl) {
            inputEl.addEventListener('blur', () => {
                this.validate(inputEl.value);
            });
            inputEl.addEventListener('input', () => {
                this.clearError();
            });
        }
        if (this.showPasswordToggle) { 
            this.PasswordToggle();
        }
    }
}