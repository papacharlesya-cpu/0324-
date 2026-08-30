import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, clamp } from "../ui";

/* 破題：開場就亮出名字 */
export const S1Open: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Push durationInFrames={DUR.s1}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 42 }}
        >
          <Eyebrow from={6}>cacaFly 做了一個新東西</Eyebrow>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 600,
              fontSize: 176,
              letterSpacing: "0.14em",
              paddingLeft: "0.14em",
              backgroundImage: `linear-gradient(100deg, ${C.ink} 30%, ${C.data} 85%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              opacity: clamp(frame, [18, 42], [0, 1]),
              filter: `blur(${clamp(frame, [18, 50], [16, 0])}px)`,
              scale: String(clamp(frame, [18, 62], [1.12, 1])),
            }}
          >
            FORESIGHT
          </div>
          <div
            style={{
              fontFamily: FONT_TC,
              fontWeight: 700,
              fontSize: 46,
              letterSpacing: "0.04em",
              color: C.ink2,
              opacity: clamp(frame, [76, 100], [0, 1]),
              translate: `0px ${clamp(frame, [76, 100], [22, 0])}px`,
            }}
          >
            會自己想、自己動手的廣告 AI。
          </div>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
