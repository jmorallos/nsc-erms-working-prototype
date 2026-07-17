import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
} from '../api/employees.js';
import {
  listDepartments,
  getDepartmentPositions,
  listEmploymentTypes,
  listEmploymentStatuses,
} from '../api/departments.js';
import { uploadEmployeePhoto, employeePhotoUrl } from '../api/documents.js';
import { ApiError } from '../api/client.js';
import { getEl, getInitials, getToday } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { renderEmployeeTable, refreshFilterDropdowns } from './employeeTable.js';

let _editingEmpId = null;
let _getSearchQuery = () => '';
let _employmentTypes = [];
let _employmentStatuses = [];
let _pendingPhotoFile = null;
let _previewObjectUrl = null;

export function initEmployeeModal(getSearchQuery) {
  _getSearchQuery = getSearchQuery;

  getEl('emp-modal-cancel').addEventListener('click', closeEmployeeModal);
  getEl('close-emp-modal').addEventListener('click', closeEmployeeModal);
  getEl('emp-modal-save').addEventListener('click', () => {
    saveEmployee().catch((err) => {
      showToast(err instanceof ApiError ? err.message : 'Save failed.', 'error');
    });
  });
  getEl('pic-input').addEventListener('change', (e) => previewPhoto(e.target));
  getEl('add-emp-btn').addEventListener('click', () => openEmployeeModal(null));
  getEl('f-dept').addEventListener('change', () => {
    loadPositionsForDepartment(getEl('f-dept').value).catch(() => {
      resetPositionSelect();
    });
  });
}

export async function openEmployeeModal(empId = null) {
  _editingEmpId = empId;
  _pendingPhotoFile = null;
  if (_previewObjectUrl) {
    URL.revokeObjectURL(_previewObjectUrl);
    _previewObjectUrl = null;
  }
  getEl('emp-modal-title').textContent = empId ? 'Edit Employee' : 'Add Employee';
  getEl('pic-input').value = '';
  getEl('emp-overlay').classList.add('open');

  try {
    await Promise.all([loadDeptOptions(), loadTypeAndStatusOptions()]);
    if (empId) {
      const { employee } = await getEmployee(empId);
      await prefillForm(employee);
    } else {
      clearForm();
    }
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'Could not open form.', 'error');
    closeEmployeeModal();
  }
}

export function closeEmployeeModal() {
  getEl('emp-overlay').classList.remove('open');
  _editingEmpId = null;
  _pendingPhotoFile = null;
  if (_previewObjectUrl) {
    URL.revokeObjectURL(_previewObjectUrl);
    _previewObjectUrl = null;
  }
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  _pendingPhotoFile = file;
  if (_previewObjectUrl) URL.revokeObjectURL(_previewObjectUrl);
  _previewObjectUrl = URL.createObjectURL(file);
  getEl('pic-preview').outerHTML =
    `<img id="pic-preview" src="${_previewObjectUrl}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid var(--blue-500);" alt=""/>`;
}

async function loadDeptOptions() {
  const { departments } = await listDepartments();
  const select = getEl('f-dept');
  const cur = select.value;
  select.innerHTML =
    '<option value="">Select department</option>' +
    departments
      .map((d) => `<option value="${d.id}">${escapeAttr(d.name)}</option>`)
      .join('');
  if (cur) select.value = cur;
}

async function loadTypeAndStatusOptions() {
  const [typesRes, statusRes] = await Promise.all([
    listEmploymentTypes(),
    listEmploymentStatuses(),
  ]);
  _employmentTypes = typesRes.employmentTypes;
  _employmentStatuses = statusRes.employmentStatuses;

  const typeEl = getEl('f-emp-type');
  typeEl.innerHTML = _employmentTypes
    .map((t) => `<option value="${t.id}">${escapeAttr(t.name)}</option>`)
    .join('');

  const statusEl = getEl('f-status');
  statusEl.innerHTML = _employmentStatuses
    .map((s) => `<option value="${s.id}">${escapeAttr(s.name)}</option>`)
    .join('');
}

