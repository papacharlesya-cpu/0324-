/*
 * Foresight teaser 配樂合成器 v3：諾蘭／Zimmer 風格（純 Node、無相依套件）
 * 產出 public/music.wav：48kHz 16-bit 立體聲，84.5 秒
 *
 * 文法：一個絕對穩定的四分音符脈衝貫穿全曲，層層堆疊、永不間斷。
 * 沒有 backbeat、沒有切分、沒有打點轟炸——張力來自累積與 Shepard tone。
 *
 *   0.0  S1  滴答 + 單音脈衝 + 鋼琴動機（近乎無聲的開場）
 *   4.6  S2  管風琴低音和弦進場，四分脈衝開始
 *  13.2  S3  八分音符琶音加入
 *  22.8  S4  低音八度脈衝 + 心跳鼓
 *  30.4  S5  旋律線進場（長音，Interstellar 式級進上行）
 *  38.8       ── 懸浮：脈衝停，只剩管風琴長音與滴答 ──
 *  40.0  D1  全部回來 + 旋律上八度
 *  57.2  D3  琶音改十六分
 *  62.0       Shepard tone 開始鋪（無限上升）
 *  66.8  D4  全編制 + Shepard 推頂
 *  76.4  S7  硬切 → 管風琴巨浪漸強 + 鋼琴動機回歸、尾奏
 */
const fs = require("fs");
const path = require("path");

const SR = 48000;
const DUR = 84.5;
const N = Math.round(SR * DUR);
const BEAT = 0.6; // 100 BPM，四分音符
const TWO_PI = Math.PI * 2;
const at = (sec) => Math.max(0, Math.min(N, Math.round(sec * SR)));
const n2f = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

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

/* 管風琴音色：加法合成疊管（16'8'4'... 音栓），雙層合唱失諧 */
const ORGAN_H = [
  [0.5, 0.55],
  [1, 1.0],
  [2, 0.62],
  [3, 0.28],
  [4, 0.38],
  [6, 0.14],
  [8, 0.1],
];
function organNote(sec, len, midi, level, atkSec, relSec, send = 0.4) {
  const s = at(sec);
  const L = Math.round((len + relSec) * SR);
  const f0 = n2f(midi);
  const atk = atkSec * SR;
  const body = len * SR;
  const rel = relSec * SR;
  for (const [pan, det] of [
    [0.88, 1 - 0.003],
    [1.0, 1 + 0.003],
  ]) {
    const ph = ORGAN_H.map(() => Math.random() * TWO_PI);
    for (let i = s, k = 0; k < L && i < N; i++, k++) {
      let env = k < atk ? k / atk : 1;
      if (k > body) env *= Math.max(0, 1 - (k - body) / rel);
      if (env <= 0) continue;
      let v = 0;
      for (let h = 0; h < ORGAN_H.length; h++) {
        const [mult, amp] = ORGAN_H[h];
        v += Math.sin((TWO_PI * f0 * det * mult * i) / SR + ph[h]) * amp;
      }
      const out = v * env * level * 0.068;
      if (det < 1) mix(i, out, out * pan * 0.55, send);
      else mix(i, out * 0.55, out * pan, send);
    }
  }
}
const organChord = (sec, len, midis, level, atk = 0.35, rel = 1.2, send = 0.4) => {
  for (const m of midis) organNote(sec, len, m, level, atk, rel, send);
};

/* 四分音符脈衝：短 gate 管風琴單音，全曲的心臟 */
const organPulse = (sec, midi, level) =>
  organNote(sec, 0.24, midi, level, 0.012, 0.12, 0.3);

/* 心跳鼓：柔軟低頻 thump，貼著脈衝網格 */
function heart(sec, level) {
  const s = at(sec);
  const L = Math.round(0.35 * SR);
  let ph = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const f = 44 + 40 * Math.exp(-t / 0.05);
    ph += (TWO_PI * f) / SR;
    const v = Math.sin(ph) * Math.exp(-t / 0.13) * level * 0.5;
    mix(i, v, v, 0.25);
  }
}

/* 時鐘滴答 */
function tick(sec, level) {
  const s = at(sec);
  const L = Math.round(0.03 * SR);
  let prev = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const n = Math.random() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const env = Math.exp(-k / (0.006 * SR));
    const v = hp * env * level * 0.3;
    mix(i, v * (k % 2 ? 1 : 0.6), v * (k % 2 ? 0.6 : 1), 0.4);
  }
}

/* 鋼琴動機：鐘形音，情緒錨點 */
function piano(sec, midi, level, len = 2.4) {
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
    mix(i, v * e * 0.9, v * e, 0.55);
  }
}

/* 低音 drone */
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
      0.15;
    mix(i, v, v, 0.25);
  }
}

