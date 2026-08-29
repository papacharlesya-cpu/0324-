/*
 * Foresight teaser 電影預告片級配樂合成器 v2（純 Node、無相依套件）
 * 產出 public/music.wav：48kHz 16-bit 立體聲，84.5 秒
 *
 * Trailer 結構（對齊影片場景）：
 *   0.0  S1  低頻 drone + 鋼琴動機 + 時鐘滴答
 *   4.6  S2  boom！弦樂 ostinato 進場、太鼓 1/3 拍
 *  13.2  S3  boom！和聲 Am-F-Dm-E 循環、上八度弦樂
 *  22.8  S4  boom！太鼓加倍、backbeat 軍鼓
 *  30.4  S5  第一波高潮
 *  38.2       ── 全部抽掉：只剩滴答 + riser（The Drop）──
 *  40.0  D1  boom！律動全開，braam 打點每個 demo 場景
 *  66.8  D4  升 key 小三度（Cm-Ab-Fm-G）、太鼓加速 4分→8分→16分
 *  76.4  S7  硬切靜音 0.15s → 巨型 boom + 最長 braam、鋼琴動機回歸、尾奏
 */
const fs = require("fs");
const path = require("path");

const SR = 48000;
const DUR = 84.5;
const N = Math.round(SR * DUR);
const BEAT = 0.6; // 100 BPM
const TWO_PI = Math.PI * 2;
const at = (sec) => Math.max(0, Math.min(N, Math.round(sec * SR)));
const n2f = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* 乾聲 bus 與殘響 send bus（各自立體聲） */
const dryL = new Float64Array(N);
const dryR = new Float64Array(N);
const wetL = new Float64Array(N);
const wetR = new Float64Array(N);

function mix(i, l, r, send) {
  dryL[i] += l;
  dryR[i] += r;
  wetL[i] += l * send;
  wetR[i] += r * send;
}

/* ---------- 樂器 ---------- */

/* 低頻 boom：60→28Hz 掃頻 + 長衰減，段落標點 */
function boom(sec, level, len = 2.2) {
  const s = at(sec);
  const L = Math.round(len * SR);
  let ph = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const f = 28 + 32 * Math.exp(-t / 0.09);
    ph += (TWO_PI * f) / SR;
    const env = Math.exp(-t / (len * 0.32));
    const v = Math.sin(ph) * env * level * 0.85;
    // 前 30ms 加一點 click 讓打擊點清楚
    const click = t < 0.03 ? (Math.random() * 2 - 1) * (1 - t / 0.03) * level * 0.25 : 0;
    mix(i, v + click, v + click, 0.55);
  }
}

/* Braam：7 層失諧鋸齒過 tanh 失真，慢起音、濾波漸開 */
function braam(sec, rootMidi, level, len = 2.8) {
  const s = at(sec);
  const L = Math.round(len * SR);
  const f0 = n2f(rootMidi);
  const dets = [-0.012, -0.007, -0.003, 0, 0.003, 0.007, 0.012];
  for (const [chan, sign] of [[0, -1], [1, 1]]) {
    let lp = 0;
    const phases = dets.map(() => Math.random());
    for (let i = s, k = 0; k < L && i < N; i++, k++) {
      const t = k / SR;
      const atk = Math.min(1, t / 0.7);
      const rel = t > len - 0.9 ? Math.max(0, (len - t) / 0.9) : 1;
      let v = 0;
      for (let d = 0; d < dets.length; d++) {
        const f = f0 * (1 + dets[d] * (1 + 0.2 * sign));
        phases[d] += f / SR;
        v += 2 * (phases[d] - Math.floor(phases[d])) - 1;
      }
      v = Math.tanh(v * 0.9);
      const cut = 0.03 + 0.12 * atk; // 濾波隨起音打開
      lp += cut * (v - lp);
      const out = lp * atk * rel * level * 0.52;
      if (chan === 0) mix(i, out, out * 0.4, 0.5);
      else mix(i, 0, out * 0.6, 0.5);
    }
  }
}

/* 弦樂 ostinato：5 層失諧鋸齒、8ms 起音、斷奏 */
function stacc(sec, midi, level, gate = 0.11) {
  const s = at(sec);
  const L = Math.round((gate + 0.06) * SR);
  const f0 = n2f(midi);
  const dets = [-0.006, -0.003, 0, 0.003, 0.006];
  let lpL = 0;
  let lpR = 0;
  const phases = dets.map(() => Math.random());
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const atk = Math.min(1, t / 0.008);
    const rel = t > gate ? Math.exp(-(t - gate) / 0.03) : 1;
    let v = 0;
    for (let d = 0; d < dets.length; d++) {
      phases[d] += (f0 * (1 + dets[d])) / SR;
      v += 2 * (phases[d] - Math.floor(phases[d])) - 1;
    }
    v /= dets.length;
    lpL += 0.18 * (v - lpL);
    lpR += 0.16 * (v - lpR);
    const e = atk * rel * level * 0.30;
    mix(i, lpL * e, lpR * e * 0.9, 0.22);
  }
}

