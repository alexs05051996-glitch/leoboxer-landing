/**
 * Эффект молний на hero-экране
 * Рисует ветвистые электрические разряды, вылетающие из центра головы льва
 * во все стороны. Молнии имеют неоновое свечение и быстро затухают.
 * Использует requestAnimationFrame для 60 FPS.
 * Canvas привязан к контейнеру .hero-neon-container через ResizeObserver.
 */
(function () {
    'use strict';

    var canvas = document.getElementById('lightning-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var container = canvas.parentElement;
    if (!container) return;

    var W, H;

    /** Максимальное количество одновременных молний */
    var MAX_BOLTS = 20;

    /** Массив активных молний */
    var bolts = [];

    /** ID анимационного фрейма */
    var animFrameId = null;

    /** Время последнего спавна молнии (ms) */
    var lastSpawn = 0;

    /** Минимальный интервал между спавнами (ms) */
    var SPAWN_INTERVAL = 80;

    // ==========================================
    // Resize — подгоняем canvas под размер контейнера
    // ==========================================
    function resize() {
        var rect = container.getBoundingClientRect();
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
    ro.observe(container);
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
     * Генерирует точки основной ломаной линии молнии
     * @param {number} x0 - начальная X (центр холста)
     * @param {number} y0 - начальная Y (центр холста)
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
        var spread = 0.35;

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
     * Генерирует ответвления (дочерние молнии) от основной линии
     * @param {Array} parentPoints - точки родительской молнии
     * @param {number} branchCount - количество ответвлений
     * @returns {Array<Array<{x: number, y: number}>>}
     */
    function generateBranches(parentPoints, branchCount) {
        var branches = [];
        var parentLen = parentPoints.length;

        for (var b = 0; b < branchCount; b++) {
            // Выбираем случайную точку на родительской молнии (не первую)
            var idx = randInt(1, parentLen - 1);
            var start = parentPoints[idx];

            // Направление ответвления — отклоняемся от основного направления
            var branchAngle = rand(-Math.PI * 0.4, Math.PI * 0.4);
            var branchLen = rand(20, 60);
            var branchSegments = randInt(2, 5);
            var segLen = branchLen / branchSegments;
            var dx = Math.cos(branchAngle);
            var dy = Math.sin(branchAngle);
            var spread = 0.3;

            var branchPoints = [{ x: start.x, y: start.y }];
            for (var i = 1; i <= branchSegments; i++) {
                var prev = branchPoints[i - 1];
                var ox = rand(-segLen * spread, segLen * spread);
                var oy = rand(-segLen * spread, segLen * spread);
                branchPoints.push({
                    x: prev.x + dx * segLen + ox,
                    y: prev.y + dy * segLen + oy
                });
            }

            branches.push(branchPoints);
        }

        return branches;
    }

    /**
     * Создаёт новую молнию с ответвлениями
     */
    function createBolt() {
        if (bolts.length >= MAX_BOLTS) return;

        var cx = W * 0.5;
        var cy = H * 0.33;

        // Случайное направление — во все стороны
        var angle = rand(0, Math.PI * 2);
        // Длина молнии — от 40% до 80% от диагонали холста
        var maxDist = Math.sqrt(W * W + H * H);
        var length = rand(maxDist * 0.4, maxDist * 0.8);
        var segments = randInt(8, 16);

        var points = generateBoltPoints(cx, cy, angle, length, segments);

        // Ответвления (0–3 штуки)
        var branchCount = randInt(0, 3);
        var branches = generateBranches(points, branchCount);

        // Цвет: синий (60%) или розовый (40%)
        var color = Math.random() < 0.6 ? '#00f0ff' : '#ff2d75';

        // Толщина основной линии
        var lineWidth = rand(1.5, 3.5);

        // Начальная прозрачность
        var opacity = rand(0.7, 1.0);

        // Скорость затухания (уменьшение opacity в секунду) — быстрое
        var fadeSpeed = rand(1.5, 3.5);

        bolts.push({
            points: points,
            branches: branches,
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

            if (bolt.opacity <= 0) {
                bolts.splice(i, 1);
                continue;
            }

            // Основная линия
            ctx.save();
            ctx.beginPath();
            var pts = bolt.points;
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var j = 1; j < pts.length; j++) {
                ctx.lineTo(pts[j].x, pts[j].y);
            }

            ctx.strokeStyle = bolt.color;
            ctx.globalAlpha = bolt.opacity;
            ctx.lineWidth = bolt.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Неоновое свечение
            ctx.shadowBlur = 30;
            ctx.shadowColor = bolt.color;

            ctx.stroke();
            ctx.restore();

            // Ответвления
            for (var b = 0; b < bolt.branches.length; b++) {
                var branch = bolt.branches[b];
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(branch[0].x, branch[0].y);
                for (var k = 1; k < branch.length; k++) {
                    ctx.lineTo(branch[k].x, branch[k].y);
                }

                ctx.strokeStyle = bolt.color;
                ctx.globalAlpha = bolt.opacity * 0.7;
                ctx.lineWidth = bolt.lineWidth * 0.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.shadowBlur = 18;
                ctx.shadowColor = bolt.color;

                ctx.stroke();
                ctx.restore();
            }
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
            // Случайное количество: 1–2
            var count = randInt(1, 2);
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