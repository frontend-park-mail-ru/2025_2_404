import Button from './Button.js';

export default class ConfirmationModal {
  constructor({ message, onConfirm, onCancel }) {
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.modalElement = null;

    this.confirmButton = new Button({
      id: 'confirm-btn',
      text: this.onCancel ? 'Да, удалить' : 'Ок',
      variant: 'secondary',
      onClick: () => {
        if (this.onConfirm) this.onConfirm();
      // text: 'Да, удалить',
      // variant: 'secondary',
      // onClick: () => {
      //   this.onConfirm();
        this.hide();
      },
    });

    if (this.onCancel) {
      this.cancelButton = new Button({
        id: 'cancel-btn',
        text: 'Нет, оставить',
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
      <div class="modal-content" style="background: white; padding: 20px; border-radius: 8px; width: 400px; text-align: center;">
        <p>${this.message}</p>
        <div class="modal-actions" style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
          ${this.confirmButton.render()}
          ${this.cancelButton ? this.cancelButton.render() : ''}
        </div>
      </div>
    `;
  }

  show() {
    if (!this.modalElement) {
      this.modalElement = document.createElement('div');
      this.modalElement.className = 'modal-overlay';
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
}

}