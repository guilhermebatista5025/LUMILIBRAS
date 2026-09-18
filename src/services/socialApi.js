import { apiRequest } from './api.js';

export const socialApi = {
  settings: () => apiRequest('/social/settings'),
  saveSettings: settings => apiRequest('/social/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  findFriends: query => apiRequest(`/social/friends?q=${encodeURIComponent(query)}`),
  friendAction: (id, action) => apiRequest(`/social/friends/${id}`, { method: 'POST', body: JSON.stringify({ action }) }),
  ranking: scope => apiRequest(`/social/ranking?scope=${scope}`),
};
