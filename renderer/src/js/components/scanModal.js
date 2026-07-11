import { getEmployeeById, addDocument } from '../store/employees.js';
import { getEl, setHTML, getToday } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { renderTabDocs } from './documents.js';
import { refreshPanelHeader } from './profilePanel.js';

const MOCK_SCANNERS = [
    { id: 'epson-l3210', name: 'EPSON L3210 Series', connection: 'USB', status: 'Ready' },
    { id: 'epson-et2720', name: 'EPSON ET-2720 Series', connection: 'Wi-Fi', status: 'Ready' },
];

let _scanEmpId = null;
let _selectedScanner = null;
let _detectedScanners = [];

export function initScanModal() {
    getEl('scan-close-btn').addEventListener('click', closeScanModal);
    getEl('scan-btn').addEventListener('click', handleStartScan);
    getEl('close-scan-modal').addEventListener('click', closeScanModal);
}

export function openScanModal(empId) {
    _scanEmpId = empId;
    _selectedScanner = null;
    getEl('scan-prog').style.display = 'none';
    getEl('scan-btn').disabled = false;
    getEl('scan-fill').style.width = '0%';
    getEl('scan-status').textContent = '';
    getEl('scan-overlay').classList.add('open');
    setHTML('scan-dev-list', '<div class="empty" style="padding:10px 0;font-size:12px;">Detecting scanners…</div>');
    setTimeout(() => { _detectedScanners = MOCK_SCANNERS; renderDeviceList(); }, 900);
}

function closeScanModal() {
    getEl('scan-overlay').classList.remove('open');
    _scanEmpId = null;
}

function handleSelectScanner(el, index) {
    document.querySelectorAll('.scan-dev-row').forEach(row => {
        row.classList.remove('sel');
        const chk = row.querySelector('.scan-checkmark');
        if (chk) chk.remove();
    });
    el.classList.add('sel');
    el.insertAdjacentHTML('beforeend', `<svg class="scan-checkmark" style="margin-left:auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9373" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`);
    _selectedScanner = _detectedScanners[index];
}

function handleStartScan() {
    if (!_selectedScanner) { showToast('Please select a scanner first.', 'error'); return; }
    getEl('scan-prog').style.display = 'block';
    getEl('scan-btn').disabled = true;
    runSimulatedScan(_selectedScanner, getEl('sc-format').value, getEl('sc-doctype').value);
}

function renderDeviceList() {
    if (!_detectedScanners.length) {
        setHTML('scan-dev-list', `<div style="padding:12px 14px;background:#fce8eb;border-radius:9px;font-size:12px;color:var(--error);border:1px solid #f8c1c9;">No scanner detected. Connect your EPSON device and ensure drivers are installed.</div>`);
        return;
    }
    setHTML('scan-dev-list', _detectedScanners.map((device, i) => `
    <div class="scan-dev-row ${i === 0 ? 'sel' : ''}" data-index="${i}">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue-700)" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="12" cy="12" r="1"/></svg>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text-1)">${device.name}</div>
        <div style="font-size:11px;color:var(--text-3)">${device.connection} &middot; ${device.status}</div>
      </div>
      ${i === 0 ? `<svg class="scan-checkmark" style="margin-left:auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9373" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
    </div>`).join(''));

    document.querySelectorAll('.scan-dev-row').forEach(row => {
        row.addEventListener('click', () => handleSelectScanner(row, Number(row.dataset.index)));
    });

    _selectedScanner = _detectedScanners[0];
}

function setProgress(percent, message) {
    getEl('scan-fill').style.width = percent + '%';
    getEl('scan-status').textContent = message;
}

function runSimulatedScan(device, format, docType) {
    const steps = [
        [10, 'Initializing scanner…'], [30, `Connecting to ${device.name}…`],
        [55, 'Scanning document…'], [80, 'Processing image…'],
        [95, 'Saving file…'], [100, 'Scan complete!'],
    ];
    let step = 0;
    const interval = setInterval(() => {
        if (step >= steps.length) { clearInterval(interval); onScanComplete(device, format, docType); return; }
        const [p, m] = steps[step];
        setProgress(p, m);
        step++;
    }, 600);
}

function onScanComplete(device, format, docType) {
    const ext = format.toLowerCase();
    const time = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const filename = `SCANNED - ${docType} ${time}.${ext}`;
    const size = (Math.random() * 2 + 0.5).toFixed(1) + ' MB';
    addDocument(_scanEmpId, { name: filename, type: 'scan', size, date: getToday(), source: 'scan' });
    closeScanModal();
    showToast(`Document scanned via ${device.name}.`, 'success');
    const emp = getEmployeeById(_scanEmpId);
    if (emp) { renderTabDocs(emp); refreshPanelHeader(); }
}
