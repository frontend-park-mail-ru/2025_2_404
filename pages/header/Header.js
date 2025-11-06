import AuthService from '../../services/ServiceAuthentification.js';
import { http } from '../../public/api/http1.js';

export default class Header {
  constructor() {
    this.header = document.createElement('header');
    document.body.prepend(this.header);
    this.template = null;
  }

  async loadTemplate() {
    if (this.template) return;
    try {
      const response = await fetch('/pages/header/header.hbs');
      if (!response.ok) {
        throw new Error('Failed to load header');
      }
      const templateText = await response.text();
      this.template = Handlebars.compile(templateText);
    } catch (error) {
      console.error(error);
      this.header.innerHTML = '<p style="color: red; text-align: center;">Error loading header</p>';
    }
  }

  render(context) {
    if (!this.template) {
        this.header.innerHTML = '<div>Загрузка хедера...</div>';
        return;
    }
    this.header.innerHTML = this.template(context);
  }

  async update() {
    let user = null;
    if (AuthService.isAuthenticated()) {
        try {
            const res = await http.get('/profile/'); 
            const clientData = res.data?.client;
            
            if (clientData) {
                user = { 
                    username: clientData.user_name, 
                    avatar: clientData.avatar || '/kit.jpg' 
                };
            }
        } catch (error) {
            console.error("Ошибка загрузки данных для хедера (возможно, токен истек)", error);
            AuthService.logout(); 
        }
    }
    this.render({
        isAuthenticated: !!user,
        user: user
    });
  }
}