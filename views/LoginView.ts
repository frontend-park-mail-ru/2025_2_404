import LoginPage from '../pages/login/LoginPage';
import MainPage from '../pages/main/MainPage';
import type Router from '../services/Router';

let routerInstance: Router | null = null;

export function setLoginViewRouter(r: Router): void {
  routerInstance = r;
}

export default class LoginView {
  loginPage: LoginPage | null = null;

  constructor() {}

  async render(): Promise<void> {
    this.loginPage = new LoginPage({
      onSuccess: () => {
        routerInstance?.navigate('/');
      },
      onCancel: () => {
        this.loginPage?.hide();
      },
      onSwitchToRegister: () => {
        this.loginPage?.hide();
      }
    });
    await this.loginPage.init();
    this.loginPage.show();
    
    const mainPage = new MainPage();
    await mainPage.loadTemplate();
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = await mainPage.render();
    }
  }

  clear(): void {
    if (this.loginPage) {
      this.loginPage.hide();
    }
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
    }
  }
}
