import { getAllEmployees } from '../store/employees.js';
import { getEl, getToday } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export function initExport() {
    getEl('export-csv-btn').addEventListener('click', exportToCSV);
    getEl('export-pdf-btn').addEventListener('click', exportToPDF);
}

function exportToCSV() {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Contact', 'Address', 'Position', 'Department', 'Status', 'Start Date'];
    const rows = getAllEmployees().map(e => [
        e.id, e.fname, e.lname, e.email, e.contact,
        e.address, e.position, e.dept, e.status, e.start_date,
    ]);
    const csv = [headers, ...rows]
        .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `EduRecords_${getToday()}.csv`;
    a.click();
    showToast('CSV exported.', 'success');
}

function exportToPDF() {
    const rows = getAllEmployees().map(e =>
        `<tr><td>${e.fname} ${e.lname}</td><td>${e.email}</td><td>${e.position}</td><td>${e.dept ?? '—'}</td><td>${e.status}</td><td>${e.start_date ?? '—'}</td></tr>`
    ).join('');
    getEl('print-area').innerHTML = `
    <style>
      @page{size:A4;margin:18mm;}
      body{font-family:'DM Sans',Arial;font-size:10pt;}
      h2{color:#062b6e;border-bottom:3px solid #062b6e;padding-bottom:8px;margin-bottom:14px;letter-spacing:-.5px;}
      table{width:100%;border-collapse:collapse;}
      th{background:#062b6e;color:#fff;padding:8px 10px;text-align:left;font-size:9pt;}
      td{padding:7px 10px;border-bottom:1px solid #e2e8f0;}
      tr:nth-child(even) td{background:#f8fafc;}
    </style>
    <h2>EduRecords — Employee Report</h2>
    <p style="color:#4b5875;font-size:9pt;">Generated: ${new Date().toLocaleString('en-PH')} · ${getAllEmployees().length} employee(s)</p>
    <table style="margin-top:14px">
      <thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Department</th><th>Status</th><th>Start Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    window.print();
}
