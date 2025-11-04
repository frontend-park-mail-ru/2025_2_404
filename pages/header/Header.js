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
      if (!response.ok) {
        throw new Error('Failed to load header');
      }
      const templateText = await response.text();
      this.template = Handlebars.compile(templateText);
    } catch (error) {
      console.error(error);
      this.header.innerHTML = '<p style="color: red; text-align: center;">Error loading header</p>';
    }
  }

  render() {
    if (!this.template) {
        this.header.innerHTML = '<div>Loading header...</div>';
        return;
    }
    const user = AuthService.getUser();
    const context = {
      isAuthenticated: AuthService.isAuthenticated(),
      user: user,
    };
    this.header.innerHTML = this.template(context);

    const avatar = this.header.querySelector('.avatar');
    if (avatar) {
      avatar.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/profile');
        window.dispatchEvent(new Event('popstate'));
      });
    }
  }
}