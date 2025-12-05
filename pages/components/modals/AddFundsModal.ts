import Input from '../Input';
import Button from '../Button';
import type { AddFundsModalProps } from '../../../src/types';

export default class AddFundsModal {
  onConfirm: (amount: number) => void;
  onCancel?: () => void;
  modalElement: HTMLElement | null = null;
  amountInput: Input;
  confirmButton: Button;

  constructor({ onConfirm, onCancel }: AddFundsModalProps) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    this.amountInput = new Input({
      id: 'add-funds-amount',
      label: 'Сумма пополнения, ₽',
      placeholder: 'Например, 5000',
      type: 'text',
      validationFn: (value: string): string | null => {
        value = value.trim();
        if (!value) return 'Введите сумму';
        if (!/^\d+(\.\d+)?$/.test(value)) return 'Сумма должна быть числом';
        if (parseFloat(value) <= 0) return 'Сумма должна быть больше нуля';
        return null;
      },
    });

    this.confirmButton = new Button({
      id: 'confirm-add-funds-btn',
      text: 'Пополнить',
      variant: 'primary',
    });
  }

  render(): string {
    return `
      <div class="confirmation-modal">
        <button class="close-btn" id="cancel-add-funds">&times;</button>
        <h2 class="confirmation-modal__title">Пополнение баланса</h2>
        <p class="confirmation-modal__subtitle">Введите сумму для зачисления на ваш счет</p>
        
        <form id="add-funds-form">
          ${this.amountInput.render()}
          <div class="confirmation-modal__footer">
            ${this.confirmButton.render()}
          </div>
        </form>
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
    this.modalElement?.querySelector('#cancel-add-funds')?.addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
      this.hide();
    });
    
    this.modalElement?.querySelector('#add-funds-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountEl = document.getElementById(this.amountInput.id) as HTMLInputElement | null;
      const amountValue = amountEl?.value || '';
      const errorMessage = this.amountInput.validate(amountValue);

      if (!errorMessage) {
        this.onConfirm(parseFloat(amountValue));
        this.hide();
      }
    });

    this.amountInput.attachValidationEvent();
  }
}
