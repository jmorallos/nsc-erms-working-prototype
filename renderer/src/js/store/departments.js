let _departments = [
    { id: 1, name: 'Administration', description: 'Administrative and support services' },
    { id: 2, name: 'College of Arts', description: 'Humanities and social sciences' },
    { id: 3, name: 'College of Education', description: 'Teacher training and education' },
    { id: 4, name: 'College of Engineering', description: 'Technical and engineering programs' },
    { id: 5, name: 'College of Nursing', description: 'Nursing and health sciences' },
    { id: 6, name: 'Library Services', description: 'Library and information management' },
];
let _nextDeptId = 7;

export function initDepartments() {
    // Data is initialized inline above; this hook exists for future
    // async loading (e.g. from localStorage or an API).
}

export function getAllDepartments() { return _departments; }

export function getDepartmentById(id) { return _departments.find(d => d.id === id) ?? null; }

export function addDepartment(data) {
    const dept = { id: _nextDeptId++, ...data };
    _departments.push(dept);
    return dept;
}

export function updateDepartment(id, data) {
    const idx = _departments.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Department #${id} not found.`);
    _departments[idx] = { ..._departments[idx], ...data };
    return _departments[idx];
}

export function deleteDepartment(id) { _departments = _departments.filter(d => d.id !== id); }

export function replaceDepts(arr) {
    _departments = arr;
    _nextDeptId = Math.max(...arr.map(d => d.id), 0) + 1;
}
