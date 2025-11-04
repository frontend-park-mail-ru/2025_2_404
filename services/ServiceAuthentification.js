import { signin, signup, logout as apiLogout } from '../public/api/auth.js';
import { http } from '../public/api/http.js';

class AuthService {
  constructor() {
    this.user = null;
    this.onAuthChangeCallback = null;
  }

  /** Возвращает сохранённый токен JWT */
  getToken() {
    return localStorage.getItem('token');
  }

  /** Проверка, авторизован ли пользователь */
  isAuthenticated() {
    return !!this.getToken();
  }

  /** Получить объект пользователя (если он уже загружен) */
  getUser() {
    return this.user;
  }
  
  /** Загрузка данных профиля при наличии токена */
  async loadProfile() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await http.get('/profile/');
      this.user = res.data?.client ?? null;

      if (this.user) {
        // нормализуем структуру данных от бэка
        this.user = {
          id: this.user.id,
          username: this.user.user_name, // ключевое место
          email: this.user.email,
          avatar: this.user.avatar || '/assets/img/default-avatar.png',
        };

        localStorage.setItem('user', JSON.stringify(this.user));
      }

      if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
      return this.user;
    } catch (err) {
      console.warn('Ошибка при загрузке профиля:', err);
      this.logout();
      return null;
    }
  }


  /** Вход пользователя (получение токена и профиля) */
  async login(credentials) {
    const data = await signin(credentials);
    if (data.token) localStorage.setItem('token', data.token);

    // если сервер возвращает user — используем его сразу
    this.user = data.user ?? null;

    // если нет — попробуем загрузить профиль
    if (!this.user) await this.loadProfile();

    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    return this.user;
  }

  /** Регистрация нового пользователя */
  async register(info) {
    const data = await signup(info);
    if (data.token) localStorage.setItem('token', data.token);

    this.user = data.user ?? null;
    if (!this.user) await this.loadProfile();

    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    return this.user;
  }

  /** Выход */
  logout() {
    localStorage.removeItem('token');
    this.user = null;
    apiLogout?.();
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
  }

  /** Подписка на событие авторизации */
  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }
}

export default new AuthService();
