function attemptLogin(onSuccess) {
    const username = getEl('login-user').value.trim();
    const password = getEl('login-pass').value;
    const errEl = getEl('login-err');
    const user = findByCredentials(username, password);
    if (!user) {
        errEl.textContent = 'Incorrect username or password.';
        getEl('login-pass').value = '';
        setTimeout(() => { errEl.textContent = ''; }, 3000);
        return;
    }
    errEl.textContent = '';
    onSuccess(user);
}