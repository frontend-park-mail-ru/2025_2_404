import Input from '../components/Input';
import Button from '../components/Button';
import AuthService from '../../services/ServiceAuthentification';
import type { LoginPageProps, HandlebarsTemplateDelegate } from '../../src/types';

interface LoginError {
  body?: {
    error?: {
      message?: string;
    };
  };
}

export default class LoginPage {
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToRegister: () => void;
  modalElement: HTMLElement | null = null;
  template: HandlebarsTemplateDelegate | null = null;
  loginInput: Input;
  passwordInput: Input;
  submitButton: Button;

  constructor({ onSuccess, onCancel, onSwitchToRegister }: LoginPageProps) {
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;
    this.onSwitchToRegister = onSwitchToRegister;

    this.loginInput = new Input({
      id: 'login-email',
      label: 'Почта',
      placeholder: 'Введите почту',
      validationFn: (value: string): string | null => {
        if (!value.trim()) return 'Это поле обязательно для заполнения';
        return null;
      },
    });
    
    this.passwordInput = new Input({
      id: 'login-password',
      label: 'Пароль',
      placeholder: 'Введите пароль',
      showPasswordToggle: true,
      validationFn: (value: string): string | null => {
        if (!value.trim()) return 'Пароль не может быть пустым';
        return null;
      },
    });
    
    this.submitButton = new Button({
      id: 'login-submit',
      text: 'Войти',
    });
    
    this.init();
  }

  async init(): Promise<void> {
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

  render(): string {
    if (!this.template) return '';
    const context = {
      Title: 'Вход',
      loginInputHtml: this.loginInput.render(),
      passwordInputHtml: this.passwordInput.render(),
      submitButtonHtml: this.submitButton.render(),
    };
    return this.template(context);
  }

  show(): void {
    if (!this.modalElement) {
      this.modalElement = document.createElement('div');
      this.modalElement.className = 'modal__overlay';
      this.modalElement.innerHTML = this.render();
      document.body.appendChild(this.modalElement);
      this.attachEvents();
    }
    this.modalElement.style.display = 'flex';
  }

  hide(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  attachEvents(): void {
    this.modalElement?.querySelector('.close-btn')?.addEventListener('click', this.onCancel);
    const form = this.modalElement?.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', (event) => this.handleSubmit(event));
    }
    const switchBtn = this.modalElement?.querySelector('#switch-to-register-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', this.onSwitchToRegister);
    }
    this.loginInput.attachValidationEvent();
    this.passwordInput.attachValidationEvent();
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    
    const emailEl = document.getElementById(this.loginInput.id) as HTMLInputElement | null;
    const passwordEl = document.getElementById(this.passwordInput.id) as HTMLInputElement | null;
    
    const email = emailEl?.value || '';
    const password = passwordEl?.value || '';
    
    const isEmailValid = !this.loginInput.validate(email);
    const isPasswordValid = !this.passwordInput.validate(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    AuthService.login({ email, password })
      .then(() => {
        this.onSuccess();
      })
      .catch((e: LoginError) => {
        const msg = e?.body?.error?.message || 'Не удалось войти';
        this.passwordInput.showError(msg);
      });
  }
}
