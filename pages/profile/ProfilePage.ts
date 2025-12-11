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
        placeholder: 'Введите логин',
      });

      this.components.emailInput = new Input({
        id: 'profile-email',
        type: 'email',
        label: 'Почта',
        placeholder: 'Введите почту',
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
      });

      this.components.lastNameInput = new Input({
        id: 'profile-lastname',
        label: 'Фамилия',
        placeholder: 'Введите вашу фамилию',
      });

      this.components.companyInput = new Input({
        id: 'profile-company',
        label: 'Компания',
        placeholder: 'Введите название компании',
      });

      this.components.phoneInput = new Input({
        id: 'profile-phone',
        label: 'Номер телефона',
        placeholder: 'Введите ваш номер телефона',
        type: 'tel',
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
    this.user = await AuthService.loadProfile();

    if (!this.user) {
      routerInstance?.navigate('/');
      return '<div>Вы не авторизованы. Перенаправление...</div>';
    }

    this.initComponents();
    const roleText = this.user?.role === 'advertiser' ? 'Рекламодатель' : 'Рекламораспространитель';
    const context = {
      ...this.user,
      roleText,
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
      this.selectedFile = target.files[0];
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
    const componentKeys: (keyof ProfileComponents)[] = [
      'loginInput', 'emailInput', 'passwordInput', 'firstNameInput',
      'lastNameInput', 'companyInput', 'phoneInput', 'roleSelect',
      'saveButton', 'deleteButton', 'logoutButton'
    ];

    componentKeys.forEach(key => {
      const component = this.components[key];
      if (component && 'attachEvents' in component && typeof component.attachEvents === 'function') {
        component.attachEvents();
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
    const formData = new FormData();
    const loginEl = document.getElementById('profile-login') as HTMLInputElement | null;
    const emailEl = document.getElementById('profile-email') as HTMLInputElement | null;
    const passwordEl = document.getElementById('profile-password') as HTMLInputElement | null;

    formData.append('user_name', loginEl?.value || '');
    formData.append('email', emailEl?.value || '');

    const password = passwordEl?.value;
    if (password) {
      formData.append('password', password);
    }
    if (this.selectedFile) {
      formData.append('img', this.selectedFile);
    }

    try {
      await AuthService.updateProfile(formData);
      routerInstance?.loadRoute();
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
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
