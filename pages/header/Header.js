import AuthService from '../../services/ServiceAuthentification.js';

export default class Header {
  constructor() {
    this.header = document.createElement('header');
    document.body.prepend(this.header);
    this.template = null;
  }

  async loadTemplate() {
    if (this.template) return;
    try {
      const response = await fetch('/pages/header/header.hbs');
      if (!response.ok) throw new Error('Failed to load header');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.header.innerHTML = '<p>Ошибка загрузки хедера</p>';
    }
  }
  update() {
    if (!this.template) return;
    const user = AuthService.getUser();
    const context = {
      isAuthenticated: AuthService.isAuthenticated(),
      user: user,
    };
    this.header.innerHTML = this.template(context);
  }
}