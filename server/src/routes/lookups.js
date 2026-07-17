import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const lookupsRouter = Router();

lookupsRouter.use(requireAuth);

lookupsRouter.get('/departments', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, description, is_active
       FROM departments
       WHERE is_active = TRUE
       ORDER BY name`,
    );
    res.json({ departments: rows });
  } catch (err) {
    next(err);
  }
});

lookupsRouter.get('/positions', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, is_active FROM positions WHERE is_active = TRUE ORDER BY name`,
    );
    res.json({ positions: rows });
  } catch (err) {
    next(err);
  }
});

/** Positions available for a department (via department_positions). */
lookupsRouter.get('/departments/:departmentId/positions', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT dp.id AS department_position_id,
              p.id AS position_id,
              p.name AS position_name,
              d.id AS department_id,
              d.name AS department_name
       FROM department_positions dp
       JOIN positions p ON p.id = dp.position_id
       JOIN departments d ON d.id = dp.department_id
       WHERE dp.department_id = $1
         AND dp.is_active = TRUE
         AND p.is_active = TRUE
       ORDER BY p.name`,
      [req.params.departmentId],
    );
    res.json({ positions: rows });
  } catch (err) {
    next(err);
  }
});

lookupsRouter.get('/employment-types', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name FROM employment_types WHERE is_active = TRUE ORDER BY name`,
    );
    res.json({ employmentTypes: rows });
  } catch (err) {
    next(err);
  }
});

lookupsRouter.get('/employment-statuses', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name FROM employment_statuses WHERE is_active = TRUE ORDER BY name`,
    );
    res.json({ employmentStatuses: rows });
  } catch (err) {
    next(err);
  }
});

lookupsRouter.get('/document-types', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, description, is_required
       FROM document_types
       WHERE is_active = TRUE
       ORDER BY name`,
    );
    res.json({
      documentTypes: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isRequired: r.is_required,
      })),
    });
  } catch (err) {
    next(err);
  }
});
