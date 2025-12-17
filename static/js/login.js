document.addEventListener('DOMContentLoaded', () => {
    const shell = document.querySelector('.login-shell');
    if (!shell) return;
    requestAnimationFrame(() => shell.classList.add('is-visible'));
});
