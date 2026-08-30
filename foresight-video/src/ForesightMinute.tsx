import React from "react";
import {
  AbsoluteFill,
  Easing,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { FONT_MONO, FONT_TC, FPS } from "./theme";
import { TypeText } from "./scenes/demo";

/* 一分鐘版 v3：對標 Google 產品片
   完整 App 外殼（側邊欄導覽 + 表格 + KPI 磚）、游標演出、
   彈簧物理、遮罩文字、連續視窗換頁 */

const LC = {
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E4EAF3",
  ink: "#17202E",
  ink2: "#5B6B80",
  ink3: "#93A1B5",
  blue: "#2F6BFF",
  blueSoft: "#EAF0FF",
  green: "#0E9F6E",
  greenSoft: "#E6F6F0",
  amber: "#D97706",
  amberSoft: "#FCF0DF",
};
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = (
  frame: number,
  inR: [number, number],
  outR: [number, number],
  easing = EASE,
) =>
  interpolate(frame, inR, outR, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
const spAt = (frame: number, from: number, damping = 13) =>
  spring({ frame: frame - from, fps: FPS, config: { damping, stiffness: 130, mass: 0.9 } });

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: LC.bg,
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT_TC,
      color: LC.ink,
    }}
  >
    {children}
  </AbsoluteFill>
);

const Pop: React.FC<{ from: number; damping?: number; children: React.ReactNode }> = ({
  from,
  damping = 13,
  children,
}) => {
  const frame = useCurrentFrame();
  const s = spAt(frame, from, damping);
  return (
    <div style={{ opacity: Math.min(1, s * 1.6), translate: `0px ${(1 - s) * 46}px`, scale: String(0.94 + s * 0.06) }}>
      {children}
    </div>
  );
};

const MaskReveal: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => {
  const frame = useCurrentFrame();
  const s = spAt(frame, from, 16);
  return (
    <div style={{ overflow: "hidden", padding: "0.08em 0" }}>
      <div style={{ translate: `0px ${(1 - s) * 110}%` }}>{children}</div>
    </div>
  );
};

