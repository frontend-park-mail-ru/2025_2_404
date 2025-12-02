import AuthService from '../../services/ServiceAuthentification.js';

export default class Header {

  #updating = false;
  constructor() {
    this.header = document.createElement('header');
    this.header.classList.add('header');
    document.body.prepend(this.header);
    this.template = null;
    this.lastUser = null;
    this.lastAuthState = null;
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

  buildNavItems(isAuthenticated) {
    return [
      {
        title: 'Агенства',
        items: [
          { href: '#', text: 'Список агенств' }
        ]
      },
      {
        title: 'Специалисты',
        items: [
          { href: '#', text: 'Список специалистов' }
        ]
      },
      {
        title: 'Проекты',
        items: [
          {
            href: isAuthenticated ? '/projects' : '#',
            text: 'Мои проекты',
            id: isAuthenticated ? null : 'login-for-projects-btn'
          }
        ]
      }
    ];
  }



  async update() {
    if (this.#updating) return;
    this.#updating = true;


    try {
      await this.loadTemplate();
      if (!this.template) {
        return;
      }
  
      let isAuthenticated = AuthService.isAuthenticated();
      let user = null;
  
      if (isAuthenticated) {
        try {
          user = await AuthService.loadProfile();
          if (user) {
            user = {
              username: user.username ?? user.user_name ?? "",
              avatar: user.avatar || "/kit.jpg",
            };
          }
        } catch {
          AuthService.logout();
          isAuthenticated = false;
        }
      }
  
      const sameAuth = this.lastAuthState === isAuthenticated;
      const sameUser = JSON.stringify(this.lastUser) === JSON.stringify(user);
  
      if (sameAuth && sameUser) {
        return;
      }
  
      this.lastAuthState = isAuthenticated;
      this.lastUser = user;
  
      // this.header.innerHTML = this.template({ isAuthenticated, user });
      const navItems = this.buildNavItems(isAuthenticated);
      this.header.innerHTML = this.template({ isAuthenticated, user, navItems });

    } catch(error){
      console.log(error);
    } finally{
      this.#updating = false;
    }
  
  }


  resetCache() {
    this.lastAuthState = null;
    this.lastUser = null;
  }

}
