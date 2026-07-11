import { getAllUsers, addUser, deleteUser } from '../store/users.js';
import { getAllEmployees } from '../store/employees.js';
import { getAllDepartments } from '../store/departments.js';
import { getAllBackups } from '../store/backups.js';
import { getEl, setHTML } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

let _getPrefs = null;
let _savePrefs = null;

export function initSettings(getPrefs, savePrefs) {
    _getPrefs = getPrefs;
    _savePrefs = savePrefs;

    getEl('dark-toggle').addEventListener('click', handleToggleDark);

    document.querySelectorAll('.fs-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSetFont(Number(btn.dataset.size), btn));
    });

    getEl('add-user-btn').addEventListener('click', openAddUserModal);
    getEl('close-user-modal').addEventListener('click', closeAddUserModal);
    getEl('user-modal-cancel').addEventListener('click', closeAddUserModal);
    getEl('user-modal-save').addEventListener('click', handleSaveUser);
    getEl('refresh').addEventListener('click', refreshStats)
}

export function renderSettingsPage() {
    renderUserTable();
    refreshStats();
}

function handleToggleDark() {
    const prefs = _getPrefs();
    prefs.darkMode = !prefs.darkMode;
    document.body.classList.toggle('dark', prefs.darkMode);
    getEl('dark-toggle').classList.toggle('on', prefs.darkMode);
    _savePrefs();
}

function handleSetFont(size, btnEl) {
    const prefs = _getPrefs();
    prefs.fontSize = size;
    document.documentElement.style.setProperty('--fs', size + 'px');
    document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    _savePrefs();
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
            ? `<button class="btn btn-sm btn-del" data-delete-user="${u.id}">Remove</button>`
            : `<span style="font-size:11px;color:var(--text-3);">Protected</span>`}</td>
      </tr>`).join('')}`);

    document.querySelectorAll('[data-delete-user]').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteUser(Number(btn.dataset.deleteUser)));
    });
}

function openAddUserModal() {
    ['u-name', 'u-user', 'u-pass'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const roleEl = document.getElementById('u-role');
    if (roleEl) roleEl.value = 'HR Administrator';
    getEl('user-overlay').classList.add('open');
}

function closeAddUserModal() {
    getEl('user-overlay').classList.remove('open');
}

function handleSaveUser() {
    const name = getEl('u-name').value.trim();
    const username = getEl('u-user').value.trim().toLowerCase();
    const password = getEl('u-pass').value;
    const role = getEl('u-role').value;
    if (!name || !username || !password) { showToast('All fields are required.', 'error'); return; }
    if (password.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
    try {
        addUser({ name, username, password, role });
        closeAddUserModal();
        renderUserTable();
        showToast(`User "${username}" created.`, 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function handleDeleteUser(userId) {
    if (!confirm('Remove this user account?')) return;
    try {
        deleteUser(userId);
        renderUserTable();
        showToast('User removed.', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function refreshStats() {
    const el = document.getElementById('db-stats');
    if (el) el.textContent = `${getAllEmployees().length} employees · ${getAllDepartments().length} departments · ${getAllBackups().length} backup(s)`;
}
