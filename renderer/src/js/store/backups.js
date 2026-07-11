import { getToday } from '../utils/helpers.js';

let _backups = [];
let _nextBkId = 1;

export function initBackups() {
    // No startup data needed for backups; hook exists for symmetry.
}

export function getAllBackups() { return _backups; }

export function getBackupById(id) { return _backups.find(b => b.id === id) ?? null; }

export function addBackup(name, data) {
    const json = JSON.stringify(data, null, 2);
    const size = (json.length / 1024).toFixed(1) + ' KB';
    const backup = { id: _nextBkId++, name, size, date: getToday(), data: json };
    _backups.unshift(backup);
    return backup;
}

export function deleteBackup(id) { _backups = _backups.filter(b => b.id !== id); }
