import { getToday } from '../utils/helpers.js';

let _employees = [
    {
        id: 1, fname: 'Maria', lname: 'Santos', email: 'm.santos@college.edu.ph', contact: '09171234567', address: '123 Rizal St, Manila', position: 'Dean', dept: 'College of Arts', status: 'Active', start_date: '2018-06-01', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.2 MB', date: '2018-06-01', source: 'upload' },
            { id: 2, name: 'Personal Data Sheet (CS Form 212).pdf', type: 'pdf', size: '890 KB', date: '2018-06-01', source: 'upload' },
            { id: 3, name: 'SCANNED - CSC Eligibility.pdf', type: 'scan', size: '1.8 MB', date: '2024-01-10', source: 'scan' },
        ]
    },
    {
        id: 2, fname: 'Jose', lname: 'Reyes', email: 'j.reyes@college.edu.ph', contact: '09281234567', address: '456 Mabini Ave, Quezon City', position: 'Professor II', dept: 'College of Engineering', status: 'Active', start_date: '2015-08-15', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.1 MB', date: '2015-08-15', source: 'upload' },
            { id: 2, name: 'Board Certificate.pdf', type: 'pdf', size: '750 KB', date: '2015-08-15', source: 'upload' },
        ]
    },
    {
        id: 3, fname: 'Ana', lname: 'Cruz', email: 'a.cruz@college.edu.ph', contact: '09391234567', address: '789 Bonifacio Rd, Makati City', position: 'Administrative Officer', dept: 'Administration', status: 'On Leave', start_date: '2020-01-10', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.0 MB', date: '2020-01-10', source: 'upload' },
            { id: 2, name: 'Leave Application Form.pdf', type: 'pdf', size: '300 KB', date: '2024-03-01', source: 'upload' },
        ]
    },
    {
        id: 4, fname: 'Pedro', lname: 'Bautista', email: 'p.bautista@college.edu.ph', contact: '09501234567', address: '321 Luna St, Pasig City', position: 'University Registrar', dept: 'Administration', status: 'Active', start_date: '2019-03-22', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '1.2 MB', date: '2019-03-22', source: 'upload' },
            { id: 2, name: 'Appointment Paper.pdf', type: 'pdf', size: '600 KB', date: '2019-03-22', source: 'upload' },
        ]
    },
    {
        id: 5, fname: 'Liza', lname: 'Villanueva', email: 'l.villanueva@college.edu.ph', contact: '09611234567', address: '654 Del Pilar, Mandaluyong', position: 'Chief Librarian', dept: 'Library Services', status: 'Active', start_date: '2017-07-05', picture: null, docs: [
            { id: 1, name: 'Employment Contract.pdf', type: 'pdf', size: '900 KB', date: '2017-07-05', source: 'upload' },
        ]
    },
    { id: 6, fname: 'Ramon', lname: 'Dela Cruz', email: 'r.delacruz@college.edu.ph', contact: '09721234567', address: '88 Gen. Luna St, Cebu City', position: 'Professor I', dept: 'College of Nursing', status: 'Active', start_date: '2021-06-14', picture: null, docs: [] },
    { id: 7, fname: 'Carla', lname: 'Mendoza', email: 'c.mendoza@college.edu.ph', contact: '09831234567', address: '11 Colon St, Cebu City', position: 'Assistant Professor', dept: 'College of Education', status: 'Inactive', start_date: '2016-11-01', picture: null, docs: [] },
];
let _nextEmpId = 8;
let _nextDocId = 100;

const SAMPLE_DOC_NAMES = [
    'Personal Data Sheet (CS Form 212)', 'Employment Contract', 'Appointment Paper',
    'Service Record', 'Certificate of Eligibility (CSC)', 'NBI Clearance',
    'Transcript of Records', 'Oath of Office', 'Medical Certificate',
];

export function initEmployees() {
    // Data is initialized inline above; this hook exists for future
    // async loading (e.g. from localStorage or an API).
}

export function getAllEmployees() { return _employees; }

export function getEmployeeById(id) { return _employees.find(e => e.id === id) ?? null; }

export function addEmployee(data) {
    const e = { id: _nextEmpId++, ...data, docs: [] };
    _employees.push(e);
    return e;
}

export function updateEmployee(id, data) {
    const idx = _employees.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`Employee #${id} not found.`);
    _employees[idx] = { ..._employees[idx], ...data };
    return _employees[idx];
}

export function deleteEmployee(id) { _employees = _employees.filter(e => e.id !== id); }

export function addDocument(employeeId, docData) {
    const emp = getEmployeeById(employeeId);
    if (!emp) throw new Error(`Employee #${employeeId} not found.`);
    const doc = { id: _nextDocId++, ...docData };
    emp.docs.push(doc);
    return doc;
}

export function deleteDocument(employeeId, docId) {
    const emp = getEmployeeById(employeeId);
    if (!emp) throw new Error(`Employee #${employeeId} not found.`);
    emp.docs = emp.docs.filter(d => d.id !== docId);
}

export function addSampleDocuments(employeeId) {
    const emp = getEmployeeById(employeeId);
    if (!emp) throw new Error(`Employee #${employeeId} not found.`);
    const existing = new Set(emp.docs.map(d => d.name));
    let added = 0;
    SAMPLE_DOC_NAMES.forEach(name => {
        const filename = `${name}.pdf`;
        if (!existing.has(filename)) {
            emp.docs.push({ id: _nextDocId++, name: filename, type: 'pdf', size: '—', date: getToday(), source: 'sample' });
            added++;
        }
    });
    return added;
}

export function replaceAll(employeesArray) {
    _employees = employeesArray;
    _nextEmpId = Math.max(...employeesArray.map(e => e.id), 0) + 1;
}
