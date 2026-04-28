import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const SCENE1_FPS = 30;
export const SCENE1_DURATION = 240; // 8 секунд @ 30 fps

// Канва Remotion: 1660×690 (точный размер стейджа слайда 07)
// Исходные PNG сделаны со скринов чат-платформы (~1920×987)

const FRAMES = {
  overview: "scene-1-assign/01-overview.png",      // общий вид, сайдбар, «Действия в беседе» свёрнута
  closeup: "scene-1-assign/02-panel-closeup.png",  // плавающая панель, дропдаун закрыт
  dropdown: "scene-1-assign/03-dropdown-open.png", // плавающая панель, дропдаун открыт
};

// Ключевые точки курсора в координатах канвы 1660×690.
// Расчёт: source_x * (1660 / source_width) с поправкой top-crop.
// Эти числа корректируем после первого рендера на реальных PNG.
const POS = {
  start:        { x: 220,  y: 620 },
  panelHeader:  { x: 1430, y: 218 }, // "Действия в беседе" в свёрнутой панели (overview)
  groupSelect:  { x: 1480, y: 250 }, // "Консультационная группа" в close-up
  dropdownItem: { x: 1480, y: 510 }, // одна из опций списка (напр., «Работа с юр. лицами»)
  assignBtn:    { x: 1340, y: 460 }, // "Назначить" в close-up
};

// Хореография по кадрам (30 fps, всего 240 = 8 секунд)
const T = {
  introCursor: 45,    // 0–1.5с : курсор едет от старта к "Действия в беседе"
  clickPanel: 75,     // 1.5–2.5с : клик по заголовку → fade overview → closeup
  hoverGroup: 110,    // 2.5–3.7с : курсор едет к дропдауну группы
  clickGroup: 140,    // 3.7–4.7с : клик → fade closeup → dropdown
  hoverItem: 195,     // 4.7–6.5с : курсор движется по списку, останавливается на опции
  clickItem: 225,     // 6.5–7.5с : клик → fade dropdown → closeup, курсор едет к "Назначить"
  clickAssign: 240,   // 7.5–8.0с : клик "Назначить"
};

const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg
    width={38}
    height={38}
    viewBox="0 0 24 24"
    style={{
      position: "absolute",
      left: x,
      top: y,
      filter: "drop-shadow(0 6px 14px rgba(11, 58, 146, 0.45))",
      pointerEvents: "none",
      zIndex: 50,
    }}
  >
    <path
      d="M5 3 L5 19 L9 15 L11.5 21 L14 20 L11.5 14 L17 14 Z"
      fill="#FFFFFF"
      stroke="#0E1821"
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);

const Ripple: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const scale = interpolate(t, [0, 1], [0.3, 2.6]);
  const opacity = interpolate(t, [0, 1], [0.78, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
        borderRadius: "50%",
        border: "2.5px solid #1360F3",
        background: "rgba(19, 96, 243, 0.20)",
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: "none",
        zIndex: 45,
      }}
    />
  );
};

const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      left: 40,
      bottom: 32,
      padding: "14px 26px",
      background: "rgba(14, 24, 33, 0.88)",
      backdropFilter: "blur(10px)",
      color: "#FFFFFF",
      fontFamily: "Manrope, Inter, sans-serif",
      fontSize: 22,
      fontWeight: 500,
      borderRadius: 14,
      boxShadow: "0 12px 32px rgba(14,24,33,0.40)",
      zIndex: 60,
      transition: "opacity 0.3s ease",
    }}
  >
    {text}
  </div>
);

const FrameLayer: React.FC<{
  src: string;
  opacity: number;
  scale: number;
  tx: number;
  ty: number;
  origin?: string;
}> = ({ src, opacity, scale, tx, ty, origin = "center center" }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      overflow: "hidden",
      background: "#0E1821",
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "auto",
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        transformOrigin: origin,
      }}
    />
  </div>
);

