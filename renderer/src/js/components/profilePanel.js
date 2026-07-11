let _panelEmpId = null;
function openProfilePanel(empId) {
    const emp = getEmployeeById(empId);
    if (!emp) return;
    _panelEmpId = empId;
    _renderPanelHeader(emp);
    _activateTab('info');
    renderTabInfo(emp);
    getEl('panel').classList.add('open');
    getEl('panel-backdrop').classList.add('open');
}
function closeProfilePanel() {
    getEl('panel').classList.remove('open');
    getEl('panel-backdrop').classList.remove('open');
    _panelEmpId = null;
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
function refreshPanelHeader() {
    if (_panelEmpId === null) return;
    const emp = getEmployeeById(_panelEmpId);
    if (emp) _renderPanelHeader(emp);
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
function _renderPanelHeader(emp) {
    const pic = emp.picture
        ? `<img src="${emp.picture}" class="ph-avatar-lg" alt=""/>`
        : `<div class="ph-ini-lg">${getInitials(emp.fname, emp.lname)}</div>`;
    setHTML('panel-header', `
    <button class="ph-close" onclick="closeProfilePanel()">×</button>
    ${pic}
    <h2>${emp.fname} ${emp.lname}</h2>
    <div class="ph-pos">${emp.position} &middot; ${emp.dept || 'No Department'}</div>
    <div class="ph-badges">
      <span class="ph-badge">${emp.status}</span>
      <span class="ph-badge">EMP-${String(emp.id).padStart(5, '0')}</span>
      ${emp.start_date ? `<span class="ph-badge">Since ${emp.start_date}</span>` : ''}
    </div>
    <div class="ph-actions">
      <button class="phbtn phbtn-edit" onclick="openEmployeeModal(${emp.id});closeProfilePanel()">Edit</button>
      <button class="phbtn phbtn-del"  onclick="handleDeleteEmployee(${emp.id})">Delete</button>
    </div>`);
}
function _activateTab(name) {
    document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane').forEach((p, i) => p.classList.toggle('active', i === 0));
}
function handleDeleteEmployee(empId) {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    deleteEmployee(empId);
    closeProfilePanel();
    renderEmployeeTable(App.searchQuery);
    showToast('Employee deleted.', 'success');
}