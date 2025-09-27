import Input from '../pages/components/Input.js';
import Button from '../pages/components/Button.js';

const templateSource = await fetch('/pages/register/register.hbs').then(res => res.text());
const template = Handlebars.compile(templateSource);

class RegisterView {
    #appElement;
    #components = {};
    
    constructor() {
        this.#appElement = document.getElementById('app');
        this.#initComponents();
    }

    #initComponents() {
        this.#components.loginInput = new Input({ id: 'login', label: 'Логин', placeholder:'Example_1'});
        this.#components.emailInput = new Input({ id: 'email', label: 'Почта', placeholder:'Введите почту'});
        this.#components.passwordInput = new Input({ id: 'password', label: 'Пароль', placeholder:'Введите пароль'});
        this.#components.submitButton = new Button({ text: 'Зарегистрироваться', onClick: this.#handleSubmit.bind(this) });
    }

    #handleSubmit() {
        console.log('Форма отправлена!');
    }

    clear() {
        if (this.#appElement) this.#appElement.innerHTML = '';
    }

    render(data = {}) {
        const context = {
            loginInputHtml: this.#components.loginInput.render(),
            emailInputHtml: this.#components.emailInput.render(),
            passwordInputHtml: this.#components.passwordInput.render(),
            submitButtonHtml: this.#components.submitButton.render()
        };
        
        this.#appElement.innerHTML = template(context);
        this.#attachEvents();
    }

    #attachEvents() {

    }
}

export default RegisterView;