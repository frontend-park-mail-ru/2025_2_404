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

// services/ServiceAuthentification.js

async loadProfile() {
  if (!this.isAuthenticated()) {
    this.user = null;
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
    return null;
  }

  try {
    const res = await http.get('/profile'); // Убрал лишний слэш
    
    // СМОТРИМ НА СКРИНШОТ: Данные лежат прямо в res.data
    const profileData = res.data || {};

    // Если данные пустые (например, 404), кидаем ошибку
    if (!profileData.user_name && !profileData.email) {
        throw new Error("Данные профиля не получены");
    }

    // Обработка картинки
    let avatarUrl = '/kit.jpg';
    if (profileData.imageData && profileData.imageData.image_data) {
        // Сервер присылает чистый base64, добавляем префикс
        const type = profileData.imageData.content_type || 'image/jpeg';
        avatarUrl = `data:${type};base64,${profileData.imageData.image_data}`;
    } else if (profileData.avatar_path) {
        // На случай если сервер вернет путь (как в /update)
        avatarUrl = `http://localhost:8080/${profileData.avatar_path}`;
    }

    this.user = {
      id: profileData.id, // Если сервер его не шлет, будет undefined
      username: profileData.user_name,
      email: profileData.email,
      firstName: profileData.first_name || '', 
      lastName: profileData.last_name || '', 
      company: profileData.company || '', 
      phone: profileData.phone || '', 
      role: profileData.profile_type || 'advertiser',
      avatar: avatarUrl,
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