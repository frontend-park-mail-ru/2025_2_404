import { signin, signup } from '../public/api/auth';
import { http } from '../public/api/http';
import type { User, LoginCredentials, RegisterInfo } from '../src/types';

interface ProfileResponse {
  data?: {
    client?: {
      id: number;
      user_name: string;
      email: string;
      first_name?: string;
      last_name?: string;
      company?: string;
      phone?: string;
      role?: string;
    };
    img?: string;
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
    if (!this.isAuthenticated()) {
      this.user = null;
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
      return null;
    }

    try {
      const res = await http.get<ProfileResponse>('/profile/');
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
        role: (clientData.role as 'advertiser' | 'publisher') || 'advertiser',
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

  async updateProfile(formData: FormData): Promise<User | null> {
    if (!this.isAuthenticated()) {
      throw new Error("Пользователь не авторизован");
    }
    await http.putFormData('/profile/', formData);
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
    await http.delete('/profile/');
    this.logout();
  }
}

export default new AuthService();
