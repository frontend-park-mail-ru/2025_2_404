/**
 * Главная страница приложения
 * @class
 */
export default class MainPage {
    constructor() {
        this.headerTemp = null;
        this.mainTemp = null;
    }
    async loadTemplate() {
        try {
            const headerResponse = await fetch('/src/components/layout/Header/header.hbs');
            if (!headerResponse.ok){
                throw new Error('ошибка загрузки хедера');
            }
            const headerText = await headerResponse.text();
            this.headerTemp = Handlebars.compile(headerText);
            const mainResponse = await fetch('/src/pages/main/MainPage.hbs');
            if (!mainResponse.ok){
                throw new Error('Ошибка загрузки главной страницы');
            }
            const mainText = await mainResponse.text();
            this.mainTemp = Handlebars.compile(mainText);

        } catch (error) {
            console.error('Ошибка загрузки шаблонов', error);
        }
    }
    render() {
        if (!this.headerTemp || !this.mainTemp) {
            return '<div>Loading page...</div>';
        }
        const mainHtml = this.mainTemp();
        return mainHtml;
    }
}