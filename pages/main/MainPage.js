export default class MainPage {
  constructor() {
    this.headerTemp = null;
    this.mainTemp = null;
  }
  async loadTemplate() {
    if (this.template) return;
    try {
      const mainResponse = await fetch('/pages/main/MainPage.hbs');
      if (!mainResponse.ok) {
        throw new Error('Ошибка загрузки главной страницы');
      }
      this.template = Handlebars.compile(await mainResponse.text());
    } catch (error) {
        console.error(error);
        this.template = Handlebars.compile('<h1>Ошибка загрузки страницы</h1>');
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
        item.classList.toggle('active');
      });
    });
  }
}
