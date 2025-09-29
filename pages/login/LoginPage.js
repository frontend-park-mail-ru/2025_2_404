import Input from '../components/Input.js';
import Button from '../components/Button.js';
import AuthService from '../../services/ServiceAuthentification.js';

export default class LoginPage {
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
      },
    });
    this.passwordInput = new Input({
      id: 'login-password',
      label: 'Пароль',
      placeholder: 'Введите пароль',
      showPasswordToggle: true,
      validationFn: (value) => {
        if (!value.trim()) return 'Пароль не может быть пустым';
        return null;
      },
    });
    this.submitButton = new Button({
      id: 'login-submit',
      text: 'Войти',
      onClick: () => this.handleSubmit(),
    });

    this.init();
  }
  async init() {
    const response = await fetch('/pages/login/LoginPage.hbs');
    if (!response.ok) {
      throw new Error('HTTP ошибка' + response.status);
    }
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }
  render() {
    const context = {
      Title: 'Вход',
      loginInputHtml: this.loginInput.render(),
      passwordInputHtml: this.passwordInput.render(),
      submitButtonHtml: this.submitButton.render(),
    };
    return this.template(context);
  }
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
  hide() {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
    }
  }
  attachEvents() {
    this.modalElement
      .querySelector('.close-btn')
      .addEventListener('click', this.onClose);
    const submitEl = document.getElementById(this.submitButton.id);
    if (submitEl) {
      submitEl.addEventListener('click', this.handleSubmit.bind(this));
    }
    this.loginInput.attachValidationEvent();
    this.passwordInput.attachValidationEvent();
  }

  handleSubmit(event) {
    if (event) event.preventDefault();

    const email = document.getElementById(this.loginInput.id).value;
    const password = document.getElementById(this.passwordInput.id).value;

    const isEmailValid = !this.loginInput.validate(email);
    const isPasswordValid = !this.passwordInput.validate(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    AuthService.login({ email, password })
      .then(() => this.onClose())
      .catch((e) => {
        const msg = e?.body?.error?.message || 'Не удалось войти';
        this.passwordInput.showError(msg);
      });
  }
}
