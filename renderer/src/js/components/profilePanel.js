import { getEmployeeById, deleteEmployee } from '../store/employees.js';
import { getEl, setHTML, getInitials, getStatusBadge, getYearsOfService } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { renderEmployeeTable } from './employeeTable.js';
import { openEmployeeModal } from './employeeModal.js';
import { renderTabDocs } from './documents.js';

let _panelEmpId = null;
let _getSearchQuery = () => '';

export function initProfilePanel(getSearchQuery) {
    _getSearchQuery = getSearchQuery;
    getEl('panel-backdrop').addEventListener('click', closeProfilePanel);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
    });
}

export function openProfilePanel(empId) {
    const emp = getEmployeeById(empId);
    if (!emp) return;
    _panelEmpId = empId;
    renderPanelHeader(emp);
    activateTab('info');
    renderTabInfo(emp);
    getEl('panel').classList.add('open');
    getEl('panel-backdrop').classList.add('open');
}

export function closeProfilePanel() {
    getEl('panel').classList.remove('open');
    getEl('panel-backdrop').classList.remove('open');
    _panelEmpId = null;
}

export function refreshPanelHeader() {
    if (_panelEmpId === null) return;
    const emp = getEmployeeById(_panelEmpId);
    if (emp) renderPanelHeader(emp);
}

function switchTab(tabName, buttonEl) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    buttonEl.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    getEl('tab-' + tabName).classList.add('active');
    if (_panelEmpId === null) return;
    const emp = getEmployeeById(_panelEmpId);
    if (!emp) return;
    if (tabName === 'info') renderTabInfo(emp);
    if (tabName === 'employment') renderTabEmployment(emp);
    if (tabName === 'docs') renderTabDocs(emp);
}

function renderTabInfo(emp) {
    setHTML('tab-info', `
    <div class="info-section">
      <h4>Personal Information</h4>
      <div class="info-row"><span class="ir-label">Full Name</span><span class="ir-val">${emp.fname} ${emp.lname}</span></div>
      <div class="info-row"><span class="ir-label">Email</span><span class="ir-val">${emp.email}</span></div>
      <div class="info-row"><span class="ir-label">Contact</span><span class="ir-val">${emp.contact || '—'}</span></div>
      <div class="info-row"><span class="ir-label">Address</span><span class="ir-val">${emp.address || '—'}</span></div>
    </div>`);
}

function renderTabEmployment(emp) {
    setHTML('tab-employment', `
    <div class="info-section">
      <h4>Employment Details</h4>
      <div class="info-row"><span class="ir-label">Employee ID</span><span class="ir-val" style="font-family:'DM Mono',monospace;">EMP-${String(emp.id).padStart(5, '0')}</span></div>
      <div class="info-row"><span class="ir-label">Position</span><span class="ir-val">${emp.position}</span></div>
      <div class="info-row"><span class="ir-label">Department</span><span class="ir-val">${emp.dept || '—'}</span></div>
      <div class="info-row"><span class="ir-label">Status</span><span class="ir-val">${getStatusBadge(emp.status)}</span></div>
      <div class="info-row"><span class="ir-label">Start Date</span><span class="ir-val">${emp.start_date || '—'}</span></div>
      <div class="info-row"><span class="ir-label">Years of Service</span><span class="ir-val">${getYearsOfService(emp.start_date)}</span></div>
    </div>`);
}

function renderPanelHeader(emp) {
    const pic = emp.picture
        ? `<img src="${emp.picture}" class="ph-avatar-lg" alt=""/>`
        : `<div class="ph-ini-lg">${getInitials(emp.fname, emp.lname)}</div>`;

    setHTML('panel-header', `
    <button class="ph-close" id="panel-close-btn">×</button>
    ${pic}
    <h2>${emp.fname} ${emp.lname}</h2>
    <div class="ph-pos">${emp.position} &middot; ${emp.dept || 'No Department'}</div>
    <div class="ph-badges">
      <span class="ph-badge">${emp.status}</span>
      <span class="ph-badge">EMP-${String(emp.id).padStart(5, '0')}</span>
      ${emp.start_date ? `<span class="ph-badge">Since ${emp.start_date}</span>` : ''}
    </div>
    <div class="ph-actions">
      <button class="phbtn phbtn-edit" id="panel-edit-btn">Edit</button>
      <button class="phbtn phbtn-del" id="panel-delete-btn">Delete</button>
    </div>`);

    document.getElementById('panel-close-btn').addEventListener('click', closeProfilePanel);
    document.getElementById('panel-edit-btn').addEventListener('click', () => {
        openEmployeeModal(emp.id);
        closeProfilePanel();
    });
    document.getElementById('panel-delete-btn').addEventListener('click', () => handleDeleteEmployee(emp.id));
}

function activateTab(name) {
    document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane').forEach((p, i) => p.classList.toggle('active', i === 0));
}

function handleDeleteEmployee(empId) {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    deleteEmployee(empId);
    closeProfilePanel();
    renderEmployeeTable(_getSearchQuery());
    showToast('Employee deleted.', 'success');
}