/* Shepard tone：六層八度間隔正弦，全部緩慢上滑、循環包裹
   對數頻率上的高斯窗做音量，聽感=永無止境地上升 */
function shepard(startSec, lenSec, maxLevel) {
  const s = at(startSec);
  const e = at(startSec + lenSec);
  const LAYERS = 6;
  const CYCLE = 16; // 每 16 秒滑一個八度
  const centerLog = Math.log2(233); // 音量高斯中心 ~Bb3
  const sigma = 1.4;
  const phases = new Float64Array(LAYERS);
  for (let i = s; i < e && i < N; i++) {
    const t = (i - s) / SR;
    const glob = Math.min(1, t / (lenSec * 0.55)); // 整體淡入到頂
    let vL = 0;
    let vR = 0;
    for (let l = 0; l < LAYERS; l++) {
      // 每層在 [55Hz, 55*2^6] 之間循環上滑
      const pos = (l + t / CYCLE) % LAYERS;
      const f = 55 * Math.pow(2, pos);
      phases[l] += (TWO_PI * f) / SR;
      const dist = Math.log2(f) - centerLog;
      const amp = Math.exp((-dist * dist) / (2 * sigma * sigma));
      const v = Math.sin(phases[l]) * amp;
      if (l % 2) vL += v;
      else vR += v;
    }
    const g = glob * glob * maxLevel * 0.09;
    mix(i, vL * g, vR * g, 0.45);
  }
}

/* ---------- 和聲：Time 式明暗循環 Am–Em–G–D ---------- */
const PROG = [
  { root: 45, chord: [57, 60, 64], bass: 33 }, // Am
  { root: 40, chord: [55, 59, 64], bass: 28 }, // Em
  { root: 43, chord: [55, 59, 62], bass: 31 }, // G
  { root: 38, chord: [54, 57, 62], bass: 26 }, // D
];
const BAR = BEAT * 4; // 2.4s，一小節一和弦
const chordAt = (t) => PROG[Math.floor((t - 4.8) / BAR) % 4];

/* ---------- 編曲 ---------- */

// ── S1 序場：滴答 + 稀疏單音 + 鋼琴動機
for (let t = 0.3; t < 4.6; t += BEAT) tick(t, 0.5);
organPulse(0.6, 57, 0.5);
organPulse(1.8, 57, 0.5);
organPulse(3.0, 57, 0.55);
organPulse(4.2, 57, 0.6);
piano(0.5, 69, 0.9);
piano(2.3, 76, 0.9);
drone(0, 5.6, 33, 0.45);

// ── 管風琴和弦鋪底：4.8 起每小節，音量階梯式上升
for (let t = 4.8; t < 76.3; t += BAR) {
  if (t >= 38.8 && t < 40.0) continue;
  const c = chordAt(t);
  const lvl =
    t < 13.2 ? 0.5 : t < 22.8 ? 0.62 : t < 30.4 ? 0.75 : t < 40 ? 0.85 : t < 44.8 ? 0.78 : t < 57.2 ? 0.95 : t < 66.8 ? 1.05 : 1.3;
  if (t < 57.2 || t >= 62.0) organChord(t, BAR - 0.1, c.chord, lvl, 0.3, 1.0); // 57.2–62 呼吸：抽和弦、低音管留著
  // 22.8 起加低音管
  if (t >= 22.8) organNote(t, BAR - 0.1, c.bass + 12, lvl * 0.9, 0.25, 0.9, 0.3);
}
// 38.8–40 懸浮：一個長和弦撐住（不留真空，只抽脈衝）
organChord(38.8, 1.1, [57, 60, 64], 0.7, 0.25, 0.9);

// ── 四分音符脈衝：全曲心臟，4.8 → 76.3 從不間斷（懸浮段除外）
for (let t = 4.8; t < 76.3; t += BEAT) {
  if (t >= 38.8 && t < 40.0) continue;
  if (t < 22.8 && Math.round((t - 4.8) / BEAT) % 2 === 1) continue; // 前段半拍速，更沉穩
  const c = chordAt(t);
  const lvl = t < 13.2 ? 0.5 : t < 30.4 ? 0.62 : t < 40 ? 0.7 : t < 66.8 ? 0.78 : 0.88;
  organPulse(t, c.root + 12, lvl);
  // 22.8 起低八度加倍
  if (t >= 22.8) organPulse(t, c.root, lvl * 0.75);
}

