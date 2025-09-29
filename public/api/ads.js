
import { http } from "./http.js";

/**
 * @typedef {object} Ad
 * @property {string} ad_id
 * @property {string} creator_id
 * @property {string} [file_path]
 * @property {string} title
 * @property {string} text
 */

/**
 * Получить список объявлений.
 * @returns {Promise<Ad[]>}
 * @throws {{status:number, body:any}}
 */
export function listAds() {
  return http.get("/ads");
}

/**
 * Создать объявление.
 * @param {{title:string, text:string, file_path?:string}} adData
 * @returns {Promise<Ad>}
 * @throws {{status:number, body:any}}
 */
export function createAd(adData) {
  return http.post("/ads", adData);
}