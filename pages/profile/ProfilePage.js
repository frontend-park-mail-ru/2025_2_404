import Input from '../components/Input.js';
import Button from '../components/Button.js';
import Select from '../components/Select.js';
import AuthService from '../../services/ServiceAuthentification.js';
import ConfirmationModal from '../components/ConfirmationModal.js';
import { router, header } from '../../main.js';
import { http } from '../../public/api/http.js';

export default class ProfilePage {
  constructor() {
    this.template = null;
    this.user = null;
    this.components = {};
    this.selectedFile = null; 
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
    this.components = {
      loginInput: new Input({
        id: 'profile-login',
        label: 'Логин',
        placeholder: 'Введите логин',
        value: this.user?.username || '',
      }),
      emailInput: new Input({
        id: 'profile-email',
        type: 'email',
        label: 'Почта',
        placeholder: 'Введите почту',
        value: this.user?.email || '',
      }),
      passwordInput: new Input({
        id: 'profile-password',
        label: 'Новый пароль',
        placeholder: 'Оставьте пустым, чтобы не менять',
        type: 'password',
        showPasswordToggle: true,
      }),
      firstNameInput: new Input({
        id: 'profile-firstname',
        label: 'Имя',
        placeholder: 'Введите ваше имя',
        value: this.user?.firstName || '',
      }),
      lastNameInput: new Input({
        id: 'profile-lastname',
        label: 'Фамилия',
        placeholder: 'Введите вашу фамилию',
        value: this.user?.lastName || '',
      }),
      companyInput: new Input({
        id: 'profile-company',
        label: 'Компания',
        placeholder: 'Введите название компании',
        value: this.user?.company || '',
      }),
      phoneInput: new Input({
        id: 'profile-phone',
        label: 'Номер телефона',
        placeholder: 'Введите ваш номер телефона',
        type: 'tel',
        value: this.user?.phone || '',
      }),
      roleSelect: new Select({
        id: 'user-role',
        label: 'Тип аккаунта',
        options: [
          { value: 'advertiser', text: 'Рекламодатель' },
          { value: 'publisher', text: 'Рекламораспространитель' }
        ],
        value: this.user?.role || 'advertiser',
      }),
      saveButton: new Button({
        id: 'profile-save-btn',
        text: 'Сохранить изменения',
        variant: 'primary',
        onClick: (e) => {
          e.preventDefault();
          this.handleSave();
        },
      }),
      deleteButton: new Button({
        id: 'profile-delete-btn',
        text: 'Удалить аккаунт',
        variant: 'danger',
        onClick: (e) => {
          e.preventDefault();
          this.handleDelete();
        },
      }),
      logoutButton: new Button({
        id: 'profile-logout-btn',
        text: 'Выйти',
        variant: 'secondary',
        onClick: (e) => {
          e.preventDefault();
          this.handleLogout();
        },
      })
    };
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

  // --- ВРЕМЕННОЕ ИСПРАВЛЕНИЕ С ЗАГЛУШКАМИ ---
  this.user = {
    id: clientData.id,
    username: clientData.user_name,
    email: clientData.email,
    // Если поле с бэка не пришло, используем временное значение
    firstName: clientData.firstName || 'Иван',
    lastName: clientData.lastName || 'Иванов',
    company: clientData.company || 'AdNet Inc.',
    phone: clientData.phone || '+7 (999) 123-45-67',
    role: clientData.role || 'advertiser',
    avatar: clientData.img_path || '/kit.jpg'
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
      loginInputHtml: this.components.loginInput.render(),
      emailInputHtml: this.components.emailInput.render(),
      passwordInputHtml: this.components.passwordInput.render(),
      firstNameInputHtml: this.components.firstNameInput.render(),
      lastNameInputHtml: this.components.lastNameInput.render(),
      companyInputHtml: this.components.companyInput.render(),
      phoneInputHtml: this.components.phoneInput.render(),
      roleSelectHtml: this.components.roleSelect.render(),
      saveButtonHtml: this.components.saveButton.render(),
      deleteButtonHtml: this.components.deleteButton.render(),
      logoutButtonHtml: this.components.logoutButton.render()
    };
    
    return this.template(context);
  }
  
  attachEvents() {
    Object.values(this.components).forEach(component => {
      if (component.attachEvents) component.attachEvents();
      if (component.attachValidationEvent) component.attachValidationEvent();
    });
    const avatarUploadInput = document.getElementById('avatar-upload');
    const avatarImage = document.getElementById('profile-avatar-img');

    if (avatarUploadInput && avatarImage) {
      avatarUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          this.selectedFile = file;
          const reader = new FileReader();
          reader.onload = (e) => {
            avatarImage.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  async handleSave() {
    if (!this.user) return;

    const formData = new FormData();
    
    formData.append('user_name', document.getElementById('profile-login')?.value || '');
    formData.append('email', document.getElementById('profile-email')?.value || '');
    formData.append('firstName', document.getElementById('profile-firstname')?.value || '');
    formData.append('lastName', document.getElementById('profile-lastname')?.value || '');
    formData.append('company', document.getElementById('profile-company')?.value || '');
    formData.append('phone', document.getElementById('profile-phone')?.value || '');
    formData.append('role', document.getElementById('user-role')?.value || 'advertiser');
    
    const password = document.getElementById('profile-password')?.value;
    if (password) {
        formData.append('password', password);
    }
    
    if (this.selectedFile) {
        formData.append('img', this.selectedFile, this.selectedFile.name);
    }
    
    try {
      await http.putFormData('/profile/', formData);
      await header.update();
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