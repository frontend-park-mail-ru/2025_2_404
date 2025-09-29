export default class Footer {
    constructor() {
        this.footer = document.createElement('footer');
    }
    async loadTemplate() {
        try {
            const response = await fetch('/src/components/layout/Footer/footer.hbs');
            if (!response.ok){
                throw new Error('Не удалось загрузить футтер');
            }
            const templateText = await response.text();
            this.template = Handlebars.compile(templateText);
        } catch (error) {
            console.error('Ошибка загрузки футтера', error);
        }
    }
    render() {
        if (this.template) {
            this.footer.innerHTML = this.template();
        }
        return this.footer;
    }
}