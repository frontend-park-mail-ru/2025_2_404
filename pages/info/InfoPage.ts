import type { HandlebarsTemplateDelegate, PageComponent } from '../../src/types';
import ConfirmationModal from '../components/ConfirmationModal';

export default class InfoPage implements PageComponent {
  template: HandlebarsTemplateDelegate | null = null;
  private initialSection: string | null = null;

  private validateName(value: string): string | null {
    value = value.trim();
    if (!value) return 'Имя обязательно для заполнения';
    if (value.length < 2) return 'Имя должно содержать минимум 2 символа';
    if (value.length > 50) return 'Имя слишком длинное';
    if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return 'Имя может содержать только буквы, пробел и дефис';
    if (/\s{2,}/.test(value)) return 'Имя не может содержать несколько пробелов подряд';
    if (/-{2,}/.test(value)) return 'Имя не может содержать несколько дефисов подряд';
    if (/[\s-]{2,}/.test(value)) return 'Имя не может содержать пробел и дефис рядом';
    if (/^[-\s]|[-\s]$/.test(value)) return 'Имя не может начинаться или заканчиваться пробелом или дефисом';
    return null;
  }

  private validateEmail(value: string): string | null {
    value = value.trim();
    if (!value) return 'Email обязателен для заполнения';
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Введите корректный email';
    return null;
  }

  private validateMessage(value: string): string | null {
    value = value.trim();
    if (!value) return 'Сообщение обязательно для заполнения';
    if (value.length < 10) return 'Сообщение должно содержать минимум 10 символов';
    return null;
  }

  private showFieldError(fieldId: string, message: string): void {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`error-${fieldId}`);
    if (input) input.classList.add('input--error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.color = 'red';
    }
  }

  private clearFieldError(fieldId: string): void {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`error-${fieldId}`);
    if (input) input.classList.remove('input--error');
    if (errorEl) errorEl.textContent = '';
  }

  private clearAllErrors(): void {
    this.clearFieldError('contact-name');
    this.clearFieldError('contact-email');
    this.clearFieldError('contact-message');
  }

  constructor(_router?: unknown, section?: string) {
    this.initialSection = section || null;
  }

  async loadTemplate(): Promise<void> {
    if (this.template) {
      return;
    }
    try {
      const response = await fetch('/pages/info/InfoPage.hbs');
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблона информационной страницы');
      }
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.template = Handlebars.compile('<h1>Не удалось загрузить страницу</h1>');
    }
  }

  async render(): Promise<string> {
    await this.loadTemplate();
    return this.template ? this.template({}) : '';
  }

  attachEvents(): void {
    const navItems = document.querySelectorAll('.info-page__nav-item');
    const sections = document.querySelectorAll('.info-page__section');

    const switchSection = (sectionId: string): void => {
      navItems.forEach(item => item.classList.remove('is-active'));
      sections.forEach(section => section.classList.remove('is-active'));

      const targetNav = document.querySelector(`[data-section="${sectionId}"]`);
      const targetSection = document.getElementById(sectionId);

      if (targetNav) targetNav.classList.add('is-active');
      if (targetSection) targetSection.classList.add('is-active');
    };

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = (item as HTMLElement).dataset.section;
        if (sectionId) {
          switchSection(sectionId);
          history.replaceState({}, '', `/info#${sectionId}`);
        }
      });
    });

    // Обработка клика на ссылки внутри секций (например "Связаться" в тарифах)
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = (link as HTMLElement).dataset.nav;
        if (sectionId) {
          switchSection(sectionId);
          history.replaceState({}, '', `/info#${sectionId}`);
        }
      });
    });

    // Обработка формы обратной связи
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('contact-name') as HTMLInputElement | null;
    const emailInput = document.getElementById('contact-email') as HTMLInputElement | null;
    const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement | null;

    nameInput?.addEventListener('input', () => this.clearFieldError('contact-name'));
    emailInput?.addEventListener('input', () => this.clearFieldError('contact-email'));
    messageInput?.addEventListener('input', () => this.clearFieldError('contact-message'));

    nameInput?.addEventListener('blur', () => {
      const error = this.validateName(nameInput.value);
      if (error) this.showFieldError('contact-name', error);
    });
    emailInput?.addEventListener('blur', () => {
      const error = this.validateEmail(emailInput.value);
      if (error) this.showFieldError('contact-email', error);
    });
    messageInput?.addEventListener('blur', () => {
      const error = this.validateMessage(messageInput.value);
      if (error) this.showFieldError('contact-message', error);
    });

    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.clearAllErrors();

        const name = nameInput?.value || '';
        const email = emailInput?.value || '';
        const message = messageInput?.value || '';

        let isValid = true;

        const nameError = this.validateName(name);
        if (nameError) {
          this.showFieldError('contact-name', nameError);
          isValid = false;
        }

        const emailError = this.validateEmail(email);
        if (emailError) {
          this.showFieldError('contact-email', emailError);
          isValid = false;
        }

        const messageError = this.validateMessage(message);
        if (messageError) {
          this.showFieldError('contact-message', messageError);
          isValid = false;
        }

        if (!isValid) return;

        (contactForm as HTMLFormElement).reset();
        new ConfirmationModal({
          message: 'Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.',
          onConfirm: () => {},
        }).show();
      });
    }

    // Слушаем изменение хеша
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash) {
        switchSection(newHash);
      }
    });

    // Проверяем хеш в URL при загрузке
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      switchSection(hash);
    } else if (this.initialSection) {
      switchSection(this.initialSection);
    }
  }
}
