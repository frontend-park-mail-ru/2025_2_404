import type { HandlebarsTemplateDelegate } from '../../src/types';

export default class Footer {
  footer: HTMLElement;
  template: HandlebarsTemplateDelegate | null = null;
  handleTitleClick: (event: Event) => void;

  constructor() {
    this.footer = document.createElement('footer');
    this.footer.classList.add('footer');
    this.handleTitleClick = this._handleTitleClick.bind(this);
  }

  async loadTemplate(): Promise<void> {
    const response = await fetch('/pages/footer/footer.hbs');
    if (!response.ok) {
      throw new Error('Не удалось загрузить футер');
    }
    const templateText = await response.text();
    this.template = Handlebars.compile(templateText);
  }

  render(): HTMLElement {
    if (this.template) {
      this.footer.innerHTML = this.template({});
      this.initAccordion();
    }
    return this.footer;
  }

  initAccordion(): void {
    const titles = this.footer.querySelectorAll('.footer__links-title');

    titles.forEach((title) => {
      title.addEventListener('click', this.handleTitleClick);
    });

    const firstColumn = this.footer.querySelector('.footer__links-column');
    if (firstColumn) {
      firstColumn.classList.add('is-open');
    }
  }

  private _handleTitleClick(event: Event): void {
    const title = event.currentTarget as HTMLElement;
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
