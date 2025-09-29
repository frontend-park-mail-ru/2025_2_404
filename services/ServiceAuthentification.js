import { signin, signup } from '../public/api/auth.js';

function setCookie(name, val, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = `${name}=${val || ''}${expires}; path=/`;
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=-99999999; path=/';
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

class AuthService {
  constructor() {
    const saved = getCookie('user');
    this.user = saved ? safeParse(saved) : null;
    this.onAuthChangeCallback = null;
  }

  isAuthenticated() { return !!this.user; }
  getUser() { return this.user; }

  /**
   * Вход: /signin
   * @param {{email:string, password:string}}
   */
  async login({ email, password }) {
    const res = await signin({ email, password }); 
    const uiUser = {
      id: res.id,
      email: res.email,
      login: res.user_name || res.name || res.username || res.login || email,
      avatar: '',
    };
    this.user = uiUser;
    setCookie('user', JSON.stringify(uiUser), 7);
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    return uiUser;
  }

  /**
   * Регистрация: /signup
   * @param {{user_name:string, email:string, password:string}}
   */
  async register({ user_name, email, password }) {
    const res = await signup({ user_name, email, password }); 
    const uiUser = {
      id: res.id,
      email: res.email,
      login: res.user_name || res.name || user_name,
      avatar: '',
    };
    this.user = uiUser;
    setCookie('user', JSON.stringify(uiUser), 7);
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    return uiUser;
  }

  logout() {
    this.user = null;
    deleteCookie('user');
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
  }

  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }
}

export default new AuthService();
