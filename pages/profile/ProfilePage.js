import Input from '../components/Input.js';
import Button from '../components/Button.js';
import Select from '../components/Select.js';
import AuthService from '../../services/ServiceAuthentification.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { router } from '../../main.js';
import { http } from '../../public/api/http.js';

export default class ProfilePage {
  constructor() {
    this.template = null;
    this.user = null; 
    this.components = {}; 
  }

  async loadTemplate() {
    if (this.template) return;
    try {
      const response = await fetch('/pages/profile/ProfilePage.hbs');
      if (!response.ok) throw new Error('Не удалось загрузить шаблон');
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
        label: 'Пароль',
        placeholder: '********',
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
        onChange: (e) => {
          if (this.user) {
            this.user.role = e.target.value;
          }
        }
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
    if (!AuthService.isAuthenticated()) {
      router.navigate('/');
      return '<div>Доступ запрещен. Перенаправление...</div>';
    }
    
    await this.loadTemplate();

    try {
      const res = await http.get('/profile/');
      const clientData = res.data?.client;
      if (!clientData) throw new Error("Данные клиента не найдены");

      this.user = {
        id: clientData.id,
        username: clientData.user_name,
        email: clientData.email,
        firstName: clientData.firstName || '',
        lastName: clientData.lastName || '',
        company: clientData.company || '',
        phone: clientData.phone || '',
        role: clientData.role || 'advertiser',
        avatar: clientData.avatar || '/kit.jpg'
      };

    } catch (error) {
      console.error("Ошибка при загрузке профиля:", error);
      AuthService.logout();
      router.navigate('/');
      return '<h1>Ошибка загрузки профиля. Попробуйте войти снова.</h1>';
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
  attachEvents() {
    const componentKeys = [
      'loginInput', 'emailInput', 'passwordInput', 'firstNameInput', 
      'lastNameInput', 'companyInput', 'phoneInput', 'roleSelect',
      'saveButton', 'deleteButton', 'logoutButton'
    ];

    componentKeys.forEach(key => {
      const component = this.components[key];
      if (component && component.attachEvents && typeof component.attachEvents === 'function') {
        try {
          component.attachEvents();
        } catch (error) {
          console.error(`Ошибка в attachEvents для ${key}:`, error);
        }
      } else {
        console.warn(`Компонент ${key} не найден или не имеет attachEvents`);
      }
    });
    if (this.components.loginInput && this.components.loginInput.attachValidationEvent) {
      this.components.loginInput.attachValidationEvent();
    }
    if (this.components.emailInput && this.components.emailInput.attachValidationEvent) {
      this.components.emailInput.attachValidationEvent();
    }
  }

   async handleSave() {
    if (!this.user) return;
    const updatedData = {
      user_name: document.getElementById('profile-login')?.value || '',
      email: document.getElementById('profile-email')?.value || '',
      firstName: document.getElementById('profile-firstname')?.value || '',
      lastName: document.getElementById('profile-lastname')?.value || '',
      company: document.getElementById('profile-company')?.value || '',
      phone: document.getElementById('profile-phone')?.value || '',
      role: document.getElementById('user-role')?.value || 'advertiser',
    };
    
    const password = document.getElementById('profile-password')?.value;
    if (password) {
        updatedData.password = password;
    }

    try {
        await http.put('/profile/', updatedData);
        router.loadRoute();

    } catch(error) {
        console.error("Ошибка сохранения профиля:", error);
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