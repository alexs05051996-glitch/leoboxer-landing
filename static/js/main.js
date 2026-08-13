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

// === ИИ-калькулятор прибыли ===
document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('calcModal');
    const modalClose = document.getElementById('calcModalClose');
    const calcForm = document.getElementById('calculator-form');
    const resultContainer = document.getElementById('calc-result');
    const submitBtn = document.getElementById('calc-submit-btn');

    function resetCalculator() {
        calcForm.style.display = '';
        resultContainer.classList.add('hidden');
        resultContainer.textContent = '';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Запустить ИИ-анализ рынка';
        // при желании очистить поля: calcForm.reset();
    }

    // Открытие по кнопке с data-open-modal="calculator"
    document.querySelectorAll('[data-open-modal="calculator"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            resetCalculator();
            modalOverlay.classList.add('active');
        });
    });

    // Закрытие по крестику
    modalClose.addEventListener('click', function() {
        modalOverlay.classList.remove('active');
        resetCalculator();
    });

    // Закрытие по клику на оверлей
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
            resetCalculator();
        }
    });

    // Отправка формы
    calcForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const statuses = [
            "⚙️ Подключаюсь к серверу ИИ...",
            "📊 Анализирую бюджет и город...",
            "🧮 Рассчитываю налоги и расходы...",
            "📊 Составляю прогноз окупаемости...",
            "📝 Формирую итоговый финансовый отчет...",
            "🚀 Почти готово, финализирую бизнес-план..."
        ];
        let statusIndex = 0;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span id="loader-text">${statuses[0]}</span>`;
        const interval = setInterval(() => {
            statusIndex++;
            const loaderText = document.getElementById('loader-text');
            if (loaderText) {
                loaderText.textContent = statuses[statusIndex % statuses.length];
            }
        }, 2500);

        try {
            const response = await fetch('/api/calculate/', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Ошибка сети');
            const data = await response.json();
            if (data.status === 'success') {
                let cleanText = data.result
                    .replace(/\*\*/g, '')
                    .replace(/###/g, '')
                    .replace(/(?:\n\s*){3,}/g, '\n\n')
                    .trim();
                calcForm.style.display = 'none';
                resultContainer.textContent = cleanText;
                resultContainer.classList.remove('hidden');
            } else {
                alert('Произошла ошибка при расчёте. Попробуйте позже.');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка сети. Проверьте подключение.');
        } finally {
            clearInterval(interval);
            if (calcForm.style.display !== 'none') {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Запустить ИИ-анализ рынка';
            }
        }
    });
});
