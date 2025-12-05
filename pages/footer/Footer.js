export default class Footer {
  constructor() {
    this.footer = document.createElement('footer');
    this.footer.classList.add('footer');
    this.handleTitleClick = this.handleTitleClick.bind(this);
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

      this.initAccordion();
    }
    return this.footer;
  }

  initAccordion() {
    const titles = this.footer.querySelectorAll('.footer__links-title');

    titles.forEach((title) => {
      title.addEventListener('click', this.handleTitleClick);
    });

    const firstColumn = this.footer.querySelector('.footer__links-column');
    if (firstColumn) {
      firstColumn.classList.add('is-open');
    }
  }

  handleTitleClick(event) {
    const title = event.currentTarget;
    const column = title.closest('.footer__links-column');

    if (!column) return;

    const isCurrentlyOpen = column.classList.contains('is-open');

    const openColumn = this.footer.querySelector('.footer__links-column.is-open');
    if (openColumn) {
      openColumn.classList.remove('is-open');
    }

    if (!isCurrentlyOpen) {
      column.classList.add('is-open');
    }
  }
}
