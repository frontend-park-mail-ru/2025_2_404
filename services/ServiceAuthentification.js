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
  if (!this.isAuthenticated()) {
    this.user = null;
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
    return null;
  }

  try {
    const res = await http.get('/profile/');
    
    const clientData = res.data?.client;
    const imgBase64 = res.data?.img; 

    if (!clientData) throw new Error("Данные клиента не найдены");

    // ИСПРАВЛЕННАЯ ЛОГИКА ОБРАБОТКИ АВАТАРА
    this.user = {
      id: clientData.id,
      username: clientData.user_name,
      email: clientData.email,
      firstName: clientData.UserFirstName || '', 
      lastName: clientData.UserLastName || '', 
      company: clientData.Company || '', 
      phone: clientData.Phone || '', 
      role: clientData.role || 'advertiser',
      
      // ИСПРАВЛЕННАЯ ОБРАБОТКА АВАТАРА:
      avatar: this.processAvatar(imgBase64),
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

// ДОБАВЬТЕ ЭТОТ МЕТОД
processAvatar(imgBase64) {
  if (!imgBase64 || imgBase64.trim() === '') {
    return '/kit.jpg'; // Дефолтный аватар
  }

  // Проверяем разные форматы изображения
  const imgString = imgBase64.trim();
  
  // Если это уже data URL
  if (imgString.startsWith('data:image')) {
    return imgString;
  }
  
  // Если это base64 без префикса (как в рабочем коде)
  if (imgString.startsWith('/9j/') || // JPEG
      imgString.startsWith('iVBOR') || // PNG
      imgString.startsWith('R0lGOD') || // GIF
      imgString.startsWith('UEs') || // SVG как base64
      imgString.length > 100) { // Длинная строка - вероятно base64
    return `data:image/jpeg;base64,${imgString}`;
  }
  
  // Если это путь к файлу
  if (imgString.startsWith('/') || imgString.includes('.')) {
    const BACKEND_SERVER_BASE = 'http://localhost:8080';
    const cleanPath = imgString.replace(/^\/?/, '');
    return `${BACKEND_SERVER_BASE}/${cleanPath}`;
  }
  
  // Во всех остальных случаях считаем это base64
  return `data:image/jpeg;base64,${imgString}`;
}

  async updateProfile(formData) {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован");
    }

    // 1. Отправляем запрос
    const res = await http.putFormData('/profile/', formData);

    // 2. ЛЕЧЕНИЕ ОШИБКИ 401:
    // Если сервер вернул новый токен при обновлении, сохраняем его!
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    
    // 3. Перезагружаем профиль
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
    await http.delete('/profile/');
    this.logout();
  }
}

export default new AuthService();