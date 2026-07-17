import { api } from './client.js';

export function listUsers() {
  return api('/users');
}

export function listRoles() {
  return api('/users/roles');
}

export function createUser(payload) {
  return api('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id, payload) {
  return api(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
