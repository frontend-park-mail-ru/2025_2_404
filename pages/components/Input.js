export default class Input{
    constructor({id, type = "text", label, placeholder, validationFn}) {
        this.id = id; 
        this.type = type;
        this.label = label;
        this.placeholder = placeholder;
        this.validationFn = validationFn;
    }
    
    render(){
        return `
            <label for="${this.id}">${this.label}</label>
            <div class="input-wrapper">
                <input type="${this.type}" id="${this.id}" placeholder="${this.placeholder}">
            </div>
        `;
    }
    validate(value){
        if (!this.validationFn) return null;
        return this.validationFn(value);
    }
}