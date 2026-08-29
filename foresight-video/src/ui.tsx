import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT_MONO, FONT_TC } from "./theme";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const clamp = (
  frame: number,
  inRange: [number, number],
  outRange: [number, number],
  easing = EASE,
) =>
  interpolate(frame, inRange, outRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/* 舞台底：深色地 + 微弱徑向光暈 + 上層暗角 */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.ground }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(85,144,255,.06), transparent 70%)",
      }}
    />
    {children}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)",
        pointerEvents: "none",
      }}
    />
  </AbsoluteFill>
);

export const Eyebrow: React.FC<{ from: number; children: string }> = ({
  from,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: "0.34em",
        color: C.ink3,
        textTransform: "uppercase",
        opacity: clamp(frame, [from, from + 24], [0, 1]),
        translate: `0px ${clamp(frame, [from, from + 24], [18, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

/* 逐字浮現的中文大標 */
export const StaggerHeadline: React.FC<{
  from: number;
  lines: string[];
  size?: number;
  perChar?: number;
}> = ({ from, lines, size = 108, perChar = 2.2 }) => {
  const frame = useCurrentFrame();
  let idx = 0;
  return (
    <div
      style={{
        fontFamily: FONT_TC,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.28,
        letterSpacing: "0.02em",
        color: C.ink,
        textAlign: "center",
      }}
    >
      {lines.map((line, li) => (
        <div key={li}>
          {Array.from(line).map((ch, ci) => {
            const start = from + idx++ * perChar;
            return (
              <span
                key={ci}
                style={{
                  display: "inline-block",
                  opacity: clamp(frame, [start, start + 18], [0, 1]),
                  translate: `0px ${clamp(frame, [start, start + 22], [42, 0])}px`,
                  filter: `blur(${clamp(frame, [start, start + 16], [8, 0])}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Sub: React.FC<{
  from: number;
  children: React.ReactNode;
  size?: number;
}> = ({ from, children, size = 42 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT_TC,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.7,
        color: C.ink2,
        textAlign: "center",
        opacity: clamp(frame, [from, from + 26], [0, 1]),
        translate: `0px ${clamp(frame, [from, from + 26], [24, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

export const Foot: React.FC<{ from: number; children: string }> = ({
  from,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 22,
        letterSpacing: "0.16em",
        color: C.ink3,
        opacity: clamp(frame, [from, from + 24], [0, 1]),
      }}
    >
      {children}
    </div>
  );
};

/* 撞入大字：overshoot 彈跳，蘋果式重點字 */
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
export const PopIn: React.FC<{
  from: number;
  size?: number;
  children: React.ReactNode;
}> = ({ from, size = 170, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT_TC,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.15,
        letterSpacing: "0.03em",
        color: C.ink,
        textAlign: "center",
        opacity: clamp(frame, [from, from + 7], [0, 1], Easing.linear),
        scale: String(clamp(frame, [from, from + 16], [1.35, 1], BACK)),
      }}
    >
      {children}
    </div>
  );
};

/* 緩慢推鏡：整幕輕微放大，鏡頭感 */
export const Push: React.FC<{
  durationInFrames: number;
  amount?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, amount = 1.045, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        scale: String(
          interpolate(frame, [0, durationInFrames], [1, amount], {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          }),
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
