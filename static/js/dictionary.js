document.addEventListener('DOMContentLoaded', () => {
    const shell = document.querySelector('.dictionary-shell');
    if (shell) {
        requestAnimationFrame(() => shell.classList.add('is-visible'));
    }

    const toggles = document.querySelectorAll('[data-mode-toggle]');
    toggles.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (!shell) {
                window.location = link.href;
                return;
            }
            shell.classList.remove('is-visible');
            setTimeout(() => {
                window.location = link.href;
            }, 180);
        });
    });

    const video = document.getElementById('asl-video');
    if (video) {
        video.autoplay = true;
        video.muted = true;
        const restart = () => {
            setTimeout(() => {
                video.currentTime = 0;
                video.play().catch(() => {});
            }, 2000);
        };
        video.addEventListener('ended', restart);
    }
});
