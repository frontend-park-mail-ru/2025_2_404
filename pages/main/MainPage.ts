import type { HandlebarsTemplateDelegate, PageComponent } from '../../src/types';

let showRegisterModalFn: (() => void) | null = null;

export function setShowRegisterModal(fn: () => void): void {
  showRegisterModalFn = fn;
}

export default class MainPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;

  constructor() {}

  async loadTemplate(): Promise<void> {
    if (this.template) {
      return;
    }
    try {
      const response = await fetch('/pages/main/MainPage.hbs');
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблона главной страницы');
      }
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Не удалось загрузить страницу</h1>');
    }
  }

  async render(): Promise<string> {
    await this.loadTemplate();
    return this.template ? this.template({}) : '';
  }

  attachEvents(): void {
    const faqItems = document.querySelectorAll('.landing__faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.landing__faq-question');
      question?.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        item.classList.toggle('active');
      });
    });

    const tryBtn = document.getElementById('try-btn');
    if (tryBtn && showRegisterModalFn) {
      tryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterModalFn!();
      });
    }
  }
}
