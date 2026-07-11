export function getInitials(fname, lname) {
    return ((fname?.[0] ?? '') + (lname?.[0] ?? '')).toUpperCase();
}
export function getToday() {
    return new Date().toISOString().split('T')[0];
}
export function formatFileSize(bytes) {
    if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
}
export function getYearsOfService(startDate) {
    if (!startDate) return '—';
    const years = new Date().getFullYear() - new Date(startDate).getFullYear();
    return years > 0 ? `${years} year(s)` : 'Less than 1 year';
}
export function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'img';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    return 'other';
}
export function getStatusBadge(status) {
    const classMap = { 'Active': 'active', 'Inactive': 'inactive', 'On Leave': 'leave' };
    const cls = classMap[status] ?? 'inactive';
    return `<span class="badge ${cls}">${status}</span>`;
}
export function getSourceTag(source) {
    if (source === 'scan') return `<span style="font-size:10px;background:#ede9fe;color:#5b21b6;padding:1px 7px;border-radius:99px;font-weight:700;margin-left:5px;">SCANNED</span>`;
    if (source === 'sample') return `<span style="font-size:10px;background:#d1fae5;color:#065f46;padding:1px 7px;border-radius:99px;font-weight:700;margin-left:5px;">SAMPLE</span>`;
    return '';
}
export function getAvatarHTML(employee, size = 32, fontSize = 11) {
    if (employee.picture) {
        return `<img src="${employee.picture}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt=""/>`;
    }
    return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px;">${getInitials(employee.fname, employee.lname)}</div>`;
}
export function setHTML(elementId, html) {
    const el = document.getElementById(elementId);
    if (!el) { console.warn(`setHTML: #${elementId} not found.`); return false; }
    el.innerHTML = html;
    return true;
}
export function getEl(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found.`);
    return el;
}
