import { api } from './client.js';

export function listDepartments() {
  return api('/departments');
}

export function createDepartment(data) {
  return api('/departments', { method: 'POST', body: JSON.stringify(data) });
}

export function updateDepartment(id, data) {
  return api(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteDepartment(id) {
  return api(`/departments/${id}`, { method: 'DELETE' });
}

export function getDepartmentPositions(departmentId) {
  return api(`/lookups/departments/${departmentId}/positions`);
}

export function listPositions() {
  return api('/positions');
}

export function createPosition(data) {
  return api('/positions', { method: 'POST', body: JSON.stringify(data) });
}

export function updatePosition(id, data) {
  return api(`/positions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function listEmploymentTypes() {
  return api('/lookups/employment-types');
}

export function listEmploymentStatuses() {
  return api('/lookups/employment-statuses');
}
