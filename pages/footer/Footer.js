export default class Footer {
  constructor() {
    this.footer = document.createElement('footer');
    this.footer.classList.add('footer');
  }
  async loadTemplate() {
    const response = await fetch('/pages/footer/footer.hbs');
    if (!response.ok) {
      throw new Error('Не удалось загрузить футтер');
    }
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }
  render() {
    if (this.template) {
      this.footer.innerHTML = this.template();
    }
    return this.footer;
  }
}
