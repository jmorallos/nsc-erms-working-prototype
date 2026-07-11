function renderSettingsPage() { renderUserTable(); refreshStats(); }
function handleToggleDark() {
    App.prefs.darkMode = !App.prefs.darkMode;
    document.body.classList.toggle('dark', App.prefs.darkMode);
    getEl('dark-toggle').classList.toggle('on', App.prefs.darkMode);
    App.savePrefs();
}
function handleSetFont(size, btnEl) {
    App.prefs.fontSize = size;
    document.documentElement.style.setProperty('--fs', size + 'px');
    document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    App.savePrefs();
    showToast(`Font size set to ${size}px.`, 'info');
}
function renderUserTable() {
    setHTML('user-table', `
    <tr><th>Name</th><th>Username</th><th>Role</th><th></th></tr>
    ${getAllUsers().map(u => `
      <tr>
        <td>${u.name}</td>
        <td><code style="background:var(--bg-base);padding:2px 8px;border-radius:6px;font-size:12px;font-family:'DM Mono',monospace;">${u.username}</code></td>
        <td><span class="badge active" style="font-size:10px;">${u.role}</span></td>
        <td>${u.id !== 1
            ? `<button class="btn btn-sm btn-del" onclick="handleDeleteUser(${u.id})">Remove</button>`
            : `<span style="font-size:11px;color:var(--text-3);">Protected</span>`}</td>
      </tr>`).join('')}`);
}
function openAddUserModal() {
    ['u-name', 'u-user', 'u-pass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const roleEl = document.getElementById('u-role'); if (roleEl) roleEl.value = 'HR Administrator';
    getEl('user-overlay').classList.add('open');
}
function closeAddUserModal() { getEl('user-overlay').classList.remove('open'); }
function handleSaveUser() {
    const name = getEl('u-name').value.trim(), username = getEl('u-user').value.trim().toLowerCase(), password = getEl('u-pass').value, role = getEl('u-role').value;
    if (!name || !username || !password) { showToast('All fields are required.', 'error'); return; }
    if (password.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
    try { addUser({ name, username, password, role }); closeAddUserModal(); renderUserTable(); showToast(`User "${username}" created.`, 'success'); }
    catch (err) { showToast(err.message, 'error'); }
}
function handleDeleteUser(userId) {
    if (!confirm('Remove this user account?')) return;
    try { deleteUser(userId); renderUserTable(); showToast('User removed.', 'success'); }
    catch (err) { showToast(err.message, 'error'); }
}
function refreshStats() {
    const el = document.getElementById('db-stats');
    if (el) el.textContent = `${getAllEmployees().length} employees · ${getAllDepartments().length} departments · ${getAllBackups().length} backup(s)`;
}