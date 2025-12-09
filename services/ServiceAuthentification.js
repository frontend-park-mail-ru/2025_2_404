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

  async loadProfile() {
    console.log('🔍 loadProfile: токен есть?', !!localStorage.getItem('token'));
    console.log('🔍 Токен:', localStorage.getItem('token')?.substring(0, 50) + '...');
    
    if (!this.isAuthenticated()) {
      console.log('❌ Нет токена, выходим');
      this.user = null;
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
      return null;
    }

    try {
      console.log('➡️ Делаю запрос на /profile');
      const res = await http.get('/profile');
      console.log('✅ Ответ от /profile:', res);
      
      // СМОТРИМ НА СКРИНШОТ: Данные лежат прямо в res.data
      const profileData = res.data || {};

      // Если данные пустые (например, 404), кидаем ошибку
      if (!profileData.user_name && !profileData.email) {
          console.error('❌ Данные профиля пустые!');
          throw new Error("Данные профиля не получены");
      }

      console.log('📦 Данные профиля получены:', profileData);

      // Обработка картинки
      let avatarUrl = '/kit.jpg';
      if (profileData.imageData && profileData.imageData.image_data) {
          // Сервер присылает чистый base64, добавляем префикс
          const type = profileData.imageData.content_type || 'image/jpeg';
          avatarUrl = `data:${type};base64,${profileData.imageData.image_data}`;
          console.log('🖼️ Аватар из base64');
      } else if (profileData.avatar_path) {
          // На случай если сервер вернет путь (как в /update)
          avatarUrl = `http://localhost:8080/${profileData.avatar_path}`;
          console.log('🖼️ Аватар из пути:', avatarUrl);
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

      console.log('👤 User object created:', this.user);

      if (this.onAuthChangeCallback) {
        console.log('🔄 Вызываю onAuthChangeCallback с user');
        this.onAuthChangeCallback(this.user);
      } else {
        console.log('⚠️ onAuthChangeCallback не установлен!');
      }

      return this.user;
    } catch (err) {
      console.error('💥 Ошибка при загрузке профиля:', err);
      console.error('Status:', err.status);
      console.error('Body:', err.body);
      if (err.status === 401) {
          console.log('🔒 401 Unauthorized, делаю logout');
          this.logout();
      }
      return null;
    }
  }

  async updateProfile(formData) {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован");
    }

    const res = await http.post('/profile/update', formData);
    
    const token = res.token || res.data?.token;

    if (token) {
      localStorage.setItem('token', token);
    }
    return await this.loadProfile();
  }

  async login(credentials) {
    console.log('🔐 Начинаю login...');
    const signinResult = await signin(credentials);
    console.log('🔐 signin завершен:', signinResult);
    
    console.log('🔐 Токен в localStorage после signin:', localStorage.getItem('token'));
    
    const profile = await this.loadProfile();
    console.log('🔐 Профиль загружен:', profile);
    
    return profile;
  }

  async register(info) {
    await signup(info);
    return await this.loadProfile();
  }

  logout() {
    console.log('🚪 Выход из системы');
    localStorage.removeItem('token');
    this.user = null;
    if (this.onAuthChangeCallback) {
      console.log('🔄 Вызываю onAuthChangeCallback с null');
      this.onAuthChangeCallback(null);
    }
    if (window.header?.resetCache) {
      window.header.resetCache();
    }
  }

  onAuthChange(callback) {
    console.log('🎯 Установлен onAuthChangeCallback');
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