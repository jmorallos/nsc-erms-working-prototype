import { query } from '../db/pool.js';
import { config } from '../config.js';

export async function getAppSetting(key, fallback = null) {
  const { rows } = await query(
    'SELECT value FROM app_settings WHERE key = $1',
    [key],
  );
  if (!rows[0]) return fallback;
  return rows[0].value;
}

export async function getFilesRoot() {
  const fromDb = await getAppSetting('files_root', null);
  if (typeof fromDb === 'string' && fromDb.trim()) return fromDb.trim();
  return config.filesRoot;
}

export async function getMaxUploadBytes() {
  const fromDb = await getAppSetting('max_upload_bytes', null);
  const n = Number(fromDb);
  if (Number.isFinite(n) && n > 0) return Math.min(n, 31457280);
  return config.maxUploadBytes;
}
