import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import AuthService from '../../services/ServiceAuthentification';
import ConfirmationModal from '../components/ConfirmationModal';
import type { HandlebarsTemplateDelegate, User, PageComponent } from '../../src/types';
import type Router from '../../services/Router';

let routerInstance: Router | null = null;

export function setRouter(r: Router): void {
  routerInstance = r;
}

interface ProfileComponents {
  loginInput?: Input;
  emailInput?: Input;
  passwordInput?: Input;
  firstNameInput?: Input;
  lastNameInput?: Input;
  companyInput?: Input;
  phoneInput?: Input;
  roleSelect?: Select;
  saveButton?: Button;
  deleteButton?: Button;
  logoutButton?: Button;
}

export default class ProfilePage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  user: User | null = null;
  components: ProfileComponents = {};
  selectedFile: File | null = null;
  handleFileChange: (event: Event) => void;
  toggleEditMode: (show: boolean) => void;

  constructor() {
    this.handleFileChange = this._handleFileChange.bind(this);
    this.toggleEditMode = this._toggleEditMode.bind(this);
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    try {
      const response = await fetch('/pages/profile/ProfilePage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон страницы профиля');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Ошибка загрузки профиля</h1>');
    }
  }

  initComponents(): void {
    try {
      this.components.loginInput = new Input({
        id: 'profile-login',
        label: 'Логин',
        placeholder: 'ivan.petrov',
        value: this.user?.username || '',
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

      this.components.emailInput = new Input({
        id: 'profile-email',
        type: 'email',
        label: 'Почта',
        placeholder: 'ivan.petrov@example.com',
        value: this.user?.email || '',
        validationFn: (value: string): string | null => {
          value = value.trim();
          if (!value) return 'Email обязателен для заполнения';
          if (value.length > 100) return 'Почта слишком длинная, введите другую';
          const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) return 'Введите корректный email';
          return null;
        },
      });

      // this.components.passwordInput = new Input({
      //   id: 'profile-password',
      //   label: 'Новый пароль',
      //   placeholder: 'Оставьте пустым, если не меняете',
      //   type: 'password',
      //   showPasswordToggle: true,
      //   validationFn: (value: string): string | null => {
      //     value = value.trim();
      //     // Пароль опционален при редактировании профиля
      //     if (!value) return null;
      //     if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
      //     if (value.length > 100) return 'Пароль слишком длинный';
      //     const hasUpperCase = /[A-Z]/.test(value);
      //     const hasLowerCase = /[a-z]/.test(value);
      //     if (!hasUpperCase || !hasLowerCase) return 'Пароль должен содержать буквы разного регистра';
      //     const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      //     if (!hasSpecialChar) return 'Пароль должен содержать хотя бы один спецсимвол';
      //     return null;
      //   },
      // });

      this.components.firstNameInput = new Input({
        id: 'profile-firstname',
        label: 'Имя',
        placeholder: 'Иван',
        value: this.user?.firstName || '',
        validationFn: (value: string): string | null => {
          value = value.trim();
          if (!value) return null;
          if (value.length < 2) return 'Имя должно содержать минимум 2 символа';
          if (value.length > 50) return 'Имя слишком длинное';
          // Должна быть хотя бы одна буква
          if (!/[a-zA-Zа-яА-ЯёЁ]/.test(value)) return 'Имя должно содержать хотя бы одну букву';
          // Разрешены только буквы, пробелы и дефисы
          if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Имя может содержать только буквы и дефисы';
          // Дефис не в начале/конце и не несколько подряд
          if (/^-|-$|--/.test(value)) return 'Некорректное использование дефиса';
          return null;
        },
      });

      this.components.lastNameInput = new Input({
        id: 'profile-lastname',
        label: 'Фамилия',
        placeholder: 'Петров',
        value: this.user?.lastName || '',
        validationFn: (value: string): string | null => {
          value = value.trim();
          if (!value) return null;
          if (value.length < 2) return 'Фамилия должна содержать минимум 2 символа';
          if (value.length > 50) return 'Фамилия слишком длинная';
          // Должна быть хотя бы одна буква
          if (!/[a-zA-Zа-яА-ЯёЁ]/.test(value)) return 'Фамилия должна содержать хотя бы одну букву';
          // Разрешены только буквы, пробелы и дефисы
          if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Фамилия может содержать только буквы и дефисы';
          // Дефис не в начале/конце и не несколько подряд
          if (/^-|-$|--/.test(value)) return 'Некорректное использование дефиса';
          return null;
        },
      });

      this.components.companyInput = new Input({
        id: 'profile-company',
        label: 'Компания',
        placeholder: 'ООО «Ромашка»',
        value: this.user?.company || '',
        validationFn: (value: string): string | null => {
          value = value.trim();
          if (value && value.length > 100) return 'Название компании слишком длинное';
          return null;
        },
      });

      this.components.phoneInput = new Input({
        id: 'profile-phone',
        label: 'Номер телефона',
        placeholder: '+7-900-123-45-67',
        type: 'tel',
        value: this.user?.phone || '',
        validationFn: (value: string): string | null => {
          value = value.trim();
          if (!value) return null;
          // Формат: (+7 или 8)-XXX-XXX-XX-XX (тире обязательны)
          const phoneRegex = /^(\+7|8)-\d{3}-\d{3}-\d{2}-\d{2}$/;
          if (!phoneRegex.test(value)) {
            return 'Формат: +7-XXX-XXX-XX-XX или 8-XXX-XXX-XX-XX';
          }
          return null;
        },
      });

      this.components.roleSelect = new Select({
        id: 'user-role',
        label: 'Тип аккаунта',
        options: [
          { value: 'advertiser', text: 'Рекламодатель' },
          { value: 'publisher', text: 'Рекламораспространитель' }
        ],
        value: this.user?.role || 'advertiser',
      });

      this.components.saveButton = new Button({
        id: 'profile-save',
        text: 'Сохранить изменения',
        variant: 'primary',
        onClick: () => this.handleSave(),
      });

      this.components.deleteButton = new Button({
        id: 'profile-delete',
        text: 'Удалить аккаунт',
        variant: 'danger',
        onClick: () => this.handleDelete(),
      });

      this.components.logoutButton = new Button({
        id: 'profile-logout',
        text: 'Выйти',
        variant: 'secondary',
        onClick: () => this.handleLogout(),
      });
    } catch (error) {
      console.error('Ошибка при инициализации компонентов:', error);
    }
  }

  async render(): Promise<string> {
    await this.loadTemplate();
    
    this.user = AuthService.getUser();
    if (!this.user) {
      try {
        this.user = await AuthService.loadProfile();
      } catch (e) {
        console.error("Не удалось загрузить профиль", e);
      }
    }

    if (!this.user) {
      routerInstance?.navigate('/');
      return '<div>Вы не авторизованы. Перенаправление...</div>';
    }

    this.initComponents();
    const roleText = this.user?.role === 'advertiser' ? 'Рекламодатель' : 'Рекламораспространитель';
    const rawUser = this.user as any;
    const adCount = rawUser.ads_count !== undefined ? rawUser.ads_count : 0;
    let registrationDate = '—';
    if (rawUser.created_at) {
        registrationDate = new Date(rawUser.created_at).toLocaleDateString('ru-RU');
    }


    const context = {
      ...this.user,
      avatar: this.user.avatar,
      roleText,
      adCount,
      registrationDate, 
      loginInputHtml: this.components.loginInput?.render() || '',
      emailInputHtml: this.components.emailInput?.render() || '',
      passwordInputHtml: this.components.passwordInput?.render() || '',
      firstNameInputHtml: this.components.firstNameInput?.render() || '',
      lastNameInputHtml: this.components.lastNameInput?.render() || '',
      companyInputHtml: this.components.companyInput?.render() || '',
      phoneInputHtml: this.components.phoneInput?.render() || '',
      roleSelectHtml: this.components.roleSelect?.render() || '',
      saveButtonHtml: this.components.saveButton?.render() || '',
      deleteButtonHtml: this.components.deleteButton?.render() || '',
      logoutButtonHtml: this.components.logoutButton?.render() || ''
    };
    return this.template ? this.template(context) : '';
  }

  private _handleFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      
      // Валидация типа файла
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.showAvatarError('Поддерживаются только JPG, PNG или GIF');
        target.value = '';
        return;
      }
      
      // Валидация размера файла (максимум 5 МБ)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showAvatarError('Файл слишком большой. Максимум 5 МБ');
        target.value = '';
        return;
      }
      
      this.clearAvatarError();
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewElement = document.getElementById('profile-avatar-preview') as HTMLImageElement | null;
        if (previewElement && e.target?.result) {
          previewElement.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  private showAvatarError(message: string): void {
    let errorEl = document.getElementById('avatar-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'avatar-error';
      errorEl.className = 'error-message';
      errorEl.style.color = 'red';
      const uploadLabel = document.querySelector('.profile__button-upload');
      if (uploadLabel) {
        uploadLabel.parentNode?.insertBefore(errorEl, uploadLabel.nextSibling);
      }
    }
    errorEl.textContent = message;
  }

  private clearAvatarError(): void {
    const errorEl = document.getElementById('avatar-error');
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  private _toggleEditMode(show: boolean): void {
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');

    if (viewMode && editMode) {
      if (show) {
        viewMode.classList.add('is-hidden');
        editMode.classList.add('is-active');
      } else {
        viewMode.classList.remove('is-hidden');
        editMode.classList.remove('is-active');
      }
    }
  }

  attachEvents(): void {
    Object.values(this.components).forEach(component => {
      if (component && 'attachEvents' in component && typeof component.attachEvents === 'function') {
        component.attachEvents();
      }
      if (component && 'attachValidationEvent' in component && typeof component.attachValidationEvent === 'function') {
        component.attachValidationEvent();
      }
    });

    const fileInput = document.getElementById('profile-avatar-upload');
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileChange);
    }

    const editBtn = document.getElementById('profile-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.toggleEditMode(true));
    }

    const backBtn = document.getElementById('profile-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.toggleEditMode(false));
    }
  }

  async handleSave(): Promise<void> {
    let isValidated = true;
    const loginEl = document.getElementById('profile-login') as HTMLInputElement | null;
    const emailEl = document.getElementById('profile-email') as HTMLInputElement | null;
    const passwordEl = document.getElementById('profile-password') as HTMLInputElement | null;
    const firstNameEl = document.getElementById('profile-firstname') as HTMLInputElement | null;
    const lastNameEl = document.getElementById('profile-lastname') as HTMLInputElement | null;
    const companyEl = document.getElementById('profile-company') as HTMLInputElement | null;
    const phoneEl = document.getElementById('profile-phone') as HTMLInputElement | null;

    const loginValue = loginEl?.value || '';
    const emailValue = emailEl?.value || '';
    const passwordValue = passwordEl?.value || '';
    const firstNameValue = firstNameEl?.value || '';
    const lastNameValue = lastNameEl?.value || '';
    const companyValue = companyEl?.value || '';
    const phoneValue = phoneEl?.value || '';

    if (this.components.loginInput?.validate(loginValue)) isValidated = false;
    if (this.components.emailInput?.validate(emailValue)) isValidated = false;
    if (this.components.passwordInput?.validate(passwordValue)) isValidated = false;
    if (this.components.firstNameInput?.validate(firstNameValue)) isValidated = false;
    if (this.components.lastNameInput?.validate(lastNameValue)) isValidated = false;
    if (this.components.companyInput?.validate(companyValue)) isValidated = false;
    if (this.components.phoneInput?.validate(phoneValue)) isValidated = false;

    if (!isValidated) {
      return;
    }

    const formData = new FormData();
    formData.append('user_name', loginValue);
    formData.append('email', emailValue);
    formData.append('first_name', firstNameValue);
    formData.append('last_name', lastNameValue);
    formData.append('phone', phoneValue);
    formData.append('company', companyValue);

    // Отправляем пароль только если он был введён
    if (passwordValue.trim()) {
      formData.append('password', passwordValue);
    }

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    try {
      const updatedUser = await AuthService.updateProfile(formData);
      this.user = updatedUser;
      new ConfirmationModal({ message: "Данные сохранены!", onConfirm: () => {} }).show();
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      this.components.loginInput?.showError('Не удалось сохранить изменения. Попробуйте позже.');
    }
  }

  handleDelete(): void {
    const modal = new ConfirmationModal({
      message: `Вы уверены, что хотите удалить аккаунт ${this.user?.username || 'пользователя'}?`,
      onConfirm: () => {
        AuthService.deleteAccount().then(() => {
          routerInstance?.navigate('/');
        });
      },
    });
    modal.show();
  }

  handleLogout(): void {
    AuthService.logout();
    routerInstance?.navigate('/');
  }
}