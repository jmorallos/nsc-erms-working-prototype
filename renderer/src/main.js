import "./js/utils/helpers.js";
import "./js/utils/toast.js";
import "./js/store/employees.js";
import "./js/store/departments.js";
import "./js/store/users.js";
import "./js/store/backups.js";

import "./js/components/login.js";
import "./js/components/employeeTable.js";
import "./js/components/empoyeeModal.js";
import "./js/components/profilePanel.js";
import "./js/components/documents.js";
import "./js/components/scanModal.js";
import "./js/components/departments.js";
import "./js/components/backup.js";
import "./js/components/settings.js";
import "./js/components/export.js";



const App = {
    currentUser: null,
    searchQuery: '',
    prefs: { darkMode: false, fontSize: 14 },
    savePrefs() { localStorage.setItem('edurecords_prefs', JSON.stringify(App.prefs)); },
    loadPrefs() {
        try { const s = localStorage.getItem('edurecords_prefs'); if (s) App.prefs = { ...App.prefs, ...JSON.parse(s) }; } catch { }
    },
    applyPrefs() {
        document.body.classList.toggle('dark', App.prefs.darkMode);
        document.getElementById('dark-toggle')?.classList.toggle('on', App.prefs.darkMode);
        document.documentElement.style.setProperty('--fs', App.prefs.fontSize + 'px');
        const sizes = [13, 14, 15, 16];
        document.querySelectorAll('.fs-btn').forEach((btn, i) => btn.classList.toggle('active', sizes[i] === App.prefs.fontSize));
    },
};

document.addEventListener('DOMContentLoaded', () => {
    App.loadPrefs();
    App.applyPrefs();
});

function handleLogin() {
    attemptLogin((user) => {
        App.currentUser = user;
        getEl('login-screen').style.display = 'none';
        getEl('app').style.display = 'flex';
        getEl('su-name').textContent = user.name;
        getEl('su-role').textContent = user.role;
        getEl('su-avatar').textContent = getInitials(user.name.split(' ')[0], user.name.split(' ')[1] ?? '');
        App.applyPrefs();
        renderEmployeeTable();
        populateDeptDropdowns();
    });
}

function handleLogout() {
    if (!confirm('Log out?')) return;
    App.currentUser = null;
    getEl('app').style.display = 'none';
    getEl('login-screen').style.display = 'flex';
    getEl('login-user').value = '';
    getEl('login-pass').value = '';
    closeProfilePanel();
}

function navTo(pageName, linkEl) {
    document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('active'));
    linkEl.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    getEl('page-' + pageName).classList.add('active');
    // Page title from link text, strip any badge text
    const clone = linkEl.cloneNode(true);
    clone.querySelectorAll('.nav-badge,.nav-section-label').forEach(e => e.remove());
    getEl('page-title').textContent = clone.textContent.trim();
    getEl('search-box').style.display = pageName === 'employees' ? 'block' : 'none';
    getEl('search-input').value = '';
    App.searchQuery = '';
    closeProfilePanel();
    if (pageName === 'departments') renderDepartmentPage();
    if (pageName === 'backup') renderBackupPage();
    if (pageName === 'settings') renderSettingsPage();
}

function handleSearch(value) {
    App.searchQuery = value;
    renderEmployeeTable(value);
}