/* 太鼓：厚 kick + 噪音皮聲 */
function taiko(sec, level) {
  const s = at(sec);
  const L = Math.round(0.45 * SR);
  let ph = 0;
  let lp = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const f = 48 + 70 * Math.exp(-t / 0.05);
    ph += (TWO_PI * f) / SR;
    lp += 0.25 * ((Math.random() * 2 - 1) - lp);
    const skin = lp * Math.exp(-t / 0.03) * 0.5;
    const env = Math.exp(-t / 0.16);
    const v = (Math.sin(ph) + skin) * env * level * 0.6;
    mix(i, v, v, 0.3);
  }
}

/* 軍鼓（backbeat）：帶通噪音短爆 */
function snare(sec, level) {
  const s = at(sec);
  const L = Math.round(0.22 * SR);
  let bp = 0;
  let lp = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const n = Math.random() * 2 - 1;
    lp += 0.35 * (n - lp);
    bp = n - lp;
    const env = Math.exp(-t / 0.055);
    const v = bp * env * level * 0.4;
    mix(i, v * 0.9, v, 0.35);
  }
}

/* 時鐘滴答：高頻短 click */
function tick(sec, level) {
  const s = at(sec);
  const L = Math.round(0.03 * SR);
  let hp = 0;
  let prev = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const n = Math.random() * 2 - 1;
    hp = n - prev;
    prev = n;
    const env = Math.exp(-k / (0.006 * SR));
    const v = hp * env * level * 0.3;
    mix(i, v * (k % 2 ? 1 : 0.6), v * (k % 2 ? 0.6 : 1), 0.4);
  }
}

/* 鋼琴動機：帶不諧和度的鐘形音，情緒錨點 */
function piano(sec, midi, level, len = 2.2) {
  const s = at(sec);
  const L = Math.round(len * SR);
  const f0 = n2f(midi);
  const partials = [
    [1, 1],
    [2, 0.45],
    [3, 0.22],
    [4.2, 0.08],
  ];
  const ph = partials.map(() => Math.random() * TWO_PI);
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    let v = 0;
    for (let p = 0; p < partials.length; p++) {
      const [h, a] = partials[p];
      v += Math.sin((TWO_PI * f0 * h * k) / SR + ph[p]) * a * Math.exp(-t * (1.4 + h));
    }
    const e = level * 0.2;
    mix(i, v * e * 0.9, v * e, 0.5);
  }
}

/* 持續低音 drone */
function drone(sec, len, midi, level) {
  const s = at(sec);
  const L = Math.round(len * SR);
  const f0 = n2f(midi);
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const edge = Math.min(1, t / 1.5, (len - t) / 1.5);
    if (edge <= 0) continue;
    const v =
      (Math.sin((TWO_PI * f0 * k) / SR) + 0.5 * Math.sin((TWO_PI * f0 * 0.5 * k) / SR)) *
      edge *
      level *
      0.14;
    mix(i, v, v, 0.25);
  }
}

/* 有音高的 riser：噪音 + 上掃正弦 */
function riser(endSec, len, level) {
  const e = at(endSec);
  const s = at(endSec - len);
  let lpL = 0;
  let lpR = 0;
  let ph = 0;
  for (let i = s; i < e && i < N; i++) {
    const p = (i - s) / (e - s);
    const cut = 0.015 + 0.35 * p * p;
    lpL += cut * ((Math.random() * 2 - 1) - lpL);
    lpR += cut * ((Math.random() * 2 - 1) - lpR);
    const f = 110 * Math.pow(2, p * 1.0); // 上掃一個八度
    ph += (TWO_PI * f) / SR;
    const tone = Math.sin(ph) * 0.35;
    const env = p * p * level * 0.5;
    mix(i, (lpL + tone) * env, (lpR + tone) * env, 0.45);
  }
}

