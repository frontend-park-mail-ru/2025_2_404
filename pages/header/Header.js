import AuthService from '../../services/ServiceAuthentification.js';

export default class Header {
  constructor() {
    this.header = document.createElement('header');
    this.header.classList.add('header');
    this.template = null;
    this.lastUser = null;
    this.lastAuthState = null;
    this._updating = false;
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

  render() {
    return this.header;
  }

  async update(userData = null) {
    if (this._updating) return;
    this._updating = true;

    await this.loadTemplate();
    if (!this.template) {
      this._updating = false;
      return;
    }

    let isAuthenticated = AuthService.isAuthenticated();
    let user = userData;
    if (isAuthenticated && !user) {
        user = AuthService.getUser(); 
        if (!user) {
            try {
                user = await AuthService.loadProfile();
            } catch {
                AuthService.logout();
                isAuthenticated = false;
            }
        }
    }
    
    if (user) {
         user = {
            username: user.username ?? user.user_name ?? "",
            avatar: user.avatar || "/kit.jpg",
         };
    }
    const sameAuth = this.lastAuthState === isAuthenticated;
    const sameUser = JSON.stringify(this.lastUser) === JSON.stringify(user);

    if (sameAuth && sameUser) {
      this._updating = false;
      return;
    }

    this.lastAuthState = isAuthenticated;
    this.lastUser = user;

    this.header.innerHTML = this.template({ isAuthenticated, user });
    this._updating = false;
  }

  resetCache() {
    this.lastAuthState = null;
    this.lastUser = null;
  }
}