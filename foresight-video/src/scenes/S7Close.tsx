import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Foot, Stage, StaggerHeadline, clamp } from "../ui";

/* 收尾：大字 tagline → 用在哪 → 落款 */
export const S7Close: React.FC = () => {
  const frame = useCurrentFrame();
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
        <StaggerHeadline
          from={10}
          perChar={2.6}
          lines={["花錢之前，", "先知道結果。"]}
          size={120}
        />
        <div
          style={{
            fontFamily: FONT_TC,
            fontSize: 40,
            letterSpacing: "0.06em",
            color: C.ink2,
            opacity: clamp(frame, [104, 128], [0, 1]),
            translate: `0px ${clamp(frame, [104, 128], [20, 0])}px`,
          }}
        >
          新品上市。大檔期。每一天的投放。
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontWeight: 600,
            fontSize: 56,
            letterSpacing: "0.22em",
            paddingLeft: "0.22em",
            backgroundImage: `linear-gradient(100deg, ${C.ink} 30%, ${C.data} 85%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginTop: 12,
            opacity: clamp(frame, [148, 172], [0, 1]),
          }}
        >
          FORESIGHT
        </div>
        <Foot from={186}>cacaFly GROUP · TAIWAN</Foot>
      </AbsoluteFill>
    </Stage>
  );
};
