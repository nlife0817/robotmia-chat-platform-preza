/* ============================================================
   RobotMIA Чат-платформа — движок анимаций презы (v2)

   Триггер анимации = смена активного слайда в <deck-stage>.
   deck-stage прячет неактивные слайды через visibility:hidden,
   поэтому IntersectionObserver на этом стеке НЕ работает —
   слушаем 'slidechange' событие, которое стейдж эмитит сам.

   Хелперы:
   - reveal-классы: .in-view добавляется ко всем [data-anim] активного слайда
   - counter-animations через requestAnimationFrame
   - hotspot-cycle: пошаговая подсветка регионов на real screens
   - text-mutation: цикл «исходный текст → перефразировка → ...»
   - typewriter: посимвольная печать
   ============================================================ */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stageEl = () => document.querySelector('deck-stage');

  /* ---------------- Активация / деактивация анимаций слайда ---------------- */

  // Если на элементе есть data-anim-counter — стартуем счётчик и сохраняем «уже отыгран»
  function maybeRunCounter(el) {
    if (!el.dataset.animCounter) return;
    if (el.dataset.animCounterDone) return;
    el.dataset.animCounterDone = '1';
    animateNumber(
      el,
      parseFloat(el.dataset.animCounter),
      parseInt(el.dataset.animCounterDur || '1500', 10),
      el.dataset.animCounterFormat || 'space'
    );
  }

  function activateSlide(slide) {
    if (!slide) return;
    // двойной rAF, чтобы стилевые transition'ы успели зафиксировать «начальное» состояние
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slide.querySelectorAll('[data-anim]').forEach((el) => el.classList.add('in-view'));
        slide.querySelectorAll('[data-anim-counter]').forEach(maybeRunCounter);
      });
    });
  }

  function deactivateSlide(slide) {
    if (!slide) return;
    slide.querySelectorAll('[data-anim]').forEach((el) => el.classList.remove('in-view'));
    // counter сбрасываем, чтобы при возврате на слайд снова отыграл от 0
    slide.querySelectorAll('[data-anim-counter]').forEach((el) => {
      delete el.dataset.animCounterDone;
      // вернуть стартовое значение в DOM — пусть будет «0», иначе при возврате видно finальное число до анимации
      el.textContent = formatNumber(0, el.dataset.animCounterFormat || 'space');
    });
  }

  function bindStage() {
    const stage = stageEl();
    if (!stage) {
      // фолбэк: если по какой-то причине нет deck-stage, активируем все слайды сразу
      document.querySelectorAll('section[data-deck-slide]').forEach(activateSlide);
      return;
    }
    stage.addEventListener('slidechange', (e) => {
      const { slide, previousSlide } = e.detail || {};
      if (previousSlide) deactivateSlide(previousSlide);
      if (slide) activateSlide(slide);
    });

    // На случай если первая slidechange (reason:init) уже была эмитнута
    // до того как мы повесили listener — активируем текущий вручную:
    const active = stage.querySelector('section[data-deck-active]');
    if (active) activateSlide(active);
  }

  /* ---------------- Line-split для заголовков [data-anim="lines"] ---------------- */
  function splitLines() {
    document.querySelectorAll('[data-anim="lines"]').forEach((el) => {
      if (el.querySelector('.anim-line')) return;
      const html = el.innerHTML;
      const parts = html.split(/<br\s*\/?>/i).map((p) => p.trim()).filter(Boolean);
      el.innerHTML = parts
        .map((p) => `<span class="anim-line-mask"><span class="anim-line">${p}</span></span>`)
        .join('');
    });
  }

  /* ---------------- animateNumber: 0 → target ---------------- */
  function animateNumber(el, target, duration, format) {
    if (REDUCED) {
      el.textContent = formatNumber(target, format);
      return;
    }
    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const v = target * easeOutCubic(t);
      el.textContent = formatNumber(v, format, target);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatNumber(v, format, target) {
    const isInt = !target ? Number.isInteger(v) : Number.isInteger(target);
    let val = isInt ? Math.round(v) : Math.round(v * 10) / 10;
    if (format === 'percent') return Math.round(v) + '%';
    if (format === 'plain') return String(val);
    return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* ---------------- Hotspot-cycle ---------------- */
  function initHotspotCycles() {
    const stages = document.querySelectorAll('[data-hotspot-cycle]');
    if (!stages.length) return;
    const stage = stageEl();
    const timers = new WeakMap();

    function startCycle(stageNode) {
      if (REDUCED) return;
      if (timers.get(stageNode)) return;
      const stepDur = parseInt(stageNode.dataset.hotspotStep || '3500', 10);
      const ids = Array.from(stageNode.querySelectorAll('.hotspot[data-hotspot-id]'))
        .map((h) => h.dataset.hotspotId);
      if (ids.length === 0) return;
      let idx = 0;
      const setActive = (i) => {
        const id = ids[i];
        stageNode.querySelectorAll('.hotspot, .hotspot-caption').forEach((el) => {
          el.classList.toggle('is-active', el.dataset.hotspotId === id);
        });
      };
      setActive(0);
      const t = setInterval(() => {
        idx = (idx + 1) % ids.length;
        setActive(idx);
      }, stepDur);
      timers.set(stageNode, t);
    }
    function stopCycle(stageNode) {
      const t = timers.get(stageNode);
      if (t) { clearInterval(t); timers.delete(stageNode); }
    }

    if (!stage) {
      stages.forEach(startCycle);
      return;
    }
    stage.addEventListener('slidechange', (e) => {
      const { slide, previousSlide } = e.detail || {};
      if (previousSlide) {
        previousSlide.querySelectorAll('[data-hotspot-cycle]').forEach(stopCycle);
      }
      if (slide) {
        slide.querySelectorAll('[data-hotspot-cycle]').forEach(startCycle);
      }
    });
    const active = stage.querySelector('section[data-deck-active]');
    if (active) {
      active.querySelectorAll('[data-hotspot-cycle]').forEach(startCycle);
    }
  }

  /* ---------------- Text-mutation cycle ---------------- */
  function initTextMutations() {
    const roots = document.querySelectorAll('[data-text-mutate]');
    if (!roots.length) return;
    const stage = stageEl();
    const timers = new WeakMap();

    function startMutate(root) {
      if (REDUCED) return;
      if (timers.get(root)) return;
      const target = root.querySelector('[data-mutate-target]');
      const versions = Array.from(root.querySelectorAll('[data-mutate-versions] > [data-btn]'));
      const buttons = Array.from(root.querySelectorAll('[data-mutate-btn]'));
      if (!target || versions.length === 0) return;
      const stepDur = parseInt(root.dataset.textStep || '4200', 10);
      let i = 0;
      const apply = (v) => {
        const btn = v.dataset.btn;
        const text = v.textContent.trim();
        buttons.forEach((b) => b.classList.toggle('btn--firing', b.dataset.mutateBtn === btn));
        target.style.filter = 'blur(6px)';
        target.style.opacity = '0.4';
        setTimeout(() => {
          target.textContent = '';
          target.style.filter = '';
          target.style.opacity = '1';
          typewriter(target, text, 22);
        }, 480);
      };
      apply(versions[0]);
      const t = setInterval(() => {
        i = (i + 1) % versions.length;
        apply(versions[i]);
      }, stepDur);
      timers.set(root, t);
    }
    function stopMutate(root) {
      const t = timers.get(root);
      if (t) { clearInterval(t); timers.delete(root); }
    }

    if (!stage) {
      roots.forEach(startMutate);
      return;
    }
    stage.addEventListener('slidechange', (e) => {
      const { slide, previousSlide } = e.detail || {};
      if (previousSlide) previousSlide.querySelectorAll('[data-text-mutate]').forEach(stopMutate);
      if (slide) slide.querySelectorAll('[data-text-mutate]').forEach(startMutate);
    });
    const active = stage.querySelector('section[data-deck-active]');
    if (active) active.querySelectorAll('[data-text-mutate]').forEach(startMutate);
  }

  /* ---------------- Typewriter ---------------- */
  function typewriter(el, text, charDur) {
    if (REDUCED) { el.textContent = text; return; }
    let i = 0;
    el.classList.add('anim-caret');
    const tick = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(tick, charDur);
      else setTimeout(() => el.classList.remove('anim-caret'), 700);
    };
    tick();
  }

  /* ---------------- bootstrap ---------------- */
  function init() {
    splitLines();
    bindStage();
    initHotspotCycles();
    initTextMutations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MiaAnim = { animateNumber, typewriter };
})();
