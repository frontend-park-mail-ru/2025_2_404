import { signin, signup } from '../public/api/auth';
import { http } from '../public/api/http';
import type { User, LoginCredentials, RegisterInfo } from '../src/types';

interface ProfileResponse {
  data?: {
    id?: number;
    user_id?: number;
    user_name?: string;
    username?: string;
    email?: string;
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    phone_number?: string;
    profile_type?: string;
    role?: string;
    avatar_path?: string;
    imageData?: {
      image_data?: string;
      content_type?: string;
    };
  };
  id?: number;
  user_id?: number;
  user_name?: string;
  username?: string;
  email?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  phone_number?: string;
  profile_type?: string;
  role?: string;
  avatar_path?: string;
  imageData?: {
    image_data?: string;
    content_type?: string;
  };
}

declare global {
  interface Window {
    header?: {
      resetCache?: () => void;
    };
  }
}

class AuthService {
  private user: User | null = null;
  private onAuthChangeCallback: ((user: User | null) => void) | null = null;

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.user;
  }

  async loadProfile(): Promise<User | null> {
    console.log('🔍 loadProfile: токен есть?', !!localStorage.getItem('token'));
    
    if (!this.isAuthenticated()) {
      console.log('❌ Нет токена, выходим');
      this.user = null;
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
      return null;
    }

    try {
      console.log('➡️ Делаю запрос на /profile');
      const res = await http.get<ProfileResponse>('/profile');
      console.log('✅ Ответ от /profile:', res);
      
      // Универсальное чтение данных профиля
      const profileData = (res as any).data || res || {};
      
      if (!profileData || Object.keys(profileData).length === 0) {
        console.error('❌ Данные профиля пустые!');
        throw new Error("Данные профиля не получены");
      }
      
      console.log('📦 Данные профиля получены:', profileData);

      // Обработка картинки
      let avatarUrl = '/kit.jpg';
      if (profileData.imageData && profileData.imageData.image_data) {
        const type = profileData.imageData.content_type || 'image/jpeg';
        avatarUrl = `data:${type};base64,${profileData.imageData.image_data}`;
        console.log('🖼️ Аватар из base64');
      } else if (profileData.avatar_path) {
        avatarUrl = `https://adnet.website/api/${profileData.avatar_path}`;
        console.log('🖼️ Аватар из пути:', avatarUrl);
      }

      this.user = {
        id: profileData.id || profileData.user_id || 0,
        username: profileData.user_name || profileData.username || '',
        email: profileData.email || '',
        firstName: profileData.first_name || profileData.firstName || '',
        lastName: profileData.last_name || profileData.lastName || '',
        company: profileData.company || '',
        phone: profileData.phone || profileData.phone_number || '',
        role: (profileData.profile_type || profileData.role || 'advertiser') as 'advertiser' | 'publisher',
        avatar: avatarUrl,
      };

      console.log('👤 User object created:', this.user);

      if (this.onAuthChangeCallback) {
        console.log('🔄 Вызываю onAuthChangeCallback с user');
        this.onAuthChangeCallback(this.user);
      }

      return this.user;
    } catch (err) {
      console.error('💥 Ошибка при загрузке профиля:', err);
      return null;
    }
  }

  async updateProfile(formData: FormData): Promise<User | null> {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован");
    }
    
    const res = await http.post<{ token?: string; data?: { token?: string } }>('/profile/update', formData);
    
    const token = (res as any).token || (res as any).data?.token;
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return await this.loadProfile();
  }

  async login(credentials: LoginCredentials): Promise<User | null> {
    await signin(credentials);
    return await this.loadProfile();
  }

  async register(info: RegisterInfo): Promise<User | null> {
    await signup(info);
    return await this.loadProfile();
  }

  logout(): void {
    localStorage.removeItem('token');
    this.user = null;

    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);

    if (window.header?.resetCache) {
      window.header.resetCache();
    }
  }

  onAuthChange(callback: (user: User | null) => void): void {
    this.onAuthChangeCallback = callback;
  }

  async deleteAccount(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован для удаления.");
    }
    await http.delete('/profile');
    this.logout();
  }
}

export default new AuthService();
