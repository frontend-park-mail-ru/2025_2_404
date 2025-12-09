import AuthService from '../../services/ServiceAuthentification.js';

export default class Header {
  constructor() {
    this.header = document.createElement('header');
    this.header.classList.add('header');
    this.template = null;
    this.lastUser = null;
    this.lastAuthState = null;
    this._updating = false;
    
    // ВАЖНО: Подписываемся на изменения авторизации
    AuthService.onAuthChange((user) => {
      console.log('🎯 Header получил событие onAuthChange:', user);
      this.update(user);
    });
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
    console.log('🔄 Header.update вызван, userData:', userData);
    console.log('🔑 AuthService.isAuthenticated():', AuthService.isAuthenticated());
    
    if (this._updating) return;
    this._updating = true;

    await this.loadTemplate();
    if (!this.template) {
      this._updating = false;
      return;
    }

    let isAuthenticated = AuthService.isAuthenticated();
    console.log('🔐 isAuthenticated:', isAuthenticated);
    
    let user = userData;
    if (isAuthenticated && !user) {
        user = AuthService.getUser(); 
        console.log('👤 User from AuthService.getUser():', user);
        
        if (!user) {
            try {
                console.log('🔄 Загружаю профиль...');
                user = await AuthService.loadProfile();
                console.log('✅ Профиль загружен для header:', user);
            } catch (error) {
                console.error('❌ Ошибка загрузки профиля для header:', error);
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
         console.log('👤 Форматированный user для шаблона:', user);
    }
    
    const sameAuth = this.lastAuthState === isAuthenticated;
    const sameUser = JSON.stringify(this.lastUser) === JSON.stringify(user);

    console.log('🔄 Проверка изменений:', { 
      sameAuth, 
      sameUser, 
      lastAuthState: this.lastAuthState,
      lastUser: this.lastUser 
    });

    if (sameAuth && sameUser) {
      console.log('⏩ Изменений нет, пропускаю обновление');
      this._updating = false;
      return;
    }

    console.log('🎨 Обновляю header с:', { isAuthenticated, user });
    
    this.lastAuthState = isAuthenticated;
    this.lastUser = user;

    this.header.innerHTML = this.template({ isAuthenticated, user });
    this._updating = false;
    
    console.log('✅ Header обновлен');
  }

  resetCache() {
    console.log('🗑️ Сброс кэша header');
    this.lastAuthState = null;
    this.lastUser = null;
  }
}