import Input from '../components/Input.js';
import Button from '../components/Button.js';
import AuthService from '../../services/ServiceAuthentification.js';

export default class LoginPage {
  constructor({ onSuccess, onCancel, onSwitchToRegister }) {
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;
    this.onSwitchToRegister = onSwitchToRegister;
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
      type: 'submit'
    });
    this.init();
  }

  async init() {
    try {
      const response = await fetch('/pages/login/LoginPage.hbs');
      if (!response.ok) {
        throw new Error('HTTP ошибка ' + response.status);
      }
      const templateText = await response.text();
      this.template = Handlebars.compile(templateText);
    } catch (error) {
      console.error("Не удалось загрузить шаблон для LoginPage:", error);
    }
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
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  attachEvents() {
    this.modalElement.querySelector('.close-btn').addEventListener('click', this.onCancel);
    const form = this.modalElement.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', (event) => this.handleSubmit(event));
    }
    const switchBtn = this.modalElement.querySelector('#switch-to-register-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', this.onSwitchToRegister);
    }
    this.loginInput.attachValidationEvent();
    this.passwordInput.attachValidationEvent();
  }

handleSubmit(event) {
  event.preventDefault();
  
  const email = document.getElementById(this.loginInput.id).value;
  const password = document.getElementById(this.passwordInput.id).value;
  const isEmailValid = !this.loginInput.validate(email);
  const isPasswordValid = !this.passwordInput.validate(password);

  if (!isEmailValid || !isPasswordValid) {
    return;
  }
  const submitButton = document.getElementById(this.submitButton.id);
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Загрузка...';
  }

  AuthService.login({ email, password })
    .then(() => {
      this.onSuccess();
    })
    .catch((error) => {
      const msg = error.message || 'Не удалось войти';
      this.passwordInput.showError(msg);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Войти';
      }
    })
    .finally(() => {
      if (submitButton && !this.modalElement) {
        submitButton.disabled = false;
        submitButton.textContent = 'Войти';
      }
    });
}
}