export const Scene1Assign: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springConfig = { damping: 16, stiffness: 90, mass: 0.95 };

  // Координаты курсора по сегментам
  let cx = POS.start.x;
  let cy = POS.start.y;

  if (frame < T.introCursor) {
    const t = spring({ frame, fps, config: springConfig, durationInFrames: T.introCursor });
    cx = interpolate(t, [0, 1], [POS.start.x, POS.panelHeader.x]);
    cy = interpolate(t, [0, 1], [POS.start.y, POS.panelHeader.y]);
  } else if (frame < T.hoverGroup) {
    const t = spring({
      frame: frame - T.clickPanel,
      fps,
      config: springConfig,
      durationInFrames: T.hoverGroup - T.clickPanel,
    });
    cx = interpolate(t, [0, 1], [POS.panelHeader.x, POS.groupSelect.x]);
    cy = interpolate(t, [0, 1], [POS.panelHeader.y, POS.groupSelect.y]);
  } else if (frame < T.hoverItem) {
    const t = spring({
      frame: frame - T.clickGroup,
      fps,
      config: springConfig,
      durationInFrames: T.hoverItem - T.clickGroup,
    });
    cx = interpolate(t, [0, 1], [POS.groupSelect.x, POS.dropdownItem.x]);
    cy = interpolate(t, [0, 1], [POS.groupSelect.y, POS.dropdownItem.y]);
  } else if (frame < T.clickAssign) {
    const t = spring({
      frame: frame - T.clickItem,
      fps,
      config: springConfig,
      durationInFrames: T.clickAssign - T.clickItem,
    });
    cx = interpolate(t, [0, 1], [POS.dropdownItem.x, POS.assignBtn.x]);
    cy = interpolate(t, [0, 1], [POS.dropdownItem.y, POS.assignBtn.y]);
  } else {
    cx = POS.assignBtn.x;
    cy = POS.assignBtn.y;
  }

  // Cross-fades (overview → closeup → dropdown → closeup)
  const ovOpacity = interpolate(
    frame,
    [T.introCursor, T.clickPanel],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const cu1Opacity = interpolate(
    frame,
    [T.introCursor, T.clickPanel, T.hoverGroup, T.clickGroup],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const ddOpacity = interpolate(
    frame,
    [T.hoverGroup, T.clickGroup, T.hoverItem, T.clickItem],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const cu2Opacity = interpolate(
    frame,
    [T.hoverItem, T.clickItem],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Overview: zoom-in к правой панели за фазу 1 (масштаб 1.0 → 1.08, сдвиг к правому верху)
  const ovScale = interpolate(
    frame,
    [0, T.clickPanel],
    [1.0, 1.08],
    { extrapolateRight: "clamp" }
  );
  const ovTx = interpolate(
    frame,
    [0, T.clickPanel],
    [0, -110],
    { extrapolateRight: "clamp" }
  );
  const ovTy = interpolate(
    frame,
    [0, T.clickPanel],
    [0, -20],
    { extrapolateRight: "clamp" }
  );

  // Close-up: лёгкий Ken Burns
  const cuScale = interpolate(
    frame,
    [T.clickPanel, T.clickAssign],
    [1.0, 1.04],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Click ripples — на каждом тапе
  const ripples = [
    { active: frame >= T.introCursor && frame < T.introCursor + 12, t: (frame - T.introCursor) / 12, p: POS.panelHeader },
    { active: frame >= T.hoverGroup && frame < T.hoverGroup + 12, t: (frame - T.hoverGroup) / 12, p: POS.groupSelect },
    { active: frame >= T.hoverItem && frame < T.hoverItem + 12, t: (frame - T.hoverItem) / 12, p: POS.dropdownItem },
    { active: frame >= T.clickAssign - 15 && frame < T.clickAssign, t: (frame - (T.clickAssign - 15)) / 15, p: POS.assignBtn },
  ];

  // Подпись по фазе
  let caption = "";
  if (frame < T.introCursor) caption = "Открываем «Действия в беседе»";
  else if (frame < T.hoverGroup) caption = "Приближаем панель действий";
  else if (frame < T.hoverItem) caption = "Выбираем группу операторов";
  else if (frame < T.clickAssign) caption = "Подтверждаем переназначение";
  else caption = "Диалог переназначен";

  return (
    <AbsoluteFill style={{ background: "#0E1821" }}>
      <FrameLayer
        src={FRAMES.overview}
        opacity={ovOpacity}
        scale={ovScale}
        tx={ovTx}
        ty={ovTy}
        origin="top right"
      />
      <FrameLayer
        src={FRAMES.closeup}
        opacity={Math.max(cu1Opacity, cu2Opacity)}
        scale={cuScale}
        tx={0}
        ty={0}
      />
      <FrameLayer
        src={FRAMES.dropdown}
        opacity={ddOpacity}
        scale={1.0}
        tx={0}
        ty={0}
      />

      {ripples.map(
        (r, i) =>
          r.active && <Ripple key={i} x={r.p.x} y={r.p.y} t={r.t} />
      )}

      <Cursor x={cx} y={cy} />
      <Caption text={caption} />
    </AbsoluteFill>
  );
};
