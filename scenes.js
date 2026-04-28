/* ============================================================
   RobotMIA Чат-платформа — движок «киношных» сцен (slide 07).

   Концепция: на сцене последовательно проигрываются bespoke-мокапы
   реальных интерфейсов чат-платформы. Каждая сцена — самодостаточный
   <div class="scene" data-scene-id="..." data-scene-duration="7000">,
   все анимации внутри запускаются классом .is-active через CSS keyframes.

   Контроллер при активации слайда:
   1. Переключает .is-active между .scene и .scene-pill по data-scene-id.
   2. Принудительно делает reflow → CSS-анимации перезапускаются с нуля.
   3. По истечении data-scene-duration переходит на следующую сцену.

   Уважает prefers-reduced-motion: показывает первую сцену без цикла.
   ============================================================ */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stageEl = () => document.querySelector('deck-stage');

  function initSceneCycles() {
    const cycles = document.querySelectorAll('[data-scene-cycle]');
    if (!cycles.length) return;
    const stage = stageEl();
    const timers = new WeakMap();

    function activateProgress(root, dur) {
      const bar = root.querySelector('[data-scene-progress]');
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
      // двойной rAF, чтобы reset зафиксировался до начала transition
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.transition = `transform ${dur}ms linear`;
        bar.style.transform = 'scaleX(1)';
      }));
    }

    function startCycle(root) {
      if (timers.get(root)) return;
      const scenes = Array.from(root.querySelectorAll('.scene[data-scene-id]'));
      const pills = Array.from(root.querySelectorAll('.scene-pill[data-scene-id]'));
      if (!scenes.length) return;

      if (REDUCED) {
        const id = scenes[0].dataset.sceneId;
        scenes[0].classList.add('is-active');
        pills.forEach((p) => p.classList.toggle('is-active', p.dataset.sceneId === id));
        return;
      }

      let idx = 0;
      const tick = () => {
        const node = scenes[idx];
        const id = node.dataset.sceneId;
        // выключаем все
        scenes.forEach((s) => s.classList.remove('is-active'));
        pills.forEach((p) => p.classList.toggle('is-active', p.dataset.sceneId === id));
        // принудительный reflow → restart CSS animations
        // eslint-disable-next-line no-unused-expressions
        void node.offsetWidth;
        node.classList.add('is-active');
        const dur = parseInt(node.dataset.sceneDuration || '6500', 10);
        activateProgress(root, dur);
        const t = setTimeout(() => {
          idx = (idx + 1) % scenes.length;
          tick();
        }, dur);
        timers.set(root, t);
      };
      tick();
    }

    function stopCycle(root) {
      const t = timers.get(root);
      if (t) { clearTimeout(t); timers.delete(root); }
      root.querySelectorAll('.scene.is-active, .scene-pill.is-active')
        .forEach((el) => el.classList.remove('is-active'));
      const bar = root.querySelector('[data-scene-progress]');
      if (bar) {
        bar.style.transition = 'none';
        bar.style.transform = 'scaleX(0)';
      }
    }

    if (!stage) {
      cycles.forEach(startCycle);
      return;
    }
    stage.addEventListener('slidechange', (e) => {
      const { slide, previousSlide } = e.detail || {};
      if (previousSlide) previousSlide.querySelectorAll('[data-scene-cycle]').forEach(stopCycle);
      if (slide) slide.querySelectorAll('[data-scene-cycle]').forEach(startCycle);
    });
    const active = stage.querySelector('section[data-deck-active]');
    if (active) active.querySelectorAll('[data-scene-cycle]').forEach(startCycle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSceneCycles);
  } else {
    initSceneCycles();
  }
})();
