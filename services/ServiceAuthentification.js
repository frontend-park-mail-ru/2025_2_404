
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
    this.onAuthChangeCallback = null;
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async login({ email, password }) {
    const fakeUser = {
      id: Date.now(),
      email: email,
      username: email.split('@')[0] || 'TestUser',
      avatar: 'kit.jpg',
      registrationDate: new Date().toLocaleDateString('ru-RU'),
      adCount: Math.floor(Math.random() * 10),
      firstName: '',
      lastName: '',
      company: '',
      phone: ''
    };
    this.user = fakeUser;
    setCookie('user', JSON.stringify(fakeUser), 7);
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    return Promise.resolve(fakeUser);
  }

  async register({ user_name, email }) {

    const fakeUser = {
      id: Date.now(),
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

    this.user = fakeUser;
    setCookie('user', JSON.stringify(fakeUser), 7);
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(this.user);
    
    return Promise.resolve(fakeUser);
  }

  logout() {
    this.user = null;
    deleteCookie('user');
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
  }

  onAuthChange(callback) {
    this.onAuthChangeCallback = callback;
  }
  
  deleteAccount() {
    this.logout();
    return Promise.resolve({ message: 'Account deleted' });
  }
}

export default new AuthService();