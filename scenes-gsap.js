/* =========================================================================
   scenes-gsap.js — GSAP-анимации для сцен слайда 07.
   Слушает .is-active на каждой [data-gsap-scene="…"] и запускает свой
   timeline. Когда сцена становится неактивной — пауза + откат к началу.
   ========================================================================= */
(function () {
  if (typeof gsap === 'undefined') return;

  // ----------- Сцена 1: «Переназначение» -----------
  function buildAssignTimeline(root) {
    const eyebrow = root.querySelector('.gs-eyebrow');
    const lines = root.querySelectorAll('.gs-line > span');
    const caption = root.querySelector('.gs-caption');
    const card = root.querySelector('[data-card]');
    const avatar = root.querySelector('[data-avatar]');
    const nameOld = root.querySelector('[data-name-old]');
    const nameNew = root.querySelector('[data-name-new]');
    const groupOld = root.querySelector('[data-group-old]');
    const groupNew = root.querySelector('[data-group-new]');
    const list = root.querySelector('[data-list]');
    const opts = root.querySelectorAll('[data-opt]');
    const target = root.querySelector('[data-opt-target]');
    const targetDot = target ? target.querySelector('.gs-opt-dot') : null;
    const badge = root.querySelector('[data-badge]');
    const glow = root.querySelector('.gs-glow');

    const tl = gsap.timeline({ paused: true });

    // ---- начальные состояния ----
    tl.set(eyebrow, { opacity: 0, x: -16 });
    tl.set(lines, { yPercent: 110 });
    tl.set(caption, { opacity: 0, y: 16 });
    tl.set(card, { opacity: 0, scale: 0.86, y: 8 });
    tl.set(nameNew, { yPercent: 100, opacity: 0 });
    tl.set(groupNew, { yPercent: 100, opacity: 0 });
    tl.set(nameOld, { yPercent: 0, opacity: 1 });
    tl.set(groupOld, { yPercent: 0, opacity: 1 });
    tl.set(list, { opacity: 0, y: 24, scale: 0.95, transformOrigin: 'top center' });
    tl.set(opts, { opacity: 0, y: 10 });
    tl.set(target, { backgroundColor: 'rgba(19,96,243,0)', boxShadow: 'inset 0 0 0 0 rgba(19,96,243,0)' });
    tl.set(badge, { opacity: 0, scale: 0.7, y: 12 });
    tl.set(glow, { opacity: 0.6, scale: 0.92 });

    // ---- ФАЗА 1 (0.0–1.0с): заголовок и подзаголовок ----
    tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' }, 0);
    tl.to(lines, {
      yPercent: 0,
      duration: 0.85,
      ease: 'power4.out',
      stagger: 0.1
    }, 0.18);
    tl.to(caption, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.85);

    // ---- ФАЗА 2 (1.0–2.0с): появляется карточка оператора ----
    tl.to(card, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.85,
      ease: 'back.out(1.5)'
    }, 1.05);
    tl.to(glow, {
      scale: 1,
      duration: 1.0,
      ease: 'power2.out'
    }, 1.05);

    // ---- ФАЗА 3 (2.6–3.6с): открывается список операторов ----
    tl.to(list, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: 'power3.out'
    }, 2.6);
    tl.to(opts, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: 'power2.out',
      stagger: 0.07
    }, 2.7);

    // ---- ФАЗА 4 (3.9–4.7с): подсветка целевой опции ----
    tl.to(target, {
      backgroundColor: 'rgba(19, 96, 243, 0.10)',
      boxShadow: 'inset 0 0 0 1.5px rgba(19, 96, 243, 0.40)',
      duration: 0.45,
      ease: 'power2.out'
    }, 3.9);
    if (targetDot) {
      tl.to(targetDot, {
        scale: 1.35,
        duration: 0.32,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 1
      }, 4.05);
    }

    // ---- ФАЗА 5 (5.0–6.1с): карточка морфит — старое значение → новое ----
    tl.to(list, {
      opacity: 0,
      y: 18,
      scale: 0.96,
      duration: 0.55,
      ease: 'power2.in'
    }, 5.0);

    // Старое имя/группа уходят вверх и пропадают
    tl.to([nameOld, groupOld], {
      yPercent: -100,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.in'
    }, 5.05);

    // Новое имя/группа поднимаются снизу
    tl.to([nameNew, groupNew], {
      yPercent: 0,
      opacity: 1,
      duration: 0.65,
      ease: 'power3.out'
    }, 5.18);

    // Аватар «отзывается» лёгкой пульсацией
    tl.to(avatar, {
      scale: 1.08,
      duration: 0.32,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: 1
    }, 5.22);

    // Карточка слегка приподнимается на момент морфа
    tl.to(card, {
      y: -6,
      duration: 0.32,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: 1
    }, 5.22);

    // ---- ФАЗА 6 (6.4–7.2с): бейдж «Назначено» ----
    tl.to(badge, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.7,
      ease: 'back.out(2.2)'
    }, 6.4);

    // Карточка получает подсвеченную тень — победный отклик
    tl.to(card, {
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.8),' +
        'inset 0 0 0 1px rgba(19,96,243,0.20),' +
        '0 28px 72px -12px rgba(19,96,243,0.40),' +
        '0 8px 28px -8px rgba(14,24,33,0.10)',
      duration: 0.6,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    }, 6.4);

    // ---- ФАЗА 7 (7.5–9.0с): дыхание ----
    tl.to(card, {
      y: -3,
      duration: 1.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1
    }, 7.4);

    return tl;
  }

  // ----------- Регистрация GSAP-сцен -----------
  const builders = {
    assign: buildAssignTimeline,
  };

  function init() {
    const scenes = document.querySelectorAll('[data-gsap-scene]');
    scenes.forEach((sceneEl) => {
      const kind = sceneEl.dataset.gsapScene;
      const builder = builders[kind];
      if (!builder) return;

      let tl = null;
      const ensureTl = () => {
        if (!tl) tl = builder(sceneEl);
        return tl;
      };

      const sync = () => {
        const isActive = sceneEl.classList.contains('is-active');
        const t = ensureTl();
        if (isActive) {
          t.restart(true);
        } else {
          t.pause(0);
        }
      };

      const obs = new MutationObserver(() => sync());
      obs.observe(sceneEl, { attributes: true, attributeFilter: ['class'] });

      // Если уже активна на момент инициализации
      if (sceneEl.classList.contains('is-active')) sync();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
