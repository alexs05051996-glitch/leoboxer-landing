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

// === ПОШАГОВЫЙ ИИ-ЧАТ "ROCKY BOXER" (в модальном окне) ===

document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM-элементы =====
    const chatModal = document.getElementById('ai-chat-modal');
    const chatInterface = document.getElementById('chat-interface');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputArea = document.getElementById('chat-input-area');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const modelButtonsContainer = document.getElementById('model-buttons');
    const chatLoading = document.getElementById('chat-loading');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const backBtn = document.getElementById('chat-back-btn');

    if (!chatModal || !chatInterface || !chatMessages || !chatInputArea) return; // нет модалки — выходим

    // ===== Состояние чата =====
    let leadData = {
        name: '',
        phone: '',
        city: '',
        budget: '',
        model_interest: ''
    };
    let currentStep = 0;
    let isStreaming = false;

    // ===== Модели (номенклатура из system_prompt.txt Rocky Boxer) =====
    // Кнопка показывает цену, а в leadData.model_interest записывается точное
    // наименование модели, которое распознаёт ИИ на бэкенде.
    const MODEL_BUTTONS = [
        { label: 'Взрослый Классик — 230 000 руб.', value: 'Взрослый Классик' },
        { label: 'Юниорский — 230 000 руб.', value: 'Юниорский' },
        { label: 'Детская серия — 220 000 руб.', value: 'Детская серия' }
    ];

    // ===== Шаги сценария =====
    const STEPS = {
        NAME: 1,
        CITY: 2,
        MODEL: 3,
        BUDGET: 4,
        PHONE: 5,
        STREAMING: 6
    };

    // ===== Вспомогательные функции =====
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Сообщение в мессенджер-стиле: аватарка (img) + пузырёк
    // type: 'user' — справа, 'assistant' — слева
    function addMessage(text, type) {
        const isUser = type === 'user';

        const row = document.createElement('div');
        row.className = 'message ' + (isUser ? 'message--user' : 'message--assistant');

        // Аватарка — чистый тег img
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (isUser) {
            avatar.innerHTML = '<div class="chat-avatar avatar-user"><img src="/static/assets/user-3d-avatar.jpg" alt="User"></div>';
        } else {
            avatar.innerHTML = '<div class="chat-avatar avatar-assistant"><img src="/static/assets/lion-neon.jpg" alt="Rocky"></div>';
        }

        // Пузырёк с текстом
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        row.appendChild(avatar);
        row.appendChild(bubble);
        chatMessages.appendChild(row);
        scrollToBottom();
        return row;
    }

    // Индикатор печатания (три точки) как сообщение бота с аватаркой
    function addTypingBubble() {
        const row = document.createElement('div');
        row.className = 'message message--assistant';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<div class="chat-avatar avatar-assistant"><img src="/static/assets/lion-neon.jpg" alt="Rocky"></div>';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = '<span class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';

        row.appendChild(avatar);
        row.appendChild(bubble);
        chatMessages.appendChild(row);
        scrollToBottom();
        return row;
    }

    function setInputMode(placeholder, buttonText, showInput) {
        if (showInput) {
            chatInputArea.style.display = 'flex';
            chatInput.placeholder = placeholder;
            chatSendBtn.textContent = buttonText;
            chatInput.focus();
        } else {
            chatInputArea.style.display = 'none';
        }
        // Показываем/скрываем кнопку «Назад»
        if (backBtn) {
            backBtn.style.display = (currentStep > STEPS.NAME && showInput) ? 'inline-block' : 'none';
        }
    }

    function showModelButtons() {
        modelButtonsContainer.style.display = 'flex';
        modelButtonsContainer.innerHTML = '';
        MODEL_BUTTONS.forEach(function(btn) {
            const button = document.createElement('button');
            button.className = 'btn btn-model';
            button.textContent = btn.label;
            button.dataset.modelValue = btn.value;
            // Обработчик через делегирование на контейнере (см. ниже)
            modelButtonsContainer.appendChild(button);
        });
        scrollToBottom();
    }

    // ===== Рендер шага =====
    function renderStep(step, value) {
        switch (step) {
            case STEPS.NAME:
                addMessage('Здравствуйте! Я — Rocky Boxer, старший аналитик завода «ЛЕО БОКСЕР». Давайте рассчитаем вашу прибыль! Как вас зовут?', 'assistant');
                setInputMode('Ваше имя', 'Далее', true);
                break;
            case STEPS.CITY:
                if (value !== null) {
                    leadData.name = value;
                }
                addMessage('Приятно познакомиться, ' + (leadData.name || '') + '! В каком городе планируете установку?', 'assistant');
                setInputMode('Ваш город', 'Далее', true);
                break;
            case STEPS.MODEL:
                if (value !== null) {
                    leadData.city = value;
                }
                addMessage('Отлично! Какую модель силомера выберем?', 'assistant');
                setInputMode('Введите модель или выберите кнопкой', 'Далее', true);
                showModelButtons();
                break;
            case STEPS.BUDGET:
                if (value !== null) {
                    leadData.model_interest = value;
                }
                addMessage('Прекрасный выбор! Теперь укажите ваш бюджет на проект (в рублях):', 'assistant');
                setInputMode('Бюджет в рублях (например, 700000)', 'Далее', true);
                break;
            case STEPS.PHONE:
                if (value !== null) {
                    leadData.budget = value;
                }
                addMessage('И последний шаг: ваш номер телефона, чтобы закрепить расчёт.', 'assistant');
                setInputMode('Номер телефона', 'Запустить ИИ-расчёт', true);
                break;
            case STEPS.STREAMING:
                if (value !== null) {
                    leadData.phone = value;
                }
                finishChat();
                break;
        }
        // Скрываем кнопки моделей, если не на шаге MODEL
        if (step !== STEPS.MODEL) {
            modelButtonsContainer.style.display = 'none';
        }
        scrollToBottom();
    }

    // ===== Отправка ввода =====
    function handleSend() {
        if (isStreaming) return;
        const value = chatInput.value.trim();
        if (!value) return;

        // Показываем ответ пользователя в чате
        addMessage(value, 'user');

        switch (currentStep) {
            case STEPS.NAME:
                renderStep(STEPS.CITY, value);
                currentStep = STEPS.CITY;
                break;
            case STEPS.CITY:
                renderStep(STEPS.MODEL, value);
                currentStep = STEPS.MODEL;
                break;
            case STEPS.MODEL:
                leadData.model_interest = value;
                renderStep(STEPS.BUDGET, value);
                currentStep = STEPS.BUDGET;
                break;
            case STEPS.BUDGET:
                if (!/^\d[\d\s\u00A0]*$/.test(value.replace(/\s/g, ''))) {
                    addMessage('️Пожалуйста, введите бюджет числом, например 700000.', 'assistant');
                    return;
                }
                renderStep(STEPS.PHONE, value.replace(/\s/g, ''));
                currentStep = STEPS.PHONE;
                break;
            case STEPS.PHONE:
                renderStep(STEPS.STREAMING, value);
                currentStep = STEPS.STREAMING;
                break;
        }

        chatInput.value = '';
        scrollToBottom();
    }

    // ===== Возврат на шаг назад =====
    function goBack() {
        if (currentStep <= STEPS.NAME || isStreaming) return;

        // Удаляем последние два сообщения (пользователь + бот)
        const messages = chatMessages.querySelectorAll('.message');
        if (messages.length >= 2) {
            messages[messages.length - 1].remove();
            messages[messages.length - 2].remove();
        }

        currentStep--;

        // Скрываем кнопки моделей при возврате с шага MODEL
        modelButtonsContainer.style.display = 'none';

        // Перерисовываем предыдущий шаг с сохранёнными данными
        renderStep(currentStep, null);
    }

    // ===== Финальная отправка + SSE =====
    async function finishChat() {
        isStreaming = true;
        setInputMode('', '', false);
        modelButtonsContainer.style.display = 'none';
        chatSendBtn.disabled = true;

        // Мгновенно показываем баббл Rocky Boxer (с аватаркой) с текстом + курсором
        const assistantRow = document.createElement('div');
        assistantRow.className = 'message message--assistant';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<div class="chat-avatar avatar-assistant"><img src="/static/assets/lion-neon.jpg" alt="Rocky"></div>';

        const assistantBubble = document.createElement('div');
        assistantBubble.className = 'message-bubble';
        assistantBubble.innerHTML = 'Анализирую рынок ' + escapeHtml(leadData.city) + '... Формирую бизнес-план:<br><span class="ai-cursor">|</span>';

        assistantRow.appendChild(avatar);
        assistantRow.appendChild(assistantBubble);
        chatMessages.appendChild(assistantRow);

        scrollToBottom();

        try {
            const response = await fetch('/api/stream-calculation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_name: leadData.name,
                    user_phone: leadData.phone,
                    user_city: leadData.city,
                    user_budget: leadData.budget,
                    user_model: leadData.model_interest
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка сети: ' + response.status);
            }

            chatLoading.style.display = 'none';

            // Читаем SSE-поток
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // последняя строка может быть неполной

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;

                    const data = trimmed.slice(5).trim();
                    if (data === '[DONE]') {
                        continue;
                    }

                    try {
                        const payload = JSON.parse(data);
                        if (payload.token) {
                            accumulatedText += payload.token;
                            // Рендерим накопленный текст через marked + курсор
                            const markdownHtml = typeof marked !== 'undefined'
                                ? marked.parse(accumulatedText)
                                : escapeHtml(accumulatedText);
                            assistantBubble.innerHTML = markdownHtml + '<span class="ai-cursor">|</span>';
                            scrollToBottom();
                        }
                    } catch (err) {
                        // Игнорируем некорректные чанки
                    }
                }
            }

            // Поток завершён — убираем курсор
            if (typeof marked !== 'undefined') {
                assistantBubble.innerHTML = marked.parse(accumulatedText);
            } else {
                assistantBubble.textContent = accumulatedText;
            }

            addMessage('✅ Расчёт готов! Менеджер завода свяжется с вами для брони лучших локаций.', 'assistant');

        } catch (error) {
            console.error(error);
            chatLoading.style.display = 'none';
            assistantBubble.innerHTML = '⚠️ Ошибка соединения. Пожалуйста, попробуйте ещё раз.';
        } finally {
            isStreaming = false;
            chatSendBtn.disabled = false;
            scrollToBottom();
        }
    }

    // ===== Полный сброс состояния чата =====
    // Очищает сообщения, обнуляет переменные и возвращает UI в исходное состояние.
    function resetChat() {
        chatMessages.innerHTML = '';
        currentStep = 0;
        leadData = {
            name: '',
            phone: '',
            city: '',
            budget: '',
            model_interest: ''
        };
        isStreaming = false;

        modelButtonsContainer.style.display = 'none';
        chatLoading.style.display = 'none';
        chatInputArea.style.display = 'flex';
        chatInput.value = '';
        chatSendBtn.disabled = false;
        if (backBtn) {
            backBtn.style.display = 'none';
        }
    }

    // ===== Инициализация: приветствие =====
    function initChat() {
        chatMessages.innerHTML = '';
        currentStep = STEPS.NAME;
        renderStep(STEPS.NAME);
        chatInput.value = '';
    }

    // ===== Открытие модального окна =====
    function openChat() {
        // Показываем оверлей
        chatModal.classList.add('active');
        // Блокируем скролл страницы
        document.body.style.overflow = 'hidden';
        // Сбрасываем состояние и запускаем сценарий с приветствия
        resetChat();
        initChat();
    }

    // ===== Закрытие модального окна =====
    function closeChat() {
        // Скрываем оверлей
        chatModal.classList.remove('active');
        // Возвращаем скролл странице
        document.body.style.overflow = '';
        // Сбрасываем состояние, чтобы при повторном открытии диалог начался заново
        resetChat();
    }

    // ===== События =====
    chatSendBtn.addEventListener('click', handleSend);
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });

    // Делегированный обработчик для кнопок моделей
    modelButtonsContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-model');
        if (btn && btn.dataset.modelValue) {
            const modelValue = btn.dataset.modelValue;
            leadData.model_interest = modelValue;
            // Добавить сообщение пользователя с выбранной моделью
            addMessage(modelValue, 'user');
            // Затем перейти к бюджету
            renderStep(STEPS.BUDGET, modelValue);
            currentStep = STEPS.BUDGET;
        }
    });

    // Чат НЕ инициализируется при загрузке страницы.
    // Rocky Boxer начинает диалог ТОЛЬКО после клика по CTA-кнопке (см. ниже).

    // ===== Открытие чата из CTA-кнопок =====
    // Любая кнопка с классом .b2b-offer-btn, [data-scroll-to-chat]
    // или .btn-hero-cta открывает модальное окно с чатом.
    document.querySelectorAll('[data-scroll-to-chat], .btn-hero-cta, .b2b-offer-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openChat();
        });
    });

    // ===== Закрытие чата =====

    // 1) По клику на крестик
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeChat);
    }

    // 2) По клику на тёмную область оверлея (но не на дочерние элементы)
    chatModal.addEventListener('click', function(e) {
        if (e.target === chatModal) {
            closeChat();
        }
    });

    // 3) По нажатию клавиши Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && chatModal.classList.contains('active')) {
            closeChat();
        }
    });
});
// === ОБРАБОТЧИК ФОРМЫ В БЛОКЕ «Начни бизнес с надёжным партнёром» ===
// Отправляет данные на /api/calculate/ и показывает результат
document.addEventListener('DOMContentLoaded', function() {
    const ctaForm = document.getElementById('b2b-cta-form');
    if (!ctaForm) return;

    const ctaResult = document.getElementById('b2b-cta-result');
    const ctaSubmitBtn = ctaForm.querySelector('.b2b-cta-submit');

    ctaForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Собираем данные формы
        const formData = new FormData(ctaForm);

        // Показываем состояние загрузки
        ctaSubmitBtn.disabled = true;
        ctaSubmitBtn.textContent = '⏳ Генерируем расчёт...';
        ctaResult.hidden = true;

        try {
            const response = await fetch('/api/calculate/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || 'Ошибка сервера: ' + response.status);
            }

            const data = await response.json();

            if (data.status === 'success' && data.result) {
                // Скрываем форму, показываем результат
                ctaForm.style.display = 'none';
                ctaResult.hidden = false;

                // Рендерим через marked (если библиотека загружена) или как текст
                if (typeof marked !== 'undefined') {
                    ctaResult.innerHTML = marked.parse(data.result);
                } else {
                    ctaResult.textContent = data.result;
                }
            } else {
                throw new Error(data.message || 'Не удалось получить расчёт');
            }
        } catch (error) {
            console.error('[b2b-cta]', error);
            ctaResult.hidden = false;
            ctaResult.innerHTML = '<p class="b2b-cta-error">⚠️ ' + escapeHtml(error.message) + '</p>'
                + '<button type="button" class="b2b-offer-btn b2b-cta-retry" onclick="location.reload()">Попробовать снова</button>';
        } finally {
            ctaSubmitBtn.disabled = false;
            ctaSubmitBtn.textContent = 'Запустить ИИ-анализ рынка';
        }
    });
});
// === СЛАЙДЕР «НАШИ ФРАНЧАЙЗИ» (чистый JS, без зависимостей) ===
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.b2b-testimonials-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.b2b-testimonials-slide');
    const dots  = document.querySelectorAll('.b2b-testimonials-dot');
    const prev  = slider.querySelector('.b2b-testimonials-nav--prev');
    const next  = slider.querySelector('.b2b-testimonials-nav--next');
    const total = slides.length;
    if (total === 0) return;

    let currentIndex = 0;

    function goTo(index) {
        if (index < 0 || index >= total) return;

        // Скрываем все слайды, показываем целевой
        slides.forEach((slide, i) => {
            slide.classList.toggle('is-active', i === index);
        });

        // Обновляем точки + aria-current
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === index);
            if (i === index) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });

        // Стрелки: блокируем на краях
        prev.disabled = index === 0;
        next.disabled = index === total - 1;

        currentIndex = index;
    }

    // Клик по стрелкам
    if (prev) prev.addEventListener('click', () => goTo(currentIndex - 1));
    if (next) next.addEventListener('click', () => goTo(currentIndex + 1));

    // Клик по точкам
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goTo(i));
    });

    // Клавиши ← →
    document.addEventListener('keydown', function(e) {
        // Срабатывает, если слайдер в области видимости или активен
        const rect = slider.closest('.b2b-testimonials-card');
        if (!rect) return;
        const bounds = rect.getBoundingClientRect();
        const isVisible = bounds.top < window.innerHeight && bounds.bottom > 0;
        if (!isVisible) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(currentIndex + 1);
        }
    });

    // Свайп на мобильных (touch)
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    slider.addEventListener('touchstart', function(e) {
        const touch = e.changedTouches[0];
        touchStartX = touch.screenX;
        touchStartY = touch.screenY;
        isSwiping = true;
    }, { passive: true });

    slider.addEventListener('touchend', function(e) {
        if (!isSwiping) return;
        isSwiping = false;

        const touch = e.changedTouches[0];
        const deltaX = touch.screenX - touchStartX;
        const deltaY = touch.screenY - touchStartY;

        // Горизонтальный свайп > 50px и доминирующий по X
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0) {
                // Свайп влево → следующий
                goTo(currentIndex + 1);
            } else {
                // Свайп вправо → предыдущий
                goTo(currentIndex - 1);
            }
        }
    }, { passive: true });

    // Инициализация: первый слайд (уже .is-active в разметке, но синхронизируем стейт)
    goTo(0);
});