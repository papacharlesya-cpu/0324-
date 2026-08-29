import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";
import { DemoWindow } from "./demo";

const LOGS: Array<[string, string]> = [
  ["✓", "建立 Campaign「新品上市_保健食品_10月」"],
  ["✓", "建立 3 組廣告組合：LAL 3% ／ 興趣 ／ 再行銷"],
  ["✓", "掛上 6 支素材（黃金模板產出）"],
  ["⏸", "全部 PAUSED，等待人工審核"],
];

export const D3Execute: React.FC = () => {
  const frame = useCurrentFrame();
  const approveAt = 124;
  return (
    <Stage>
      <Push durationInFrames={DUR.d3} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>DEMO 3/4 · 直接動手</Eyebrow>
          <StaggerHeadline from={8} perChar={1.6} lines={["然後它動手，你只要點頭。"]} size={92} />
          <DemoWindow from={26} height={560}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 70px",
                gap: 26,
              }}
            >
              {LOGS.map(([mark, text], i) => {
                const at = 40 + i * 18;
                const isPause = mark === "⏸";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 28,
                      fontFamily: FONT_MONO,
                      fontSize: 32,
                      opacity: clamp(frame, [at, at + 14], [0, 1]),
                      translate: `${clamp(frame, [at, at + 16], [-26, 0])}px 0px`,
                    }}
                  >
                    <span
                      style={{
                        color: isPause ? C.judgeText : C.exec,
                        width: 44,
                        textAlign: "center",
                        flex: "none",
                      }}
                    >
                      {mark}
                    </span>
                    <span style={{ fontFamily: FONT_TC, color: C.ink }}>{text}</span>
                  </div>
                );
              })}
              {/* 人工核准：human-in-the-loop 的一格 */}
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  border: `2px solid ${frame > approveAt + 20 ? C.exec : C.hairline}`,
                  borderRadius: 16,
                  padding: "26px 40px",
                  background:
                    frame > approveAt + 20 ? C.execSoft : "rgba(255,255,255,.02)",
                  opacity: clamp(frame, [approveAt - 24, approveAt - 6], [0, 1]),
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: frame > approveAt + 20 ? C.exec : C.hairline,
                    color: C.ground,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    fontWeight: 700,
                    flex: "none",
                    scale: String(
                      1 +
                        0.18 *
                          clamp(frame, [approveAt + 14, approveAt + 22], [0, 1]) *
                          clamp(frame, [approveAt + 22, approveAt + 34], [1, 0]),
                    ),
                  }}
                >
                  ✓
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: FONT_TC,
                      fontWeight: 900,
                      fontSize: 32,
                      color: C.ink,
                    }}
                  >
                    {frame > approveAt + 20 ? "操作人員已核准，開始投放" : "等待操作人員核准…"}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_TC,
                      fontSize: 24,
                      color: C.ink2,
                      marginTop: 6,
                    }}
                  >
                    每一筆對外投放，都有人看過才出手
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
