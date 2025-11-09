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
    try {
      this.components.loginInput = new Input({
        id: 'profile-login',
        label: 'Логин',
        placeholder: 'Введите логин',
        value: this.user?.username || '',
      });

      this.components.emailInput = new Input({
        id: 'profile-email',
        type: 'email',
        label: 'Почта',
        placeholder: 'Введите почту',
        value: this.user?.email || '',
      });

      this.components.passwordInput = new Input({
        id: 'profile-password',
        label: 'Новый пароль',
        placeholder: 'Оставьте пустым, если не меняете',
        type: 'password',
      });

      this.components.firstNameInput = new Input({
        id: 'profile-firstname',
        label: 'Имя',
        placeholder: 'Введите ваше имя',
        value: this.user?.firstName || '',
      });
      
      this.components.lastNameInput = new Input({
        id: 'profile-lastname',
        label: 'Фамилия',
        placeholder: 'Введите вашу фамилию',
        value: this.user?.lastName || '',
      });

      this.components.companyInput = new Input({
        id: 'profile-company',
        label: 'Компания',
        placeholder: 'Введите название компании',
        value: this.user?.company || '',
      });

      this.components.phoneInput = new Input({
        id: 'profile-phone',
        label: 'Номер телефона',
        placeholder: 'Введите ваш номер телефона',
        type: 'tel',
        value: this.user?.phone || '',
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

  async render() {
    await this.loadTemplate();
    this.user = await AuthService.loadProfile();

    if (!this.user) {
      router.navigate('/');
      return '<div>Вы не авторизованы. Перенаправление...</div>';
    }

    this.initComponents();
    const context = {
      ...this.user,
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
    const componentKeys = [
      'loginInput', 'emailInput', 'passwordInput', 'firstNameInput', 
      'lastNameInput', 'companyInput', 'phoneInput', 'roleSelect',
      'saveButton', 'deleteButton', 'logoutButton'
    ];

    componentKeys.forEach(key => {
        const component = this.components[key];
        if (component && component.attachEvents) {
            component.attachEvents();
        }
    });

    const fileInput = document.getElementById('profile-avatar-upload');
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileChange);
    }
  }
  async handleSave() {
    const formData = new FormData();
    formData.append('user_name', document.getElementById('profile-login')?.value || '');
    formData.append('email', document.getElementById('profile-email')?.value || '');
    // formData.append('first_name', document.getElementById('profile-firstname')?.value || '');
    // formData.append('last_name', document.getElementById('profile-lastname')?.value || '');
    
    const password = document.getElementById('profile-password')?.value;
    if (password) {
      formData.append('password', password);
    }
    if (this.selectedFile) {
      formData.append('img', this.selectedFile);
    }
  
    try {
      await AuthService.updateProfile(formData);
      router.loadRoute();
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
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