/*
 * Foresight teaser 原創配樂合成器（純 Node、無相依套件）
 * 產出 public/music.wav：48kHz 16-bit 立體聲，84.5 秒
 * 結構對齊影片場景：
 *   0.0  S1 開場（暗湧 drone）
 *   4.6  S2 資料規模（和弦、脈衝進場）
 *  13.2  S3 因果（琶音進場）
 *  22.8  S4 十五年（心跳鼓點）
 *  30.4  S5 引擎（拉升、閃爍高音）
 *  40.0  D1-D4 demo（four-on-floor 律動）
 *  76.4  S7 揭示（全收，重擊 + 長音，尾奏淡出）
 */
const fs = require("fs");
const path = require("path");

const SR = 48000;
const DUR = 84.5;
const N = Math.round(SR * DUR);
const BEAT = 0.6; // 100 BPM

const padL = new Float64Array(N);
const padR = new Float64Array(N);
const arpL = new Float64Array(N);
const arpR = new Float64Array(N);
const drmL = new Float64Array(N);
const drmR = new Float64Array(N);
const fxL = new Float64Array(N);
const fxR = new Float64Array(N);
const subM = new Float64Array(N);

const TWO_PI = Math.PI * 2;
const at = (sec) => Math.max(0, Math.min(N, Math.round(sec * SR)));

/* ---------- 和聲 ---------- */
// [root, voicing...]（Hz）
const CH = {
  Am: { sub: 55.0, notes: [110.0, 220.0, 261.63, 329.63] },
  F: { sub: 43.65, notes: [87.31, 174.61, 220.0, 261.63] },
  C: { sub: 65.41, notes: [130.81, 196.0, 261.63, 329.63] },
  G: { sub: 49.0, notes: [98.0, 196.0, 246.94, 293.66] },
};
const PROG = ["Am", "F", "C", "G"];

/* 柔和鋸齒 pad：6 個諧波 1/k^1.6，雙層微失諧做立體寬度 */
function pad(startSec, lenSec, chord, level) {
  const s = at(startSec);
  const e = at(startSec + lenSec + 1.6); // 含 release
  const atk = 1.2 * SR;
  const rel = 1.5 * SR;
  const bodyEnd = at(startSec + lenSec) - s;
  for (const f of CH[chord].notes) {
    for (const [buf, det] of [
      [padL, 1 - 0.0016],
      [padR, 1 + 0.0016],
    ]) {
      const ph = Math.random() * TWO_PI;
      const w = (TWO_PI * f * det) / SR;
      for (let i = s; i < e && i < N; i++) {
        const k = i - s;
        let env = k < atk ? k / atk : 1;
        if (k > bodyEnd) env *= Math.max(0, 1 - (k - bodyEnd) / rel);
        if (env <= 0) continue;
        let v = 0;
        for (let h = 1; h <= 6; h++)
          v += Math.sin(w * h * i + ph * h) / Math.pow(h, 1.6);
        buf[i] += v * env * level * 0.055;
      }
    }
  }
}

/* Sub 正弦，跟和弦根音 */
function sub(startSec, lenSec, freq, level) {
  const s = at(startSec);
  const e = at(startSec + lenSec + 0.6);
  const atk = 0.4 * SR;
  const bodyEnd = at(startSec + lenSec) - s;
  const rel = 0.6 * SR;
  const w = (TWO_PI * freq) / SR;
  for (let i = s; i < e && i < N; i++) {
    const k = i - s;
    let env = k < atk ? k / atk : 1;
    if (k > bodyEnd) env *= Math.max(0, 1 - (k - bodyEnd) / rel);
    subM[i] += Math.sin(w * i) * env * level * 0.16;
  }
}

