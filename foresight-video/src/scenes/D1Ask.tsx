import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";
import { DemoWindow, TypeText } from "./demo";

const BRIEF =
  "新品上市：膠原蛋白飲，月預算 NT$800,000，目標 EC 購買，10 月中開賣。";

export const D1Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const sent = clamp(frame, [112, 124], [0, 1]);
  return (
    <Stage>
      <Push durationInFrames={DUR.d1} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>DEMO 1/4 · 想像一下</Eyebrow>
          <StaggerHeadline from={8} perChar={1.6} lines={["跟它說你要什麼。"]} size={92} />
          <DemoWindow from={26} height={460}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 60px",
                gap: 34,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_TC,
                  fontSize: 26,
                  color: C.ink3,
                  opacity: clamp(frame, [36, 50], [0, 1]),
                }}
              >
                告訴 Foresight 你的目標
              </div>
              <div
                style={{
                  border: `2px solid ${C.hairline}`,
                  borderRadius: 18,
                  padding: "34px 40px",
                  fontFamily: FONT_TC,
                  fontSize: 36,
                  lineHeight: 1.6,
                  color: C.ink,
                  minHeight: 130,
                  background: "rgba(255,255,255,.02)",
                }}
              >
                <TypeText from={48} cps={24} text={BRIEF} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 26,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    color: C.ground,
                    background: C.data,
                    borderRadius: 12,
                    padding: "16px 44px",
                    opacity: clamp(frame, [56, 72], [0.35, 1]),
                    scale: String(1 + 0.06 * sent * (1 - sent) * 4),
                    boxShadow: `0 0 ${40 * sent}px rgba(85,144,255,.5)`,
                  }}
                >
                  {frame < 118 ? "送出 ▸" : "分析中…"}
                </div>
              </div>
            </div>
          </DemoWindow>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
