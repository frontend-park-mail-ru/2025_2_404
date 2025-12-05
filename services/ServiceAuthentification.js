import { signin, signup, logout as apiLogout } from '../public/api/auth.js';
import { http } from '../public/api/http.js';

class AuthService {
  constructor() {
    this.user = null;
    this.onAuthChangeCallback = null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getUser() {
    return this.user;
  }

  async loadProfile() {
    if (!this.isAuthenticated()) {
      this.user = null;
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
      return null;
    }

    try {
      const res = await http.get('/profile/');
      const clientData = res.data?.client;
      if (!clientData) throw new Error("Данные клиента не найдены");
      this.user = {
        id: clientData.id,
        username: clientData.user_name,
        email: clientData.email,
        firstName: clientData.first_name || '',
        lastName: clientData.last_name || '',
        company: clientData.company || '',
        phone: clientData.phone || '',
        role: clientData.role || 'advertiser',
        avatar: res.data?.img ? `data:image/jpeg;base64,${res.data.img}` : '/kit.jpg',
      };

      if (this.onAuthChangeCallback) {
        this.onAuthChangeCallback(this.user);
      }

      return this.user;
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err);
      this.logout();
      return null;
    }
  }

  async updateProfile(formData) {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован");
    }
    await http.putFormData('/profile/', formData);
    return await this.loadProfile();
  }

  async login(credentials) {
    await signin(credentials);
    return await this.loadProfile();
  }

  async register(info) {
    await signup(info);
    return await this.loadProfile();
  }

  logout() {
    localStorage.removeItem('token');
    this.user = null;

    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);

    if (window.header?.resetCache) {
      window.header.resetCache();
    }
  }

  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }

  async deleteAccount() {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован для удаления.");
    }
    await http.delete('/profile/');
    this.logout();
  }
}

export default new AuthService();