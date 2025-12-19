import Button from './Button';
import type { ConfirmationModalProps } from '../../src/types';

export default class ConfirmationModal {
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  modalElement: HTMLElement | null = null;
  confirmButton: Button;
  cancelButton: Button | null;

  constructor({ message, onConfirm, onCancel, confirmText, cancelText }: ConfirmationModalProps) {
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    const defaultConfirmText = this.onCancel ? 'Да, выйти' : 'Ок';
    const defaultCancelText = 'Нет, остаться';

    this.confirmButton = new Button({
      id: 'confirm-btn',
      text: confirmText ?? defaultConfirmText,
      variant: 'secondary',
      onClick: () => {
        if (this.onConfirm) this.onConfirm();
        this.hide();
      },
    });

    if (this.onCancel) {
      this.cancelButton = new Button({
        id: 'cancel-btn',
        text: cancelText ?? defaultCancelText,
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
    if (this.modalElement) {
      this.modalElement.addEventListener('click', (e) => {
        if (e.target === this.modalElement) {
          if (this.onCancel) this.onCancel();
          this.hide();
        }
      });
    }
  }
}
