import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DUR, FONT_MONO, FONT_TC } from "../theme";
import { EASE, Eyebrow, Push, Stage, StaggerHeadline, clamp } from "../ui";
import { DemoWindow } from "./demo";

/* 深色模式的廣告管理員：FORESIGHT 把三個廣告組合寫進後台，
   操作人員核准後開關逐一撥開。資料為虛構示範值。 */

const ROWS: Array<[string, string, string]> = [
  ["新品上市_主檔", "LAL 3%", "NT$12,000"],
  ["新品上市_興趣", "保健食品興趣", "NT$8,000"],
  ["新品上市_再行銷", "站內 30 天", "NT$6,000"],
];

const COLS = { toggle: 56, name: 1.5, aud: 1.1, status: 1, budget: 0.9, spend: 0.7 };

export const D3Execute: React.FC = () => {
  const frame = useCurrentFrame();
  const approveAt = 196;
  const writing = frame < 160;
  const check = clamp(frame, [approveAt, approveAt + 14], [0, 1]);
  /* 游標：滑向核准鈕，196 點擊 */
  const curX = clamp(frame, [170, 192], [1080, 1293], EASE);
  const curY = clamp(frame, [170, 192], [478, 431], EASE);
  const curOn =
    clamp(frame, [162, 172], [0, 1]) * clamp(frame, [232, 246], [1, 0]);
  const ripple = clamp(frame, [approveAt, approveAt + 22], [0, 1]);
  return (
    <Stage>
      <Push durationInFrames={DUR.d3} amount={1.025}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
        >
          <Eyebrow from={4}>DEMO 3/4 · 直接動手</Eyebrow>
          <StaggerHeadline from={14} lines={["然後它動手，你只要點頭。"]} size={92} />
          <DemoWindow from={54} height={560}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                fontFamily: FONT_TC,
              }}
            >
              {/* 瀏覽器列 */}
              <div
                style={{
                  height: 44,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 20px",
                  background: "rgba(255,255,255,.03)",
                  borderBottom: `1px solid ${C.hairline}`,
                  opacity: clamp(frame, [70, 84], [0, 1]),
                }}
              >
                <div style={{ display: "flex", gap: 7 }}>
                  {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                    <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
                  ))}
                </div>
                <div
                  style={{
                    flex: 1,
                    maxWidth: 470,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,.06)",
                    border: `1px solid ${C.hairline}`,
                    borderRadius: 999,
                    padding: "5px 16px",
                  }}
                >
                  <svg width={13} height={15} viewBox="0 0 13 15">
                    <rect x={1} y={6} width={11} height={8} rx={2} fill={C.ink3} />
                    <path d="M3.5 6V4.5a3 3 0 0 1 6 0V6" fill="none" stroke={C.ink3} strokeWidth={1.8} />
                  </svg>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.ink2 }}>
                    business.facebook.com/adsmanager
                  </span>
                </div>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: FONT_MONO,
                    fontSize: 14,
                    color: C.exec,
                    border: `1px solid ${C.hairline}`,
                    borderRadius: 999,
                    padding: "5px 14px",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.exec }} />
                  FORESIGHT 已連線
                </span>
              </div>
              {/* 管理員標題列 */}
              <div
                style={{
                  height: 46,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  opacity: clamp(frame, [76, 90], [0, 1]),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 21, fontWeight: 900, color: C.ink }}>廣告管理員</span>
                  <span style={{ fontSize: 15, color: C.ink2, border: `1.5px solid ${C.hairline}`, borderRadius: 999, padding: "3px 14px" }}>
                    Demo Brand TW ▾
                  </span>
                </div>
                <span style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8, color: writing ? C.data : C.ink2 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: writing ? C.data : C.exec,
                      opacity: writing ? 0.55 + 0.45 * Math.sin(frame / 3.2) : 1,
                    }}
                  />
                  {writing ? "FORESIGHT 寫入中…" : "3 個廣告組合已建立"}
                </span>
              </div>
              {/* 分頁籤 */}
              <div
                style={{
                  height: 40,
                  flex: "none",
                  display: "flex",
                  gap: 34,
                  padding: "0 24px",
                  borderBottom: `1px solid ${C.hairline}`,
                  opacity: clamp(frame, [80, 94], [0, 1]),
                }}
              >
                {["行銷活動", "廣告組合", "廣告"].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      fontSize: 18,
                      fontWeight: i === 1 ? 700 : 400,
                      color: i === 1 ? C.data : C.ink2,
                    }}
                  >
                    {t}
                    {i === 1 ? (
                      <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, borderRadius: 2, background: C.data }} />
                    ) : null}
                  </span>
                ))}
              </div>
              {/* 欄頭 */}
              <div
                style={{
                  height: 30,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 24px",
                  fontSize: 15,
                  color: C.ink3,
                  background: "rgba(255,255,255,.02)",
                  opacity: clamp(frame, [84, 98], [0, 1]),
                }}
              >
                <span style={{ width: COLS.toggle }}>開關</span>
                <span style={{ flex: COLS.name }}>廣告組合</span>
                <span style={{ flex: COLS.aud }}>受眾</span>
                <span style={{ flex: COLS.status }}>投遞狀態</span>
                <span style={{ flex: COLS.budget }}>日預算</span>
                <span style={{ flex: COLS.spend }}>花費金額</span>
              </div>
              {/* 資料列 */}
              {ROWS.map(([name, aud, budget], i) => {
                const at = 88 + i * 22;
                const flipAt = approveAt + 20 + i * 7;
                const flipped = frame > flipAt;
                const knobX = clamp(frame, [flipAt, flipAt + 8], [3, 23]);
                return (
                  <div
                    key={i}
                    style={{
                      height: 58,
                      flex: "none",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 24px",
                      borderTop: i ? `1px solid ${C.hairline}` : "none",
                      opacity: clamp(frame, [at, at + 14], [0, 1]),
                      translate: `${clamp(frame, [at, at + 16], [-26, 0])}px 0px`,
                    }}
                  >
                    <span style={{ width: COLS.toggle }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 46,
                          height: 26,
                          borderRadius: 999,
                          background: flipped ? "#1877F2" : "#2A3550",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: knobX,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 1px 4px rgba(0,0,0,.5)",
                          }}
                        />
                      </span>
                    </span>
                    <span style={{ flex: COLS.name, fontWeight: 700, fontSize: 21, color: C.ink }}>{name}</span>
                    <span style={{ flex: COLS.aud, fontSize: 18, color: C.ink2 }}>{aud}</span>
                    <span style={{ flex: COLS.status, display: "flex", alignItems: "center", gap: 9, fontSize: 17, color: flipped ? C.exec : C.ink3 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: flipped ? C.exec : C.ink3 }} />
                      {flipped ? "使用中" : "審查中"}
                    </span>
                    <span style={{ flex: COLS.budget, fontFamily: FONT_MONO, fontSize: 18, color: C.ink2 }}>{budget}</span>
                    <span style={{ flex: COLS.spend, fontFamily: FONT_MONO, fontSize: 18, color: C.ink3 }}>NT$0</span>
                  </div>
                );
              })}
              {/* 總計列 */}
              <div
                style={{
                  height: 40,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  background: "rgba(255,255,255,.02)",
                  borderTop: `1px solid ${C.hairline}`,
                  fontSize: 16,
                  color: C.ink2,
                  opacity: clamp(frame, [150, 164], [0, 1]),
                }}
              >
                <span>3 個廣告組合 · 6 支素材已掛上 — 由 FORESIGHT 建立</span>
                <span style={{ fontFamily: FONT_MONO }}>日預算總計 NT$26,000</span>
              </div>
              {/* 核准列：human-in-the-loop */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  opacity: clamp(frame, [166, 180], [0, 1]),
                }}
              >
                <div style={{ fontSize: 22, color: C.ink2 }}>
                  {check > 0
                    ? "操作人員已核准，開始投放 — 每一筆對外投放，都有人看過才出手"
                    : "等待操作人員核准…"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 23,
                    fontWeight: 700,
                    fontFamily: FONT_TC,
                    color: C.ground,
                    background: check > 0 ? C.exec : C.data,
                    borderRadius: 12,
                    padding: "12px 34px",
                    scale: String(frame >= approveAt - 2 && frame < approveAt + 4 ? 0.92 : 1),
                    boxShadow: `0 0 ${34 * check}px ${C.execSoft}`,
                  }}
                >
                  <svg width={22} height={22} viewBox="0 0 26 26">
                    <path
                      d="M5 13.5 L11 19 L21 7"
                      fill="none"
                      stroke={C.ground}
                      strokeWidth={3.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - check}
                    />
                  </svg>
                  {check > 0 ? "已核准" : "核准"}
                </div>
              </div>
              {/* 游標演出 */}
              {curOn > 0 ? (
                <>
                  {ripple > 0 && ripple < 1 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 1293 - 34,
                        top: 431 - 34,
                        width: 68,
                        height: 68,
                        borderRadius: "50%",
                        border: `3px solid ${C.data}`,
                        opacity: (1 - ripple) * 0.6,
                        scale: String(0.3 + ripple * 1.1),
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: "absolute",
                      left: curX - 13,
                      top: curY - 13,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "rgba(238,243,251,.25)",
                      border: "3px solid #fff",
                      boxShadow: "0 4px 14px rgba(0,0,0,.5)",
                      opacity: curOn,
                      scale: String(frame >= approveAt && frame < approveAt + 6 ? 0.82 : 1),
                    }}
                  />
                </>
              ) : null}
            </div>
          </DemoWindow>
        </AbsoluteFill>
      </Push>
    </Stage>
  );
};
