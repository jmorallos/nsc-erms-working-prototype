import { getEmployeeById, addEmployee, updateEmployee } from '../store/employees.js';
import { getEl, getInitials } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { populateDeptDropdowns, renderEmployeeTable } from './employeeTable.js';

let _editingEmpId = null;
let _tempPhoto = null;
let _getSearchQuery = () => '';

export function initEmployeeModal(getSearchQuery) {
    _getSearchQuery = getSearchQuery;

    getEl('emp-modal-cancel').addEventListener('click', closeEmployeeModal);
    getEl('close-emp-modal').addEventListener('click', closeEmployeeModal);
    getEl('emp-modal-save').addEventListener('click', saveEmployee);
    getEl('pic-input').addEventListener('change', (e) => previewPhoto(e.target));
    getEl('add-emp-btn').addEventListener('click', () => openEmployeeModal(null));
}

export function openEmployeeModal(empId = null) {
    _editingEmpId = empId;
    _tempPhoto = null;
    getEl('emp-modal-title').textContent = empId ? 'Edit Employee' : 'Add Employee';
    getEl('pic-input').value = '';
    populateDeptDropdowns();
    if (empId) { prefillForm(getEmployeeById(empId)); } else { clearForm(); }
    getEl('emp-overlay').classList.add('open');
}

export function closeEmployeeModal() {
    getEl('emp-overlay').classList.remove('open');
    _editingEmpId = null;
    _tempPhoto = null;
}

function previewPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        _tempPhoto = e.target.result;
        getEl('pic-preview').outerHTML = `<img id="pic-preview" src="${_tempPhoto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid var(--blue-500);" alt=""/>`;
    };
    reader.readAsDataURL(file);
}

function saveEmployee() {
    const fname = getEl('f-fname').value.trim(), lname = getEl('f-lname').value.trim(),
        email = getEl('f-email').value.trim(), position = getEl('f-position').value.trim();
    if (!fname || !lname || !email || !position) {
        showToast('Please fill in all required fields (*).', 'error');
        return;
    }
    const data = {
        fname, lname, email, position,
        contact: getEl('f-contact').value.trim(),
        address: getEl('f-address').value.trim(),
        dept: getEl('f-dept').value,
        status: getEl('f-status').value,
        start_date: getEl('f-start').value,
        picture: _tempPhoto ?? (getEmployeeById(_editingEmpId)?.picture ?? null),
    };
    if (_editingEmpId) {
        updateEmployee(_editingEmpId, data);
        showToast('Employee updated.', 'success');
    } else {
        addEmployee(data);
        showToast('Employee added.', 'success');
    }
    closeEmployeeModal();
    renderEmployeeTable(_getSearchQuery());
    populateDeptDropdowns();
}

function prefillForm(emp) {
    getEl('f-fname').value = emp.fname;
    getEl('f-lname').value = emp.lname;
    getEl('f-email').value = emp.email;
    getEl('f-contact').value = emp.contact ?? '';
    getEl('f-address').value = emp.address ?? '';
    getEl('f-position').value = emp.position;
    getEl('f-status').value = emp.status;
    getEl('f-start').value = emp.start_date ?? '';
    setTimeout(() => { const el = document.getElementById('f-dept'); if (el) el.value = emp.dept ?? ''; }, 0);
    const prevEl = getEl('pic-preview');
    if (emp.picture) {
        prevEl.outerHTML = `<img id="pic-preview" src="${emp.picture}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid var(--blue-500);" alt=""/>`;
    } else {
        prevEl.outerHTML = `<div id="pic-preview" class="pic-ini">${getInitials(emp.fname, emp.lname)}</div>`;
    }
}

function clearForm() {
    ['f-fname', 'f-lname', 'f-email', 'f-contact', 'f-address', 'f-position', 'f-start']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const statusEl = document.getElementById('f-status');
    if (statusEl) statusEl.value = 'Active';
    const prevEl = document.getElementById('pic-preview');
    if (prevEl) prevEl.outerHTML = `<div id="pic-preview" class="pic-ini">?</div>`;
}
