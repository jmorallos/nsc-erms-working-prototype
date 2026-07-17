/**
 * Populate demo employee records (default 60).
 * Safe to re-run: skips if enough non-deleted employees already exist,
 * unless SEED_EMPLOYEES_FORCE=1.
 *
 * Usage: npm run seed:employees -w server
 *        SEED_EMPLOYEES_COUNT=65 npm run seed:employees -w server
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { ulid } from 'ulid';
import pg from 'pg';
import { getPgConfig } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env') });

const TARGET = Math.min(
  200,
  Math.max(1, Number(process.env.SEED_EMPLOYEES_COUNT || 60)),
);
const FORCE = process.env.SEED_EMPLOYEES_FORCE === '1';

const FIRST_NAMES = [
  'Maria', 'Juan', 'Ana', 'Jose', 'Rosa', 'Pedro', 'Carmen', 'Antonio',
  'Luz', 'Carlos', 'Elena', 'Miguel', 'Sofia', 'Rafael', 'Isabel', 'Diego',
  'Angela', 'Luis', 'Patricia', 'Francisco', 'Grace', 'Andres', 'Nina', 'Manuel',
  'Teresa', 'Roberto', 'Claire', 'Eduardo', 'Faith', 'Gabriel', 'Hope', 'Victor',
  'Joyce', 'Marco', 'Karen', 'Paolo', 'Lisa', 'Daniel', 'May', 'Allan',
  'Bea', 'Chris', 'Diane', 'Eric', 'Faye', 'Glenn', 'Helen', 'Ivan',
  'Jenny', 'Kevin', 'Lara', 'Mark', 'Nora', 'Owen', 'Pearl', 'Quinn',
  'Rita', 'Sam', 'Tina', 'Ulysses', 'Vera', 'Warren', 'Xena', 'Yves',
];

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
  'Flores', 'Villanueva', 'Ramos', 'Castro', 'Del Rosario', 'Fernandez', 'Gonzales',
  'Lopez', 'Martinez', 'Perez', 'Aquino', 'Diaz', 'Morales', 'Gutierrez', 'Navarro',
  'Domingo', 'Salazar', 'Padilla', 'Lim', 'Tan', 'Sy', 'Go', 'Chua',
  'Rivera', 'Santiago', 'Aguilar', 'Castillo', 'Pascual', 'Valdez', 'Mercado',
  'Alvarez', 'Romero', 'Silva', 'Nunez', 'Ortega', 'Vargas', 'Jimenez',
];

const MIDDLE = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'M.', 'P.', 'S.', 'T.'];

const STREETS = [
  'Rizal St', 'Bonifacio Ave', 'Mabini St', 'Quezon Blvd', 'Luna St',
  'National Highway', 'San Jose St', 'Catarman Road', 'University Ave', 'Market Road',
];

const BARANGAYS = [
  'Brgy. Dalakit', 'Brgy. Acacia', 'Brgy. Capoocan', 'Brgy. Jose Abad Santos',
  'Brgy. Old Rizal', 'Brgy. Polangi', 'Brgy. San Roque', 'Brgy. Washington',
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function dateYearsAgo(yearsBack) {
  const y = new Date().getFullYear() - randInt(0, yearsBack);
  const m = String(randInt(1, 12)).padStart(2, '0');
  const d = String(randInt(1, 28)).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function main() {
  const client = new pg.Client(getPgConfig());
  await client.connect();

  try {
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS n FROM employees WHERE deleted_at IS NULL`,
    );
    const existing = countRows[0].n;

    if (!FORCE && existing >= TARGET) {
      console.log(
        `Already have ${existing} employees (target ${TARGET}). Skip. Use SEED_EMPLOYEES_FORCE=1 to add more.`,
      );
      return;
    }

    const need = FORCE ? TARGET : Math.max(0, TARGET - existing);
    if (need === 0) {
      console.log('Nothing to insert.');
      return;
    }

    const { rows: deptPos } = await client.query(
      `SELECT dp.id
       FROM department_positions dp
       JOIN departments d ON d.id = dp.department_id
       JOIN positions p ON p.id = dp.position_id
       WHERE dp.is_active = TRUE AND d.is_active = TRUE AND p.is_active = TRUE
       ORDER BY d.name, p.name`,
    );
    if (!deptPos.length) {
      throw new Error('No department_positions found. Run npm run seed first.');
    }

    const { rows: types } = await client.query(
      `SELECT id FROM employment_types WHERE is_active = TRUE ORDER BY name`,
    );
    const { rows: statuses } = await client.query(
      `SELECT id, name FROM employment_statuses WHERE is_active = TRUE ORDER BY name`,
    );
    if (!types.length || !statuses.length) {
      throw new Error('Missing employment types/statuses. Run npm run seed first.');
    }

    const activeStatus =
      statuses.find((s) => /active/i.test(s.name) && !/inactive/i.test(s.name))?.id ||
      statuses[0].id;
    const otherStatuses = statuses.map((s) => s.id);

    const { rows: noRows } = await client.query(
      `SELECT employee_no FROM employees
       WHERE employee_no ~ '^[0-9]+$'
       ORDER BY employee_no::bigint DESC
       LIMIT 1`,
    );
    let nextNo = noRows[0]?.employee_no ? Number(noRows[0].employee_no) + 1 : 200001;

    await client.query('BEGIN');
    let inserted = 0;

    for (let i = 0; i < need; i++) {
      const firstName = pick(FIRST_NAMES, i + inserted);
      const lastName = pick(LAST_NAMES, i * 3 + 7);
      const middleName = pick(MIDDLE, i);
      const employeeNo = String(nextNo++);
      const email = `${firstName}.${lastName}.${employeeNo}@nsc.edu.ph`
        .toLowerCase()
        .replace(/[^a-z0-9.@]/g, '');
      const contact = `09${String(100000000 + ((i * 7919) % 899999999)).slice(0, 9)}`;
      const address = `${randInt(1, 200)} ${pick(STREETS, i)}, ${pick(BARANGAYS, i * 2)}, Catarman, Northern Samar`;
      const sex = i % 3 === 0 ? 'male' : i % 3 === 1 ? 'female' : null;
      const birthDate = dateYearsAgo(randInt(22, 55));
      const startDate = dateYearsAgo(randInt(0, 12));
      const deptPositionId = pick(deptPos, i).id;
      // ~80% active, rest mix
      const statusId =
        i % 5 === 0 ? pick(otherStatuses, i) : activeStatus;
      const typeId = pick(types, i).id;

      const empId = ulid();
      try {
        await client.query(
          `INSERT INTO employees (
             id, employee_no, first_name, middle_name, last_name,
             sex, birth_date, contact_number, email, address, remarks
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            empId,
            employeeNo,
            firstName,
            middleName,
            lastName,
            sex,
            birthDate,
            contact,
            email,
            address,
            'Demo seed employee',
          ],
        );

        await client.query(
          `INSERT INTO employee_assignments (
             id, employee_id, department_position_id, employment_type_id,
             employment_status_id, start_date, is_active, is_primary
           ) VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE)`,
          [ulid(), empId, deptPositionId, typeId, statusId, startDate],
        );
        inserted += 1;
      } catch (err) {
        if (err.code === '23505') {
          console.warn(`Skip duplicate for ${email}`);
          continue;
        }
        throw err;
      }
    }

    await client.query('COMMIT');
    console.log(`Inserted ${inserted} employees (had ${existing}, target ${TARGET}).`);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
