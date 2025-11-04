const API_BASE_URL = 'http://localhost:8080';

function setCookie(name, val, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = `${name}=${val || ''}${expires}; path=/`;
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=-99999999; path=/';
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

class AuthService {
  constructor() {
    const saved = getCookie('user');
    this.user = saved ? safeParse(saved) : null;
    this.token = getCookie('authToken');
    this.onAuthChangeCallback = null;
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  async login({ email, password }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data.token) {
        throw new Error('Invalid response from server');
      }

      this.token = data.data.token;
      const tokenPayload = JSON.parse(atob(this.token.split('.')[1]));
      
      const user = {
        id: tokenPayload.userId || Date.now(),
        email: email,
        username: tokenPayload.username || email.split('@')[0],
        avatar: 'kit.jpg',
        registrationDate: new Date().toLocaleDateString('ru-RU'),
        adCount: 0,
        firstName: tokenPayload.firstName || '',
        lastName: tokenPayload.lastName || '',
        company: tokenPayload.company || '',
        phone: tokenPayload.phone || ''
      };

      this.user = user;
      setCookie('authToken', this.token, 7);
      setCookie('user', JSON.stringify(user), 7);
      
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
      
      return user;
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register({ user_name, email, password }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: user_name,
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data.token) {
        throw new Error('Invalid response from server');
      }

      this.token = data.data.token;
      const tokenPayload = JSON.parse(atob(this.token.split('.')[1]));
      const user = {
        id: tokenPayload.userId || Date.now(),
        email: email,
        username: user_name,
        avatar: 'kit.jpg',
        registrationDate: new Date().toLocaleDateString('ru-RU'),
        adCount: 0,
        firstName: '',
        lastName: '',
        company: '',
        phone: ''
      };

      this.user = user;
      setCookie('authToken', this.token, 7);
      setCookie('user', JSON.stringify(user), 7);
      
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
      
      return user;
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout() {
    this.user = null;
    this.token = null;
    deleteCookie('authToken');
    deleteCookie('user');
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
  }

  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async deleteAccount() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.logout();
      return { message: 'Account deleted' };
      
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }
}

export default new AuthService();