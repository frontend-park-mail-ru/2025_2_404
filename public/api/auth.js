import { http } from "./http.js";

/**
 * Регистрация пользователя.
 * Контракт: POST /auth/signup  → UserResponse (без пароля)
 * @param {{email:string, password:string, name:string}} userData
 * @returns {Promise<UserResponse>}
 */
export function signup(userData) {
  return http.post("/auth/signup", userData);
}

/**
 * Вход пользователя.
 * @param {{email:string, password:string}} userData
 * @returns {Promise<UserResponse>}
 */
export function signin(userData) {
  return http.post("/auth/signin", userData);
}


//на будущее
/**
 * Выход пользователя (очистка сессии).
 * @returns {Promise<void>}
 */
export function signout() {
  return http.post("/auth/signout");
}
