import Input from '../Input.js';
import Button from '../Button.js';

export default class WithdrawModal {
  constructor({ onConfirm, onCancel, balance }) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.balance = balance;
    this.modalElement = null;

    this.amountInput = new Input({
      id: 'withdraw-amount',
      label: 'Сумма вывода, ₽',
      placeholder: 'Например, 1000',
      type: 'text', 
      validationFn: (value) => {
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
  
  render() {
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
    this.modalElement.querySelector('#cancel-withdraw').addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
      this.hide();
    });
    this.modalElement.querySelector('#withdraw-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const amountValue = document.getElementById(this.amountInput.id).value;
      const errorMessage = this.amountInput.validate(amountValue);

      if (!errorMessage) {
        this.onConfirm(parseFloat(amountValue));
        this.hide();
      }
    });
    
    this.amountInput.attachValidationEvent();
  }
}