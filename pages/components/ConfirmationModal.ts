import Button from './Button';
import type { ConfirmationModalProps } from '../../src/types';

export default class ConfirmationModal {
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  modalElement: HTMLElement | null = null;
  confirmButton: Button;
  cancelButton: Button | null;

  constructor({ message, onConfirm, onCancel }: ConfirmationModalProps) {
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    this.confirmButton = new Button({
      id: 'confirm-btn',
      text: this.onCancel ? 'Да, удалить' : 'Ок',
      variant: 'secondary',
      onClick: () => {
        if (this.onConfirm) this.onConfirm();
        this.hide();
      },
    });

    if (this.onCancel) {
      this.cancelButton = new Button({
        id: 'cancel-btn',
        text: 'Нет, оставить',
        variant: 'primary',
        onClick: () => {
          this.onCancel!();
          this.hide();
        },
      });
    } else {
      this.cancelButton = null;
    }
  }

  render(): string {
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

  show(): void {
    if (!this.modalElement) {
      this.modalElement = document.createElement('div');
      this.modalElement.className = 'modal__overlay';
      this.modalElement.innerHTML = this.render();
      document.body.appendChild(this.modalElement);
      this.attachEvents();
    }
    this.modalElement.style.display = 'flex';
  }

  hide(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  attachEvents(): void {
    this.confirmButton.attachEvents();
    if (this.cancelButton) {
      this.cancelButton.attachEvents();
    }
  }
}
