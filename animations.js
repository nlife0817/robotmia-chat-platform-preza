/* ============================================================
   RobotMIA Чат-платформа — движок анимаций презы
   - IntersectionObserver: добавляет .in-view при попадании в кадр,
     снимает при выходе (повтор анимаций при возврате).
   - Counter-animations: requestAnimationFrame, easeOutCubic.
   - Hotspot-cycle: переключатель областей подсветки на real screens.
   - Text-mutation: цикл по списку версий текста (для слайда ИИ-инструменты).
   - Typewriter: посимвольная печать.

   Все хелперы — без зависимостей. Работает на всём, что поддерживает ES2017+.
   ============================================================ */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------- 1. IntersectionObserver для reveal ----------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // если на элементе есть data-anim-counter — стартуем счётчик 1 раз
        if (entry.target.dataset.animCounter && !entry.target.dataset.animCounterDone) {
          entry.target.dataset.animCounterDone = '1';
          animateNumber(
            entry.target,
            parseFloat(entry.target.dataset.animCounter),
            parseInt(entry.target.dataset.animCounterDur || '1500', 10),
            entry.target.dataset.animCounterFormat || 'space'
          );
        }
      } else {
        entry.target.classList.remove('in-view');
        // counter не сбрасываем — единожды отыграл, и хватит (пересчёт на повторе сбивает счёт)
      }
    });
  }, { threshold: 0.35 });

  function observeAll() {
    document.querySelectorAll('[data-anim], [data-anim-counter]').forEach((el) => io.observe(el));
  }

  /* ----------------- 2. Line-split для заголовков [data-anim="lines"] ----------------- */
  // Если у h-элемента нет .anim-line внутри — оборачиваем каждую line break (<br>) в .anim-line.
  function splitLines() {
    document.querySelectorAll('[data-anim="lines"]').forEach((el) => {
      if (el.querySelector('.anim-line')) return; // уже размечен вручную
      const html = el.innerHTML;
      const parts = html.split(/<br\s*\/?>/i).map((p) => p.trim()).filter(Boolean);
      el.innerHTML = parts
        .map((p) => `<span class="anim-line-mask"><span class="anim-line">${p}</span></span>`)
        .join('');
    });
  }

  /* ----------------- 3. animateNumber: 0 → target ----------------- */
  function animateNumber(el, target, duration, format) {
    if (REDUCED) {
      el.textContent = formatNumber(target, format);
      return;
    }
    const start = performance.now();
    const startVal = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const v = startVal + (target - startVal) * easeOutCubic(t);
      el.textContent = formatNumber(v, format, target);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatNumber(v, format, target) {
    // 'space': 1 234 567   |   'space-int': 1 234   |   'plain': 1234   |   'percent': 34%
    const isInt = !target ? Number.isInteger(v) : Number.isInteger(target);
    let val = isInt ? Math.round(v) : Math.round(v * 10) / 10;
    if (format === 'percent') return Math.round(v) + '%';
    if (format === 'plain') return String(val);
    // space-сепаратор тысяч (RU-стиль)
    return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* ----------------- 4. Hotspot-cycle: переключатель регионов на скрине ----------------- */
  // Использование:
  //   <div class="hotspot-stage" data-hotspot-cycle data-hotspot-step="3500">
  //     <div class="hotspot" data-hotspot-id="filters" style="left:..; top:..; width:..; height:..">
  //     <div class="hotspot-caption" data-hotspot-id="filters">…</div>
  //   </div>
  function initHotspotCycles() {
    document.querySelectorAll('[data-hotspot-cycle]').forEach((stage) => {
      const stepDur = parseInt(stage.dataset.hotspotStep || '3500', 10);
      const ids = Array.from(stage.querySelectorAll('.hotspot[data-hotspot-id]'))
        .map((h) => h.dataset.hotspotId);
      if (ids.length === 0) return;
      let idx = 0;
      let timer = null;
      const setActive = (i) => {
        const id = ids[i];
        stage.querySelectorAll('.hotspot, .hotspot-caption').forEach((el) => {
          el.classList.toggle('is-active', el.dataset.hotspotId === id);
        });
      };
      setActive(0);
      const start = () => {
        if (REDUCED) return;
        if (timer) return;
        timer = setInterval(() => {
          idx = (idx + 1) % ids.length;
          setActive(idx);
        }, stepDur);
      };
      const stop = () => {
        if (timer) { clearInterval(timer); timer = null; }
      };
      // запускаем только когда сцена в кадре
      const stageIo = new IntersectionObserver((entries) => {
        entries.forEach((e) => e.isIntersecting ? start() : stop());
      }, { threshold: 0.4 });
      stageIo.observe(stage);
    });
  }

  /* ----------------- 5. Text-mutation cycle (слайд ИИ-инструменты) ----------------- */
  // <div data-text-mutate data-text-step="4200">
  //   <div data-mutate-target>исходный текст</div>
  //   <div data-mutate-versions style="display:none">
  //     <div data-btn="rephrase">версия 1</div>
  //     <div data-btn="tone">версия 2</div>
  //     ...
  //   </div>
  //   <button data-mutate-btn="rephrase">…</button>
  // </div>
  function initTextMutations() {
    document.querySelectorAll('[data-text-mutate]').forEach((root) => {
      const target = root.querySelector('[data-mutate-target]');
      const versions = Array.from(root.querySelectorAll('[data-mutate-versions] > [data-btn]'));
      const buttons = Array.from(root.querySelectorAll('[data-mutate-btn]'));
      if (!target || versions.length === 0) return;
      const stepDur = parseInt(root.dataset.textStep || '4200', 10);
      let i = 0;
      let timer = null;
      const apply = (v) => {
        const btn = v.dataset.btn;
        const text = v.textContent.trim();
        // подсветка соответствующей кнопки
        buttons.forEach((b) => b.classList.toggle('btn--firing', b.dataset.mutateBtn === btn));
        // blur out → typewriter in
        target.style.filter = 'blur(6px)';
        target.style.opacity = '0.4';
        setTimeout(() => {
          if (REDUCED) {
            target.textContent = text;
            target.style.filter = '';
            target.style.opacity = '1';
            return;
          }
          target.textContent = '';
          target.style.filter = '';
          target.style.opacity = '1';
          typewriter(target, text, 22);
        }, 480);
      };
      apply(versions[0]);
      const stageIo = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (timer) return;
            timer = setInterval(() => {
              i = (i + 1) % versions.length;
              apply(versions[i]);
            }, stepDur);
          } else {
            if (timer) { clearInterval(timer); timer = null; }
          }
        });
      }, { threshold: 0.4 });
      stageIo.observe(root);
    });
  }

  /* ----------------- 6. Typewriter ----------------- */
  function typewriter(el, text, charDur) {
    if (REDUCED) { el.textContent = text; return; }
    let i = 0;
    el.classList.add('anim-caret');
    const tick = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        setTimeout(tick, charDur);
      } else {
        setTimeout(() => el.classList.remove('anim-caret'), 700);
      }
    };
    tick();
  }

  /* ----------------- bootstrap ----------------- */
  function init() {
    splitLines();
    observeAll();
    initHotspotCycles();
    initTextMutations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // публичный API на всякий
  window.MiaAnim = { animateNumber, typewriter };
})();
