import Input from '../Input';
import Button from '../Button';
import type { WithdrawModalProps } from '../../../src/types';

export default class WithdrawModal {
  onConfirm: (amount: number) => void;
  onCancel?: () => void;
  balance: number;
  modalElement: HTMLElement | null = null;
  amountInput: Input;
  confirmButton: Button;

  constructor({ onConfirm, onCancel, balance }: WithdrawModalProps) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.balance = balance;

    this.amountInput = new Input({
      id: 'withdraw-amount',
      label: 'Сумма вывода, ₽',
      placeholder: 'Например, 1000',
      type: 'text',
      validationFn: (value: string): string | null => {
        value = value.trim();
        if (!value) return 'Введите сумму';
        if (!/^\d+(\.\d+)?$/.test(value)) return 'Сумма должна быть числом';

        const amount = parseFloat(value);
        if (amount <= 0) return 'Сумма должна быть больше нуля';
        if (amount > this.balance) return 'Недостаточно средств на счете';

        return null;
      },
    });

    this.confirmButton = new Button({
      id: 'confirm-withdraw-btn',
      text: 'Вывести',
      variant: 'primary',
    });
  }

  render(): string {
    return `
      <div class="confirmation-modal">
        <button class="close-btn" id="cancel-withdraw">&times;</button>
        <h2 class="confirmation-modal__title">Вывод средств</h2>
        <p confirmation-modal__title>Введите сумму для вывода с вашего счета</p>
        
        <form id="withdraw-form">
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
    this.modalElement?.querySelector('#cancel-withdraw')?.addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
      this.hide();
    });
    
    this.modalElement?.querySelector('#withdraw-form')?.addEventListener('submit', (e) => {
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
