import { loadFont as loadNoto } from "@remotion/google-fonts/NotoSansTC";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const noto = loadNoto("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "chinese-traditional"],
});
const mono = loadMono("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

export const FONT_TC = noto.fontFamily;
export const FONT_MONO = mono.fontFamily;

export const C = {
  ground: "#060A14",
  panel: "#0C1322",
  hairline: "#1B2438",
  ink: "#EEF3FB",
  ink2: "#8B96AC",
  ink3: "#57627A",
  data: "#5590FF",
  judge: "#C97F12",
  judgeText: "#E8A83C",
  exec: "#17A873",
  dataSoft: "rgba(85,144,255,.16)",
  judgeSoft: "rgba(201,127,18,.16)",
  execSoft: "rgba(23,168,115,.16)",
} as const;

export const FPS = 30;
export const W = 1920;
export const H = 1080;

/* 各場景長度（frames）與轉場重疊 */
export const DUR = {
  s1: 150,
  s2: 270,
  s3: 300,
  s4: 240,
  s5: 300,
  d1: 150,
  d2: 210,
  d3: 180,
  d4: 210,
  s7: 240,
  fade: 12,
} as const;

export const TOTAL =
  DUR.s1 +
  DUR.s2 +
  DUR.s3 +
  DUR.s4 +
  DUR.s5 +
  DUR.d1 +
  DUR.d2 +
  DUR.d3 +
  DUR.d4 +
  DUR.s7 -
  9 * DUR.fade;