const Wordmark: React.FC<{ from: number; size?: number }> = ({ from, size = 120 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex" }}>
      {Array.from("FORESIGHT").map((ch, i) => {
        const s = spAt(frame, from + i * 2.2, 12);
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 600,
              fontSize: size,
              letterSpacing: "0.12em",
              backgroundImage: `linear-gradient(100deg, ${LC.ink} 25%, ${LC.blue} 80%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              display: "inline-block",
              opacity: Math.min(1, s * 1.8),
              translate: `0px ${(1 - s) * 60}px`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/* 游標演出 */
type Way = { t: number; x: number; y: number; click?: boolean };
const Cursor: React.FC<{ ways: Way[]; hideAfter: number }> = ({ ways, hideAfter }) => {
  const frame = useCurrentFrame();
  if (frame < ways[0].t - 12 || frame > hideAfter + 14) return null;
  let x = ways[0].x;
  let y = ways[0].y;
  for (let i = 0; i < ways.length - 1; i++) {
    const a = ways[i];
    const b = ways[i + 1];
    if (frame >= b.t) {
      x = b.x;
      y = b.y;
    } else if (frame > a.t) {
      const p = EASE((frame - a.t) / (b.t - a.t));
      x = a.x + (b.x - a.x) * p;
      y = a.y + (b.y - a.y) * p;
      break;
    }
  }
  const appear = clamp(frame, [ways[0].t - 12, ways[0].t], [0, 1]);
  const vanish = clamp(frame, [hideAfter, hideAfter + 14], [1, 0]);
  let press = 1;
  const ripples: React.ReactNode[] = [];
  for (const w of ways) {
    if (!w.click) continue;
    const dt = frame - w.t;
    if (dt >= 0 && dt < 6) press = 0.82;
    if (dt >= 0 && dt < 24) {
      const p = dt / 24;
      ripples.push(
        <div
          key={w.t}
          style={{
            position: "absolute",
            left: w.x - 34,
            top: w.y - 34,
            width: 68,
            height: 68,
            borderRadius: "50%",
            border: `3px solid ${LC.blue}`,
            opacity: (1 - p) * 0.55,
            scale: String(0.3 + p * 1.1),
          }}
        />,
      );
    }
  }
  return (
    <>
      {ripples}
      <div
        style={{
          position: "absolute",
          left: x - 13,
          top: y - 13,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(23,32,46,.55)",
          border: "3px solid #fff",
          boxShadow: "0 4px 14px rgba(23,32,46,.35)",
          opacity: appear * vanish,
          scale: String(press),
        }}
      />
    </>
  );
};

/* ---------- M1 / M2 / M3 ---------- */
const M1: React.FC = () => {
  const frame = useCurrentFrame();
  const dot = spAt(frame, 4, 10);
  const ring = clamp(frame, [10, 34], [0, 1], Easing.linear);
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
        <div style={{ position: "relative", width: 30, height: 30 }}>
          <div
            style={{
              position: "absolute",
              inset: -22,
              borderRadius: "50%",
              border: `3px solid ${LC.blue}`,
              opacity: (1 - ring) * 0.5,
              scale: String(0.4 + ring * 1.3),
            }}
          />
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: LC.blue, scale: String(dot) }} />
        </div>
        <MaskReveal from={20}>
          <div style={{ fontSize: 44, color: LC.ink2 }}>認識一下</div>
        </MaskReveal>
        <Wordmark from={34} size={150} />
      </div>
    </Page>
  );
};

const M2: React.FC = () => (
  <Page>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, textAlign: "center" }}>
      <MaskReveal from={4}>
        <div style={{ fontSize: 60, fontWeight: 700 }}>cacaFly 的廣告 AI。</div>
      </MaskReveal>
      <MaskReveal from={38}>
        <div style={{ fontSize: 60, fontWeight: 700, color: LC.blue }}>會想，也會動手。</div>
      </MaskReveal>
    </div>
  </Page>
);

const FACTS = [
  { big: "3 億", sub: "筆廣告數據／每月", line: "它全看過。" },
  { big: "每一次", sub: "調整與結果", line: "它都記得。" },
  { big: "15 年", sub: "老手的判斷", line: "都教給它了。" },
];
const M3: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Page>
      <div style={{ display: "flex", gap: 36 }}>
        {FACTS.map((f, i) => {
          const s = spAt(frame, 10 + i * 56, 12);
          const bigS = spAt(frame, 26 + i * 56, 9);
          return (
            <div
              key={i}
              style={{
                width: 420,
                height: 400,
                background: LC.card,
                border: `2px solid ${LC.border}`,
                borderRadius: 26,
                boxShadow: `0 ${10 + s * 14}px ${34 + s * 30}px rgba(23,32,46,.09)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
                opacity: Math.min(1, s * 1.7),
                translate: `0px ${(1 - s) * 70}px`,
                rotate: `${(1 - s) * (i % 2 ? 2.5 : -2.5)}deg`,
              }}
            >
              <div style={{ fontSize: 84, fontWeight: 900, color: LC.blue, scale: String(0.5 + bigS * 0.5) }}>{f.big}</div>
              <div style={{ fontSize: 30, color: LC.ink2 }}>{f.sub}</div>
              <div style={{ fontSize: 38, fontWeight: 700, marginTop: 10 }}>{f.line}</div>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

/* ---------- M4-M7：完整 App 外殼，連續視窗 ----------
   local 0-1020；換頁 270/540/810；核准 714（= 41.8s 暖和弦） */
const PAGE_T = [0, 270, 540, 810];
const NAV = ["對話", "預測", "執行", "成效"];
const CHIP_LABELS = [
  "STEP 1 · 跟它說你要什麼",
  "STEP 2 · 它先想，再給答案",
  "STEP 3 · 它動手，你點頭",
  "STEP 4 · 上線後，它一直盯著",
];
const pageShift = (frame: number, idx: number) => {
  const enter = idx === 0 ? 1 : spAt(frame, PAGE_T[idx], 15);
  const exitStart = idx < 3 ? PAGE_T[idx + 1] : Infinity;
  const exit = idx < 3 ? clamp(frame, [exitStart, exitStart + 14], [0, 1]) : 0;
  return {
    opacity: Math.min(1, enter * 1.6) * (1 - exit),
    translate: `${(1 - enter) * 120 - exit * 120}px 0px`,
  };
};

const KpiTile: React.FC<{ from: number; label: string; value: string; hint?: string }> = ({
  from,
  label,
  value,
  hint,
}) => {
  const frame = useCurrentFrame();
  const s = spAt(frame, from, 12);
  return (
    <div
      style={{
        flex: 1,
        background: LC.card,
        border: `2px solid ${LC.border}`,
        borderRadius: 16,
        padding: "18px 26px",
        opacity: Math.min(1, s * 1.7),
        translate: `0px ${(1 - s) * 34}px`,
      }}
    >
      <div style={{ fontSize: 20, color: LC.ink3 }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 40, fontWeight: 600, marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: 18, color: LC.ink2, marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
};

const Badge: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      fontSize: 20,
      fontWeight: 700,
      color: on ? LC.green : LC.amber,
      background: on ? LC.greenSoft : LC.amberSoft,
      borderRadius: 999,
      padding: "6px 20px",
    }}
  >
    {on ? "● 進行中" : "⏸ 待核准"}
  </span>
);

const M4to7: React.FC = () => {
  const frame = useCurrentFrame();
  const win = spAt(frame, 6, 15);
  const pageIdx = frame >= 810 ? 3 : frame >= 540 ? 2 : frame >= 270 ? 1 : 0;
  const chipS = spAt(frame, PAGE_T[pageIdx] === 0 ? 6 : PAGE_T[pageIdx], 15);
  /* 側邊欄指示器：每次換頁往下滑一格（彈簧在換頁前自然為 0） */
  const NAV_H = 74;
  const navSlide =
    NAV_H * spAt(frame, PAGE_T[1], 15) +
    NAV_H * spAt(frame, PAGE_T[2], 15) +
    NAV_H * spAt(frame, PAGE_T[3], 15);
  /* 核准：badge 逐列翻綠 */
  const approveAt = 714;
  const check = clamp(frame, [approveAt, approveAt + 14], [0, 1]);
  /* Page 2 帶狀圖 */
  const x = (roas: number) => 26 + (roas / 3) * 400;
  const grow = clamp(frame, [352, 382], [0, 1]);
  /* Page 4 曲線 */
  const DATA = [1.4, 1.8, 1.6, 2.0, 2.2, 2.3];
  const CW = 760;
  const CH = 300;
  const px = (i: number) => 50 + (i / 5) * (CW - 100);
  const py = (v: number) => CH - 40 - ((v - 1) / 1.6) * (CH - 90);
  const lpath = DATA.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ");
  const draw = clamp(frame, [826, 930], [0, 1]);
  const endPop = spAt(frame, 936, 9);
  const roasCount = (1.0 + 1.3 * clamp(frame, [840, 940], [0, 1])).toFixed(1);

  const rows: Array<[string, string, string]> = [
    ["新品上市_主檔", "LAL 3%", "NT$12,000"],
    ["新品上市_興趣", "保健食品興趣", "NT$8,000"],
    ["新品上市_再行銷", "站內 30 天", "NT$6,000"],
  ];

  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ opacity: Math.min(1, chipS * 1.6), translate: `0px ${(1 - chipS) * 18}px` }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: LC.blue,
              background: LC.blueSoft,
              borderRadius: 999,
              padding: "10px 28px",
            }}
          >
            {CHIP_LABELS[pageIdx]}
          </div>
        </div>

        {/* App 視窗：header + 側邊欄 + 內容 */}
        <div
          style={{
            width: 1540,
            height: 640,
            background: LC.card,
            border: `2px solid ${LC.border}`,
            borderRadius: 26,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 70px rgba(23,32,46,.10)",
            opacity: Math.min(1, win * 1.6),
            translate: `0px ${(1 - win) * 60}px`,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 30px",
              borderBottom: `1px solid ${LC.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: LC.blue }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, letterSpacing: "0.2em", color: LC.ink2 }}>
                FORESIGHT
              </span>
            </div>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 15,
                letterSpacing: "0.16em",
                color: LC.ink3,
                border: `1px solid ${LC.border}`,
                borderRadius: 999,
                padding: "5px 16px",
              }}
            >
              DEMO · 模擬畫面
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            {/* 側邊欄：指示器跟劇情滑動 */}
            <div
              style={{
                width: 230,
                borderRight: `1px solid ${LC.border}`,
                background: LC.bg,
                position: "relative",
                padding: "26px 0",
              }}
            >
              <div style={{ padding: "0 26px", fontSize: 19, color: LC.ink3, marginBottom: 18 }}>新品上市計畫</div>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 81 + navSlide,
                  width: 206,
                  height: 58,
                  background: LC.blueSoft,
                  borderRadius: 12,
                }}
              />
              {NAV.map((n, i) => (
                <div
                  key={n}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "0 30px",
                    height: NAV_H,
                    fontSize: 25,
                    fontWeight: i === pageIdx ? 700 : 400,
                    color: i === pageIdx ? LC.blue : LC.ink2,
                  }}
                >
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: i === 3 ? "50%" : 3,
                      background: i === pageIdx ? LC.blue : LC.ink3,
                    }}
                  />
                  {n}
                </div>
              ))}
            </div>

            {/* 內容區 */}
            <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
              {/* P1 對話 */}
              <div style={{ position: "absolute", inset: 0, ...pageShift(frame, 0) }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", gap: 24 }}>
                  <div style={{ fontSize: 27, color: LC.ink2, opacity: clamp(frame, [26, 40], [0, 1]) }}>
                    嗨，今天想做什麼？
                  </div>
                  <div
                    style={{
                      border: `2px solid ${frame > 50 && frame < 172 ? LC.blue : LC.border}`,
                      borderRadius: 18,
                      padding: "26px 32px",
                      fontSize: 33,
                      lineHeight: 1.6,
                      minHeight: 112,
                      background: LC.bg,
                      boxShadow: frame > 50 && frame < 172 ? "0 0 0 5px rgba(47,107,255,.10)" : "none",
                    }}
                  >
                    <TypeText from={58} cps={22} text="新品上市：膠原蛋白飲，月預算 80 萬，目標 EC 購買。" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 14, opacity: clamp(frame, [34, 50], [0, 1]) }}>
                      {["雙 11 備戰", "週報摘要", "健檢帳戶"].map((t) => (
                        <span key={t} style={{ fontSize: 21, color: LC.ink2, border: `1.5px solid ${LC.border}`, borderRadius: 999, padding: "8px 22px" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 23,
                        fontWeight: 600,
                        color: "#fff",
                        background: LC.blue,
                        borderRadius: 12,
                        padding: "13px 38px",
                        scale: String(frame >= 160 && frame < 166 ? 0.92 : 1),
                        boxShadow: "0 8px 24px rgba(47,107,255,.35)",
                      }}
                    >
                      {frame < 164 ? "送出 ▸" : "分析中…"}
                    </div>
                  </div>
                </div>
              </div>

              {/* P2 預測儀表板 */}
              <div style={{ position: "absolute", inset: 0, ...pageShift(frame, 1) }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "34px 48px", gap: 24 }}>
                  <div style={{ display: "flex", gap: 22 }}>
                    <KpiTile from={296} label="預期 ROAS" value="2.0" hint="信心區間 1.6–2.4" />
                    <KpiTile from={312} label="建議日預算" value="NT$26,000" hint="80 萬／月" />
                    <KpiTile from={328} label="預估月轉換" value="1,150 筆" hint="EC 購買" />
                  </div>
                  <div style={{ display: "flex", gap: 24, flex: 1 }}>
                    <div style={{ flex: 1.2, border: `2px solid ${LC.border}`, borderRadius: 16, background: LC.bg, padding: "22px 28px", opacity: clamp(frame, [344, 360], [0, 1]) }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 17, letterSpacing: "0.2em", color: LC.ink3, marginBottom: 14 }}>
                        預測 ROAS 區間
                      </div>
                      <svg width={440} height={120} style={{ overflow: "visible" }}>
                        <line x1={x(0)} y1={82} x2={x(3)} y2={82} stroke={LC.border} strokeWidth={3} />
                        {[0, 1, 2, 3].map((t) => (
                          <text key={t} x={x(t)} y={112} textAnchor="middle" fontFamily={FONT_MONO} fontSize={17} fill={LC.ink3}>
                            {t === 0 ? "0" : t.toFixed(1)}
                          </text>
                        ))}
                        <rect x={x(1.6)} y={58} width={(x(2.4) - x(1.6)) * grow} height={48} rx={7} fill="rgba(47,107,255,.15)" stroke={LC.blue} strokeWidth={3} />
                        <g opacity={clamp(frame, [396, 410], [0, 1])}>
                          <line x1={x(2)} y1={52} x2={x(2)} y2={112} stroke={LC.blue} strokeWidth={3} />
                          <text x={x(2)} y={34} textAnchor="middle" fontWeight={700} fontSize={25} fill={LC.ink}>預期 2.0</text>
                        </g>
                      </svg>
                    </div>
                    <div style={{ flex: 1, border: `2px solid ${LC.border}`, borderRadius: 16, background: LC.bg, padding: "22px 28px", opacity: clamp(frame, [400, 416], [0, 1]) }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 17, letterSpacing: "0.2em", color: LC.ink3, marginBottom: 16 }}>
                        風險提醒
                      </div>
                      {["第 3 週素材疲勞，先備第二波", "再行銷池 4 週見頂，需擴上層"].map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: LC.ink2, marginTop: i ? 14 : 0, opacity: clamp(frame, [416 + i * 18, 430 + i * 18], [0, 1]) }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: LC.amber, flex: "none" }} />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* P3 執行表格 + 核准 */}
              <div style={{ position: "absolute", inset: 0, ...pageShift(frame, 2) }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "32px 48px", gap: 18 }}>
                  <div style={{ display: "flex", fontSize: 19, color: LC.ink3, padding: "0 22px", opacity: clamp(frame, [560, 574], [0, 1]) }}>
                    <span style={{ flex: 2 }}>廣告組合</span>
                    <span style={{ flex: 1.4 }}>受眾</span>
                    <span style={{ flex: 1 }}>日預算</span>
                    <span style={{ width: 150 }}>狀態</span>
                  </div>
                  {rows.map(([name, aud, budget], i) => {
                    const e = spAt(frame, 574 + i * 20, 13);
                    const flipped = frame > approveAt + 8 + i * 7;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: LC.bg,
                          border: `2px solid ${LC.border}`,
                          borderRadius: 14,
                          padding: "18px 22px",
                          fontSize: 24,
                          opacity: Math.min(1, e * 1.7),
                          translate: `0px ${(1 - e) * 30}px`,
                        }}
                      >
                        <span style={{ flex: 2, fontWeight: 700 }}>{name}</span>
                        <span style={{ flex: 1.4, color: LC.ink2 }}>{aud}</span>
                        <span style={{ flex: 1, fontFamily: FONT_MONO, color: LC.ink2 }}>{budget}</span>
                        <span style={{ width: 150 }}>
                          <Badge on={flipped} />
                        </span>
                      </div>
                    );
                  })}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 6,
                      opacity: clamp(frame, [648, 664], [0, 1]),
                    }}
                  >
                    <div style={{ fontSize: 23, color: LC.ink2 }}>
                      {check > 0 ? "已核准，開始投放 — 每一筆都有人看過才出手" : "3 個廣告組合已備妥，等待核准"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#fff",
                        background: check > 0 ? LC.green : LC.blue,
                        borderRadius: 12,
                        padding: "13px 36px",
                        scale: String(frame >= approveAt - 2 && frame < approveAt + 4 ? 0.92 : 1),
                      }}
                    >
                      <svg width={22} height={22} viewBox="0 0 26 26">
                        <path
                          d="M5 13.5 L11 19 L21 7"
                          fill="none"
                          stroke="#fff"
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
                </div>
              </div>

              {/* P4 成效 */}
              <div style={{ position: "absolute", inset: 0, ...pageShift(frame, 3) }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", padding: "34px 48px", gap: 26 }}>
                  <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ background: LC.bg, border: `2px solid ${LC.border}`, borderRadius: 16, padding: "20px 26px", opacity: clamp(frame, [820, 834], [0, 1]) }}>
                      <div style={{ fontSize: 19, color: LC.ink3 }}>6 週 ROAS</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 56, fontWeight: 600, color: LC.blue }}>{roasCount}</div>
                      <div style={{ fontSize: 18, color: LC.green }}>高於預期</div>
                    </div>
                    <div style={{ background: LC.bg, border: `2px solid ${LC.border}`, borderRadius: 16, padding: "20px 26px", opacity: clamp(frame, [838, 852], [0, 1]) }}>
                      <div style={{ fontSize: 19, color: LC.ink3 }}>CPA</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 40, fontWeight: 600 }}>−18%</div>
                    </div>
                    <div style={{ background: LC.bg, border: `2px solid ${LC.border}`, borderRadius: 16, padding: "20px 26px", opacity: clamp(frame, [856, 870], [0, 1]) }}>
                      <div style={{ fontSize: 19, color: LC.ink3 }}>異常到修正</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 40, fontWeight: 600 }}>4 小時</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, border: `2px solid ${LC.border}`, borderRadius: 16, background: LC.bg, padding: "24px 30px", opacity: clamp(frame, [816, 830], [0, 1]) }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 17, letterSpacing: "0.2em", color: LC.ink3, marginBottom: 10 }}>
                      週次 ROAS
                    </div>
                    <svg width={CW} height={CH} style={{ overflow: "visible" }}>
                      <line x1={50} y1={py(2)} x2={CW - 50} y2={py(2)} stroke={LC.ink3} strokeWidth={2} strokeDasharray="7 9" opacity={0.5} />
                      {DATA.map((_, i) => (
                        <text key={i} x={px(i)} y={CH - 8} textAnchor="middle" fontFamily={FONT_MONO} fontSize={17} fill={LC.ink3}>
                          W{i + 1}
                        </text>
                      ))}
                      <path d={lpath} fill="none" stroke={LC.blue} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
                      <circle cx={px(2)} cy={py(1.6)} r={10} fill={LC.amber} stroke="#fff" strokeWidth={4} opacity={clamp(frame, [858, 870], [0, 1])} />
                      <text x={px(3)} y={py(2.0) - 24} textAnchor="middle" fontSize={21} fill={LC.green} opacity={clamp(frame, [876, 890], [0, 1])}>
                        自動換素材，救回來
                      </text>
                      <g opacity={Math.min(1, endPop * 1.6)}>
                        <circle cx={px(5)} cy={py(2.3)} r={10 * (0.3 + endPop * 0.7)} fill={LC.blue} stroke="#fff" strokeWidth={4} />
                        <text x={px(5)} y={py(2.3) - 22} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={600} fontSize={28} fill={LC.ink}>
                          2.3
                        </text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 游標演出（座標相對整個視窗） */}
          <Cursor
            ways={[
              { t: 24, x: 1310, y: 500 },
              { t: 46, x: 870, y: 338 },
              { t: 54, x: 870, y: 338, click: true },
              { t: 140, x: 1340, y: 452 },
              { t: 160, x: 1400, y: 452, click: true },
            ]}
            hideAfter={196}
          />
          <Cursor
            ways={[
              { t: 668, x: 1230, y: 530 },
              { t: 702, x: 1396, y: 462 },
              { t: 712, x: 1396, y: 462, click: true },
            ]}
            hideAfter={752}
          />
        </div>
      </div>
    </Page>
  );
};

/* ---------- M8 收尾 ---------- */
const M8: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [214, 240], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, opacity: fadeOut }}>
        <div style={{ display: "flex", gap: 20 }}>
          {["新品上市", "雙 11 大檔", "每一天的投放"].map((t, i) => (
            <Pop key={t} from={6 + i * 12} damping={11}>
              <span style={{ fontSize: 28, color: LC.ink2, border: `2px solid ${LC.border}`, background: LC.card, borderRadius: 999, padding: "12px 32px", display: "inline-block" }}>
                {t}
              </span>
            </Pop>
          ))}
        </div>
        <MaskReveal from={54}>
          <div style={{ fontSize: 64, fontWeight: 900 }}>花錢之前，先知道結果。</div>
        </MaskReveal>
        <Wordmark from={96} size={72} />
        <Pop from={132}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 20, letterSpacing: "0.16em", color: LC.ink3 }}>
            cacaFly GROUP · TAIWAN
          </div>
        </Pop>
      </div>
    </Page>
  );
};

export const ForesightMinute: React.FC = () => (
  <AbsoluteFill style={{ background: LC.bg }}>
    <Audio src={staticFile("music-minute.wav")} />
    <Series>
      <Series.Sequence durationInFrames={105}><M1 /></Series.Sequence>
      <Series.Sequence durationInFrames={135}><M2 /></Series.Sequence>
      <Series.Sequence durationInFrames={300}><M3 /></Series.Sequence>
      <Series.Sequence durationInFrames={1020}><M4to7 /></Series.Sequence>
      <Series.Sequence durationInFrames={240}><M8 /></Series.Sequence>
    </Series>
  </AbsoluteFill>
);
