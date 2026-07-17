import { getEmployee, deleteEmployee } from '../api/employees.js';
import { ApiError } from '../api/client.js';
import { getEl, setHTML, getInitials, getStatusBadge, getYearsOfService, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { renderEmployeeTable } from './employeeTable.js';
import { openEmployeeModal } from './employeeModal.js';
import { renderTabDocs } from './documents.js';
import { canWrite } from '../utils/authz.js';

let _panelEmpId = null;
let _getSearchQuery = () => '';

export function initProfilePanel(getSearchQuery) {
  _getSearchQuery = getSearchQuery;
  getEl('panel-backdrop').addEventListener('click', closeProfilePanel);

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
  });
}

export async function openProfilePanel(empId) {
  try {
    const { employee } = await getEmployee(empId);
    _panelEmpId = empId;
    renderPanelHeader(employee);
    activateTab('info');
    renderTabInfo(employee);
    getEl('panel').classList.add('open');
    getEl('panel-backdrop').classList.add('open');
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'Could not open profile.', 'error');
  }
}

export function closeProfilePanel() {
  getEl('panel').classList.remove('open');
  getEl('panel-backdrop').classList.remove('open');
  _panelEmpId = null;
}

export async function refreshPanelHeader() {
  if (_panelEmpId === null) return;
  try {
    const { employee } = await getEmployee(_panelEmpId);
    renderPanelHeader(employee);
  } catch { /* ignore */ }
}

async function switchTab(tabName, buttonEl) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  buttonEl.classList.add('active');
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  getEl('tab-' + tabName).classList.add('active');
  if (_panelEmpId === null) return;
  try {
    const { employee } = await getEmployee(_panelEmpId);
    if (tabName === 'info') renderTabInfo(employee);
    if (tabName === 'employment') renderTabEmployment(employee);
    if (tabName === 'docs') renderTabDocs(employee);
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'Failed to load tab.', 'error');
  }
}

function renderTabInfo(emp) {
  setHTML(
    'tab-info',
    `
    <div class="info-section">
      <h4>Personal Information</h4>
      <div class="info-row"><span class="ir-label">Full Name</span><span class="ir-val">${escapeHtml(emp.firstName)} ${escapeHtml(emp.lastName)}</span></div>
      <div class="info-row"><span class="ir-label">Email</span><span class="ir-val">${escapeHtml(emp.email)}</span></div>
      <div class="info-row"><span class="ir-label">Contact</span><span class="ir-val">${escapeHtml(emp.contactNumber || '—')}</span></div>
      <div class="info-row"><span class="ir-label">Address</span><span class="ir-val">${escapeHtml(emp.address || '—')}</span></div>
    </div>`,
  );
}

function renderTabEmployment(emp) {
  const a = emp.assignment;
  setHTML(
    'tab-employment',
    `
    <div class="info-section">
      <h4>Employment Details</h4>
      <div class="info-row"><span class="ir-label">Employee No</span><span class="ir-val" style="font-family:'DM Mono',monospace;">${escapeHtml(emp.employeeNo)}</span></div>
      <div class="info-row"><span class="ir-label">Position</span><span class="ir-val">${escapeHtml(a?.positionName || '—')}</span></div>
      <div class="info-row"><span class="ir-label">Department</span><span class="ir-val">${escapeHtml(a?.departmentName || '—')}</span></div>
      <div class="info-row"><span class="ir-label">Employment type</span><span class="ir-val">${escapeHtml(a?.employmentTypeName || '—')}</span></div>
      <div class="info-row"><span class="ir-label">Status</span><span class="ir-val">${getStatusBadge(a?.employmentStatusName || '—')}</span></div>
      <div class="info-row"><span class="ir-label">Start Date</span><span class="ir-val">${escapeHtml(a?.startDate ? String(a.startDate).slice(0, 10) : '—')}</span></div>
      <div class="info-row"><span class="ir-label">Years of Service</span><span class="ir-val">${getYearsOfService(a?.startDate)}</span></div>
    </div>`,
  );
}

function renderPanelHeader(emp) {
  const a = emp.assignment;
  const pic =
    emp.photoUrl || emp.profilePicturePath
      ? `<img src="${emp.photoUrl || `/api/v1/employees/${emp.id}/photo`}" class="ph-avatar-lg" alt=""/>`
      : `<div class="ph-ini-lg">${getInitials(emp.firstName, emp.lastName)}</div>`;

  setHTML(
    'panel-header',
    `
    <button class="ph-close" id="panel-close-btn">×</button>
    ${pic}
    <h2>${escapeHtml(emp.firstName)} ${escapeHtml(emp.lastName)}</h2>
    <div class="ph-pos">${escapeHtml(a?.positionName || 'No position')} &middot; ${escapeHtml(a?.departmentName || 'No Department')}</div>
    <div class="ph-badges">
      <span class="ph-badge">${escapeHtml(a?.employmentStatusName || '—')}</span>
      <span class="ph-badge">${escapeHtml(emp.employeeNo)}</span>
      ${a?.startDate ? `<span class="ph-badge">Since ${escapeHtml(String(a.startDate).slice(0, 10))}</span>` : ''}
    </div>
    <div class="ph-actions">
      ${canWrite() ? `<button class="phbtn phbtn-edit" id="panel-edit-btn">Edit</button>
      <button class="phbtn phbtn-del" id="panel-delete-btn">Delete</button>` : ''}
    </div>`,
  );

  document.getElementById('panel-close-btn').addEventListener('click', closeProfilePanel);
  document.getElementById('panel-edit-btn')?.addEventListener('click', () => {
    openEmployeeModal(emp.id);
    closeProfilePanel();
  });
  document.getElementById('panel-delete-btn')?.addEventListener('click', () => {
    handleDeleteEmployee(emp.id);
  });
}

function activateTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane').forEach((p, i) => p.classList.toggle('active', i === 0));
  void name;
}

async function handleDeleteEmployee(empId) {
  if (!confirm('Delete this employee? This cannot be undone.')) return;
  try {
    await deleteEmployee(empId);
    closeProfilePanel();
    await renderEmployeeTable(_getSearchQuery());
    showToast('Employee deleted.', 'success');
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'Delete failed.', 'error');
  }
}
