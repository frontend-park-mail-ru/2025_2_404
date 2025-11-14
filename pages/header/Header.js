// import AuthService from '../../services/ServiceAuthentification.js';

// export default class Header {
//   constructor() {
//     this.header = document.createElement('header');
//     this.header.classList.add('header');
//     document.body.prepend(this.header);
//     this.template = null;
//   }

//   async loadTemplate() {
//     if (this.template) return;
//     try {
//       const response = await fetch('/pages/header/header.hbs');
//       if (!response.ok) throw new Error('Failed to load header');
//       this.template = Handlebars.compile(await response.text());
//     } catch (error) {
//       console.error(error);
//       this.header.innerHTML = '<p>Ошибка загрузки хедера</p>';
//     }
//   }

//   // единая версия update
//   async update() {
//     await this.loadTemplate();
//     if (!this.template) return;

//     let isAuthenticated = AuthService.isAuthenticated();
//     let user = null;

//     if (isAuthenticated) {
//       try {
//         // централизованно берём профиль (как в ProfilePage)
//         user = await AuthService.loadProfile();
//         if (user) {
//           user = {
//             username: user.username ?? user.user_name ?? '',
//             avatar: user.avatar || '/kit.jpg',
//           };
//         }
//       } catch (err) {
//         console.error('Ошибка загрузки данных для хедера (возможно, токен истёк)', err);
//         AuthService.logout();
//         isAuthenticated = false;
//       }
//     }

//     this.header.innerHTML = this.template({ isAuthenticated, user });
//   }
// }

import AuthService from '../../services/ServiceAuthentification.js';

export default class Header {
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

  async update() {
    await this.loadTemplate();
    if (!this.template) return;

    let isAuthenticated = AuthService.isAuthenticated();
    let user = null;

    if (isAuthenticated) {
      try {
        user = await AuthService.loadProfile();
        if (user) {
          user = {
            username: user.username ?? user.user_name ?? '',
            avatar: user.avatar || '/kit.jpg',
          };
        }
      } catch (err) {
        console.error('Ошибка загрузки данных для хедера (возможно, токен истёк)', err);
        AuthService.logout();
        isAuthenticated = false;
      }
    }

    const sameAuth = this.lastAuthState === isAuthenticated;
    const sameUser =
      JSON.stringify(this.lastUser) === JSON.stringify(user);

    // if (sameAuth && sameUser) {
    //   return;
    // }
    if (sameAuth && sameUser && isAuthenticated) return;


    // обновляем кеш состояния
    this.lastAuthState = isAuthenticated;
    this.lastUser = user;

    this.header.innerHTML = this.template({ isAuthenticated, user });
  }

  resetCache() {
  this.lastAuthState = null;
  this.lastUser = null;
}

}
