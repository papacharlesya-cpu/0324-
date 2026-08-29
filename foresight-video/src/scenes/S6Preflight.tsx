import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";

const FIELDS: Array<[string, string]> = [
  ["產業", "保健食品"],
  ["月預算", "NT$800,000"],
  ["目標", "EC 購買"],
];

const RISKS = [
  "第 3 週：素材疲勞風險，預先備第二波切角",
  "第 4 週：再行銷受眾池見頂，需擴上層蓄水",
];

const PanelTitle: React.FC<{ children: string }> = ({ children }) => (
  <div
    style={{
      fontFamily: FONT_MONO,
      fontSize: 22,
      letterSpacing: "0.26em",
      color: C.ink3,
      marginBottom: 30,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

export const S6Preflight: React.FC = () => {
  const frame = useCurrentFrame();

  /* 預測帶：x 軸 0～3.0 對應 40～660 px */
  const x = (roas: number) => 40 + (roas / 3) * 620;
  const bandGrow = clamp(frame, [150, 185], [0, 1]);

  return (
    <Stage>
      <Push durationInFrames={DUR.s6} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>PRE-FLIGHT · 產品預覽</Eyebrow>
          <StaggerHeadline from={16} lines={["花錢之前，先看到結果。"]} size={96} />
          <div style={{ display: "flex", gap: 44, marginTop: 16 }}>
            {/* 左：輸入條件 */}
            <div
              style={{
                width: 660,
                background: C.panel,
                border: `2px solid ${C.hairline}`,
                borderRadius: 22,
                padding: "40px 48px",
                textAlign: "left",
                opacity: clamp(frame, [78, 100], [0, 1]),
                translate: `0px ${clamp(frame, [78, 102], [40, 0])}px`,
              }}
            >
              <PanelTitle>Campaign 條件</PanelTitle>
              {FIELDS.map(([k, v], i) => {
                const start = 104 + i * 14;
                return (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "20px 0",
                      borderBottom: `1px solid ${C.hairline}`,
                      fontSize: 32,
                      opacity: clamp(frame, [start, start + 12], [0, 1]),
                    }}
                  >
                    <span style={{ fontFamily: FONT_TC, color: C.ink2 }}>{k}</span>
                    <span style={{ fontFamily: FONT_MONO, color: C.ink }}>{v}</span>
                  </div>
                );
              })}
              <div
                style={{
                  fontFamily: FONT_TC,
                  fontSize: 26,
                  color: C.ink2,
                  lineHeight: 1.7,
                  marginTop: 30,
                  opacity: clamp(frame, [150, 174], [0, 1]),
                }}
              >
                比對同產業、同量級的歷史操作結果，投放前先算出合理區間，以及會卡住的環節。
              </div>
            </div>
            {/* 右：預測結果 */}
            <div
              style={{
                width: 700,
                background: C.panel,
                border: `2px solid ${C.hairline}`,
                borderRadius: 22,
                padding: "40px 48px",
                textAlign: "left",
                opacity: clamp(frame, [90, 112], [0, 1]),
                translate: `0px ${clamp(frame, [90, 114], [40, 0])}px`,
              }}
            >
              <PanelTitle>預測 ROAS 區間</PanelTitle>
              <svg width={660} height={210} style={{ overflow: "visible" }}>
                <line
                  x1={x(0)}
                  y1={140}
                  x2={x(3)}
                  y2={140}
                  stroke={C.hairline}
                  strokeWidth={3}
                />
                {[0, 1, 2, 3].map((t) => (
                  <text
                    key={t}
                    x={x(t)}
                    y={182}
                    textAnchor="middle"
                    fontFamily={FONT_MONO}
                    fontSize={22}
                    fill={C.ink3}
                  >
                    {t === 0 ? "0" : t.toFixed(1)}
                  </text>
                ))}
                {/* 區間帶 1.6–2.4，由左往右長出 */}
                <rect
                  x={x(1.6)}
                  y={112}
                  width={(x(2.4) - x(1.6)) * bandGrow}
                  height={56}
                  rx={8}
                  fill="rgba(85,144,255,.22)"
                  stroke={C.data}
                  strokeWidth={3}
                />
                {/* 中位線與標籤 */}
                <g opacity={clamp(frame, [190, 210], [0, 1])}>
                  <line
                    x1={x(2)}
                    y1={104}
                    x2={x(2)}
                    y2={176}
                    stroke={C.data}
                    strokeWidth={3}
                  />
                  <text
                    x={x(1.6)}
                    y={92}
                    textAnchor="middle"
                    fontFamily={FONT_MONO}
                    fontSize={26}
                    fill={C.ink}
                  >
                    1.6
                  </text>
                  <text
                    x={x(2)}
                    y={62}
                    textAnchor="middle"
                    fontFamily={FONT_TC}
                    fontWeight={700}
                    fontSize={30}
                    fill={C.ink}
                  >
                    預期 2.0
                  </text>
                  <text
                    x={x(2.4)}
                    y={92}
                    textAnchor="middle"
                    fontFamily={FONT_MONO}
                    fontSize={26}
                    fill={C.ink}
                  >
                    2.4
                  </text>
                </g>
              </svg>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  marginTop: 20,
                }}
              >
                {RISKS.map((r, i) => {
                  const start = 224 + i * 18;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                        fontFamily: FONT_TC,
                        fontSize: 27,
                        color: C.ink2,
                        opacity: clamp(frame, [start, start + 14], [0, 1]),
                        translate: `${clamp(frame, [start, start + 16], [-22, 0])}px 0px`,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: C.judge,
                          flex: "none",
                        }}
                      />
                      {r}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 21,
              letterSpacing: "0.2em",
              color: C.ink3,
              border: `2px solid ${C.hairline}`,
              borderRadius: 999,
              padding: "10px 34px",
              opacity: clamp(frame, [270, 292], [0, 1]),
            }}
          >
            產品模擬畫面 · 非實際數據
          </div>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
