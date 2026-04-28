# RobotMIA Slides — Remotion compositions

Видео-сцены для слайда 07 (циклическая демонстрация чат-платформы).

## Установка

```bash
cd presfromclaude/remotion
npm install
```

Первый запуск рендера дополнительно скачает Chromium (~150 МБ).

## Разработка

```bash
npm start
```

Откроется Remotion Studio на http://localhost:3000 — превью композиций в реальном времени с таймлайном.

## Рендер MP4

```bash
npm run render:scene1
```

MP4 попадает в `presfromclaude/videos/scene-1-assign.mp4`. В слайде 07 он встраивается через `<video autoplay muted loop playsinline>`.

## Где живут реальные скриншоты

`presfromclaude/remotion/public/scene-1-assign/*.png` (нужно создать вручную с реальной платформы).

Ожидаемые файлы:
- `01-panel-collapsed.png`
- `02-panel-expanded.png`
- `03-dropdown-open.png`
- `04-option-hover-vitaly.png` *(опционально)*
- `05-success-toast.png`

Разрешение исходников: 1920×1080. В Scene1Assign канва 1660×690 — изображение центрируется с `objectFit: cover` и top-crop.

После размещения PNG — поменять `USE_PLACEHOLDERS = true` на `false` в `src/Scene1Assign.tsx`.
