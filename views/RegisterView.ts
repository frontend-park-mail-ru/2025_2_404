import RegisterPage from '../pages/register/Register';
import MainPage from '../pages/main/MainPage';
import type Router from '../services/Router';

let routerInstance: Router | null = null;

export function setRegisterViewRouter(r: Router): void {
  routerInstance = r;
}

export default class RegisterView {
  registerPage: RegisterPage | null = null;

  constructor() {}

  async render(): Promise<void> {
    this.registerPage = new RegisterPage({
      onSuccess: () => {
        routerInstance?.navigate('/');
      },
      onCancel: () => {
        this.registerPage?.hide();
      },
      onSwitchToLogin: () => {
        this.registerPage?.hide();
      }
    });
    await this.registerPage.init();
    this.registerPage.show();
    
    const mainPage = new MainPage();
    await mainPage.loadTemplate();
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = await mainPage.render();
    }
  }

  clear(): void {
    if (this.registerPage) {
      this.registerPage.hide();
    }
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
    }
  }
}
