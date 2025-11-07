export default class Button {
  constructor({ id, text, onClick, variant = 'primary' }) {
    this.id = id;
    this.text = text;
    this.onClick = onClick; 
    this.variant = variant;
  }
  render() {
    return `<button class="btn btn--${this.variant}" id="${this.id}" type="submit">${this.text}</button>`;
  }
  attachEvents() {
    const button = document.getElementById(this.id);
    if (button && this.onClick) {
      button.addEventListener('click', (event) => this.onClick(event));
    }
  }
}