import AuthService from '../../services/ServiceAuthentification';
import type { HandlebarsTemplateDelegate, User } from '../../src/types';

interface NavItem {
  href: string;
  text: string;
  id: string | null;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface HeaderUser {
  username: string;
  avatar: string;
}

export default class Header {
  #updating = false;
  header: HTMLElement;
  template: HandlebarsTemplateDelegate | null = null;
  lastUser: HeaderUser | null = null;
  lastAuthState: boolean | null = null;

  constructor() {
    this.header = document.createElement('header');
    this.header.classList.add('header');
    document.body.prepend(this.header);
  }

  async loadTemplate(): Promise<void> {
    if (this.template) return;
    try {
      const response = await fetch('/pages/header/header.hbs');
      if (!response.ok) throw new Error('Failed to load header');
      this.template = Handlebars.compile(await response.text());
    } catch (error) {
      console.error(error);
      this.header.innerHTML = '<p>Ошибка загрузки хедера</p>';
    }
  }

  buildNavItems(isAuthenticated: boolean): NavGroup[] {
    return [
      {
        title: 'Баланс',
        items: [
          {
            href: isAuthenticated ? '/balance' : '#',
            text: 'Мой баланс',
            id: isAuthenticated ? null : 'login-for-projects-btn'
          }
        ]
      },
      {
        title: 'Проекты',
        items: [
          {
            href: isAuthenticated ? '/projects' : '#',
            text: 'Мои проекты',
            id: isAuthenticated ? null : 'login-for-projects-btn'
          }
        ]
      }
    ];
  }

  async update(): Promise<void> {
    if (this.#updating) return;
    this.#updating = true;

    try {
      await this.loadTemplate();
      if (!this.template) {
        this.#updating = false;
        return;
      }

      let isAuthenticated = AuthService.isAuthenticated();
      let user: HeaderUser | null = null;

      if (isAuthenticated) {
        try {
          const profile = await AuthService.loadProfile();
          if (profile) {
            user = {
              username: profile.username ?? '',
              avatar: profile.avatar || '/kit.jpg',
            };
          }
        } catch {
          AuthService.logout();
          isAuthenticated = false;
        }
      }

      const sameAuth = this.lastAuthState === isAuthenticated;
      const sameUser = JSON.stringify(this.lastUser) === JSON.stringify(user);

      if (sameAuth && sameUser) {
        this.#updating = false;
        return;
      }

      this.lastAuthState = isAuthenticated;
      this.lastUser = user;

      const navItems = this.buildNavItems(isAuthenticated);
      this.header.innerHTML = this.template({ isAuthenticated, user, navItems });

    } catch (error) {
      console.log(error);
    } finally {
      this.#updating = false;
    }
  }

  resetCache(): void {
    this.lastAuthState = null;
    this.lastUser = null;
  }
}
