// ─── Stores ───────────────────────────────────────────────────────────────────
import { initUsers } from './js/store/users.js';
import { initEmployees } from './js/store/employees.js';
import { initDepartments } from './js/store/departments.js';
import { initBackups } from './js/store/backups.js';

// ─── Utils ────────────────────────────────────────────────────────────────────
import { getEl, getInitials } from './js/utils/helpers.js';

// ─── Components ───────────────────────────────────────────────────────────────
import { initLogin } from './js/components/login.js';
import { initEmployeeTable, renderEmployeeTable, populateDeptDropdowns } from './js/components/employeeTable.js';
import { initEmployeeModal } from './js/components/employeeModal.js';
import { initProfilePanel, closeProfilePanel } from './js/components/profilePanel.js';
import { initDocuments } from './js/components/documents.js';
import { initScanModal } from './js/components/scanModal.js';
import { initDepartments as initDepartmentComponent, renderDepartmentPage } from './js/components/departments.js';
import { initBackup, renderBackupPage } from './js/components/backup.js';
import { initSettings, renderSettingsPage } from './js/components/settings.js';
import { initExport } from './js/components/export.js';

// ─── App State ────────────────────────────────────────────────────────────────
const App = {
    currentUser: null,
    searchQuery: '',
    prefs: { darkMode: false, fontSize: 14 },
    savePrefs() {
        localStorage.setItem('edurecords_prefs', JSON.stringify(App.prefs));
    },
    loadPrefs() {
        try {
            const s = localStorage.getItem('edurecords_prefs');
            if (s) App.prefs = { ...App.prefs, ...JSON.parse(s) };
        } catch { }
    },
    applyPrefs() {
        document.body.classList.toggle('dark', App.prefs.darkMode);
        document.getElementById('dark-toggle')?.classList.toggle('on', App.prefs.darkMode);
        document.documentElement.style.setProperty('--fs', App.prefs.fontSize + 'px');
        const sizes = [13, 14, 15, 16];
        document.querySelectorAll('.fs-btn').forEach((btn, i) => btn.classList.toggle('active', sizes[i] === App.prefs.fontSize));
    },
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize stores
    initUsers();
    initEmployees();
    initDepartments();
    initBackups();

    // 2. Load saved preferences
    App.loadPrefs();
    App.applyPrefs();

    // 3. Initialize components (pass shared state via closures/callbacks)
    const getSearchQuery = () => App.searchQuery;

    initLogin(handleLogin);
    initEmployeeTable();
    initEmployeeModal(getSearchQuery);
    initProfilePanel(getSearchQuery);
    initDocuments();
    initScanModal();
    initDepartmentComponent();
    initBackup(getSearchQuery);
    initSettings(() => App.prefs, () => App.savePrefs());
    initExport();

    // 4. Wire up global UI (sidebar nav, search, logout)
    wireNavigation();
    wireSearch();
    wireLogout();
});

// ─── Login ────────────────────────────────────────────────────────────────────
function handleLogin(user) {
    App.currentUser = user;
    getEl('login-screen').style.display = 'none';
    getEl('app').style.display = 'flex';
    getEl('su-name').textContent = user.name;
    getEl('su-role').textContent = user.role;
    getEl('su-avatar').textContent = getInitials(user.name.split(' ')[0], user.name.split(' ')[1] ?? '');
    App.applyPrefs();
    renderEmployeeTable();
    populateDeptDropdowns();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function wireNavigation() {
    document.querySelectorAll('#sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.dataset.page;
            if (pageName) navTo(pageName, link);
        });
    });
}

function navTo(pageName, linkEl) {
    document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('active'));
    linkEl.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    getEl('page-' + pageName).classList.add('active');

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

// ─── Search ───────────────────────────────────────────────────────────────────
function wireSearch() {
    getEl('search-input').addEventListener('input', (e) => {
        App.searchQuery = e.target.value;
        renderEmployeeTable(App.searchQuery);
    });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function wireLogout() {
    getEl('logout-btn').addEventListener('click', handleLogout);
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
