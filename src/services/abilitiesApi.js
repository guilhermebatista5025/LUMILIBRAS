import { apiRequest } from './api.js';

export const abilitiesApi = {
  state: () => apiRequest('/abilities'),
  use: (abilityId, scope, context = {}) => apiRequest('/abilities/use', {
    method: 'POST', body: JSON.stringify({ abilityId, scope, context }),
  }),
  review: (abilityId, scope, answers = null) => apiRequest('/abilities/review', {
    method: 'POST', body: JSON.stringify({ abilityId, scope, answers }),
  }),
};
