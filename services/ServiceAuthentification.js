import { signin, signup, logout as apiLogout } from '../public/api/auth.js';
import { http } from '../public/api/http.js';

class AuthService {
  constructor() {
    this.onAuthChangeCallback = null;
  }
  getToken() {
    return localStorage.getItem('token');
  }
  isAuthenticated() {
    return !!this.getToken();
  }
  async login(credentials) {
    await signin(credentials);
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(true);
  }
  async register(info) {
    await signup(info); 
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(true);
  }

  logout() {
    const token = this.getToken();
    localStorage.removeItem('token');
    
    if (token) {
        apiLogout?.(token);
    }

    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
  }

  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }

  deleteAccount() {
    console.log("Отправка запроса на удаление аккаунта...");
    this.logout();
    return Promise.resolve();
  }
}

export default new AuthService();