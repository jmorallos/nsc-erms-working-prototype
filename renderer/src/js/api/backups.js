import { api } from './client.js';

export function listBackups() {
  return api('/backups');
}

export function createBackup() {
  return api('/backups', { method: 'POST', body: '{}' });
}

export function deleteBackup(id) {
  return api(`/backups/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function downloadBackupUrl(id) {
  return `/api/v1/backups/${encodeURIComponent(id)}/download`;
}
