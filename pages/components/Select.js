export default class Select {
  constructor({ id, label, options, value, onChange }) {
    this.id = id;
    this.label = label;
    this.options = options || [];
    this.value = value || '';
    this.onChange = onChange;
  }

  render() {
    return `
      <div class="form-group">
        <label for="${this.id}">${this.label}</label>
        <select id="${this.id}" name="${this.id}" class="form-select">
          ${this.options.map(option => 
            `<option value="${option.value}" ${this.value === option.value ? 'selected' : ''}>
              ${option.text}
            </option>`
          ).join('')}
        </select>
      </div>
    `;
  }

  attachEvents() {
    const select = document.getElementById(this.id);
    if (select && this.onChange) {
      select.addEventListener('change', this.onChange);
    } else {
      console.warn(`Select element ${this.id} not found for event attachment`);
    }
  }
}