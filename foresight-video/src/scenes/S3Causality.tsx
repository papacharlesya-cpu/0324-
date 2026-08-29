import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO } from "../theme";
import { Eyebrow, Foot, PopIn, Push, Stage, Sub, clamp } from "../ui";

const ROWS: Array<[string, string]> = [
  ["調預算 +20%", "ROAS 2.1 ▸ 2.6"],
  ["換素材 痛點切角", "CTR +38%"],
  ["改受眾 LAL 3%", "CPA −22%"],
  ["停放大量字組", "CPC −41%"],
];

export const S3Causality: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Push durationInFrames={DUR.s3} amount={1.03}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 34 }}
        >
          <Eyebrow from={4}>CAUSALITY · 不只是數據</Eyebrow>
          <PopIn from={8} size={170}>它記得。</PopIn>
          <Sub from={24}>每一次調整、每一個結果，全都留著。</Sub>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 26,
              marginTop: 26,
              fontFamily: FONT_MONO,
              fontSize: 34,
              textAlign: "left",
            }}
          >
            {ROWS.map(([act, res], i) => {
              const start = 40 + i * 22;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 70,
                    alignItems: "baseline",
                    borderLeft: `4px solid ${C.hairline}`,
                    paddingLeft: 44,
                    paddingTop: 8,
                    paddingBottom: 8,
                    opacity: clamp(frame, [start, start + 16], [0, 1]),
                    translate: `${clamp(frame, [start, start + 18], [-34, 0])}px 0px`,
                  }}
                >
                  <span style={{ color: C.ink, minWidth: 560 }}>{act}</span>
                  <span style={{ color: C.exec }}>{res}</span>
                </div>
              );
            })}
          </div>
          <Foot from={150}>示意資料</Foot>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
