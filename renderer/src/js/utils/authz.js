let _roleCode = '';

function resolvedRole() {
  return _roleCode || document.body.dataset.role || '';
}

export function setCurrentRole(roleCode) {
  _roleCode = String(roleCode || '').trim();
  if (_roleCode) {
    document.body.dataset.role = _roleCode;
  } else {
    delete document.body.dataset.role;
  }
}

export function clearCurrentRole() {
  _roleCode = '';
  delete document.body.dataset.role;
}

export function currentRole() {
  return resolvedRole();
}

export function canWrite() {
  return ['staff', 'admin', 'superadmin'].includes(resolvedRole());
}

export function canManageUsers() {
  return ['admin', 'superadmin'].includes(resolvedRole());
}

export function isSuperadmin() {
  return resolvedRole() === 'superadmin';
}
