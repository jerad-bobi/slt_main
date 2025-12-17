document.addEventListener('DOMContentLoaded', () => {
    const shell = document.querySelector('.profile-shell');
    if (!shell) return;

    requestAnimationFrame(() => shell.classList.add('is-visible'));
});
