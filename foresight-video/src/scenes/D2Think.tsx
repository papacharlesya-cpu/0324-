import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";
import { DemoWindow } from "./demo";

const STEPS = [
  { color: C.data, name: "資料層", detail: "掃描同產業 2.1 億筆成效紀錄", at: 84 },
  { color: C.judge, name: "判斷層", detail: "套用 47 條資深操作判斷規則", at: 116 },
  { color: C.exec, name: "預測", detail: "產出區間與風險，3.2 秒", at: 148 },
];

export const D2Think: React.FC = () => {
  const frame = useCurrentFrame();
  const x = (roas: number) => 30 + (roas / 3) * 500;
  const bandGrow = clamp(frame, [170, 200], [0, 1]);
  return (
    <Stage>
      <Push durationInFrames={DUR.d2} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>DEMO 2/4 · 引擎運轉</Eyebrow>
          <StaggerHeadline from={14} lines={["它先想，再給你答案。"]} size={92} />
          <DemoWindow from={54} height={560}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                padding: "50px 60px",
                gap: 56,
              }}
            >
              {/* 左：三步驟依序亮起 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 34,
                }}
              >
                {STEPS.map((s) => (
                  <div
                    key={s.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 26,
                      opacity: clamp(frame, [s.at, s.at + 16], [0, 1]),
                      translate: `${clamp(frame, [s.at, s.at + 18], [-30, 0])}px 0px`,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        background: s.color,
                        boxShadow: `0 0 24px ${s.color}`,
                        flex: "none",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontFamily: FONT_TC,
                          fontWeight: 900,
                          fontSize: 34,
                          color: C.ink,
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_TC,
                          fontSize: 26,
                          color: C.ink2,
                          marginTop: 4,
                        }}
                      >
                        {s.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 右：預測結果卡 */}
              <div
                style={{
                  width: 620,
                  border: `2px solid ${C.hairline}`,
                  borderRadius: 18,
                  padding: "36px 44px",
                  background: "rgba(255,255,255,.02)",
                  opacity: clamp(frame, [162, 182], [0, 1]),
                  translate: `0px ${clamp(frame, [162, 184], [30, 0])}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 20,
                    letterSpacing: "0.24em",
                    color: C.ink3,
                    marginBottom: 22,
                  }}
                >
                  預測 ROAS 區間
                </div>
                <svg width={540} height={150} style={{ overflow: "visible" }}>
                  <line x1={x(0)} y1={100} x2={x(3)} y2={100} stroke={C.hairline} strokeWidth={3} />
                  {[0, 1, 2, 3].map((t) => (
                    <text key={t} x={x(t)} y={136} textAnchor="middle" fontFamily={FONT_MONO} fontSize={19} fill={C.ink3}>
                      {t === 0 ? "0" : t.toFixed(1)}
                    </text>
                  ))}
                  <rect
                    x={x(1.6)}
                    y={76}
                    width={(x(2.4) - x(1.6)) * bandGrow}
                    height={48}
                    rx={7}
                    fill="rgba(85,144,255,.22)"
                    stroke={C.data}
                    strokeWidth={3}
                  />
                  <g opacity={clamp(frame, [204, 222], [0, 1])}>
                    <line x1={x(2)} y1={70} x2={x(2)} y2={130} stroke={C.data} strokeWidth={3} />
                    <text x={x(2)} y={44} textAnchor="middle" fontFamily={FONT_TC} fontWeight={700} fontSize={26} fill={C.ink}>
                      預期 2.0
                    </text>
                    <text x={x(1.6)} y={62} textAnchor="middle" fontFamily={FONT_MONO} fontSize={21} fill={C.ink}>
                      1.6
                    </text>
                    <text x={x(2.4)} y={62} textAnchor="middle" fontFamily={FONT_MONO} fontSize={21} fill={C.ink}>
                      2.4
                    </text>
                  </g>
                </svg>
                {[
                  "第 3 週：素材疲勞風險，先備第二波切角",
                  "第 4 週：再行銷受眾池見頂，需擴上層",
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontFamily: FONT_TC,
                      fontSize: 24,
                      color: C.ink2,
                      marginTop: i === 0 ? 14 : 12,
                      opacity: clamp(frame, [226 + i * 16, 240 + i * 16], [0, 1]),
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: C.judge,
                        flex: "none",
                      }}
                    />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </DemoWindow>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
