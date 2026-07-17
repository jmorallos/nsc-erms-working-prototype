import {
  listBackups,
  createBackup,
  deleteBackup,
  downloadBackupUrl,
} from '../api/backups.js';
import { ApiError } from '../api/client.js';
import { getEl, setHTML, escapeHtml, formatFileSize } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { canManageUsers } from '../utils/authz.js';

export function initBackup() {
  getEl('create-backup-btn')?.addEventListener('click', () => {
    runCreateBackup().catch(showErr);
  });
  getEl('backup-refresh')?.addEventListener('click', () => {
    renderBackupPage().catch(showErr);
  });
}

export async function renderBackupPage() {
  const pathEl = getEl('backup-root-path');
  if (!canManageUsers()) {
    if (pathEl) pathEl.textContent = '—';
    setHTML(
      'bk-list',
      `<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0;">
        Only administrators can create or download backups.
      </p>`,
    );
    return;
  }

  setHTML('bk-list', '<p style="font-size:12px;color:var(--text-3);padding:12px 0;">Loading backups…</p>');

  try {
    const { backups, backupsRoot, busy } = await listBackups();
    if (pathEl) pathEl.textContent = backupsRoot || '—';

    const btn = getEl('create-backup-btn');
    if (btn) {
      btn.disabled = Boolean(busy);
      btn.textContent = busy ? 'Backup in progress…' : 'Create Backup Now';
    }

    if (!backups.length) {
      setHTML(
        'bk-list',
        `<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0;">
          No backups yet. Create one to snapshot the database and FILES_ROOT.
        </p>`,
      );
      return;
    }

    setHTML(
      'bk-list',
      backups
        .map((b) => {
          const when = b.createdAt
            ? new Date(b.createdAt).toLocaleString('en-PH')
            : '—';
          const who = b.createdByName ? ` · ${escapeHtml(b.createdByName)}` : '';
          return `
        <div class="bk-item" style="align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <div class="bk-name">${escapeHtml(b.fileName || b.id)}</div>
            <div class="bk-meta">
              ${formatFileSize(b.sizeBytes || 0)} · ${escapeHtml(when)}${who}
              · DB + files
            </div>
          </div>
          <div class="bk-acts">
            <button type="button" class="btn btn-sm btn-edit" data-dl-backup="${escapeHtml(b.id)}">Download</button>
            <button type="button" class="btn btn-sm btn-del" data-del-backup="${escapeHtml(b.id)}">Delete</button>
          </div>
        </div>`;
        })
        .join(''),
    );

    document.querySelectorAll('[data-dl-backup]').forEach((el) => {
      el.addEventListener('click', () => {
        window.open(downloadBackupUrl(el.dataset.dlBackup), '_blank');
      });
    });
    document.querySelectorAll('[data-del-backup]').forEach((el) => {
      el.addEventListener('click', () => {
        removeBackup(el.dataset.delBackup).catch(showErr);
      });
    });
  } catch (err) {
    showErr(err);
    setHTML(
      'bk-list',
      `<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0;">
        ${escapeHtml(err instanceof ApiError ? err.message : 'Unable to load backups')}
      </p>`,
    );
  }
}

async function runCreateBackup() {
  if (!canManageUsers()) {
    showToast('Only administrators can create backups.', 'error');
    return;
  }
  if (
    !confirm(
      'Create a full backup now?\n\nThis runs pg_dump and copies FILES_ROOT. It may take a minute.',
    )
  ) {
    return;
  }

  const btn = getEl('create-backup-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Creating backup…';
  }
  try {
    const { backup } = await createBackup();
    showToast(`Backup created: ${backup.fileName}`, 'success');
    await renderBackupPage();
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Create Backup Now';
    }
    throw err;
  }
}

async function removeBackup(id) {
  if (!confirm('Delete this backup archive from the server?')) return;
  await deleteBackup(id);
  showToast('Backup deleted.', 'success');
  await renderBackupPage();
}

function showErr(err) {
  showToast(err instanceof ApiError ? err.message : 'Backup action failed.', 'error');
}
