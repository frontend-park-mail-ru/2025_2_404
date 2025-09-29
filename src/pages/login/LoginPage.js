import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import AuthService from '../../services/api/ServiceAuthentification.js'

/**
 * Страница входа в систему
 * @class
 */
export default class LoginPage {
    /**
     * Создает экземпляр страницы входа
     * @param {Function} onClose - Callback при закрытии модального окна
     */
    constructor(onClose) {
        this.onClose = onClose;
        this.modalElement = null;
        this.loginInput = new Input({
            id: 'login-email',
            label: 'Почта',
            placeholder: 'Введите почту',
            validationFn: (value) => {
                if (!value.trim()) return 'Это поле обязательно для заполнения';
                return null;
            }
        });
        this.passwordInput = new Input({
            id: 'login-password',
            label: 'Пароль',
            placeholder: 'Введите пароль',
            showPasswordToggle: true,
            validationFn: (value) => {
                if (!value.trim()) return 'Пароль не может быть пустым';
                return null;
            }
        });
        this.submitButton = new Button({
            id: 'login-submit',
            text: 'Войти',
            onClick: () => this.handleSubmit()
        });

        this.init();
    }

    /**
     * Инициализирует страницу
     * @async
     */
    async init() {
        try {
            const response = await fetch('/src/pages/login/LoginPage.hbs');
            if (!response.ok){
                throw new Error('HTTP ошибка' + response.status);
            } 
            const templateText = await response.text();
            this.template = Handlebars.compile(templateText);
        } catch (error) {
            console.error('Ошибка загрузки входа:', error);
        }
    }

    /**
     * Рендерит страницу входа
     * @returns {string} HTML строка
     */
    render() {
        const context = {
            Title: 'Вход',
            loginInputHtml: this.loginInput.render(),
            passwordInputHtml: this.passwordInput.render(),
            submitButtonHtml: this.submitButton.render()
        };
        return this.template(context);
    }

    /**
     * Показывает модальное окно входа
     */
    show() {
        if (!this.modalElement) {
            this.modalElement = document.createElement('div');
            this.modalElement.className = 'modal-overlay';
            this.modalElement.innerHTML = this.render();
            document.body.appendChild(this.modalElement);
            this.attachEvents();
        }
        this.modalElement.style.display = 'flex';
    }

    /**
     * Скрывает модальное окно входа
     */
    hide() {
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
        }
    }

    /**
     * Прикрепляет обработчики событий
     */
    attachEvents() {
        this.modalElement.querySelector('.close-btn').addEventListener('click', this.onClose);
        const submitEl = document.getElementById(this.submitButton.id);
        if (submitEl) {
            submitEl.addEventListener('click', this.handleSubmit.bind(this));
        }
        this.loginInput.attachValidationEvent();
        this.passwordInput.attachValidationEvent();
    }

    /**
     * Обрабатывает отправку формы
     * @param {Event} [event] - Событие отправки формы
     */
    handleSubmit(event) {
    if (event){
        event.preventDefault();
    }
    
    const login = document.getElementById(this.loginInput.id).value;
    const password = document.getElementById(this.passwordInput.id).value;
    
    const isLoginValid = !this.loginInput.validate(login);
    const isPasswordValid = !this.passwordInput.validate(password);

    if (isLoginValid && isPasswordValid) {
        console.log('Форма входа валидна, выполняем вход...');
        AuthService.login({ login: login });
        this.onClose();
    } else {
        console.warn('Форма входа содержит ошибки.');
    }
}
}