import Button from './Button.js';

export default class ConfirmationModal {
  constructor({ message, onConfirm, onCancel }) {
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.modalElement = null;

    this.confirmButton = new Button({
      id: 'confirm-btn',
      text: this.onCancel ? 'Да, выйти' : 'Ок',
      variant: 'secondary',
      onClick: () => {
        if (this.onConfirm) this.onConfirm();
        this.hide();
      },
    });

    if (this.onCancel) {
      this.cancelButton = new Button({
        id: 'cancel-btn',
        text: 'Нет, остаться',
        variant: 'primary',
        onClick: () => {
          this.onCancel();
          this.hide();
        },
      });
    } else {
      this.cancelButton = null;
    }

  }

  render() {
    return `
      <div class="modal__content">
        <p>${this.message}</p>
        <div class="modal__actions">
          ${this.confirmButton.render()}
          ${this.cancelButton ? this.cancelButton.render() : ''}
        </div>
      </div>
    `;
  }

  show() {
    if (!this.modalElement) {
      this.modalElement = document.createElement('div');
      this.modalElement.className = 'modal__overlay';
      this.modalElement.innerHTML = this.render();
      document.body.appendChild(this.modalElement);
      this.attachEvents();
    }
    this.modalElement.style.display = 'flex';
  }

  hide() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  attachEvents() {
  this.confirmButton.attachEvents();
  if (this.cancelButton) {
    this.cancelButton.attachEvents();
  }
   if (this.modalElement) {
      this.modalElement.addEventListener('click', (e) => {
        // e.target — это то, куда нажали. this.modalElement — это весь оверлей.
        if (e.target === this.modalElement) {
           if (this.onCancel) this.onCancel();
           this.hide();
        }
      });
    }
}

}