// ── 琶音：13.2 起八分，57.2 起十六分（同一網格細分，永不切分）
for (let t = 13.2; t < 76.3; t += BEAT / 2) {
  if (t >= 38.8 && t < 40.0) continue;
  if (t >= 40.0 && t < 44.8) continue; // D1 浪谷：琶音晚兩小節回來
  const c = chordAt(t);
  const step = Math.round((t - 13.2) / (BEAT / 2));
  const tones = [c.chord[0], c.chord[1], c.chord[2], c.chord[1]];
  const lvl = t < 22.8 ? 0.4 : t < 40 ? 0.5 : t < 66.8 ? 0.55 : 0.62;
  organNote(t, 0.2, tones[step % 4] + 12, lvl, 0.015, 0.1, 0.35);
  if (t >= 57.2) {
    // 十六分：半拍再插一個音
    organNote(t + BEAT / 4, 0.13, tones[(step + 2) % 4] + 12, lvl * 0.7, 0.012, 0.08, 0.35);
  }
}

// ── 心跳鼓：22.8 起每兩拍，40 起每拍（貼脈衝網格，無 backbeat）
for (let t = 22.8; t < 38.8; t += BEAT * 2) heart(t, 0.5);
for (let t = 40.0; t < 57.2; t += BEAT * 2) heart(t, 0.55);
for (let t = 57.2; t < 76.3; t += BEAT) heart(t, t < 66.8 ? 0.65 : 0.9);

// ── 旋律線：30.4 起長音級進（Interstellar 式），40 起上八度
const MELODY = [
  [30.4, 69, 4.8],
  [35.2, 71, 3.4],
  [40.0, 81, 4.8],
  [44.8, 83, 4.8],
  [49.6, 84, 4.8],
  [54.4, 83, 2.4],
  [57.2, 84, 4.8],
  [62.0, 88, 4.8],
  [66.8, 84, 4.8],
  [71.6, 88, 4.6],
];
for (const [t, m, len] of MELODY) {
  organNote(t, len - 0.2, m, t < 40 ? 0.5 : t < 66.8 ? 0.62 : 0.85, 0.5, 1.4, 0.5);
}

// ── 對位線：47.6 起與主旋律反向而行（下行），中段的第二聲部
const COUNTER = [
  [47.6, 76, 2.4],
  [50.0, 74, 2.4],
  [52.4, 72, 2.4],
  [54.8, 71, 2.4],
  [62.0, 76, 2.4],
  [64.4, 72, 2.4],
  [66.8, 79, 2.4],
  [69.2, 74, 2.4],
  [71.6, 76, 4.6],
];
for (const [t, m, len] of COUNTER) organNote(t, len - 0.2, m, 0.42, 0.4, 1.0, 0.45);

// ── 滴答持續整段 demo（諾蘭的錶）
for (let t = 40.0; t < 76.3; t += BEAT / 2) tick(t, 0.16);
for (let t = 38.8; t < 40.0; t += BEAT / 2) tick(t, 0.7);

// ── Shepard tone：62 秒起鋪到 76.4，終盤的無限上升
shepard(62.0, 14.4, 1.5);

// ── S7 揭示（76.4 硬切 → 巨浪漸強，不用爆擊）
const cutS = at(76.38);
const cutE = at(76.5);
organChord(76.5, 5.6, [45, 57, 60, 64, 71], 1.8, 1.1, 2.4, 0.55); // Am add9 巨浪
drone(76.5, 7.6, 33, 1.5);
heart(76.55, 1.0);
piano(78.4, 69, 1.1, 3.0);
piano(79.6, 72, 1.0, 3.0);
piano(80.8, 76, 1.25, 3.5);

/* ---------- Schroeder 殘響 ---------- */
function reverb(input, combTunings) {
  const out = new Float64Array(N);
  const combs = combTunings.map((len) => ({ buf: new Float64Array(len), idx: 0, filt: 0 }));
  const FB = 0.87;
  const DAMP = 0.3;
  const aps = [225, 556].map((x) => ({
    buf: new Float64Array(Math.round((x * SR) / 44100)),
    idx: 0,
  }));
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
console.log("rendering reverb…");
const revL = reverb(wetL, [1557, 1617, 1491, 1422].map((x) => Math.round((x * SR) / 44100)));
const revR = reverb(wetR, [1580, 1641, 1514, 1445].map((x) => Math.round((x * SR) / 44100)));

/* ---------- 混音、母帶 ---------- */
const outL = new Float64Array(N);
const outR = new Float64Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  let l = dryL[i] + revL[i] * 0.95;
  let r = dryR[i] + revR[i] * 0.95;
  if (i >= cutS && i < cutE) {
    l = 0;
    r = 0;
  }
  l = Math.tanh(l * 1.15);
  r = Math.tanh(r * 1.15);
  outL[i] = l;
  outR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const norm = 0.92 / peak;
const fadeIn = at(0.04);
const fadeOutStart = at(82.8);
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > fadeOutStart) g *= Math.max(0, 1 - (i - fadeOutStart) / (N - fadeOutStart));
  outL[i] *= g;
  outR[i] *= g;
}

/* ---------- 檢查：每 2.5 秒 RMS ---------- */
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
