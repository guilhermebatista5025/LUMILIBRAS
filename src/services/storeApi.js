import { apiRequest } from './api.js';

export const storeApi = {
  state: () => apiRequest('/store'),
  buy: (itemId, eventId) => apiRequest('/store/buy', {
    method: 'POST', body: JSON.stringify({ itemId, eventId }),
  }),
  equip: skinId => apiRequest('/store/equip', {
    method: 'POST', body: JSON.stringify({ skinId }),
  }),
};