/* ---------- 和聲設計 ---------- */
// 主循環 Am-F-Dm-E（E 大和弦 = 和聲小調屬和弦，緊張感來源）
const MAIN = [
  { root: 45, chord: [45, 57, 60, 64] }, // Am
  { root: 41, chord: [41, 53, 57, 60] }, // F
  { root: 38, chord: [38, 50, 53, 57] }, // Dm
  { root: 40, chord: [40, 52, 56, 59] }, // E（G# 升音）
];
// 結尾升小三度 Cm-Ab-Fm-G
const LIFT = [
  { root: 48, chord: [48, 60, 63, 67] }, // Cm
  { root: 44, chord: [44, 56, 60, 63] }, // Ab
  { root: 41, chord: [41, 53, 56, 60] }, // Fm
  { root: 43, chord: [43, 55, 59, 62] }, // G
];
const chordAt = (t) => {
  const prog = t >= 66.8 ? LIFT : MAIN;
  const t0 = t >= 66.8 ? 66.8 : 4.8;
  return prog[Math.floor((t - t0) / 2.4) % 4]; // 一小節一個和弦
};

/* ---------- 編曲 ---------- */

// ── S1 序場（0–4.6）
drone(0, 5.4, 33, 1.0); // A1 drone
piano(0.5, 69, 1.0); // A4
piano(1.4, 72, 0.9); // C5
piano(2.3, 76, 1.0); // E5
piano(3.2, 74, 0.8); // D5
for (let t = 0.3; t < 4.3; t += BEAT / 2) tick(t, 0.5);
riser(4.6, 2.8, 0.7);

// ── 段落 boom
for (const [t, lv] of [
  [4.6, 0.85],
  [13.2, 0.9],
  [22.8, 1.0],
  [30.4, 1.0],
  [40.0, 1.1],
  [47.6, 0.8],
  [57.2, 1.0],
  [66.8, 1.1],
]) {
  boom(t, lv);
}

// ── Braam 打點（音高跟當下和弦根音，低八度）
for (const [t, lv, len] of [
  [8.6, 0.6, 2.6],
  [18.0, 0.7, 2.6],
  [26.4, 0.8, 2.8],
  [33.0, 0.9, 3.0],
  [40.0, 1.0, 3.2],
  [47.6, 0.8, 2.6],
  [57.2, 0.95, 3.0],
  [61.8, 0.7, 2.4],
  [66.8, 1.0, 3.2],
  [71.6, 0.9, 2.8],
]) {
  const c = chordAt(t);
  braam(t, c.root - 12, lv, len);
}

// ── 弦樂 ostinato：16 分，音型 [根,8度,5度,8度]，drop 期間停
const OSTI = [0, 12, 7, 12];
for (let t = 4.8; t < 76.3; t += 0.15) {
  if (t >= 38.2 && t < 40.0) continue; // The Drop
  const c = chordAt(t);
  const step = Math.round((t - 4.8) / 0.15);
  const base = c.root + 12; // 中音域
  const midi = base + OSTI[step % 4];
  let lvl = t < 13.2 ? 0.55 : t < 30.4 ? 0.75 : t < 40 ? 0.9 : t < 66.8 ? 0.85 : 1.0;
  stacc(t, midi, lvl);
  // 22.8 之後加上八度第二層
  if (t >= 22.8 && step % 2 === 0) stacc(t, midi + 12, lvl * 0.5, 0.09);
}

// ── 長音和聲層（弦樂 pad 感：把斷奏改長 gate 疊在小節頭）
for (let t = 13.2; t < 76.3; t += 2.4) {
  if (t >= 38.2 && t < 40.0) continue;
  const c = chordAt(t);
  for (const m of c.chord.slice(1)) stacc(t, m, 0.75, 2.1);
}

// ── Sub bass：每小節跟根音，填滿低頻
for (let t = 4.8; t < 76.3; t += 2.4) {
  if (t >= 38.2 && t < 40.0) continue;
  const c = chordAt(t);
  drone(t, 2.5, c.root - 12, t < 22.8 ? 0.9 : 1.3);
}

// ── 打擊
// S2：太鼓 1、3 拍
for (let t = 4.8; t < 22.8; t += BEAT * 2) taiko(t, 0.6);
// S4 起：太鼓每拍 + backbeat 軍鼓
for (let t = 22.8; t < 38.2; t += BEAT) taiko(t, 0.7);
for (let t = 22.8 + BEAT; t < 38.2; t += BEAT * 2) snare(t, 0.5);
// demo 段：全開
for (let t = 40.0; t < 71.0; t += BEAT) taiko(t, 0.8);
for (let t = 40.0 + BEAT; t < 71.0; t += BEAT * 2) snare(t, 0.6);
for (let t = 40.0; t < 71.0; t += BEAT / 2) tick(t, 0.25);
// 終盤加速：4 分 → 8 分 → 16 分
for (let t = 71.0; t < 73.4; t += BEAT) taiko(t, 0.85);
for (let t = 73.4; t < 75.2; t += BEAT / 2) taiko(t, 0.9);
for (let t = 75.2; t < 76.35; t += BEAT / 4) taiko(t, 1.0);

