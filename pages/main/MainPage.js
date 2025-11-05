import AuthService from '../../services/ServiceAuthentification.js';
import { router } from '../../main.js';

export default class MainPage {
  constructor() {
    this.template = null;
  }

  async loadTemplate() {
    if (AuthService.isAuthenticated()) {
        return;
    }
    const mainResponse = await fetch('/pages/main/MainPage.hbs');
    if (!mainResponse.ok) {
      throw new Error('Ошибка загрузки главной страницы');
    }
    const mainText = await mainResponse.text();
    this.template = Handlebars.compile(mainText);
  }

  render() {
    if (AuthService.isAuthenticated()) {
      router.navigate('/projects');
      return '<div>Перенаправление в ваши проекты...</div>';
    }

    if (!this.template) {
      return '<div>Загрузка страницы...</div>';
    }
    return this.template();
  }

  attachEvents() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        item.classList.toggle('active');
      });
    });
  }
}
