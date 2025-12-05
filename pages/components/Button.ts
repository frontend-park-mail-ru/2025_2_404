import type { ButtonProps } from '../../src/types';

export default class Button {
  id: string;
  text: string;
  onClick?: (event: MouseEvent) => void;
  variant: 'primary' | 'secondary' | 'danger';

  constructor({ id, text, onClick, variant = 'primary' }: ButtonProps) {
    this.id = id;
    this.text = text;
    this.onClick = onClick;
    this.variant = variant;
  }

  render(): string {
    return `<button class="btn btn--${this.variant}" id="${this.id}" type="submit">${this.text}</button>`;
  }

  attachEvents(): void {
    const button = document.getElementById(this.id);
    if (button && this.onClick) {
      button.addEventListener('click', (event) => this.onClick!(event as MouseEvent));
    }
  }
}
