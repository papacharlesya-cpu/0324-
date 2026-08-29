import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { DUR } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";

export const S1Open: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Push durationInFrames={DUR.s1}>
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 46,
          }}
        >
          <Eyebrow from={6}>2026 · cacaFly GROUP</Eyebrow>
          <StaggerHeadline from={22} lines={["還沒有人做過這件事。"]} size={124} />
          {/* 標題下方細線，由中央往兩側展開 */}
          <div
            style={{
              height: 3,
              width: 560,
              background: C.data,
              borderRadius: 2,
              scale: `${clamp(frame, [58, 92], [0, 1])} 1`,
              opacity: clamp(frame, [58, 80], [0, 1]),
            }}
          />
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
