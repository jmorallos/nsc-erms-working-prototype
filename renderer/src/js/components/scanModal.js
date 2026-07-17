import { getEl } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

/** Legacy mock scanner UI — real flow is Scan Inbox (drop folder). */
export function initScanModal() {
  getEl('scan-close-btn')?.addEventListener('click', closeScanModal);
  getEl('scan-btn')?.addEventListener('click', () => {
    showToast('Use Scan Inbox: drop files into the inbox folder, then Assign.', 'info');
    closeScanModal();
  });
  getEl('close-scan-modal')?.addEventListener('click', closeScanModal);
}

export function openScanModal() {
  showToast('Use the Scan Inbox page to assign dropped/scanned files.', 'info');
}

function closeScanModal() {
  getEl('scan-overlay')?.classList.remove('open');
}