/* 琶音 pluck：基頻 + 2 倍頻，指數衰減，左右交替 */
function pluck(startSec, freq, level, panRight) {
  const s = at(startSec);
  const len = Math.round(0.22 * SR);
  const w = (TWO_PI * freq) / SR;
  const main = panRight ? arpR : arpL;
  const side = panRight ? arpL : arpR;
  for (let i = s, k = 0; k < len && i < N; i++, k++) {
    const env = Math.exp(-k / (0.05 * SR));
    const v =
      (Math.sin(w * i) + 0.4 * Math.sin(2 * w * i)) * env * level * 0.14;
    main[i] += v;
    side[i] += v * 0.45;
  }
}

/* 鼓：正弦掃頻 kick */
function kick(startSec, level) {
  const s = at(startSec);
  const len = Math.round(0.3 * SR);
  let phase = 0;
  for (let i = s, k = 0; k < len && i < N; i++, k++) {
    const t = k / SR;
    const f = 42 + 90 * Math.exp(-t / 0.045);
    phase += (TWO_PI * f) / SR;
    const env = Math.exp(-t / 0.11);
    const v = Math.sin(phase) * env * level * 0.5;
    drmL[i] += v;
    drmR[i] += v;
  }
}

/* 噪音 riser：結束在 endSec，最後帶一點收束 */
function riser(endSec, lenSec, level) {
  const e = at(endSec);
  const s = at(endSec - lenSec);
  let lpL = 0;
  let lpR = 0;
  for (let i = s; i < e && i < N; i++) {
    const p = (i - s) / (e - s);
    const cutoff = 0.02 + 0.3 * p * p; // 濾波隨進度打開
    lpL += cutoff * ((Math.random() * 2 - 1) - lpL);
    lpR += cutoff * ((Math.random() * 2 - 1) - lpR);
    const env = p * p * level * 0.5;
    fxL[i] += lpL * env;
    fxR[i] += lpR * env;
  }
}

/* 重擊：thump + 噪音尾 + 低頻長音 */
function impact(startSec, level) {
  kick(startSec, level * 1.6);
  const s = at(startSec);
  const len = Math.round(1.6 * SR);
  let lpL = 0;
  let lpR = 0;
  for (let i = s, k = 0; k < len && i < N; i++, k++) {
    const t = k / SR;
    const env = Math.exp(-t / 0.4) * level * 0.3;
    lpL += 0.08 * ((Math.random() * 2 - 1) - lpL);
    lpR += 0.08 * ((Math.random() * 2 - 1) - lpR);
    fxL[i] += lpL * env;
    fxR[i] += lpR * env;
  }
}

/* 高音閃爍：五度泛音慢速顫音 */
function shimmer(startSec, lenSec, freqs, level) {
  const s = at(startSec);
  const e = at(startSec + lenSec);
  for (const f of freqs) {
    const w = (TWO_PI * f) / SR;
    const trem = TWO_PI / (SR * 1.9); // ~0.53Hz 顫音
    const ph = Math.random() * TWO_PI;
    for (let i = s; i < e && i < N; i++) {
      const k = i - s;
      const edge = Math.min(1, k / (2 * SR), (e - i) / (2 * SR));
      const v =
        Math.sin(w * i + ph) *
        (0.6 + 0.4 * Math.sin(trem * i)) *
        edge *
        level *
        0.03;
      padL[i] += v * 0.8;
      padR[i] += v;
    }
  }
}

/* ---------- 編曲 ---------- */
// S1：暗湧
pad(0, 4.8, "Am", 0.5);
sub(0, 4.6, 55.0, 0.7);
riser(4.6, 2.4, 0.5);

// 和弦循環 4.8s 一個，從 4.8 到 76.8
for (let i = 0; i < 15; i++) {
  const t = 4.8 + i * 4.8;
  const name = PROG[i % 4];
  const lvl = t < 13.2 ? 0.75 : t < 30.4 ? 0.9 : 1.0;
  pad(t, 4.8, name, lvl);
  sub(t, 4.8, CH[name].sub, t < 22.8 ? 0.8 : 1.0);
}

// S2：8 分音符單音脈衝（根音高八度）
for (let t = 4.8; t < 13.2; t += BEAT / 2) {
  const chord = CH[PROG[Math.floor((t - 4.8) / 4.8) % 4]];
  pluck(t, chord.notes[0] * 2, 0.4, Math.round(t / (BEAT / 2)) % 2 === 0);
}

