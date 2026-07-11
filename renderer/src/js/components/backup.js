import { getAllBackups, getBackupById, addBackup, deleteBackup } from '../store/backups.js';
import { getAllEmployees, replaceAll } from '../store/employees.js';
import { getAllDepartments, replaceDepts } from '../store/departments.js';
import { setHTML, getEl } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { renderEmployeeTable, populateDeptDropdowns } from './employeeTable.js';

let _getSearchQuery = () => '';

export function initBackup(getSearchQuery) {
    _getSearchQuery = getSearchQuery;
    getEl('create-backup-btn').addEventListener('click', handleCreateBackup);
    getEl('restore-input').addEventListener('change', (e) => handleRestoreBackup(e.target));
}

export function renderBackupPage() {
    const backups = getAllBackups();
    setHTML('bk-list', backups.length
        ? backups.map(b => `
        <div class="bk-item">
          <div>
            <div class="bk-name">${b.name}</div>
            <div class="bk-meta">${b.size} &middot; ${b.date}</div>
          </div>
          <div class="bk-acts">
            <button class="btn btn-sm btn-edit" data-download-backup="${b.id}">Download</button>
            <button class="btn btn-sm btn-del" data-delete-backup="${b.id}">Delete</button>
          </div>
        </div>`).join('')
        : '<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0;">No backups yet.</p>');

    document.querySelectorAll('[data-download-backup]').forEach(btn => {
        btn.addEventListener('click', () => handleDownloadBackup(Number(btn.dataset.downloadBackup)));
    });
    document.querySelectorAll('[data-delete-backup]').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteBackup(Number(btn.dataset.deleteBackup)));
    });
}

function handleCreateBackup() {
    const today = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    addBackup(`EduRecords_Backup_${today}.json`, {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        employees: getAllEmployees(),
        departments: getAllDepartments(),
    });
    renderBackupPage();
    showToast('Backup created.', 'success');
}

function handleDownloadBackup(backupId) {
    const backup = getBackupById(backupId);
    if (!backup) { showToast('Backup not found.', 'error'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([backup.data], { type: 'application/json' }));
    a.download = backup.name;
    a.click();
    showToast('Backup downloaded.', 'success');
}

function handleDeleteBackup(backupId) {
    if (!confirm('Delete this backup?')) return;
    deleteBackup(backupId);
    renderBackupPage();
    showToast('Backup deleted.', 'success');
}

function handleRestoreBackup(input) {
    const file = input.files[0];
    if (!file) return;
    if (!confirm('Restore from backup? ALL current records will be replaced.')) { input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            replaceAll(data.employees ?? []);
            if (data.departments) replaceDepts(data.departments);
            renderEmployeeTable(_getSearchQuery());
            populateDeptDropdowns();
            showToast('Data restored successfully.', 'success');
        } catch {
            showToast('Invalid backup file.', 'error');
        }
        input.value = '';
    };
    reader.readAsText(file);
}
