// import { router } from '../../main.js';
// import supportRepository from '../../public/repository/supportRepository.js';

// export default class AppealPage {
//   constructor() {
//     this.template = null;
//   }

//   async loadTemplate() {
//     if (this.template) return;
//     const response = await fetch('/pages/appeal/AppealPage.hbs');
//     this.template = Handlebars.compile(await response.text());
//   }

//   async render() {
//     await this.loadTemplate();

//     try {
//       const appeals = await supportRepository.getAll();

//       return this.template({
//         appeals,
//         error: null,
//       });
//     } catch (err) {
//       console.error('Ошибка при загрузке обращений:', err);
//       return this.template({
//         appeals: [],
//         error: 'Не удалось загрузить обращения. Попробуйте позже.',
//       });
//     }
//   }

//   attachEvents() {
//     document.querySelectorAll('.appeal-card').forEach((card) => {
//       card.addEventListener('click', () => {
//         const id = card.dataset.id;
//         if (id) {
//           router.navigate(`/support/${id}`);
//         }
//       });
//     });
//   }
// }


import { router } from '../../main.js';
import supportRepository from '../../public/repository/supportRepository.js';

export default class AppealPage {
  constructor() {
    this.template = null;
  }

  async loadTemplate() {
    if (this.template) return;
    const response = await fetch('/pages/appeal/AppealPage.hbs');
    this.template = Handlebars.compile(await response.text());
  }

  async render() {
    await this.loadTemplate();

    try {
      // по умолчанию показываем МОИ обращения
      const appeals = await supportRepository.getAll();

      return this.template({
        appeals,
        error: null,
      });
    } catch (err) {
      console.error('Ошибка при загрузке обращений:', err);
      return this.template({
        appeals: [],
        error: 'Не удалось загрузить обращения. Попробуйте позже.',
      });
    }
  }

  async switchToAllUsersView() {
    try {
      const appeals = await supportRepository.getAllForAllUsers();

      const container = document.querySelector('.appeals');
      if (!container) return;

      // перерисовываем ту же страницу, но уже с обращениями всех пользователей
      container.innerHTML = this.template({
        appeals,
        error: null,
      });

      // после innerHTML нужно заново навесить обработчики
      this.attachEvents();
    } catch (err) {
      console.error('Ошибка при загрузке обращений всех пользователей:', err);
      // тут можно потом добавить красивый вывод ошибки на страницу
    }
  }

  attachEvents() {
    // переход на страницу конкретного обращения
    document.querySelectorAll('.appeal-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (id) {
          router.navigate(`/support/${id}`);
        }
      });
    });

    // кнопка "Посмотреть обращения всех пользователей"
    const allBtn = document.getElementById('appeals-all-btn');
    if (allBtn) {
      allBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchToAllUsersView();
      });
    }
  }
}
