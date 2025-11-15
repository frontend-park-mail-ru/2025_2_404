const ICON_OPEN = './public/assets/eye-show.svg';

const ICON_CLOSE = './public/assets/eye-close.svg'


export default class Input {
  constructor({
    id,
    type = 'text',
    label,
    placeholder,
    showPasswordToggle = false,
    validationFn,
  }) {
    this.id = id;
    this.type = showPasswordToggle ? 'password' : type;
    this.label = label;
    this.placeholder = placeholder;
    this.showPasswordToggle = showPasswordToggle;
    this.validationFn = validationFn;
  }

  render() {
    return `
            <div class="form-group">
                <label class="form-group__label"for="${this.id}">${this.label}</label>
                <div class="input-wrapper">
                    <input class="form-group__input" type="${this.type}" id="${this.id}" placeholder="${this.placeholder}">
                    ${this.showPasswordToggle ?
                    `<span class="password-toggle" role="button" aria-controls="${this.id}">
                      <img class="password-toggle__icon" src="${ICON_CLOSE}" alt="toggle password">
                    </span>` : ''}
                </div>
                <div class="error-message" id="error-${this.id}"></div>
            </div>
        `;
  }
  validate(value) {
    if (!this.validationFn) {
      return null;
    }
    const errorMessage = this.validationFn(value);
    const inputEl = document.getElementById(this.id);
    if (!inputEl) {
      return errorMessage;
    }
    inputEl.classList.remove('input--valid', 'input--error');

    if (errorMessage) {
      this.showError(errorMessage);
      inputEl.classList.add('input--error');
    } else {
      this.clearError();
      inputEl.classList.add('input--valid');
    }
    return errorMessage;
  }

  showError(message) {
    const errorEl = document.getElementById(`error-${this.id}`);
    const inputEl = document.getElementById(this.id);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.color = 'red';
    }
    if (inputEl) {
      inputEl.classList.add('input--error');
      inputEl.classList.remove('input--valid');
    }
  }

  clearError() {
    const errorEl = document.getElementById(`error-${this.id}`);
    const inputEl = document.getElementById(this.id);
    if (errorEl) {
      errorEl.textContent = '';
    }
    if (inputEl) {
      inputEl.classList.remove('input--error');
    }
  }

  PasswordToggle() {
    const toggle = document.querySelector(`#${this.id} + .password-toggle`);
    if (toggle) {
      toggle.addEventListener('click', () => {
        const inputEl = document.getElementById(this.id);
        if (inputEl.type === 'password') {
          inputEl.type = 'text';
          toggle.innerHTML = `<img class="password-toggle__icon" src="${ICON_OPEN}" alt="">`;
        } else {
          inputEl.type = 'password';
          toggle.innerHTML = `<img class="password-toggle__icon" src="${ICON_CLOSE}" alt="">`;

        }
      });
    }
  }

  attachValidationEvent() {
    const inputEl = document.getElementById(this.id);
    if (inputEl) {
      inputEl.addEventListener('blur', () => {
        this.validate(inputEl.value);
      });
      inputEl.addEventListener('input', () => {
        this.clearError();
      });
    }
    if (this.showPasswordToggle) {
      this.PasswordToggle();
    }
  }
}
