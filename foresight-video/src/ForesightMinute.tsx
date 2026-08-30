import React from "react";
import {
  AbsoluteFill,
  Easing,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { FONT_MONO, FONT_TC } from "./theme";
import { TypeText } from "./scenes/demo";

/* 一分鐘版：Google 產品片文法——白底、圓角卡片、快切、輕快節奏 */

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

/* 進場：上滑 + 淡入 */
const Rise: React.FC<{
  from: number;
  children: React.ReactNode;
  dist?: number;
}> = ({ from, children, dist = 30 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        opacity: clamp(frame, [from, from + 14], [0, 1]),
        translate: `0px ${clamp(frame, [from, from + 16], [dist, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

const StepChip: React.FC<{ from: number; children: string }> = ({ from, children }) => {
  const frame = useCurrentFrame();
  return (
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
        opacity: clamp(frame, [from, from + 12], [0, 1]),
        translate: `0px ${clamp(frame, [from, from + 14], [20, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

const Wordmark: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <span
    style={{
      fontFamily: FONT_MONO,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "0.12em",
      backgroundImage: `linear-gradient(100deg, ${LC.ink} 25%, ${LC.blue} 80%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
    }}
  >
    FORESIGHT
  </span>
);

/* 產品視窗（白卡版） */
const LWindow: React.FC<{
  from: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
}> = ({ from, width = 1360, height = 600, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width,
        height,
        background: LC.card,
        border: `2px solid ${LC.border}`,
        borderRadius: 26,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 70px rgba(23,32,46,.10)",
        opacity: clamp(frame, [from, from + 14], [0, 1]),
        translate: `0px ${clamp(frame, [from, from + 16], [36, 0])}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: `1px solid ${LC.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: LC.blue }} />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: LC.ink2,
            }}
          >
            FORESIGHT
          </span>
        </div>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 16,
            letterSpacing: "0.16em",
            color: LC.ink3,
            border: `1px solid ${LC.border}`,
            borderRadius: 999,
            padding: "5px 18px",
          }}
        >
          DEMO · 模擬畫面
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
    </div>
  );
};

/* ---------- M1 認識一下 ---------- */
const M1: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: LC.blue,
            scale: String(clamp(frame, [4, 22], [0, 1], Easing.bezier(0.34, 1.56, 0.64, 1))),
          }}
        />
        <Rise from={18}>
          <div style={{ fontSize: 44, color: LC.ink2 }}>認識一下</div>
        </Rise>
        <Rise from={34}>
          <Wordmark size={150} />
        </Rise>
      </div>
    </Page>
  );
};

/* ---------- M2 一句定義 ---------- */
const M2: React.FC = () => (
  <Page>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, textAlign: "center" }}>
      <Rise from={4}>
        <div style={{ fontSize: 60, fontWeight: 700 }}>cacaFly 的廣告 AI。</div>
      </Rise>
      <Rise from={36}>
        <div style={{ fontSize: 60, fontWeight: 700, color: LC.blue }}>會想，也會動手。</div>
      </Rise>
    </div>
  </Page>
);

/* ---------- M3 三張事實卡 ---------- */
const FACTS = [
  { big: "3 億", sub: "筆廣告數據／每月", line: "它全看過。" },
  { big: "每一次", sub: "調整與結果", line: "它都記得。" },
  { big: "15 年", sub: "老手的判斷", line: "都教給它了。" },
];
const M3: React.FC = () => (
  <Page>
    <div style={{ display: "flex", gap: 36 }}>
      {FACTS.map((f, i) => (
        <Rise key={i} from={10 + i * 62} dist={44}>
          <div
            style={{
              width: 420,
              height: 400,
              background: LC.card,
              border: `2px solid ${LC.border}`,
              borderRadius: 26,
              boxShadow: "0 20px 60px rgba(23,32,46,.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 84, fontWeight: 900, color: LC.blue }}>{f.big}</div>
            <div style={{ fontSize: 30, color: LC.ink2 }}>{f.sub}</div>
            <div style={{ fontSize: 38, fontWeight: 700, marginTop: 10 }}>{f.line}</div>
          </div>
        </Rise>
      ))}
    </div>
  </Page>
);

/* ---------- M4 說需求 ---------- */
const M4: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <StepChip from={4}>STEP 1 · 跟它說你要什麼</StepChip>
        <LWindow from={16} height={430}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 56px",
              gap: 28,
            }}
          >
            <div
              style={{
                border: `2px solid ${LC.border}`,
                borderRadius: 18,
                padding: "30px 36px",
                fontSize: 34,
                lineHeight: 1.6,
                minHeight: 120,
                background: LC.bg,
              }}
            >
              <TypeText from={40} cps={22} text="新品上市：膠原蛋白飲，月預算 80 萬，目標 EC 購買。" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#fff",
                  background: LC.blue,
                  borderRadius: 12,
                  padding: "14px 40px",
                  opacity: clamp(frame, [50, 66], [0.4, 1]),
                  boxShadow: `0 0 ${28 * clamp(frame, [176, 190], [0, 1])}px rgba(47,107,255,.45)`,
                }}
              >
                {frame < 182 ? "送出 ▸" : "分析中…"}
              </div>
            </div>
          </div>
        </LWindow>
      </div>
    </Page>
  );
};

/* ---------- M5 預測 ---------- */
const M5: React.FC = () => {
  const frame = useCurrentFrame();
  const x = (roas: number) => 30 + (roas / 3) * 480;
  const grow = clamp(frame, [96, 126], [0, 1]);
  const STEPS = [
    { c: LC.blue, name: "資料層", d: "掃同產業 2.1 億筆紀錄", at: 34 },
    { c: LC.amber, name: "判斷層", d: "套 47 條老手規則", at: 54 },
    { c: LC.green, name: "預測", d: "3.2 秒，答案出來", at: 74 },
  ];
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <StepChip from={4}>STEP 2 · 它先想，再給答案</StepChip>
        <LWindow from={14} height={470}>
          <div style={{ position: "absolute", inset: 0, display: "flex", padding: "44px 56px", gap: 52 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
              {STEPS.map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    opacity: clamp(frame, [s.at, s.at + 12], [0, 1]),
                    translate: `${clamp(frame, [s.at, s.at + 14], [-24, 0])}px 0px`,
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 5, background: s.c, flex: "none" }} />
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 24, color: LC.ink2 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                width: 580,
                border: `2px solid ${LC.border}`,
                borderRadius: 18,
                padding: "30px 36px",
                background: LC.bg,
                opacity: clamp(frame, [84, 100], [0, 1]),
              }}
            >
              <div style={{ fontFamily: FONT_MONO, fontSize: 18, letterSpacing: "0.2em", color: LC.ink3, marginBottom: 18 }}>
                預測 ROAS 區間
              </div>
              <svg width={520} height={150} style={{ overflow: "visible" }}>
                <line x1={x(0)} y1={100} x2={x(3)} y2={100} stroke={LC.border} strokeWidth={3} />
                {[0, 1, 2, 3].map((t) => (
                  <text key={t} x={x(t)} y={134} textAnchor="middle" fontFamily={FONT_MONO} fontSize={18} fill={LC.ink3}>
                    {t === 0 ? "0" : t.toFixed(1)}
                  </text>
                ))}
                <rect x={x(1.6)} y={76} width={(x(2.4) - x(1.6)) * grow} height={48} rx={7} fill="rgba(47,107,255,.15)" stroke={LC.blue} strokeWidth={3} />
                <g opacity={clamp(frame, [130, 146], [0, 1])}>
                  <line x1={x(2)} y1={70} x2={x(2)} y2={130} stroke={LC.blue} strokeWidth={3} />
                  <text x={x(2)} y={46} textAnchor="middle" fontWeight={700} fontSize={28} fill={LC.ink}>
                    預期 2.0
                  </text>
                  <text x={x(1.6)} y={62} textAnchor="middle" fontFamily={FONT_MONO} fontSize={20} fill={LC.ink2}>1.6</text>
                  <text x={x(2.4)} y={62} textAnchor="middle" fontFamily={FONT_MONO} fontSize={20} fill={LC.ink2}>2.4</text>
                </g>
              </svg>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 23,
                  color: LC.ink2,
                  marginTop: 14,
                  opacity: clamp(frame, [156, 172], [0, 1]),
                }}
              >
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: LC.amber, flex: "none" }} />
                第 3 週有素材疲勞風險，先備第二波
              </div>
            </div>
          </div>
        </LWindow>
      </div>
    </Page>
  );
};

/* ---------- M6 執行 + 核准 ---------- */
const M6: React.FC = () => {
  const frame = useCurrentFrame();
  const approveAt = 168; // 對齊 41.8s 的暖和弦
  const LOGS: Array<[string, string]> = [
    ["✓", "建好 Campaign 與 3 組受眾"],
    ["✓", "掛上 6 支素材"],
    ["⏸", "全部暫停，等人點頭"],
  ];
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <StepChip from={4}>STEP 3 · 它動手，你點頭</StepChip>
        <LWindow from={14} height={470}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 64px",
              gap: 24,
            }}
          >
            {LOGS.map(([mark, text], i) => {
              const st = 34 + i * 24;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    fontSize: 32,
                    opacity: clamp(frame, [st, st + 12], [0, 1]),
                    translate: `${clamp(frame, [st, st + 14], [-22, 0])}px 0px`,
                  }}
                >
                  <span style={{ fontFamily: FONT_MONO, color: mark === "⏸" ? LC.amber : LC.green, width: 40, textAlign: "center" }}>
                    {mark}
                  </span>
                  {text}
                </div>
              );
            })}
            <div
              style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                gap: 24,
                border: `2px solid ${frame > approveAt ? LC.green : LC.border}`,
                background: frame > approveAt ? LC.greenSoft : LC.bg,
                borderRadius: 16,
                padding: "24px 36px",
                opacity: clamp(frame, [118, 134], [0, 1]),
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: frame > approveAt ? LC.green : LC.border,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 700,
                  flex: "none",
                  scale: String(
                    1 + 0.16 * clamp(frame, [approveAt, approveAt + 8], [0, 1]) * clamp(frame, [approveAt + 8, approveAt + 20], [1, 0]),
                  ),
                }}
              >
                ✓
              </span>
              <div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>
                  {frame > approveAt ? "核准，開始投放" : "等待核准…"}
                </div>
                <div style={{ fontSize: 23, color: LC.ink2, marginTop: 4 }}>每一筆投放，都有人看過才出手</div>
              </div>
            </div>
          </div>
        </LWindow>
      </div>
    </Page>
  );
};

/* ---------- M7 成效 ---------- */
const M7: React.FC = () => {
  const frame = useCurrentFrame();
  const DATA = [1.4, 1.8, 1.6, 2.0, 2.2, 2.3];
  const CW = 1100;
  const CH = 300;
  const px = (i: number) => 60 + (i / 5) * (CW - 120);
  const py = (v: number) => CH - 40 - ((v - 1) / 1.6) * (CH - 90);
  const path = DATA.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ");
  const draw = clamp(frame, [10, 108], [0, 1]);
  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <StepChip from={2}>STEP 4 · 上線後，它一直盯著</StepChip>
        <LWindow from={8} height={440}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <svg width={CW} height={CH} style={{ overflow: "visible" }}>
              <line x1={60} y1={py(2)} x2={CW - 60} y2={py(2)} stroke={LC.ink3} strokeWidth={2} strokeDasharray="7 9" opacity={0.5} />
              <path d={path} fill="none" stroke={LC.blue} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              <circle cx={px(2)} cy={py(1.6)} r={11} fill={LC.amber} stroke="#fff" strokeWidth={4} opacity={clamp(frame, [42, 54], [0, 1])} />
              <g opacity={clamp(frame, [56, 70], [0, 1])}>
                <text x={px(3)} y={py(2.0) - 26} textAnchor="middle" fontSize={23} fill={LC.green}>
                  自動換素材，救回來
                </text>
              </g>
              <g opacity={clamp(frame, [112, 126], [0, 1])}>
                <circle cx={px(5)} cy={py(2.3)} r={11} fill={LC.blue} stroke="#fff" strokeWidth={4} />
                <text x={px(5)} y={py(2.3) - 24} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={600} fontSize={30} fill={LC.ink}>
                  2.3
                </text>
              </g>
            </svg>
            <div style={{ fontSize: 26, color: LC.ink2, opacity: clamp(frame, [130, 148], [0, 1]) }}>
              6 週 ROAS 2.3，高於預期
            </div>
          </div>
        </LWindow>
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
            <Rise key={t} from={6 + i * 14}>
              <span
                style={{
                  fontSize: 28,
                  color: LC.ink2,
                  border: `2px solid ${LC.border}`,
                  background: LC.card,
                  borderRadius: 999,
                  padding: "12px 32px",
                }}
              >
                {t}
              </span>
            </Rise>
          ))}
        </div>
        <Rise from={54}>
          <div style={{ fontSize: 64, fontWeight: 900 }}>花錢之前，先知道結果。</div>
        </Rise>
        <Rise from={96}>
          <Wordmark size={72} />
        </Rise>
        <Rise from={128}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 20, letterSpacing: "0.16em", color: LC.ink3 }}>
            cacaFly GROUP · TAIWAN
          </div>
        </Rise>
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
      <Series.Sequence durationInFrames={270}><M4 /></Series.Sequence>
      <Series.Sequence durationInFrames={270}><M5 /></Series.Sequence>
      <Series.Sequence durationInFrames={270}><M6 /></Series.Sequence>
      <Series.Sequence durationInFrames={210}><M7 /></Series.Sequence>
      <Series.Sequence durationInFrames={240}><M8 /></Series.Sequence>
    </Series>
  </AbsoluteFill>
);
