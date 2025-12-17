document.addEventListener('DOMContentLoaded', () => {
    const shell = document.querySelector('.register-shell');
    if (!shell) return;
    requestAnimationFrame(() => shell.classList.add('is-visible'));
});
