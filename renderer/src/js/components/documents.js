import { getEmployeeById, addDocument, deleteDocument, addSampleDocuments } from '../store/employees.js';
import { getEl, setHTML, getFileType, formatFileSize, getToday, getSourceTag } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { refreshPanelHeader } from './profilePanel.js';
import { openScanModal } from './scanModal.js';

const DOC_ICONS = {
    pdf: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8253c" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    img: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9373" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    doc: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e6fff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>`,
    scan: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="12" cy="12" r="1"/></svg>`,
    other: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`,
};
const DOC_BG_CLASS = { pdf: 'di-pdf', img: 'di-img', doc: 'di-doc', scan: 'di-scan', other: 'di-other' };

export function initDocuments() {
    // Event listeners are attached dynamically in renderTabDocs via delegation.
}

export function renderTabDocs(emp) {
    const docsHTML = emp.docs.length
        ? emp.docs.map(doc => buildDocRow(doc, emp)).join('')
        : '<div class="empty" style="padding:20px 0">No documents on file.</div>';

    setHTML('tab-docs', `
    <div class="file-toolbar">
      <label class="fab fab-upload" for="doc-upload">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
      </label>
      <input type="file" id="doc-upload" style="display:none" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/>
      <button class="fab fab-scan" id="doc-scan-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
        Scan
      </button>
      <button class="fab fab-sample" id="doc-sample-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Sample Files
      </button>
    </div>
    <p style="font-size:12px;color:var(--text-3);margin-bottom:12px;">${emp.docs.length} document(s)</p>
    <div class="doc-list">${docsHTML}</div>`);

    document.getElementById('doc-upload').addEventListener('change', (e) => handleDocUpload(e.target, emp.id));
    document.getElementById('doc-scan-btn').addEventListener('click', () => openScanModal(emp.id));
    document.getElementById('doc-sample-btn').addEventListener('click', () => handleAddSampleDocs(emp.id));

    document.querySelectorAll('.dbtn-print').forEach(btn => {
        btn.addEventListener('click', () => handlePrintDoc(btn.dataset.docName, btn.dataset.empName));
    });
    document.querySelectorAll('.dbtn-del').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteDoc(emp.id, Number(btn.dataset.docId)));
    });
}

function handleDocUpload(input, empId) {
    const file = input.files[0];
    if (!file) return;
    addDocument(empId, { name: file.name, type: getFileType(file.name), size: formatFileSize(file.size), date: getToday(), source: 'upload' });
    showToast(`"${file.name}" added.`, 'success');
    input.value = '';
    renderTabDocs(getEmployeeById(empId));
    refreshPanelHeader();
}

function handleAddSampleDocs(empId) {
    const added = addSampleDocuments(empId);
    showToast(added ? `${added} sample file(s) added.` : 'All sample files already exist.', added ? 'success' : 'info');
    renderTabDocs(getEmployeeById(empId));
    refreshPanelHeader();
}

function handleDeleteDoc(empId, docId) {
    if (!confirm('Remove this document?')) return;
    deleteDocument(empId, docId);
    showToast('Document removed.', 'success');
    renderTabDocs(getEmployeeById(empId));
    refreshPanelHeader();
}

function handlePrintDoc(docName, empName) {
    getEl('print-area').innerHTML = `
    <style>@page{size:A4;margin:20mm;}body{font-family:'DM Sans',Arial;font-size:11pt;}
    h2{color:#062b6e;border-bottom:3px solid #062b6e;padding-bottom:8px;margin-bottom:16px;}</style>
    <h2>College HR Office — Document Print</h2>
    <p><strong>Document:</strong> ${docName}</p>
    <p><strong>Employee:</strong> ${empName}</p>
    <p><strong>Printed:</strong> ${new Date().toLocaleString('en-PH')}</p>`;
    window.print();
}

function buildDocRow(doc, emp) {
    const icon = DOC_ICONS[doc.type] ?? DOC_ICONS.other;
    const bgClass = DOC_BG_CLASS[doc.type] ?? 'di-other';
    const empName = `${emp.fname} ${emp.lname}`;
    return `
    <div class="doc-item">
      <div class="doc-icon ${bgClass}">${icon}</div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}${getSourceTag(doc.source)}</div>
        <div class="doc-meta">${doc.size} &middot; ${doc.date}</div>
      </div>
      <div class="doc-acts">
        <button class="dbtn dbtn-print" data-doc-name="${doc.name}" data-emp-name="${empName}">Print</button>
        <button class="dbtn dbtn-del" data-doc-id="${doc.id}">Remove</button>
      </div>
    </div>`;
}