async function loadPositionsForDepartment(departmentId, selectedDepartmentPositionId = '') {
  const posEl = getEl('f-position');
  if (!departmentId) {
    resetPositionSelect();
    return;
  }
  posEl.disabled = true;
  posEl.innerHTML = '<option value="">Loading…</option>';
  const { positions } = await getDepartmentPositions(departmentId);
  if (!positions.length) {
    posEl.innerHTML = '<option value="">No positions for this department</option>';
    posEl.disabled = true;
    return;
  }
  posEl.innerHTML =
    '<option value="">Select position</option>' +
    positions
      .map(
        (p) =>
          `<option value="${p.department_position_id}">${escapeAttr(p.position_name)}</option>`,
      )
      .join('');
  posEl.disabled = false;
  if (selectedDepartmentPositionId) {
    posEl.value = selectedDepartmentPositionId;
  }
}

function resetPositionSelect() {
  const posEl = getEl('f-position');
  posEl.innerHTML = '<option value="">Select department first</option>';
  posEl.disabled = true;
}

async function saveEmployee() {
  const firstName = getEl('f-fname').value.trim();
  const lastName = getEl('f-lname').value.trim();
  const email = getEl('f-email').value.trim();
  const departmentId = getEl('f-dept').value;
  const departmentPositionId = getEl('f-position').value;
  const employmentTypeId = getEl('f-emp-type').value;
  const employmentStatusId = getEl('f-status').value;
  const startDate = getEl('f-start').value;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !departmentId ||
    !departmentPositionId ||
    !employmentTypeId ||
    !employmentStatusId ||
    !startDate
  ) {
    showToast('Please fill in all required fields (*).', 'error');
    return;
  }

  const payload = {
    firstName,
    lastName,
    email,
    contactNumber: getEl('f-contact').value.trim(),
    address: getEl('f-address').value.trim(),
    departmentPositionId,
    employmentTypeId,
    employmentStatusId,
    startDate,
  };

  const btn = getEl('emp-modal-save');
  btn.disabled = true;
  try {
    let employeeId = _editingEmpId;
    if (_editingEmpId) {
      await updateEmployee(_editingEmpId, payload);
      showToast('Employee updated.', 'success');
    } else {
      const { employee } = await createEmployee(payload);
      employeeId = employee.id;
      showToast('Employee added.', 'success');
    }
    if (_pendingPhotoFile && employeeId) {
      await uploadEmployeePhoto(employeeId, _pendingPhotoFile);
    }
    closeEmployeeModal();
    await renderEmployeeTable(_getSearchQuery());
    await refreshFilterDropdowns();
  } finally {
    btn.disabled = false;
  }
}

async function prefillForm(emp) {
  getEl('f-fname').value = emp.firstName;
  getEl('f-lname').value = emp.lastName;
  getEl('f-email').value = emp.email;
  getEl('f-contact').value = emp.contactNumber ?? '';
  getEl('f-address').value = emp.address ?? '';

  const a = emp.assignment;
  if (a?.employmentTypeId) getEl('f-emp-type').value = a.employmentTypeId;
  if (a?.employmentStatusId) getEl('f-status').value = a.employmentStatusId;
  getEl('f-start').value = a?.startDate ? String(a.startDate).slice(0, 10) : '';

  if (a?.departmentId) {
    getEl('f-dept').value = a.departmentId;
    await loadPositionsForDepartment(a.departmentId, a.departmentPositionId);
  } else {
    resetPositionSelect();
  }

  const prevEl = getEl('pic-preview');
  if (emp.photoUrl || emp.profilePicturePath) {
    prevEl.outerHTML =
      `<img id="pic-preview" src="${emp.photoUrl || employeePhotoUrl(emp.id)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid var(--blue-500);" alt=""/>`;
  } else {
    prevEl.outerHTML = `<div id="pic-preview" class="pic-ini">${getInitials(emp.firstName, emp.lastName)}</div>`;
  }
}

function clearForm() {
  _pendingPhotoFile = null;
  if (_previewObjectUrl) {
    URL.revokeObjectURL(_previewObjectUrl);
    _previewObjectUrl = null;
  }
  ['f-fname', 'f-lname', 'f-email', 'f-contact', 'f-address'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  getEl('f-dept').value = '';
  resetPositionSelect();
  getEl('f-start').value = getToday();
  if (_employmentTypes[0]) getEl('f-emp-type').value = _employmentTypes[0].id;
  const active = _employmentStatuses.find((s) => s.name === 'Active');
  if (active) getEl('f-status').value = active.id;
  else if (_employmentStatuses[0]) getEl('f-status').value = _employmentStatuses[0].id;
  const prevEl = document.getElementById('pic-preview');
  if (prevEl) prevEl.outerHTML = `<div id="pic-preview" class="pic-ini">?</div>`;
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
