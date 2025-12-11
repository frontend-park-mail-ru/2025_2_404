import Input from '../components/Input';
import Button from '../components/Button';
import AuthService from '../../services/ServiceAuthentification';
import type { RegisterPageProps, HandlebarsTemplateDelegate, HttpError } from '../../src/types';

export default class RegisterPage {
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToLogin: () => void;
  modalEl: HTMLElement | null = null;
  template: HandlebarsTemplateDelegate | null = null;
  loginInput: Input;
  emailInput: Input;
  passwordInput: Input;
  passwordCheckInput: Input;
  submitButton: Button;

  constructor({ onSuccess, onCancel, onSwitchToLogin }: RegisterPageProps) {
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;
    this.onSwitchToLogin = onSwitchToLogin;

    this.loginInput = new Input({
      id: 'login',
      label: 'Логин',
      placeholder: 'Введите логин',
      validationFn: (value: string): string | null => {
        value = value.trim();
        if (!value) return 'Логин обязателен для заполнения';
        if (value.length < 4) return 'Логин должен содержать минимум 4 символа';
        if (value.length > 20) return 'Логин должен содержать максимум 20 символов';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Логин может содержать только латиницу, цифры и _';
        const UpperCase = /[A-Z]/.test(value);
        const LowerCase = /[a-z]/.test(value);
        if (!UpperCase && !LowerCase) return 'Логин должен содержать хотя бы одну букву';
        return null;
      },
    });

    this.emailInput = new Input({
      id: 'email',
      label: 'Почта',
      placeholder: 'Введите почту',
      validationFn: (value: string): string | null => {
        value = value.trim();
        if (!value) return 'Email обязателен для заполнения';
        if (value.length > 100) return 'Почта слишком длинная, введите другую';
        const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) return 'Введите корректный email';
        return null;
      },
    });

    this.passwordInput = new Input({
      id: 'password',
      label: 'Пароль',
      placeholder: 'Введите пароль',
      showPasswordToggle: true,
      validationFn: (value: string): string | null => {
        value = value.trim();
        if (!value) return 'Заполните пароль';
        if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
        if (value.length > 100) return 'Пароль слишком длинный';
        const UpperCase = /[A-Z]/.test(value);
        const LowerCase = /[a-z]/.test(value);
        if (!UpperCase || !LowerCase) return 'Пароль должен содержать буквы разного регистра';
        const SpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
        if (!SpecialChar) return 'Пароль должен содержать хотя бы один спецсимвол';
        return null;
      },
    });

    this.passwordCheckInput = new Input({
      id: 'passwordCheck',
      label: 'Повторите пароль',
      placeholder: 'Повторите пароль',
      showPasswordToggle: true,
      validationFn: (value: string): string | null => {
        value = value.trim();
        const passwordEl = document.getElementById('password') as HTMLInputElement | null;
        const passwordValue = passwordEl?.value || '';
        if (!value) return 'Заполните пароль повторно';
        if (value !== passwordValue) return 'Пароли не совпадают';
        return null;
      },
    });

    this.submitButton = new Button({
      id: 'register-submit',
      text: 'Зарегистрироваться',
    });

    this.init();
  }

  async init(): Promise<void> {
    const response = await fetch('/pages/register/register.hbs');
    if (!response.ok) throw new Error('HTTP ошибка ' + response.status);
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }

  render(): string {
    if (!this.template) return '';
    const context = {
      Title: 'Регистрация',
      loginInputHtml: this.loginInput.render(),
      emailInputHtml: this.emailInput.render(),
      passwordInputHtml: this.passwordInput.render(),
      passwordCheckInputHtml: this.passwordCheckInput.render(),
      submitButtonHtml: this.submitButton.render(),
    };
    return this.template(context);
  }

  show(): void {
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.className = 'modal__overlay';
      this.modalEl.innerHTML = this.render();
      document.body.appendChild(this.modalEl);
      this.attachEvents();
    }
    this.modalEl.style.display = 'flex';
  }

  hide(): void {
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
  }

  attachEvents(): void {
    this.modalEl?.querySelector('.close-btn')?.addEventListener('click', this.onCancel);
    
    const form = this.modalEl?.querySelector('#register-form');
    if (form) {
      form.addEventListener('submit', (event) => this.Submit(event));
    }
    const switchBtn = this.modalEl?.querySelector('#switch-to-login-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', this.onSwitchToLogin);
    }
    this.loginInput.attachValidationEvent();
    this.emailInput.attachValidationEvent();
    this.passwordInput.attachValidationEvent();
    this.passwordCheckInput.attachValidationEvent();
  }

  async Submit(event: Event): Promise<void> {
    event.preventDefault();
    let isValidated = true;
    
    const loginEl = document.getElementById(this.loginInput.id) as HTMLInputElement | null;
    const emailEl = document.getElementById(this.emailInput.id) as HTMLInputElement | null;
    const passwordEl = document.getElementById(this.passwordInput.id) as HTMLInputElement | null;
    const passwordCheckEl = document.getElementById(this.passwordCheckInput.id) as HTMLInputElement | null;
    
    const loginValue = loginEl?.value || '';
    const emailValue = emailEl?.value || '';
    const passwordValue = passwordEl?.value || '';
    const passwordCheckValue = passwordCheckEl?.value || '';
    
    if (this.loginInput.validate(loginValue)) isValidated = false;
    if (this.emailInput.validate(emailValue)) isValidated = false;
    if (this.passwordInput.validate(passwordValue)) isValidated = false;
    if (this.passwordCheckInput.validate(passwordCheckValue)) isValidated = false;

    if (!isValidated) {
      return;
    }
    
    try {
      await AuthService.register({
        user_name: loginValue,
        email: emailValue,
        password: passwordValue,
      });
      this.onSuccess();
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      const httpError = error as HttpError;
      if (httpError && httpError.status === 409) {
        this.emailInput.showError('Пользователь с таким email уже существует.');
      } else {
        const generalErrorMessage = (httpError.body as string) || 'Произошла непредвиденная ошибка. Попробуйте позже.';
        this.loginInput.showError(generalErrorMessage);
      }
    }
  }
}
