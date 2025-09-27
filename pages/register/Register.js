import Input from '../components/Input.js';
import Button from '../components/Button.js';
import Handlebars from 'handlebars';

export default class RegisterPage{
    constructor (){
        this.loginInput = new Input({id:'login', label:'Логин', placeholder:'Example_1',
            validationFn: (value) => {
                value = value.trim();
                if (!value){
                    return 'Email обязателен для заполнения';
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
                const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/; //взяла из интернета, не знаю, нужен ли такой сложный или надо упростить
                if (!emailRegex.test(value)) {
                    return 'Введите корректный email';
                }
                return null;
            }
        })
        this.passwordInput = new Input({id:'password', label:'Пароль', placeholder:'Введите пароль',
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
        this.submitButton = new Button({
            text: 'Зарегистрироваться',
            onClick: () => this.handleSubmit()
        });
        this.loadTemplate();
        
    }
async loadTemplate() {
        try {
            const response = await fetch('/pages/register/register.hbs');
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const templateText = await response.text();
            this.template = Handlebars.compile(templateText);
        } catch (error) {
            console.error('Ошибка загрузки шаблона:', error);
            this.template = Handlebars.compile(`
                <div>Ошибка загрузки формы регистрации</div>
            `);
        }
    }
    
    render() {
        if (!this.template) {
            return '<div>Загрузка формы...</div>';
        }
        
        const context = {
            Title: 'Регистрация',
            loginInputHtml: this.loginInput.render(),
            emailInputHtml: this.emailInput.render(),
            passwordInputHtml: this.passwordInput.render(),
            submitButtonHtml: this.submitButton.render()
        };

        return this.template(context);
    }
    
    handleSubmit() {
        console.log('Форма отправлена!');
    }
}