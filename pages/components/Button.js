export default class Button{
    constructor(text, onClick, type = "primary"){
        this.text = text;
        this.onClick = onClick;
        this.type = type;
    }
    
    render(){
        return `<button class="btn btn-${this.type}" type="button">${this.text}</button>`;
    }
    
    attachEvents() {
        const button = document.querySelector(`.btn-${this.type}`);
        if (button && this.onClick) {
            button.addEventListener('click', this.onClick);
        }
    }
}