// S3 起：16 分琶音
const ARP_PATTERN = [0, 1, 2, 3, 2, 1];
for (let t = 13.2; t < 76.35; t += 0.15) {
  const idx = Math.floor((t - 4.8) / 4.8) % 4;
  const chord = CH[PROG[idx]];
  const step = Math.round((t - 13.2) / 0.15);
  const note = chord.notes[ARP_PATTERN[step % 6]] * 2;
  const lvl = t < 22.8 ? 0.42 : t < 40 ? 0.58 : 0.7;
  // demo 段每兩拍留一個 16 分空拍，呼吸感
  if (t >= 40 && step % 8 === 7) continue;
  pluck(t, note, lvl, step % 2 === 0);
}

// S4-S5：心跳（1、3 拍）
for (let t = 22.8; t < 40; t += BEAT * 2) kick(t, 0.42);
// demo 段：four-on-floor
for (let t = 40.2; t < 76.2; t += BEAT) kick(t, 0.52);

// S5 與 D4 的高音閃爍（A 小調五音上兩個八度）
shimmer(30.4, 9.4, [880, 1318.5], 1.0);
shimmer(66.8, 9.4, [880, 1046.5], 0.8);

// 結構 riser
riser(40.0, 2.6, 0.65);
riser(76.4, 3.0, 1.0);

// S7：重擊 + 終止長音
impact(76.5, 1.0);
pad(76.6, 6.2, "Am", 1.1);
sub(76.6, 6.4, 55.0, 1.2);

/* ---------- 琶音延遲效果（0.45s 回授） ---------- */
const dSamp = Math.round(0.45 * SR);
for (const [src, dst] of [
  [arpL, arpR],
  [arpR, arpL],
]) {
  for (let i = 0; i < N - dSamp; i++) {
    dst[i + dSamp] += src[i] * 0.3;
  }
}

/* ---------- Sidechain：鼓點時 pad/arp 閃避 ---------- */
function duckGain(tSec) {
  let region = null;
  if (tSec >= 22.8 && tSec < 40) region = [22.8, BEAT * 2];
  else if (tSec >= 40.2 && tSec < 76.2) region = [40.2, BEAT];
  if (!region) return 1;
  const phase = (tSec - region[0]) % region[1];
  return 1 - 0.28 * Math.exp(-phase / 0.1);
}

/* ---------- 混音、軟限幅、正規化 ---------- */
const outL = new Float64Array(N);
const outR = new Float64Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = duckGain(i / SR);
  let l = (padL[i] + arpL[i]) * g + drmL[i] + fxL[i] + subM[i];
  let r = (padR[i] + arpR[i]) * g + drmR[i] + fxR[i] + subM[i];
  l = Math.tanh(l * 1.15);
  r = Math.tanh(r * 1.15);
  outL[i] = l;
  outR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const norm = 0.89 / peak;
const fadeIn = at(0.05);
const fadeOutStart = at(83.0);
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > fadeOutStart) g *= Math.max(0, 1 - (i - fadeOutStart) / (N - fadeOutStart));
  outL[i] *= g;
  outR[i] *= g;
}

/* ---------- 檢查：每 5 秒 RMS ---------- */
for (let w = 0; w < DUR; w += 5) {
  const s = at(w);
  const e = at(Math.min(w + 5, DUR));
  let sum = 0;
  for (let i = s; i < e; i++) sum += outL[i] * outL[i] + outR[i] * outR[i];
  const rms = Math.sqrt(sum / (2 * (e - s)));
  console.log(`${String(w).padStart(4)}s  RMS ${rms.toFixed(3)}  ${"#".repeat(Math.round(rms * 120))}`);
}

/* ---------- 寫 WAV（16-bit PCM） ---------- */
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
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, bytes);
console.log(`\nWrote ${out} (${(bytes.length / 1e6).toFixed(1)} MB, peak norm ${norm.toFixed(2)})`);
