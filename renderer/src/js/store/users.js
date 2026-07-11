let _users = [
    { id: 1, name: 'Admin', username: 'admin', password: 'admin123', role: 'HR Administrator' },
    { id: 2, name: 'HR Staff', username: 'hrstaff', password: 'staff123', role: 'HR Staff' },
];
let _nextUserId = 3;
function getAllUsers() { return _users.map(({ password: _, ...u }) => u); }
function findByCredentials(u, p) { return _users.find(x => x.username === u && x.password === p) ?? null; }
function addUser(data) {
    if (_users.some(u => u.username === data.username)) throw new Error('Username already exists.');
    const user = { id: _nextUserId++, ...data };
    _users.push(user);
    return { id: user.id, name: user.name, username: user.username, role: user.role };
}
function deleteUser(id) {
    if (id === 1) throw new Error('Cannot delete the main admin account.');
    _users = _users.filter(u => u.id !== id);
}