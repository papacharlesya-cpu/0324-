import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";

const CHIPS = [
  "零售",
  "金融",
  "CPG",
  "醫藥",
  "電商",
  "房產",
  "戶外用品",
  "汽機車",
  "美妝",
  "保健食品",
];

export const S4Depth: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Push durationInFrames={DUR.s4} amount={1.035}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 44 }}
        >
          <Eyebrow from={4}>DEPTH · SINCE 2011</Eyebrow>
          <StaggerHeadline
            from={16}
            lines={["十五年，四百多個帳戶，", "全部自己動手。"]}
            size={100}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "22px 20px",
              justifyContent: "center",
              maxWidth: 1250,
              marginTop: 18,
            }}
          >
            {CHIPS.map((label, i) => {
              const start = 96 + i * 6;
              return (
                <span
                  key={label}
                  style={{
                    fontFamily: FONT_TC,
                    fontSize: 34,
                    color: C.ink2,
                    border: `2px solid ${C.hairline}`,
                    borderRadius: 999,
                    padding: "12px 38px",
                    background: C.panel,
                    opacity: clamp(frame, [start, start + 14], [0, 1]),
                    scale: String(clamp(frame, [start, start + 16], [0.82, 1])),
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
          {/* 2011 → 2026 時間軸 */}
          <div
            style={{
              marginTop: 40,
              width: 1100,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                height: 3,
                background: C.hairline,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: C.data,
                  width: "100%",
                  scale: `${clamp(frame, [150, 210], [0, 1])} 1`,
                  transformOrigin: "left",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: FONT_MONO,
                fontSize: 24,
                color: C.ink3,
                letterSpacing: "0.12em",
                opacity: clamp(frame, [150, 172], [0, 1]),
              }}
            >
              <span>2011</span>
              <span>2026</span>
            </div>
          </div>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
