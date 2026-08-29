import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { EASE, Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";
import { DemoWindow } from "./demo";

/* 週次 ROAS：第 3 週素材疲勞下滑，介入後回升 */
const DATA = [1.4, 1.8, 1.6, 2.0, 2.2, 2.3];

export const D4Loop: React.FC = () => {
  const frame = useCurrentFrame();
  const CW = 1160;
  const CH = 330;
  const px = (i: number) => 60 + (i / (DATA.length - 1)) * (CW - 120);
  const py = (v: number) => CH - 40 - ((v - 1) / 1.6) * (CH - 100);
  const points = DATA.map((v, i) => [px(i), py(v)] as const);
  const path = points
    .map(([X, Y], i) => `${i === 0 ? "M" : "L"}${X},${Y}`)
    .join(" ");
  const draw = clamp(frame, [86, 190], [0, 1], EASE);
  const anomalyOn = clamp(frame, [126, 142], [0, 1]);
  const fixOn = clamp(frame, [152, 168], [0, 1]);
  return (
    <Stage>
      <Push durationInFrames={DUR.d4} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>DEMO 4/4 · 全天候</Eyebrow>
          <StaggerHeadline from={14} lines={["上線之後，它一直盯著。"]} size={92} />
          <DemoWindow from={54} height={540}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
              }}
            >
              <svg width={CW} height={CH} style={{ overflow: "visible" }}>
                {/* 週次格線（隱性） */}
                {DATA.map((_, i) => (
                  <g key={i}>
                    <line
                      x1={px(i)}
                      y1={40}
                      x2={px(i)}
                      y2={CH - 40}
                      stroke={C.hairline}
                      strokeWidth={1}
                    />
                    <text
                      x={px(i)}
                      y={CH - 8}
                      textAnchor="middle"
                      fontFamily={FONT_MONO}
                      fontSize={20}
                      fill={C.ink3}
                    >
                      W{i + 1}
                    </text>
                  </g>
                ))}
                {/* 預期線 2.0 */}
                <line
                  x1={60}
                  y1={py(2)}
                  x2={CW - 60}
                  y2={py(2)}
                  stroke={C.ink3}
                  strokeWidth={2}
                  strokeDasharray="8 10"
                  opacity={0.6}
                />
                <text
                  x={CW - 54}
                  y={py(2) + 7}
                  fontFamily={FONT_MONO}
                  fontSize={20}
                  fill={C.ink3}
                >
                  2.0
                </text>
                {/* 成效線逐步畫出 */}
                <path
                  d={path}
                  fill="none"
                  stroke={C.data}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                />
                {/* 第 3 週異常點 */}
                <circle
                  cx={px(2)}
                  cy={py(DATA[2])}
                  r={13}
                  fill={C.judge}
                  stroke={C.ground}
                  strokeWidth={4}
                  opacity={anomalyOn}
                />
                <g opacity={anomalyOn}>
                  <text
                    x={px(2)}
                    y={py(DATA[2]) + 52}
                    textAnchor="middle"
                    fontFamily={FONT_TC}
                    fontSize={24}
                    fill={C.judgeText}
                  >
                    偵測：素材疲勞
                  </text>
                </g>
                <g opacity={fixOn}>
                  <text
                    x={px(3)}
                    y={py(DATA[3]) - 30}
                    textAnchor="middle"
                    fontFamily={FONT_TC}
                    fontSize={24}
                    fill={C.exec}
                  >
                    自動換第二波素材
                  </text>
                </g>
                {/* 終點強調 */}
                <g opacity={clamp(frame, [192, 208], [0, 1])}>
                  <circle
                    cx={px(5)}
                    cy={py(DATA[5])}
                    r={12}
                    fill={C.data}
                    stroke={C.ground}
                    strokeWidth={4}
                  />
                  <text
                    x={px(5)}
                    y={py(DATA[5]) - 26}
                    textAnchor="middle"
                    fontFamily={FONT_MONO}
                    fontWeight={600}
                    fontSize={30}
                    fill={C.ink}
                  >
                    2.3
                  </text>
                </g>
              </svg>
              <div
                style={{
                  display: "flex",
                  gap: 22,
                  opacity: clamp(frame, [214, 234], [0, 1]),
                  translate: `0px ${clamp(frame, [214, 236], [22, 0])}px`,
                }}
              >
                {["6 週 ROAS 2.3，高於預期", "異常到修正：4 小時", "全程留有紀錄，可回放"].map(
                  (t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: FONT_TC,
                        fontSize: 25,
                        color: C.ink2,
                        border: `2px solid ${C.hairline}`,
                        borderRadius: 999,
                        padding: "12px 30px",
                        background: "rgba(255,255,255,.02)",
                      }}
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>
          </DemoWindow>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