// ── The Drop（38.2–40）：只剩滴答與 riser
for (let t = 38.3; t < 39.9; t += BEAT / 2) tick(t, 0.7);
riser(40.0, 3.2, 0.9);

// ── 終盤大 riser
riser(76.4, 3.6, 1.15);

// ── S7 揭示（76.4 硬切 → 76.55 巨擊）
boom(76.55, 1.4, 3.5);
braam(76.6, 33 - 0 + 12, 1.1, 4.5); // A2
drone(76.6, 7.4, 33, 1.4);
// 鋼琴動機回歸（放慢、大殘響）
piano(78.2, 69, 1.1, 3.0);
piano(79.4, 72, 1.0, 3.0);
piano(80.6, 76, 1.2, 3.5);

/* ---------- 硬切靜音（76.38–76.53）：揭示前的抽真空 ---------- */
const cutS = at(76.38);
const cutE = at(76.53);

/* ---------- Schroeder 殘響（4 comb + 2 allpass / 聲道） ---------- */
function reverb(input, combTunings) {
  const out = new Float64Array(N);
  const combs = combTunings.map((len) => ({
    buf: new Float64Array(len),
    idx: 0,
    filt: 0,
  }));
  const FB = 0.86;
  const DAMP = 0.28;
  const apTunings = [225, 556].map((x) => Math.round((x * SR) / 44100));
  const aps = apTunings.map((len) => ({ buf: new Float64Array(len), idx: 0 }));
  for (let i = 0; i < N; i++) {
    const x = input[i];
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.idx];
      c.filt = y * (1 - DAMP) + c.filt * DAMP;
      c.buf[c.idx] = x + c.filt * FB;
      c.idx = (c.idx + 1) % c.buf.length;
      acc += y;
    }
    let v = acc * 0.25;
    for (const a of aps) {
      const y = a.buf[a.idx];
      const z = v + y * 0.5;
      a.buf[a.idx] = z;
      a.idx = (a.idx + 1) % a.buf.length;
      v = y - z * 0.5;
    }
    out[i] = v;
  }
  return out;
}
const combL = [1557, 1617, 1491, 1422].map((x) => Math.round((x * SR) / 44100));
const combR = [1580, 1641, 1514, 1445].map((x) => Math.round((x * SR) / 44100));
console.log("rendering reverb…");
const revL = reverb(wetL, combL);
const revR = reverb(wetR, combR);

/* ---------- 混音、母帶 ---------- */
const outL = new Float64Array(N);
const outR = new Float64Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  let l = dryL[i] + revL[i] * 0.9;
  let r = dryR[i] + revR[i] * 0.9;
  if (i >= cutS && i < cutE) {
    l = 0;
    r = 0;
  }
  l = Math.tanh(l * 1.2);
  r = Math.tanh(r * 1.2);
  outL[i] = l;
  outR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const norm = 0.92 / peak;
const fadeIn = at(0.04);
const fadeOutStart = at(82.6);
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > fadeOutStart) g *= Math.max(0, 1 - (i - fadeOutStart) / (N - fadeOutStart));
  outL[i] *= g;
  outR[i] *= g;
}

/* ---------- 檢查：每 2.5 秒 RMS（要看得到 38.2 的 drop 與 76.4 的硬切） ---------- */
for (let w = 0; w < DUR; w += 2.5) {
  const s = at(w);
  const e = at(Math.min(w + 2.5, DUR));
  let sum = 0;
  for (let i = s; i < e; i++) sum += outL[i] * outL[i] + outR[i] * outR[i];
  const rms = Math.sqrt(sum / (2 * (e - s)));
  console.log(`${w.toFixed(1).padStart(5)}s  RMS ${rms.toFixed(3)}  ${"#".repeat(Math.round(rms * 110))}`);
}

/* ---------- 寫 WAV ---------- */
const bytes = Buffer.alloc(44 + N * 4);
bytes.write("RIFF", 0);
bytes.writeUInt32LE(36 + N * 4, 4);
bytes.write("WAVE", 8);
bytes.write("fmt ", 12);
bytes.writeUInt32LE(16, 16);
bytes.writeUInt16LE(1, 20);
bytes.writeUInt16LE(2, 22);
bytes.writeUInt32LE(SR, 24);
bytes.writeUInt32LE(SR * 4, 28);
bytes.writeUInt16LE(4, 32);
bytes.writeUInt16LE(16, 34);
bytes.write("data", 36);
bytes.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[i])) * 32767), 44 + i * 4);
  bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[i])) * 32767), 46 + i * 4);
}
const out = path.join(__dirname, "..", "public", "music.wav");
fs.writeFileSync(out, bytes);
console.log(`\nWrote ${out} (${(bytes.length / 1e6).toFixed(1)} MB, peak norm ${norm.toFixed(2)})`);
