import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT_MONO } from "../theme";
import { clamp } from "../ui";

/* Demo 四幕共用的產品視窗外框：頂欄 + DEMO 標記，讓四幕讀成同一個產品 */
export const DemoWindow: React.FC<{
  from: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
}> = ({ from, width = 1400, height = 620, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width,
        height,
        background: C.panel,
        border: `2px solid ${C.hairline}`,
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 40px 120px rgba(0,0,0,.5)",
        opacity: clamp(frame, [from, from + 20], [0, 1]),
        translate: `0px ${clamp(frame, [from, from + 24], [46, 0])}px`,
        scale: String(clamp(frame, [from, from + 24], [0.97, 1])),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 34px",
          borderBottom: `1px solid ${C.hairline}`,
          background: "rgba(255,255,255,.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: C.data,
            }}
          />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: C.ink2,
            }}
          >
            FORESIGHT
          </span>
        </div>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 17,
            letterSpacing: "0.18em",
            color: C.ink3,
            border: `1px solid ${C.hairline}`,
            borderRadius: 999,
            padding: "6px 20px",
          }}
        >
          DEMO · 模擬畫面
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
    </div>
  );
};

/* 打字機文字：依 frame 逐字出現，尾端帶游標 */
export const TypeText: React.FC<{
  from: number;
  cps?: number; // 每秒字數（frame 基準 30fps）
  text: string;
  style?: React.CSSProperties;
  cursor?: boolean;
}> = ({ from, cps = 12, text, style, cursor = true }) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const shown = Math.max(
    0,
    Math.min(chars.length, Math.floor(((frame - from) * cps) / 30)),
  );
  const done = shown >= chars.length;
  const blink = Math.floor(frame / 16) % 2 === 0;
  return (
    <span style={style}>
      {chars.slice(0, shown).join("")}
      {cursor && (!done || blink) && frame >= from ? (
        <span style={{ color: C.data }}>▋</span>
      ) : null}
    </span>
  );
};
