import {
  listSupportTickets,
  listSupportTicketsAllUsers,
  getSupportTicketById,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
} from '../api/support.js';

const supportRepository = {
  async getAll() {
    return listSupportTickets();
  },

  getAllForAllUsers() {
    return listSupportTicketsAllUsers();
  },

  async getById(id) {
    return getSupportTicketById(id);
  },

  async create(data) {
    return createSupportTicket(data);
  },

  async update(id, data) {
    return updateSupportTicket(id, data);
  },

  async delete(id) {
    return deleteSupportTicket(id);
  },
};

export default supportRepository;
