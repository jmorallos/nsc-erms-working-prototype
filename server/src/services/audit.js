import { ulid } from 'ulid';
import { query } from '../db/pool.js';

/**
 * @param {{
 *   actorUserId?: string|null,
 *   action: string,
 *   entityType: string,
 *   entityId?: string|null,
 *   meta?: object,
 *   ip?: string|null,
 * }} entry
 */
export async function writeAudit(entry) {
  try {
    await query(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, meta, ip)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        ulid(),
        entry.actorUserId || null,
        entry.action,
        entry.entityType,
        entry.entityId || null,
        JSON.stringify(entry.meta || {}),
        entry.ip || null,
      ],
    );
  } catch (err) {
    // Never fail the main request because of audit
    console.error('audit write failed:', err.message);
  }
}

export function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}
