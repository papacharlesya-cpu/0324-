import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";
import { DemoWindow, TypeText } from "./demo";

const BRIEF =
  "新品上市：膠原蛋白飲，月預算 NT$800,000，目標 EC 購買，10 月中開賣。";

export const D1Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const sent = clamp(frame, [172, 184], [0, 1]);
  return (
    <Stage>
      <Push durationInFrames={DUR.d1} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>DEMO 1/4 · 想像一下</Eyebrow>
          <StaggerHeadline from={14} lines={["跟它說你要什麼。"]} size={92} />
          <DemoWindow from={60} height={480}>
            {/* 失焦的後台骨架：暗示 FORESIGHT 架在廣告帳戶之上 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "22px 40px",
                filter: "blur(5px)",
                opacity: 0.35,
              }}
            >
              <div style={{ display: "flex", gap: 26, marginBottom: 20 }}>
                {[120, 96, 60].map((w, i) => (
                  <span key={i} style={{ width: w, height: 14, borderRadius: 8, background: i === 1 ? "rgba(85,144,255,.5)" : C.hairline }} />
                ))}
              </div>
              {[
                [300, 130, 110],
                [260, 150, 90],
                [330, 120, 120],
                [280, 140, 100],
              ].map((bars, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, padding: "18px 0", borderTop: `1px solid ${C.hairline}` }}>
                  <span style={{ width: 46, height: 26, borderRadius: 999, background: "#2A3550" }} />
                  {bars.map((w, k) => (
                    <span key={k} style={{ width: w, height: 14, borderRadius: 8, background: k ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.12)" }} />
                  ))}
                </div>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 1180,
                  background: C.panel,
                  border: `2px solid ${C.hairline}`,
                  borderRadius: 20,
                  boxShadow: "0 28px 70px rgba(0,0,0,.55)",
                  padding: "32px 44px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 26,
                }}
              >
              <div
                style={{
                  fontFamily: FONT_TC,
                  fontSize: 26,
                  color: C.ink3,
                  opacity: clamp(frame, [78, 96], [0, 1]),
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
                <TypeText from={92} cps={13} text={BRIEF} />
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
                    opacity: clamp(frame, [110, 128], [0.35, 1]),
                    scale: String(1 + 0.06 * sent * (1 - sent) * 4),
                    boxShadow: `0 0 ${40 * sent}px rgba(85,144,255,.5)`,
                  }}
                >
                  {frame < 178 ? "送出 ▸" : "分析中…"}
                </div>
              </div>
              </div>
            </div>
          </DemoWindow>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
