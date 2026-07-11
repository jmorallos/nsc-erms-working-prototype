import { getAllDepartments, getDepartmentById, addDepartment, updateDepartment, deleteDepartment } from '../store/departments.js';
import { getAllEmployees } from '../store/employees.js';
import { getEl, setHTML } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { populateDeptDropdowns } from './employeeTable.js';

let _editingDeptId = null;

export function initDepartments() {
    getEl('add-dept-btn').addEventListener('click', () => openDeptModal(null));
    getEl('dept-modal-cancel').addEventListener('click', closeDeptModal);
    getEl('close-dept-modal').addEventListener('click', closeDeptModal);
    getEl('dept-modal-save').addEventListener('click', saveDept);
}

export function renderDepartmentPage() {
    const depts = getAllDepartments();
    const emps = getAllEmployees();
    if (!depts.length) {
        setHTML('dept-grid', '<div class="empty">No departments yet.</div>');
        return;
    }
    setHTML('dept-grid', depts.map(dept => {
        const count = emps.filter(e => e.dept === dept.name).length;
        return `
      <div class="dept-card">
        <div class="dept-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h4>${dept.name}</h4>
        <div class="dsub">${dept.description || 'No description'}</div>
        <div class="dcount">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${count} employee(s)
        </div>
        <div style="display:flex;gap:7px;">
          <button class="btn btn-sm btn-edit" data-edit-dept="${dept.id}">Edit</button>
          <button class="btn btn-sm btn-del" data-delete-dept="${dept.id}">Delete</button>
        </div>
      </div>`;
    }).join(''));

    document.querySelectorAll('[data-edit-dept]').forEach(btn => {
        btn.addEventListener('click', () => openDeptModal(Number(btn.dataset.editDept)));
    });
    document.querySelectorAll('[data-delete-dept]').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteDept(Number(btn.dataset.deleteDept)));
    });
}

function openDeptModal(deptId = null) {
    _editingDeptId = deptId;
    getEl('dept-modal-title').textContent = deptId ? 'Edit Department' : 'Add Department';
    if (deptId) {
        const d = getDepartmentById(deptId);
        getEl('d-name').value = d.name;
        getEl('d-desc').value = d.description ?? '';
    } else {
        getEl('d-name').value = '';
        getEl('d-desc').value = '';
    }
    getEl('dept-overlay').classList.add('open');
}

function closeDeptModal() {
    getEl('dept-overlay').classList.remove('open');
}

function saveDept() {
    const name = getEl('d-name').value.trim();
    if (!name) { showToast('Department name is required.', 'error'); return; }
    const data = { name, description: getEl('d-desc').value.trim() };
    if (_editingDeptId) {
        updateDepartment(_editingDeptId, data);
        showToast('Department updated.', 'success');
    } else {
        addDepartment(data);
        showToast('Department added.', 'success');
    }
    closeDeptModal();
    renderDepartmentPage();
    populateDeptDropdowns();
}

function handleDeleteDept(deptId) {
    const dept = getDepartmentById(deptId);
    const inUse = getAllEmployees().some(e => e.dept === dept?.name);
    if (inUse) { showToast('Cannot delete: department still has employees.', 'error'); return; }
    if (!confirm(`Delete department "${dept?.name}"?`)) return;
    deleteDepartment(deptId);
    renderDepartmentPage();
    populateDeptDropdowns();
    showToast('Department deleted.', 'success');
}
