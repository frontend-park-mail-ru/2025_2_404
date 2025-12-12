import Input from '../Input.js';
import Button from '../Button.js';

export default class AddFundsModal {
  constructor({ onConfirm, onCancel }) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.modalElement = null;

    this.amountInput = new Input({
      id: 'add-funds-amount',
      label: 'Сумма пополнения, ₽',
      placeholder: 'Например, 1000',
      type: 'number', // Лучше поставить type: 'number' для мобильных
      validationFn: (value) => {
        value = String(value).trim(); // Приводим к строке на всякий случай
        if (!value) return 'Введите сумму';
        if (parseFloat(value) <= 0) return 'Сумма должна быть больше нуля';
        return null;
      },
    });

    this.confirmButton = new Button({
      id: 'confirm-add-funds-btn',
      // ИЗМЕНЕНИЕ: Меняем текст, чтобы пользователь понимал, что сейчас будет редирект
      text: 'Перейти к оплате', 
      variant: 'primary',
    });
  }

  render() {
    return `
        <div class="confirmation-modal">
          <button class="close-btn" id="cancel-add-funds">&times;</button>
          <h2 class="confirmation-modal__title">Пополнение баланса</h2>
          <p class="confirmation-modal__subtitle">Вы будете перенаправлены на страницу оплаты</p>
          
          <form id="add-funds-form">
            ${this.amountInput.render()}
            <div class="confirmation-modal__footer">
              ${this.confirmButton.render()}
            </div>
          </form>
        </div>
      `;
  }
  // ... Остальной код (show, hide, attachEvents) оставляем без изменений ...
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
    this.modalElement.querySelector('#cancel-add-funds').addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
      this.hide();
    });
    this.modalElement.querySelector('#add-funds-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const amountValue = document.getElementById(this.amountInput.id).value;
      const errorMessage = this.amountInput.validate(amountValue);

      if (!errorMessage) {
        // Передаем число в onConfirm
        this.onConfirm(parseFloat(amountValue));
        this.hide();
      }
    });

    this.amountInput.attachValidationEvent();
  }
}