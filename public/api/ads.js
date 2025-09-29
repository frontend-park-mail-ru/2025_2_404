import { http } from "./http.js";

/**
 * Получить список объявлений.
 * @returns {Promise<Ad[]>}
 * @throws {{status:number, body:any}}
 */
export async function listAds() {
  const data = await http.get("/");
  const raw = Array.isArray(data?.ads) ? data.ads : [];

  return raw.map(item => ({
    ad_id:      item.add_id ?? "",
    creator_id: item.creater_id ?? "",
    file_path:  item.file_path ?? "",
    title:      item.title ?? "",
    text:       item.text ?? "",
  }));
}
