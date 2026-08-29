import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";

const LAYERS = [
  {
    name: "資料層",
    desc: "每月三億筆成效資料，持續累積、持續更新",
    color: C.data,
    soft: C.dataSoft,
  },
  {
    name: "判斷層",
    desc: "十五年資深操作判斷，一條一條寫進系統",
    color: C.judge,
    soft: C.judgeSoft,
  },
  {
    name: "執行層",
    desc: "AI agent 直連廣告帳戶，判斷完直接動手",
    color: C.exec,
    soft: C.execSoft,
  },
];

export const S5Engine: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Push durationInFrames={DUR.s5} amount={1.03}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>THE ENGINE</Eyebrow>
          <StaggerHeadline
            from={16}
            lines={["不是儀表板，是會動手的引擎。"]}
            size={92}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 30,
              width: 1240,
              marginTop: 20,
              position: "relative",
            }}
          >
            {LAYERS.map((l, i) => {
              const start = 92 + i * 26;
              return (
                <div
                  key={l.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 36,
                    textAlign: "left",
                    background: `linear-gradient(90deg, ${l.soft}, ${C.panel} 55%)`,
                    border: `2px solid ${C.hairline}`,
                    borderRadius: 20,
                    padding: "34px 48px",
                    opacity: clamp(frame, [start, start + 18], [0, 1]),
                    translate: `0px ${clamp(frame, [start, start + 22], [50, 0])}px`,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: l.color,
                      flex: "none",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: FONT_TC,
                        fontWeight: 900,
                        fontSize: 44,
                        letterSpacing: "0.08em",
                        color: C.ink,
                      }}
                    >
                      {l.name}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_TC,
                        fontSize: 30,
                        color: C.ink2,
                        marginTop: 8,
                        lineHeight: 1.6,
                      }}
                    >
                      {l.desc}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 三層之間流動的資料點 */}
            <svg
              width={8}
              height={620}
              style={{
                position: "absolute",
                left: 69,
                top: 20,
                opacity: clamp(frame, [180, 205], [0, 1]),
              }}
              aria-hidden
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const y = ((frame * 4 + i * 124) % 620) as number;
                return <circle key={i} cx={4} cy={y} r={4} fill={C.ink2} opacity={0.7} />;
              })}
            </svg>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 24,
              letterSpacing: "0.2em",
              color: C.ink3,
              marginTop: 8,
              opacity: clamp(frame, [210, 234], [0, 1]),
            }}
          >
            DATA → JUDGMENT → EXECUTION
          </div>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
