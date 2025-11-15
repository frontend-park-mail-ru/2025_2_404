import RegisterPage from '../pages/register/Register.js';
import MainPage from '../pages/main/MainPage.js';
import Router from '../services/Router.js';

export default class RegisterView {
  constructor() {
    this.registerPage = null;
  }

  async render() {
    this.registerPage = new RegisterPage(() => {
      Router.navigate('/');
    });
    await this.registerPage.init();
    this.registerPage.show();
    const mainPage = new MainPage();
    await mainPage.loadTemplate();
    const app = document.getElementById('app');
    app.innerHTML = mainPage.render();
  }
  clear() {
    if (this.registerPage) {
      this.registerPage.hide();
    }
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
    }
  }
}
