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
      const res = await http.get('/profile');
      const profileData = res.data || res || {};
      
      if (!profileData || Object.keys(profileData).length === 0) {
        throw new Error("Данные профиля не получены");
      }
      
      let avatarUrl = '/kit.jpg';
      if (profileData.imageData && profileData.imageData.image_data) {
        const type = profileData.imageData.content_type || 'image/jpeg';
        avatarUrl = `data:${type};base64,${profileData.imageData.image_data}`;
      } else if (profileData.avatar_path) {
        avatarUrl = `https://adnet.website/api/${profileData.avatar_path}`;
      }

      this.user = {
        id: profileData.id || profileData.user_id || '',
        username: profileData.user_name || profileData.username || '',
        email: profileData.email || '',
        firstName: profileData.first_name || profileData.firstName || '', 
        lastName: profileData.last_name || profileData.lastName || '', 
        company: profileData.company || '', 
        phone: profileData.phone || profileData.phone_number || '', 
        role: profileData.profile_type || profileData.role || 'advertiser',
        avatar: avatarUrl,
      };

      if (this.onAuthChangeCallback) {
        this.onAuthChangeCallback(this.user);
      }

      return this.user;
      
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err);
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
    try {
      await signin(credentials);
      const profile = await this.loadProfile();
      return profile;
    } catch (error) {
      console.error('Ошибка в login:', error);
      throw error;
    }
  }

  async register(info) {
    await signup(info);
    return await this.loadProfile();
  }

  logout() {
    localStorage.removeItem('token');
    this.user = null;
    if (this.onAuthChangeCallback) {
      this.onAuthChangeCallback(null);
    }
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
    await http.delete('/profile');
    this.logout();
  }
}

export default new AuthService();