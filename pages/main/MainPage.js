// pages/main/MainPage.js

import { showRegisterModal, router } from '../../main.js'; // <--- Добавили router
import AuthService from '../../services/ServiceAuthentification.js'; // <--- Добавили AuthService

export default class MainPage {
  constructor() {
    this.template = null;
  }
  
  async loadTemplate() {
    if (this.template) {
      return;
    }
    try {
      const response = await fetch('/pages/main/MainPage.hbs');
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблона главной страницы');
      }
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Не удалось загрузить страницу</h1>');
    }
  }

  async render() {
    await this.loadTemplate();
    return this.template();
  }

  attachEvents() {
    // Логика аккордеона FAQ (оставляем без изменений)
    const faqItems = document.querySelectorAll('.landing__faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.landing__faq-question');
      question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        item.classList.toggle('active');
      });
    });

    // Логика кнопки "Попробовать"
    const tryBtn = document.getElementById('try-btn');
    if (tryBtn) {
      tryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // ПРОВЕРЯЕМ АВТОРИЗАЦИЮ
        if (AuthService.isAuthenticated()) {
            // Если пользователь вошел:
            // 1. Устанавливаем вкладку "ads" (объявления), чтобы открылись именно они, а не слоты
            localStorage.setItem('projects_tab', 'ads');
            // 2. Переходим на страницу проектов
            router.navigate('/projects');
        } else {
            // Если гость: открываем модалку регистрации
            showRegisterModal();
        }
      });
    }
  }
}