// pages/appeal/AppealDetailPage.js
import supportRepository from '../../public/repository/supportRepository.js';

export default class AppealDetailPage {
  constructor(params) {
    // 1) пробуем взять id из params, как делает ProjectDetailPage
    let id = params && params.id;

    // 2) запасной вариант — берём из URL /support/1
    if (!id) {
      const segments = window.location.pathname.split('/').filter(Boolean);
      // ['support', '1'] → берём последний элемент
      id = segments[segments.length - 1];
    }

    this.id = id;
    this.template = null;

    // оставь, пока дебажим:
    console.log('[AppealDetailPage] id =', this.id);
  }

  async loadTemplate() {
    if (this.template) return;
    const response = await fetch('/pages/appeal/AppealDetailPage.hbs');
    this.template = Handlebars.compile(await response.text());
  }

  async render() {
    await this.loadTemplate();

    try {
      const appeal = await supportRepository.getById(this.id);

      return this.template({
        appeal,
        error: null,
      });
    } catch (err) {
      console.error('Ошибка при загрузке обращения:', err);
      return this.template({
        appeal: null,
        error: 'Не удалось загрузить обращение.',
      });
    }
  }

  attachEvents() {}
}
