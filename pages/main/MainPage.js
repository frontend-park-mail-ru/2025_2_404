export default class MainPage {
  constructor() {
    this.template = null;
  }
  async loadTemplate() {
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
  async render() {
    await this.loadTemplate();
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