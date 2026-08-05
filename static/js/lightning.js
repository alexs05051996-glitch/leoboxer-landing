/**
 * Динамический эффект молний на hero-экране
 * Рисует ломаные линии (молнии) синего (#00f0ff) и розового (#ff2d75) цветов.
 * Молнии появляются случайно из центральной области, разлетаются в стороны и затухают.
 * Не более 15 одновременных молний.
 * Использует requestAnimationFrame для анимации.
 * Canvas адаптируется под размер родительского блока (ResizeObserver).
 */
(function () {
    'use strict';

    var canvas = document.getElementById('lightningCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var wrapper = canvas.parentElement;
    if (!wrapper) return;

    var W, H;

    /** Максимальное количество одновременных молний */
    var MAX_BOLTS = 15;

    /** Массив активных молний */
    var bolts = [];

    /** ID анимационного фрейма */
    var animFrameId = null;

    /** Время последнего спавна молнии */
    var lastSpawn = 0;

    /** Минимальный интервал между спавнами (ms) */
    var SPAWN_INTERVAL = 200;

    // ==========================================
    // Resize — подгоняем canvas под размер wrapper
    // ==========================================
    function resize() {
        var rect = wrapper.getBoundingClientRect();
        var dpr = window.devicePixelRatio || 1;
        W = rect.width;
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    // ==========================================
    // Вспомогательные функции
    // ==========================================
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randInt(min, max) {
        return Math.floor(rand(min, max + 1));
    }

    /**
     * Генерирует точки ломаной линии молнии
     * @param {number} x0 - начальная X
     * @param {number} y0 - начальная Y
     * @param {number} angle - направление в радианах
     * @param {number} length - общая длина молнии
     * @param {number} segments - количество сегментов
     * @returns {Array<{x: number, y: number}>}
     */
    function generateBoltPoints(x0, y0, angle, length, segments) {
        var points = [{ x: x0, y: y0 }];
        var segLen = length / segments;
        var dx = Math.cos(angle);
        var dy = Math.sin(angle);
        var spread = 0.4; // разброс отклонения

        for (var i = 1; i <= segments; i++) {
            var prev = points[i - 1];
            var offsetX = rand(-segLen * spread, segLen * spread);
            var offsetY = rand(-segLen * spread, segLen * spread);
            var nx = prev.x + dx * segLen + offsetX;
            var ny = prev.y + dy * segLen + offsetY;
            points.push({ x: nx, y: ny });
        }

        return points;
    }

    /**
     * Создаёт новую молнию
     */
    function createBolt() {
        if (bolts.length >= MAX_BOLTS) return;

        var cx = W * 0.5;
        var cy = H * 0.5;

        // Случайное направление (все стороны)
        var angle = rand(0, Math.PI * 2);
        // Длина молнии — от 30% до 70% от диагонали
        var maxDist = Math.sqrt(W * W + H * H);
        var length = rand(maxDist * 0.3, maxDist * 0.7);
        var segments = randInt(6, 14);

        var points = generateBoltPoints(cx, cy, angle, length, segments);

        // Цвет: синий или розовый
        var color = Math.random() < 0.6 ? '#00f0ff' : '#ff2d75';

        // Толщина линии
        var lineWidth = rand(1.5, 4);

        // Прозрачность (затухание)
        var opacity = rand(0.6, 1.0);

        // Скорость затухания (уменьшение opacity в секунду)
        var fadeSpeed = rand(0.8, 2.0);

        bolts.push({
            points: points,
            color: color,
            lineWidth: lineWidth,
            opacity: opacity,
            fadeSpeed: fadeSpeed,
            age: 0
        });
    }

    // ==========================================
    // Отрисовка
    // ==========================================
    function draw() {
        ctx.clearRect(0, 0, W, H);

        for (var i = bolts.length - 1; i >= 0; i--) {
            var bolt = bolts[i];
            var pts = bolt.points;

            if (bolt.opacity <= 0) {
                bolts.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var j = 1; j < pts.length; j++) {
                ctx.lineTo(pts[j].x, pts[j].y);
            }

            ctx.strokeStyle = bolt.color;
            ctx.globalAlpha = bolt.opacity;
            ctx.lineWidth = bolt.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Сброс
            ctx.globalAlpha = 1;
        }
    }

    // ==========================================
    // Обновление состояния
    // ==========================================
    function update(dt) {
        // Затухание
        for (var i = 0; i < bolts.length; i++) {
            var bolt = bolts[i];
            bolt.opacity -= bolt.fadeSpeed * dt;
            bolt.age += dt;
        }

        // Спавн новых молний
        lastSpawn += dt * 1000;
        if (lastSpawn >= SPAWN_INTERVAL) {
            lastSpawn = 0;
            // Случайное количество: 1–3
            var count = randInt(1, 3);
            for (var k = 0; k < count; k++) {
                createBolt();
            }
        }
    }

    // ==========================================
    // Цикл анимации
    // ==========================================
    var lastTime = 0;

    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var dt = (timestamp - lastTime) / 1000; // в секундах
        lastTime = timestamp;

        // Ограничиваем dt, чтобы при переключении вкладки не было скачков
        if (dt > 0.1) dt = 0.016;

        update(dt);
        draw();

        animFrameId = requestAnimationFrame(loop);
    }

    // ==========================================
    // Запуск
    // ==========================================
    animFrameId = requestAnimationFrame(loop);

    // ==========================================
    // Очистка при выгрузке страницы
    // ==========================================
    window.addEventListener('beforeunload', function () {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        if (ro) {
            ro.disconnect();
        }
    });
})();