
/**
 * Cookie.
 * @param {string} name - Имя cookie.
 * @param {string} val - Значение cookie.
 * @param {number} days - Срок жизни cookie в днях.
 */

function setCookie(name, val, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (val || "") + expires + "; path=/";
}

/**
 * Получает значение cookie по имени.
 * @param {string} name - Имя cookie.
 * @returns {string|null} - Значение cookie или null, если не найдено.
 */

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Удаляет cookie по имени.
 * @param {string} name - Имя cookie.
 */
function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/';
}

class AuthService {
    constructor() {
        this.user = null;
        const userCookie = getCookie('user');
        if (userCookie) {
            try {
                this.user = JSON.parse(userCookie);
            } catch (e) {
                console.error("Не парсится куки юзера:", e);
                deleteCookie('user');
            }
        }
        this.onAuthChangeCallback = null;
    }

    isAuthenticated() {
        return !!this.user;
    }

    getUser() {
        return this.user;
    }

    login(userData) {
        const mockUser = {
            login: userData.login,
            avatar: ''
        };
        this.user = mockUser;
        setCookie('user', JSON.stringify(mockUser), 7);
        if (this.onAuthChangeCallback) {
            this.onAuthChangeCallback(this.user);
        }
    }
    logout() {
        this.user = null;
        deleteCookie('user');
        if (this.onAuthChangeCallback) {
            this.onAuthChangeCallback(null);
        }
    }
    onAuthChange(callback) {
        this.onAuthChangeCallback = callback;
    }
}

export default new AuthService();