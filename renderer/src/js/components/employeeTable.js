import { getAllEmployees } from '../store/employees.js';
import { getAllDepartments } from '../store/departments.js';
import { getAvatarHTML, getStatusBadge, getEl } from '../utils/helpers.js';
import { openProfilePanel } from './profilePanel.js';

export function initEmployeeTable() {
    getEl('filter-dept').addEventListener('change', () => renderEmployeeTable());
    getEl('filter-status').addEventListener('change', () => renderEmployeeTable());
}

export function renderEmployeeTable(searchQuery = '') {
    const deptFilter = getEl('filter-dept').value;
    const statusFilter = getEl('filter-status').value;
    const q = searchQuery.toLowerCase();

    const filtered = getAllEmployees().filter(emp => {
        const matchesSearch = !q || [emp.fname, emp.lname, emp.email, emp.position, emp.dept]
            .some(field => (field ?? '').toLowerCase().includes(q));
        const matchesDept = !deptFilter || emp.dept === deptFilter;
        const matchesStatus = !statusFilter || emp.status === statusFilter;
        return matchesSearch && matchesDept && matchesStatus;
    });

    const emptyEl = getEl('emp-empty');
    const tbody = getEl('emp-tbody');
    emptyEl.style.display = filtered.length ? 'none' : 'block';
    tbody.innerHTML = filtered.map((emp, i) => buildEmployeeRow(emp, i + 1)).join('');

    tbody.querySelectorAll('tr').forEach((row, i) => {
        const emp = filtered[i];
        row.querySelector('[data-profile-trigger]')?.addEventListener('click', () => openProfilePanel(emp.id));
    });

    const badge = document.getElementById('emp-count-badge');
    if (badge) badge.textContent = getAllEmployees().length;
}

export function populateDeptDropdowns() {
    const depts = getAllDepartments();
    const opts = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');

    const filterEl = document.getElementById('filter-dept');
    if (filterEl) {
        const cur = filterEl.value;
        filterEl.innerHTML = '<option value="">All Departments</option>' + opts;
        filterEl.value = cur;
    }

    const modalEl = document.getElementById('f-dept');
    if (modalEl) modalEl.innerHTML = opts;
}

function buildEmployeeRow(emp, rowNumber) {
    return `
    <tr>
      <td style="color:var(--text-3);font-size:12px;font-family:'DM Mono',monospace;">${String(rowNumber).padStart(2, '0')}</td>
      <td style="cursor:pointer;" data-profile-trigger>
        <div style="display:flex;align-items:center;gap:10px;">
          ${getAvatarHTML(emp, 34, 12)}
          <div>
            <div style="font-weight:700;color:var(--blue-900);letter-spacing:-.2px;">${emp.fname} ${emp.lname}</div>
            <div style="font-size:11px;color:var(--text-3);">${emp.email}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text-2);font-size:12.5px;">${emp.contact || '—'}</td>
      <td style="font-weight:500;">${emp.position}</td>
      <td style="color:var(--text-2);">${emp.dept || '—'}</td>
      <td>${getStatusBadge(emp.status)}</td>
    </tr>`;
}
