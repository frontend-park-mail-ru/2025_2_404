import RegisterPage from './pages/register/Register.js';
import LoginPage from './pages/login/LoginPage.js';
import AuthService from './services/ServiceAuthentification.js';
import Header from './pages/header/Header.js';
import Footer from './pages/footer/Footer.js';
import Router from './services/Router.js';

class App {
  constructor() {
    this.header = new Header();
    this.modals = {};
    this.footer = new Footer();
    this.currentMod = null;
    window.app = this;
  }
  async start() {
    await this.header.loadTemplate();
    this.header.render();
    AuthService.onAuthChange(() => {
      this.header.render();
      if (!AuthService.isAuthenticated()) {
        this.closeMod();
      }
    });
    this.modals.register = new RegisterPage(() => Router.navigate('/'));
    this.modals.login = new LoginPage(() => Router.navigate('/'));
    await this.modals.register.init();
    await this.modals.login.init();

    Router.start();

    await this.footer.loadTemplate();
    const footerElement = this.footer.render();
    document.body.appendChild(footerElement);
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';

    if (this.currentMod) {
      this.currentMod.hide();
      this.currentMod = null;
    }

    if (hash === '/register') {
      this.currentMod = this.modals.register;
      this.currentMod.show();
    } else if (hash === '/login') {
      this.currentMod = this.modals.login;
      this.currentMod.show();
    }
  }

  closeMod() {
    Router.navigate('/');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start().then(() => {
    if (!window.location.hash) {
      Router.navigate('/register');
    }
  });
});
