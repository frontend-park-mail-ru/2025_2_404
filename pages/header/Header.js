import AuthService from '../../services/ServiceAuthentification.js';

export default class Header {
  constructor() {
    this.header = document.createElement('header');
    document.body.prepend(this.header);
  }

  async loadTemplate() {
    const response = await fetch('/pages/header/header.hbs');
    if (!response.ok) {
      throw new Error('Не удалось загрузить хедер');
    }
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }
  render() {
    const user = AuthService.getUser();
    const context = {
      isAuthenticated: AuthService.isAuthenticated(),
      user: user,
    };
    this.header.innerHTML = this.template(context);
    this.attachEvents();
  }
  showLogoutError() {
      const message = 'Ошибка: Невозможно выйти из аккаунта (тестовый режим)';
      const errorDiv = document.createElement('div');
      errorDiv.textContent = message;
      errorDiv.id = 'logout-error-message';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #dad4d4ff;
        border-color:  #7C54E8;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    }

    attachEvents() {
      const logoutButton = this.header.querySelector('#logout-btn');
      if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
          e.preventDefault();

          this.showLogoutError(); 
        });
    }
  }
}
