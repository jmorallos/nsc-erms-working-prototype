let _users = [
    { id: 1, name: 'Admin', username: 'admin', password: 'admin123', role: 'HR Administrator' },
    { id: 2, name: 'HR Staff', username: 'hrstaff', password: 'staff123', role: 'HR Staff' },
];
let _nextUserId = 3;

export function initUsers() {
    // Data is initialized inline above; this hook exists for future
    // async loading (e.g. from localStorage or an API).
}

export function getAllUsers() { return _users.map(({ password: _, ...u }) => u); }

export function findByCredentials(username, password) {
    return _users.find(x => x.username === username && x.password === password) ?? null;
}

export function addUser(data) {
    if (_users.some(u => u.username === data.username)) throw new Error('Username already exists.');
    const user = { id: _nextUserId++, ...data };
    _users.push(user);
    return { id: user.id, name: user.name, username: user.username, role: user.role };
}

export function deleteUser(id) {
    if (id === 1) throw new Error('Cannot delete the main admin account.');
    _users = _users.filter(u => u.id !== id);
}
