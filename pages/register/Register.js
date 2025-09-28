import Input from '../components/Input.js';
import Button from '../components/Button.js';
import AuthService from '../../services/ServiceAuthentification.js'

export default class RegisterPage{
    constructor (onClose){
        this.onClose = onClose;
        this.modalEl = null;
        this.loginInput = new Input({id:'login', label:'Логин', placeholder:'Example_1',
            validationFn: (value) => {
                value = value.trim();
                if (!value){
                    return 'Логин обязателен для заполнения';
                }
                if (value.length < 4){
                    return 'Логин должен содержать минимум 4 символа';
                } 
                if (value.length > 20){
                    return 'Логин должен содержать максимум 20 символов';
                } 
                if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    return 'Логин может содержать только английские буквы, цифры и символ _';
                }
                const UpperCase = /[A-Z]/.test(value);
                const LowerCase = /[a-z]/.test(value);
                
                if (!UpperCase && !LowerCase) {
                    return 'Логин должен содержать хотя бы одну букву';
                }
                
                if (!UpperCase || !LowerCase) {
                    return 'Логин должен содержать буквы разного регистра (заглавные и строчные)';
                }
                
                return null;
            }
        })
        this.emailInput = new Input({id:'email', label:'Почта', placeholder:'Введите почту',
            validationFn: (value) => {
                value = value.trim();
                if (!value){
                    return 'Email обязателен для заполнения';
                } 
                if (value.length > 100){
                return 'Почта слишком длинная, введите другую';
                } 
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                if (!emailRegex.test(value)) {
                    return 'Введите корректный email';
                }
                return null;
            }
        })
        this.passwordInput = new Input({id:'password', label:'Пароль', placeholder:'Введите пароль', showPasswordToggle: true,
            validationFn: (value) => {
                value = value.trim();
                if (!value){
                    return 'Заполните пароль';
                }
                if (value.length < 8){
                    return 'Пароль должен содержать минимум 8 символов';
                } 
                if (value.length > 100){
                return 'Пароль слишком длинный';
                } 
                const UpperCase = /[A-Z]/.test(value);
                const LowerCase = /[a-z]/.test(value);
                if (!UpperCase || !LowerCase) {
                    return 'Пароль должен содержать буквы разного регистра (заглавные и строчные)';
                }
                const SpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                if (!SpecialChar) {
                    return 'Пароль должен содержать хотя бы один спецсимвол (!@#$%^&* и т.д.)';
                }
                return null;
            }
        })
        this.passwordCheckInput = new Input({id:'passwordCheck', label:'', placeholder:'Повторите пароль', showPasswordToggle: true,
            validationFn: (value) => {
                value = value.trim();
                const passwordValue = document.getElementById('password') ? document.getElementById('password').value : '';
                if (!value){
                    return 'Заполните пароль повторно';
                }
                if (value !== passwordValue) {
                    return 'Пароли не совпадают';
                }
        
                return null;
            }
        })
        this.submitButton = new Button({
            id: 'register-submit',
            text: 'Зарегистрироваться',
            onClick: () => this.Submit()
        });
        this.init();
        
    }
    async init() {
        try {
            const response = await fetch('/pages/register/register.hbs');
            if (!response.ok){
                throw new Error('HTTP ошибка ' + response.status);
            } 
            const templateText = await response.text();
            this.template = Handlebars.compile(templateText);

        } catch (error) {
            console.error('Ошибка загрузки шаблона:', error);
        }
    }
    render() {
        
        const context = {
            Title: 'Регистрация',
            loginInputHtml: this.loginInput.render(),
            emailInputHtml: this.emailInput.render(),
            passwordInputHtml: this.passwordInput.render(),
            passwordCheckInputHtml: this.passwordCheckInput.render(),
            submitButtonHtml: this.submitButton.render()
        };
        return this.template(context);
    }

    show() {
        if (!this.modalEl) {
            this.modalEl = document.createElement('div');
            this.modalEl.className = 'modal-overlay';
            this.modalEl.innerHTML = this.render();
            document.body.appendChild(this.modalEl);
            this.attachEvents();
        }
        this.modalEl.style.display = 'flex';
    }

    hide() {
        if (this.modalEl) {
            this.modalEl.style.display = 'none';
        }
    }

    attachEvents() {
        this.modalEl.querySelector('.close-btn').addEventListener('click', this.onClose);
        const submitEl = document.getElementById(this.submitButton.id);
        if (submitEl) {
            submitEl.addEventListener('click', this.Submit.bind(this));
        }
        this.loginInput.attachValidationEvent();
        this.emailInput.attachValidationEvent();
        this.passwordInput.attachValidationEvent();
        this.passwordCheckInput.attachValidationEvent();
    }
    Submit(event) {
        if (event) {
            event.preventDefault(); 
        }
        let isValidated = true;
        const loginValue = document.getElementById(this.loginInput.id).value;
        const emailValue = document.getElementById(this.emailInput.id).value;
        const passwordValue = document.getElementById(this.passwordInput.id).value;
        const passwordCheckValue = document.getElementById(this.passwordCheckInput.id).value;
        const loginError = this.loginInput.validate(loginValue);
        if (loginError) {
            isValidated = false;
            console.error('Ошибка логина:', loginError);
        }
        const emailError = this.emailInput.validate(emailValue);
        if (emailError) {
            isValidated = false;
            console.error('Ошибка почты:', emailError);
        }
        const passwordError = this.passwordInput.validate(passwordValue);
        if (passwordError) {
            isValidated = false;
            console.error('Ошибка пароля:', passwordError);
        }
        const passwordCheckError = this.passwordCheckInput.validate(passwordCheckValue);
        if (passwordCheckError) {
            isValidated = false;
            console.error('Ошибка повторного ввода пароля:', passwordCheckError);
        }
            if (isValidated) {
                console.log('Форма успешно отправлена!');
                AuthService.login({ login: loginValue, email: emailValue });
                this.onClose();
            } else {
                console.warn('Форма содержит ошибки');
            }
        }
    }