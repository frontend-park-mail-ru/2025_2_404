import Input from '../components/Input.js';
import Button from '../components/Button.js';
import Select from '../components/Select.js';
import AuthService from '../../services/ServiceAuthentification.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { router } from '../../main.js';

export default class ProfilePage {
  constructor() {
    this.template = null;
    this.user = null;
    this.components = {};
    this.selectedFile = null; 
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  async loadTemplate() {
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

initComponents() {
    // Логин работает, тут все ок
    this.components.loginInput = new Input({
      id: 'profile-login',
      label: 'Логин',
      placeholder: 'Введите логин',
      value: this.user?.username || '',
      validationFn: (value) => {
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

    // А вот тут проверь внимательно!
    this.components.emailInput = new Input({
      id: 'profile-email',
      type: 'email',
      label: 'Почта',
      placeholder: 'Введите почту',
      value: this.user?.email || '',
      validationFn: (value) => {
        value = value.trim();
        if (!value) return 'Email обязателен для заполнения';
        if (value.length > 100) return 'Почта слишком длинная, введите другую';
        const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) return 'Введите корректный email';
        return null;
      },
    });

    this.components.firstNameInput = new Input({
      id: 'profile-firstname',
      label: 'Имя',
      placeholder: 'Введите ваше имя',
      value: this.user?.firstName || '',
      validationFn: (value) => {
        value = value.trim();
        if (!value) return 'Имя обязательно для заполнения';
        if (value.length < 2) return 'Имя должно содержать минимум 2 символа';
        if (value.length > 50) return 'Имя слишком длинное';
        if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Имя может содержать только буквы и дефисы';
        return null;
      },
    });
      
    this.components.lastNameInput = new Input({
      id: 'profile-lastname',
      label: 'Фамилия',
      placeholder: 'Введите вашу фамилию',
      value: this.user?.lastName || '',
      validationFn: (value) => {
        value = value.trim();
        if (!value) return 'Фамилия обязательна для заполнения';
        if (value.length < 2) return 'Фамилия должна содержать минимум 2 символа';
        if (value.length > 50) return 'Фамилия слишком длинная';
        if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Фамилия может содержать только буквы и дефисы';
        return null;
      },
    });

    this.components.companyInput = new Input({
      id: 'profile-company',
      label: 'Компания',
      placeholder: 'Введите название компании',
      value: this.user?.company || '',
      validationFn: (value) => {
        value = value.trim();
        if (value && value.length > 100) return 'Название компании слишком длинное';
        return null;
      },
    });

    this.components.phoneInput = new Input({
      id: 'profile-phone',
      label: 'Номер телефона',
      placeholder: 'Введите ваш номер телефона',
      type: 'tel',
      value: this.user?.phone || '',
      validationFn: (value) => {
        value = value.trim();
        if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) return 'Номер телефона может содержать только цифры, пробелы и символы +-()';
        if (value && value.replace(/\D/g, '').length < 10) return 'Номер телефона должен содержать минимум 10 цифр';
        if (value && value.replace(/\D/g, '').length > 15) return 'Номер телефона слишком длинный';
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
  }

  async render() {
    await this.loadTemplate();
    
    // ИСПРАВЛЕНИЕ ДВОЙНОГО ЗАПРОСА:
    // 1. Сначала пробуем взять данные из памяти (кэша сервиса)
    this.user = AuthService.getUser();

    // 2. Если в памяти пусто (например, мы перешли по прямой ссылке и main.js еще не отработал),
    // или если данных недостаточно - тогда загружаем с сервера.
    if (!this.user) {
        try {
            this.user = await AuthService.loadProfile();
        } catch (e) {
            console.error("Не удалось загрузить профиль", e);
        }
    }

    if (!this.user) {
      router.navigate('/');
      return '<div>Вы не авторизованы. Перенаправление...</div>';
    }

    this.initComponents();
    
    const context = {
      ...this.user,
      // Передаем аватарку явно, чтобы handlebars мог ее подхватить
      avatar: this.user.avatar, 
      
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
    return this.template(context);
  }

  handleFileChange(event) {
    if (event.target.files && event.target.files[0]) {
      this.selectedFile = event.target.files[0];
      
      // Это нужно только для предпросмотра ДО сохранения
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewElement = document.getElementById('profile-avatar-preview');
        if (previewElement) {
          previewElement.src = e.target.result;
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  attachEvents() {
    // Прикрепление событий для инпутов
    Object.values(this.components).forEach(component => {
        if (component && component.attachEvents) {
            component.attachEvents();
        }
    });

    // Обработчик для загрузки файла
    const fileInput = document.getElementById('profile-avatar-upload');
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileChange);
    }
  }

  async handleSave() {
    let isValidated = true;
    
    // Проверяем все поля на валидность
    const loginValue = document.getElementById('profile-login')?.value || '';
    const emailValue = document.getElementById('profile-email')?.value || '';
    const firstNameValue = document.getElementById('profile-firstname')?.value || '';
    const lastNameValue = document.getElementById('profile-lastname')?.value || '';
    const companyValue = document.getElementById('profile-company')?.value || '';
    const phoneValue = document.getElementById('profile-phone')?.value || '';
    
    // Проверяем все поля и показываем ошибки если есть
    if (this.components.loginInput.validate(loginValue)) isValidated = false;
    if (this.components.emailInput.validate(emailValue)) isValidated = false;
    if (this.components.firstNameInput.validate(firstNameValue)) isValidated = false;
    if (this.components.lastNameInput.validate(lastNameValue)) isValidated = false;
    if (this.components.companyInput.validate(companyValue)) isValidated = false;
    if (this.components.phoneInput.validate(phoneValue)) isValidated = false;

    // Если есть ошибки - просто выходим, не показывая alert
    if (!isValidated) {
      return; // Просто выходим из функции, не показывая alert
    }

    const formData = new FormData();
    
    formData.append('user_name', loginValue);
    formData.append('email', emailValue);
    formData.append('user_first_name', firstNameValue);
    formData.append('user_second_name', lastNameValue);
    formData.append('company', companyValue);
    formData.append('phone_number', phoneValue);
    
    if (this.selectedFile) {
      formData.append('img', this.selectedFile);
    }
      
    try {
      const updatedUser = await AuthService.updateProfile(formData);
      this.user = updatedUser; 
      new ConfirmationModal({ message: "Данные сохранены!", onConfirm: () => {} }).show();
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      // Вместо alert можно показать ошибку в форме
      this.components.loginInput.showError('Не удалось сохранить изменения. Попробуйте позже.');
    }
  }
  
  handleDelete() {
    const modal = new ConfirmationModal({
      message: `Вы уверены, что хотите удалить аккаунт ${this.user?.username || 'пользователя'}?`,
      onConfirm: () => {
        AuthService.deleteAccount().then(() => {
          router.navigate('/');
        });
      },
    });
    modal.show();
  }

  handleLogout() {
    AuthService.logout();
    router.navigate('/');
  }
}