// public/api/support.js
import { http } from './http.js';

const BACKEND_SERVER_BASE = 'http://89.208.230.119:8080';

function normalizeSupportImageUrl(support, imageBytes) {
  // 1) Если бэк вернул картинку байтами (base64)
  if (imageBytes) {
    const v = String(imageBytes).trim();
    if (v.startsWith('/9j/') || v.startsWith('iVBOR')) {
      // jpeg / png в base64
      return `data:image/jpeg;base64,${v}`;
    }
    if (v.startsWith('data:image')) {
      return v;
    }
  }

  // 2) Если хранится путь к файлу
  const path =
    support?.image_path ||
    support?.img_path ||
    support?.imagePath;

  if (!path) return null;

  const cleanPath = String(path).replace(/^\/?/, '');
  return `${BACKEND_SERVER_BASE}/${cleanPath}`;
}

function mapSupport(raw, imageBytes) {
  if (!raw) return null;

  return {
    id:
      raw.id ??
      raw.support_id ??
      raw.sup_id ??
      raw.uved_id,
    userId:
      raw.client_id ??
      raw.user_id ??
      raw.userID,
    status:
      raw.status ??
      raw.sup_status,
    category: raw.category,
    description:
      raw.description ??
      raw.sup_description,
    imagePath: normalizeSupportImageUrl(raw, imageBytes),
    contactName:
      raw.contact_name ??
      raw.contactName,
    contactEmail:
      raw.contact_email ??
      raw.contactEmail,
  };
}

// ============= Список обращений текущего пользователя =============
// GET /support/
export async function listSupportTickets() {
  const res = await http.get('/support/');
  const items = res.data?.uved || [];
  return items.map((raw) => mapSupport(raw, null)).filter(Boolean);
}

export async function listSupportTicketsAllUsers() {
  const res = await http.get('/supports/'); // либо '/supports/', как настроен бэк
  const items = res.data?.uved || [];
  return items.map((raw) => mapSupport(raw, null)).filter(Boolean);
}

// ============= Одно обращение =============
// GET /support/{id}
export async function getSupportTicketById(id) {
  const res = await http.get(`/support/${id}`);
  const raw = res.data?.uved || res.data || null;
  const imageBytes = res.data?.image || null;
  return mapSupport(raw, imageBytes);
}

// ============= Создать обращение =============
// POST /support/
// data: { status, category, description, contactName, contactEmail, imageFile? }
export async function createSupportTicket(data) {
  const formData = new FormData();

  if (data.status) formData.append('status', data.status);
  if (data.category) formData.append('category', data.category);
  if (data.description) formData.append('description', data.description);
  if (data.contactName) formData.append('contact_name', data.contactName);
  if (data.contactEmail) formData.append('contact_email', data.contactEmail);
  if (data.imageFile) formData.append('image', data.imageFile);

  const res = await http.post('/support/', formData);

  const raw = res.data?.uved || res.data || null;
  return mapSupport(raw, null);
}

// ============= Обновить обращение =============
// PUT /support/{id}
export async function updateSupportTicket(id, data) {
  const formData = new FormData();

  if (data.status) formData.append('status', data.status);
  if (data.category) formData.append('category', data.category);
  if (data.description) formData.append('description', data.description);
  if (data.contactName) formData.append('contact_name', data.contactName);
  if (data.contactEmail) formData.append('contact_email', data.contactEmail);
  if (data.imageFile) formData.append('image', data.imageFile);

  const res = await http.put(`/support/${id}`, formData);

  const raw = res.data?.uved || res.data || null;
  return mapSupport(raw, null);
}

// ============= Удалить обращение =============
// DELETE /support/{id}
export async function deleteSupportTicket(id) {
  return http.delete(`/support/${id}`);
}
