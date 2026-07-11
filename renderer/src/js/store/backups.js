let _backups = [];
let _nextBkId = 1;
function getAllBackups() { return _backups; }
function getBackupById(id) { return _backups.find(b => b.id === id) ?? null; }
function addBackup(name, data) {
    const json = JSON.stringify(data, null, 2);
    const size = (json.length / 1024).toFixed(1) + ' KB';
    const backup = { id: _nextBkId++, name, size, date: getToday(), data: json };
    _backups.unshift(backup);
    return backup;
}
function deleteBackup(id) { _backups = _backups.filter(b => b.id !== id); }