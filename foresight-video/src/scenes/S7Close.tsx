import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { EASE, Eyebrow, Foot, Stage, clamp } from "../ui";

const NAME = "FORESIGHT";

export const S7Close: React.FC = () => {
  const frame = useCurrentFrame();
  /* 字距由寬收窄，電影片尾質感 */
  const tracking = interpolate(frame, [14, 70], [0.55, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const fadeOut = interpolate(frame, [DUR.s7 - 26, DUR.s7], [1, 0], {
    extrapolateLeft: "clamp",
  });
  return (
    <Stage>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          opacity: fadeOut,
        }}
      >
        <Eyebrow from={4}>NOW BUILDING</Eyebrow>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontWeight: 600,
            fontSize: 168,
            letterSpacing: `${tracking}em`,
            paddingLeft: `${tracking}em`,
            backgroundImage: `linear-gradient(100deg, ${C.ink} 30%, ${C.data} 85%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            opacity: clamp(frame, [14, 44], [0, 1]),
            filter: `blur(${clamp(frame, [14, 48], [14, 0])}px)`,
          }}
        >
          {NAME}
        </div>
        <div
          style={{
            fontFamily: FONT_TC,
            fontSize: 40,
            color: C.ink2,
            opacity: clamp(frame, [70, 94], [0, 1]),
            translate: `0px ${clamp(frame, [70, 94], [20, 0])}px`,
          }}
        >
          cacaFly 決策智慧引擎 · 打造中
        </div>
        <div
          style={{
            fontFamily: FONT_TC,
            fontWeight: 700,
            fontSize: 56,
            letterSpacing: "0.08em",
            color: C.ink,
            opacity: clamp(frame, [104, 130], [0, 1]),
            translate: `0px ${clamp(frame, [104, 130], [22, 0])}px`,
          }}
        >
          花錢之前，先知道結果。
        </div>
        <Foot from={150}>cacaFly GROUP · TAIWAN</Foot>
      </AbsoluteFill>
    </Stage>
  );
};
