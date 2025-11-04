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
        avatar: clientData.avatar || '/kit.jpg',
      };
      
      return this.user;
    } catch (err) {
      console.error('Ошибка при загрузке профиля (токен может быть невалидным):', err);
      this.logout(); 
      return null;
    }
  }
  async login(credentials) {
    await signin(credentials);
    await this.loadProfile(); 
    
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user); 
    return this.user;
  }
  async register(info) {
    await signup(info);
    await this.loadProfile();
    
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    return this.user;
  }
  logout() {
    const token = this.getToken();
    localStorage.removeItem('token');
    this.user = null;
    
    if (token) {
        apiLogout?.(token);
    }
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
  }
  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }
  deleteAccount() {
    this.logout();
    return Promise.resolve();
  }
}

export default new AuthService();