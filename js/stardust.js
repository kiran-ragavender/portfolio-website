/* ==========================================================
   stardust.js · full-page animated starfield (canvas)

   - Drifting stars with twinkle and depth (closer stars are
     bigger, brighter, and move more with scroll and cursor)
   - Occasional shooting stars (dark mode only)
   - Colors come from CSS custom properties (--star-*), so the
     field follows the dark/light theme automatically
   - Respects prefers-reduced-motion by drawing a still field
   ========================================================== */
(function () {
    'use strict';

    var canvas = document.getElementById('stardust');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');

    /* ---- Tweak the look here ---- */
    var CONFIG = {
        density: 1 / 5200,      // stars per square pixel of viewport
        maxStars: 380,
        drift: 0.08,            // upward drift speed (px per frame, nearest layer)
        scrollParallax: 0.15,   // how far stars shift as the page scrolls
        pointerParallax: 22,    // max px shift following the cursor
        tintChance: 0.18,       // share of stars that get a neon tint
        shootingEvery: [3500, 9000] // ms between shooting stars (min, max)
    };

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var width = 0;
    var height = 0;
    var stars = [];
    var shooting = [];
    var palette = readPalette();
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var nextShootAt = performance.now() + 2500;
    var rafId = null;

    /* Read star colors from the active theme */
    function readPalette() {
        var styles = getComputedStyle(document.documentElement);
        function v(name) { return styles.getPropertyValue(name).trim(); }
        return {
            base: v('--star-base') || '236, 232, 246',
            tints: [v('--star-tint-1'), v('--star-tint-2'), v('--star-tint-3')].filter(Boolean),
            alpha: parseFloat(v('--star-alpha')) || 1,
            shooting: v('--star-shooting') === '1'
        };
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function makeStar() {
        var depth = Math.pow(Math.random(), 1.8); // most stars are far away
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            depth: 0.15 + depth * 0.85,
            r: 0.35 + depth * 1.45,
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.6, 1.8),
            tint: Math.random() < CONFIG.tintChance ? Math.floor(Math.random() * 3) : -1
        };
    }

    function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var count = Math.min(CONFIG.maxStars, Math.round(width * height * CONFIG.density));
        stars = [];
        for (var i = 0; i < count; i++) stars.push(makeStar());
    }

    function spawnShootingStar() {
        var goingRight = Math.random() < 0.5;
        var angle = rand(0.35, 0.6); // radians below horizontal
        var speed = rand(9, 14);
        shooting.push({
            x: goingRight ? rand(0, width * 0.6) : rand(width * 0.4, width),
            y: rand(0, height * 0.4),
            vx: Math.cos(angle) * speed * (goingRight ? 1 : -1),
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: rand(45, 70),
            length: rand(80, 160)
        });
    }

    function drawStars(time, animate) {
        var scrollShift = window.scrollY * CONFIG.scrollParallax;
        var t = time / 1000;

        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            if (animate) {
                s.y -= CONFIG.drift * s.depth;
                if (s.y < 0) s.y += height;
            }

            var x = s.x + pointer.x * CONFIG.pointerParallax * s.depth;
            var y = s.y - scrollShift * s.depth;
            y = ((y % height) + height) % height;
            x = ((x % width) + width) % width;

            var flicker = animate ? 0.55 + 0.45 * Math.sin(t * s.twinkle + s.phase) : 0.8;
            var alpha = flicker * (0.3 + s.depth * 0.7) * palette.alpha;
            var color = s.tint >= 0 && palette.tints[s.tint] ? palette.tints[s.tint] : palette.base;

            // Soft halo on the nearest stars
            if (s.r > 1.3) {
                ctx.fillStyle = 'rgba(' + color + ',' + (alpha * 0.12) + ')';
                ctx.beginPath();
                ctx.arc(x, y, s.r * 3.2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
            ctx.beginPath();
            ctx.arc(x, y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawShootingStars(time) {
        if (palette.shooting && time > nextShootAt) {
            spawnShootingStar();
            nextShootAt = time + rand(CONFIG.shootingEvery[0], CONFIG.shootingEvery[1]);
        }

        for (var i = shooting.length - 1; i >= 0; i--) {
            var m = shooting[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life++;

            var fade = 1 - m.life / m.maxLife;
            var speed = Math.hypot(m.vx, m.vy);
            var tailX = m.x - (m.vx / speed) * m.length;
            var tailY = m.y - (m.vy / speed) * m.length;

            var gradient = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
            gradient.addColorStop(0, 'rgba(255, 255, 255,' + fade + ')');
            gradient.addColorStop(0.3, 'rgba(' + (palette.tints[0] || palette.base) + ',' + (fade * 0.6) + ')');
            gradient.addColorStop(1, 'rgba(' + (palette.tints[1] || palette.base) + ', 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            if (m.life >= m.maxLife) shooting.splice(i, 1);
        }
    }

    function frame(time) {
        // Ease the parallax toward the cursor
        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;

        ctx.clearRect(0, 0, width, height);
        drawStars(time, true);
        drawShootingStars(time);
        rafId = requestAnimationFrame(frame);
    }

    function drawStill() {
        ctx.clearRect(0, 0, width, height);
        drawStars(0, false);
    }

    function start() {
        cancelAnimationFrame(rafId);
        shooting = [];
        if (reduceMotion.matches) {
            drawStill();
        } else {
            rafId = requestAnimationFrame(frame);
        }
    }

    /* ---- Events ---- */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resize();
            if (reduceMotion.matches) drawStill();
        }, 150);
    });

    // Still mode: redraw on scroll so the parallax remains consistent
    window.addEventListener('scroll', function () {
        if (reduceMotion.matches) drawStill();
    }, { passive: true });

    window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        pointer.tx = (e.clientX / width - 0.5) * 2;
        pointer.ty = (e.clientY / height - 0.5) * 2;
    });

    // Fired by main.js whenever the theme changes
    document.addEventListener('themechange', function () {
        palette = readPalette();
        if (!palette.shooting) shooting = [];
        if (reduceMotion.matches) drawStill();
    });

    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', start);
    }

    resize();
    start();
})();
