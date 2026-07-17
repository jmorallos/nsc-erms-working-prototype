import { Router } from 'express';
import { ulid } from 'ulid';
import { query, withClient } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { writeAudit, clientIp } from '../services/audit.js';

export const departmentsRouter = Router();

const writeRoles = requireRole('staff', 'admin', 'superadmin');

departmentsRouter.use(requireAuth);

async function loadDepartmentPositions(departmentId) {
  const { rows } = await query(
    `SELECT dp.id AS department_position_id,
            p.id AS position_id,
            p.name AS position_name,
            dp.is_active
     FROM department_positions dp
     JOIN positions p ON p.id = dp.position_id
     WHERE dp.department_id = $1
       AND dp.is_active = TRUE
       AND p.is_active = TRUE
     ORDER BY p.name`,
    [departmentId],
  );
  return rows.map((r) => ({
    departmentPositionId: r.department_position_id,
    positionId: r.position_id,
    name: r.position_name,
  }));
}

async function syncDepartmentPositions(client, departmentId, positionIds) {
  const desired = [...new Set((positionIds || []).map((id) => String(id).trim()).filter(Boolean))];

  const { rows: current } = await client.query(
    `SELECT dp.id, dp.position_id, dp.is_active, p.name AS position_name
     FROM department_positions dp
     JOIN positions p ON p.id = dp.position_id
     WHERE dp.department_id = $1`,
    [departmentId],
  );

  const byPosition = new Map(current.map((r) => [r.position_id, r]));

  // Validate all desired position IDs exist and are active
  if (desired.length) {
    const { rows: found } = await client.query(
      `SELECT id FROM positions WHERE id = ANY($1::char(26)[]) AND is_active = TRUE`,
      [desired],
    );
    if (found.length !== desired.length) {
      throw new HttpError(400, 'One or more positions are invalid', 'VALIDATION');
    }
  }

  // Activate or insert desired
  for (const positionId of desired) {
    const existing = byPosition.get(positionId);
    if (existing) {
      if (!existing.is_active) {
        await client.query(
          `UPDATE department_positions
           SET is_active = TRUE, updated_at = NOW()
           WHERE id = $1`,
          [existing.id],
        );
      }
    } else {
      await client.query(
        `INSERT INTO department_positions (id, department_id, position_id, is_active)
         VALUES ($1, $2, $3, TRUE)`,
        [ulid(), departmentId, positionId],
      );
    }
  }

  // Deactivate removed links (block if employees still assigned)
  for (const row of current) {
    if (!row.is_active) continue;
    if (desired.includes(row.position_id)) continue;

    const { rows: inUse } = await client.query(
      `SELECT 1
       FROM employee_assignments
       WHERE department_position_id = $1
         AND is_active = TRUE
         AND end_date IS NULL
       LIMIT 1`,
      [row.id],
    );
    if (inUse.length) {
      throw new HttpError(
        400,
        `Cannot remove “${row.position_name}”: employees are still assigned`,
        'IN_USE',
      );
    }

    await client.query(
      `UPDATE department_positions
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [row.id],
    );
  }
}

departmentsRouter.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at,
              COUNT(ea.id) FILTER (
                WHERE ea.is_active = TRUE AND ea.is_primary = TRUE AND ea.end_date IS NULL
              )::int AS employee_count
       FROM departments d
       LEFT JOIN department_positions dp
         ON dp.department_id = d.id AND dp.is_active = TRUE
       LEFT JOIN employee_assignments ea ON ea.department_position_id = dp.id
       WHERE d.is_active = TRUE
       GROUP BY d.id
       ORDER BY d.name`,
    );

    const departments = [];
    for (const row of rows) {
      const positions = await loadDepartmentPositions(row.id);
      departments.push({
        ...row,
        employeeCount: row.employee_count,
        positions,
      });
    }

    res.json({ departments });
  } catch (err) {
    next(err);
  }
});

