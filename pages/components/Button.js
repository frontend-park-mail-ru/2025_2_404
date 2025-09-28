export default class Button{
    constructor({id, text, onClick, variant = "primary"}){
        this.id = id;
        this.text = text;
        this.onClick = onClick;
        this.variant = variant;
    }
    render(){
        return `<button class="btn btn-${this.variant}" id="${this.id}" type="submit">${this.text}</button>`;
    }
    attachEvents() {
        const button = document.querySelector(`.btn-${this.variant}`);
        if (button && this.onClick) {
            button.addEventListener('click', this.onClick);
        }
    }
}