// Глобальные скрипты для лендинга «ЛЕО БОКСЕР»

// Intersection Observer для неоновой цифры — анимация только в области видимости
document.addEventListener('DOMContentLoaded', () => {
    const neonEl = document.querySelector('.neon-number');
    if (!neonEl) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                neonEl.style.animationPlayState = 'running';
            } else {
                neonEl.style.animationPlayState = 'paused';
            }
        });
    }, { threshold: 0.3 });

    observer.observe(neonEl);
});