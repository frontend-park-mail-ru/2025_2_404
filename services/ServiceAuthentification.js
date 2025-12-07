import { signin, signup, logout as apiLogout } from '../public/api/auth.js';
import { http } from '../public/api/http1.js';

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

// ... импорты и начало класса ...

// Внутри ServiceAuthentification.js

async loadProfile() {
  if (!this.isAuthenticated()) {
    this.user = null;
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
    return null;
  }

  try {
    const res = await http.get('/profile');
    
    // Ищем данные клиента
    let clientData = res.data || res;
    if (!clientData && res && res.user_name) {
        clientData = res; 
    }

    const imgBase64 = res.img || res.data?.img || clientData?.img || clientData?.avatar;

    if (!clientData) {
         throw new Error("Данные клиента не найдены");
    }

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Мы ищем данные и по новым ключам (first_name), и по старым (user_first_name), на всякий случай
    this.user = {
      id: clientData.id,
      username: clientData.user_name,
      email: clientData.email,
      
      // Имя: ищем first_name ИЛИ user_first_name
      firstName: clientData.first_name || clientData.user_first_name || '', 
      
      // Фамилия: ищем last_name ИЛИ user_second_name
      lastName: clientData.last_name || clientData.user_second_name || '', 
      
      company: clientData.company || '', 
      
      // Телефон: ищем phone ИЛИ phone_number
      phone: clientData.phone || clientData.phone_number || '', 
      
      role: clientData.role || clientData.profile_type || 'advertiser',
      avatar: imgBase64 ? `data:image/jpeg;base64,${imgBase64}` : '/kit.jpg',
    };

    if (this.onAuthChangeCallback) {
      this.onAuthChangeCallback(this.user);
    }

    return this.user;
  } catch (err) {
    console.error('Ошибка при загрузке профиля:', err);
    if (err.status === 401) {
        this.logout();
    }
    return null;
  }
}

// ... остальные методы (updateProfile, deleteAccount) ТОЖЕ БЕЗ СЛЕШЕЙ ...
async updateProfile(formData) {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован");
    }

    // ИСПРАВЛЕНИЕ:
    // 1. Используем http.post вместо http.putFormData (или put)
    // 2. Добавляем /update к пути
    const res = await http.post('/profile/update', formData);
    
    // Также поправим чтение токена, так как структура может быть "плоской"
    const token = res.token || res.data?.token;

    if (token) {
      localStorage.setItem('token', token);
    }
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
    if (window.header?.resetCache) window.header.resetCache();
  }

  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }

  async deleteAccount() {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован для удаления.");
    }
    await http.delete('/profile');
    this.logout();
  }
}

export default new AuthService();