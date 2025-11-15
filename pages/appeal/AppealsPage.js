// pages/appeal/AppealsPage.js
import { router } from '../../main.js';
import supportRepository from '../../public/repository/supportRepository.js';

export default class AppealsPage {
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
      const appeals = await supportRepository.getAllForAllUsers();

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

  attachEvents() {
    document.querySelectorAll('.appeal-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (id) {
          router.navigate(`/support/${id}`);
        }
      });
    });
  }
}
