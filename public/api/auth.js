// public/api/auth.js
import { request } from "./http.js";

/**
 * Регистрация пользователя.
 * @param {{email:string, password:string, user_name:string}} data
 */
export function signup(data) {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      user_name: data.user_name,
    }),
  });
}

/**
 * Вход пользователя.
 * @param {{email:string, password:string}} data
 */
export function signin(data) {
  return request("/signin", {
    method: "POST",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
}
