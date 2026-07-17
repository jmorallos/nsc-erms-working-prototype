import { api } from './client.js';

export function listScanInbox() {
  return api('/scan-inbox');
}

export function assignScanInboxFile(fileName, payload) {
  return api(`/scan-inbox/${encodeURIComponent(fileName)}/assign`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function rejectScanInboxFile(fileName, reason) {
  return api(`/scan-inbox/${encodeURIComponent(fileName)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
