import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";
import { C, DUR, FONT_MONO, FONT_TC, H, W } from "../theme";
import { Eyebrow, Foot, Push, Stage, clamp } from "../ui";

const N = 380;

/* 由外向核心匯流的資料粒子，全部由 frame 決定（確定性渲染） */
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = W / 2;
  const cy = H / 2 - 30;
  const converge = interpolate(frame, [0, DUR.s2], [0, 0.9], {
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      {Array.from({ length: N }).map((_, i) => {
        const a0 = random(`a${i}`) * Math.PI * 2;
        const r0 = 320 + random(`r${i}`) * 820;
        const spin = (random(`s${i}`) - 0.5) * 0.012;
        const drift = 0.4 + random(`d${i}`) * 0.8;
        const angle = a0 + frame * spin;
        const r = r0 * (1 - converge * drift * 0.9);
        const x = cx + Math.cos(angle) * r * 1.35;
        const y = cy + Math.sin(angle) * r * 0.75;
        const size = 1.2 + random(`z${i}`) * 2.6;
        const alpha =
          (0.12 + random(`o${i}`) * 0.45) *
          interpolate(frame, [0, 40], [0, 1], {
            extrapolateRight: "clamp",
          });
        return (
          <circle key={i} cx={x} cy={y} r={size} fill={C.data} opacity={alpha} />
        );
      })}
    </svg>
  );
};

const fmt = (n: number) => n.toLocaleString("en-US");

export const S2Scale: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    3e8 *
      interpolate(frame, [24, 118], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
  );
  return (
    <Stage>
      <Particles />
      {/* 核心光暈隨匯流增強 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 34% 26% at 50% 46%, rgba(85,144,255,.20), transparent 70%)",
          opacity: clamp(frame, [30, 120], [0, 1]),
        }}
      />
      <Push durationInFrames={DUR.s2} amount={1.03}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 38 }}
        >
          <Eyebrow from={4}>SCALE · 每一個月</Eyebrow>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 600,
              fontSize: 176,
              letterSpacing: "0.02em",
              color: C.ink,
              textShadow: "0 0 90px rgba(85,144,255,.4)",
              opacity: clamp(frame, [18, 40], [0, 1]),
              filter: `blur(${clamp(frame, [18, 44], [10, 0])}px)`,
            }}
          >
            {fmt(count)}
          </div>
          <div
            style={{
              fontFamily: FONT_TC,
              fontWeight: 700,
              fontSize: 46,
              letterSpacing: "0.1em",
              color: C.data,
              opacity: clamp(frame, [40, 66], [0, 1]),
              translate: `0px ${clamp(frame, [40, 66], [22, 0])}px`,
            }}
          >
            筆 Meta 成效資料，流進集團
          </div>
          <Foot from={130}>聚合統計 · 去識別化</Foot>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
