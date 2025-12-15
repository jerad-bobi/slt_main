document.addEventListener('DOMContentLoaded', () => {
    const letterCards = document.querySelectorAll('.letter-card');
    letterCards.forEach((card) => {
        const video = card.querySelector('video');
        if (!video) return;

        let timer = null;

        const startLoop = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                video.currentTime = 0;
                video.play().catch(() => {});
            }, 2000);
        };

        const playNow = () => {
            clearTimeout(timer);
            video.muted = true;
            video.play().catch(() => {});
        };

        const stopAndReset = () => {
            clearTimeout(timer);
            video.pause();
            video.currentTime = 0;
        };

        video.addEventListener('ended', startLoop);
        card.addEventListener('mouseenter', playNow);
        card.addEventListener('mouseleave', stopAndReset);
        card.addEventListener('focus', playNow);
        card.addEventListener('blur', stopAndReset);
    });

    const lessonCards = document.querySelectorAll('.lesson-card');
    lessonCards.forEach((card) => {
        if (card.classList.contains('letter-card')) return;

        const video = card.querySelector('video');
        if (!video || video.closest('.phrase-player')) return;

        let timer = null;

        const startLoop = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                video.currentTime = 0;
                video.play().catch(() => {});
            }, 2000);
        };

        const playNow = () => {
            clearTimeout(timer);
            video.muted = true;
            video.play().catch(() => {});
        };

        const stopAndReset = () => {
            clearTimeout(timer);
            video.pause();
            video.currentTime = 0;
        };

        video.addEventListener('ended', startLoop);
        card.addEventListener('mouseenter', playNow);
        card.addEventListener('mouseleave', stopAndReset);
        card.addEventListener('focus', playNow);
        card.addEventListener('blur', stopAndReset);
    });
});
