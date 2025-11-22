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
    });

    // А вот тут проверь внимательно!
    this.components.emailInput = new Input({
      id: 'profile-email',
      type: 'email',
      label: 'Почта',
      placeholder: 'Введите почту',
      value: this.user?.email || '', // <--- Передаем email
    });

    this.components.firstNameInput = new Input({
      id: 'profile-firstname',
      label: 'Имя',
      placeholder: 'Введите ваше имя',
      value: this.user?.firstName || '', // <--- Передаем firstName (из ServiceAuth)
    });
      
    this.components.lastNameInput = new Input({
      id: 'profile-lastname',
      label: 'Фамилия',
      placeholder: 'Введите вашу фамилию',
      value: this.user?.lastName || '', // <--- Передаем lastName
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
    const formData = new FormData();
    
    // Важно: input value нужно брать из DOM элемента в момент клика, а не из компонента
    formData.append('user_name', document.getElementById('profile-login')?.value || '');
    formData.append('email', document.getElementById('profile-email')?.value || '');
    formData.append('user_first_name', document.getElementById('profile-firstname')?.value || ''); // ИСПРАВЛЕНО под бэкенд
    formData.append('user_second_name', document.getElementById('profile-lastname')?.value || ''); // ИСПРАВЛЕНО под бэкенд
    formData.append('company', document.getElementById('profile-company')?.value || '');
    formData.append('phone_number', document.getElementById('profile-phone')?.value || ''); // ИСПРАВЛЕНО под бэкенд
    
    const password = document.getElementById('profile-password')?.value;
    if (password) {
      formData.append('password', password);
    }
if (this.selectedFile) {
  // Верни 'img', так как это стандартное имя для этого бэкенда
  formData.append('image', this.selectedFile); 
}
      
        try {
      // updateProfile УЖЕ возвращает обновленного пользователя (сделав 1-й GET запрос)
      const updatedUser = await AuthService.updateProfile(formData);
      
      // ВМЕСТО ТОГО ЧТОБЫ ДЕЛАТЬ router.loadRoute() (который вызовет 2-й GET),
      // мы просто обновляем this.user и перерисовываем страницу вручную 
      // или просто показываем уведомление, так как данные в инпутах и так уже новые (ты же их только что ввела).
      
      this.user = updatedUser; 
      
      // Вариант А: Просто показать уведомление (самый экономный)
      // router.loadRoute() НЕ ВЫЗЫВАЕМ.
      new ConfirmationModal({ message: "Данные сохранены!", onConfirm: () => {} }).show();

      // Вариант Б: Если очень хочется обновить картинку/шапку:
      // Можно обновить хедер вручную:
      //if (window.header) window.header.update(this.user);
      
      
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      alert('Не удалось сохранить изменения');
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