departmentsRouter.post('/', writeRoles, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const positionIds = Array.isArray(req.body?.positionIds) ? req.body.positionIds : [];
    if (!name) throw new HttpError(400, 'Name is required', 'VALIDATION');

    const id = ulid();
    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query(
          `INSERT INTO departments (id, name, description)
           VALUES ($1, $2, $3)`,
          [id, name, description],
        );
        await syncDepartmentPositions(client, id, positionIds);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });

    await writeAudit({
      actorUserId: req.session.userId,
      action: 'department.create',
      entityType: 'department',
      entityId: id,
      meta: { name, positionIds },
      ip: clientIp(req),
    });

    const positions = await loadDepartmentPositions(id);
    res.status(201).json({
      department: {
        id,
        name,
        description,
        is_active: true,
        employee_count: 0,
        employeeCount: 0,
        positions,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return next(new HttpError(409, 'Department name already exists', 'CONFLICT'));
    }
    next(err);
  }
});

departmentsRouter.patch('/:id', writeRoles, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description ?? '').trim();
    if (!name) throw new HttpError(400, 'Name is required', 'VALIDATION');

    const hasPositionIds = Array.isArray(req.body?.positionIds);

    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const { rows } = await client.query(
          `UPDATE departments
           SET name = $2, description = $3, updated_at = NOW()
           WHERE id = $1 AND is_active = TRUE
           RETURNING id`,
          [req.params.id, name, description],
        );
        if (!rows[0]) throw new HttpError(404, 'Department not found', 'NOT_FOUND');

        if (hasPositionIds) {
          await syncDepartmentPositions(client, req.params.id, req.body.positionIds);
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });

    await writeAudit({
      actorUserId: req.session.userId,
      action: 'department.update',
      entityType: 'department',
      entityId: req.params.id,
      meta: {
        name,
        positionIds: hasPositionIds ? req.body.positionIds : undefined,
      },
      ip: clientIp(req),
    });

    const { rows } = await query(
      `SELECT d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at,
              COUNT(ea.id) FILTER (
                WHERE ea.is_active = TRUE AND ea.is_primary = TRUE AND ea.end_date IS NULL
              )::int AS employee_count
       FROM departments d
       LEFT JOIN department_positions dp
         ON dp.department_id = d.id AND dp.is_active = TRUE
       LEFT JOIN employee_assignments ea ON ea.department_position_id = dp.id
       WHERE d.id = $1
       GROUP BY d.id`,
      [req.params.id],
    );

    const positions = await loadDepartmentPositions(req.params.id);
    res.json({
      department: {
        ...rows[0],
        employeeCount: rows[0]?.employee_count ?? 0,
        positions,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return next(new HttpError(409, 'Department name already exists', 'CONFLICT'));
    }
    next(err);
  }
});

departmentsRouter.delete('/:id', writeRoles, async (req, res, next) => {
  try {
    const { rows: inUse } = await query(
      `SELECT 1
       FROM employee_assignments ea
       JOIN department_positions dp ON dp.id = ea.department_position_id
       WHERE dp.department_id = $1
         AND ea.is_active = TRUE
         AND ea.end_date IS NULL
       LIMIT 1`,
      [req.params.id],
    );
    if (inUse.length) {
      throw new HttpError(
        400,
        'Cannot delete: department still has active employees',
        'IN_USE',
      );
    }

    const { rows } = await query(
      `UPDATE departments
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id`,
      [req.params.id],
    );
    if (!rows[0]) throw new HttpError(404, 'Department not found', 'NOT_FOUND');

    await query(
      `UPDATE department_positions
       SET is_active = FALSE, updated_at = NOW()
       WHERE department_id = $1 AND is_active = TRUE`,
      [req.params.id],
    );

    await writeAudit({
      actorUserId: req.session.userId,
      action: 'department.delete',
      entityType: 'department',
      entityId: req.params.id,
      ip: clientIp(req),
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
