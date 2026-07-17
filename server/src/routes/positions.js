import { Router } from 'express';
import { ulid } from 'ulid';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { writeAudit, clientIp } from '../services/audit.js';

export const positionsRouter = Router();

const writeRoles = requireRole('staff', 'admin', 'superadmin');

positionsRouter.use(requireAuth);

positionsRouter.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, is_active, created_at, updated_at
       FROM positions
       WHERE is_active = TRUE
       ORDER BY name`,
    );
    res.json({ positions: rows });
  } catch (err) {
    next(err);
  }
});

positionsRouter.post('/', writeRoles, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) throw new HttpError(400, 'Name is required', 'VALIDATION');
    if (name.length > 80) {
      throw new HttpError(400, 'Position name must be 80 characters or fewer', 'VALIDATION');
    }

    const id = ulid();
    try {
      const { rows } = await query(
        `INSERT INTO positions (id, name)
         VALUES ($1, $2)
         RETURNING id, name, is_active, created_at, updated_at`,
        [id, name],
      );

      await writeAudit({
        actorUserId: req.session.userId,
        action: 'position.create',
        entityType: 'position',
        entityId: id,
        meta: { name },
        ip: clientIp(req),
      });

      res.status(201).json({ position: rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        // Reactivate soft-deleted name collision, or return existing active
        const { rows: existing } = await query(
          `SELECT id, name, is_active, created_at, updated_at
           FROM positions WHERE lower(name) = lower($1)`,
          [name],
        );
        if (existing[0] && !existing[0].is_active) {
          const { rows } = await query(
            `UPDATE positions
             SET is_active = TRUE, name = $2, updated_at = NOW()
             WHERE id = $1
             RETURNING id, name, is_active, created_at, updated_at`,
            [existing[0].id, name],
          );
          await writeAudit({
            actorUserId: req.session.userId,
            action: 'position.reactivate',
            entityType: 'position',
            entityId: rows[0].id,
            meta: { name },
            ip: clientIp(req),
          });
          return res.status(200).json({ position: rows[0], reactivated: true });
        }
        throw new HttpError(409, 'Position name already exists', 'CONFLICT');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

positionsRouter.patch('/:id', writeRoles, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) throw new HttpError(400, 'Name is required', 'VALIDATION');
    if (name.length > 80) {
      throw new HttpError(400, 'Position name must be 80 characters or fewer', 'VALIDATION');
    }

    const { rows } = await query(
      `UPDATE positions
       SET name = $2, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name, is_active, created_at, updated_at`,
      [req.params.id, name],
    );
    if (!rows[0]) throw new HttpError(404, 'Position not found', 'NOT_FOUND');

    await writeAudit({
      actorUserId: req.session.userId,
      action: 'position.update',
      entityType: 'position',
      entityId: req.params.id,
      meta: { name },
      ip: clientIp(req),
    });

    res.json({ position: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return next(new HttpError(409, 'Position name already exists', 'CONFLICT'));
    }
    next(err);
  }
});
