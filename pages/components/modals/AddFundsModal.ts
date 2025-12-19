import Input from '../Input';
import Button from '../Button';
import type { AddFundsModalProps } from '../../../src/types';

interface ExtendedProps extends AddFundsModalProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export default class AddFundsModal {
  onConfirm: (amount: number) => void;
  onCancel?: () => void;
  modalElement: HTMLElement | null = null;
  amountInput: Input;
  confirmButton: Button;
  title: string;
  subtitle: string;
  buttonText: string;
  constructor({ onConfirm, onCancel, title, subtitle, buttonText }: ExtendedProps) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.title = title || 'Пополнение баланса';
    this.subtitle = subtitle || 'Вы будете перенаправлены на страницу оплаты';
    this.buttonText = buttonText || 'Перейти к оплате';

    this.amountInput = new Input({
      id: 'add-funds-amount',
      label: 'Сумма, ₽',
      placeholder: 'Например, 1000',
      type: 'number',
      validationFn: (value: string): string | null => {
        value = String(value).trim();
        if (!value) return 'Введите сумму';
        if (parseFloat(value) <= 0) return 'Сумма должна быть больше нуля';
        if (parseFloat(value) > 100000) return 'На данный момент пополнение возможно только до 100.000₽';
        return null;
      },
    });

    this.confirmButton = new Button({
      id: 'confirm-add-funds-btn',
      text: this.buttonText,
      variant: 'primary',
    });
  }

  render(): string {
    return `
      <div class="confirmation-modal">
        <button class="close-btn" id="cancel-add-funds">&times;</button>
        
        <!-- Вставляем динамические переменные -->
        <h2 class="confirmation-modal__title">${this.title}</h2>
        <p class="confirmation-modal__subtitle">${this.subtitle}</p>
        
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
    
    this.modalElement?.addEventListener('click', (e) => {
        if (e.target === this.modalElement) {
            if (this.onCancel) this.onCancel();
            this.hide();
        }
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