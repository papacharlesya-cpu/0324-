/*
 * Foresight teaser 配樂・明亮電子版（純 Node、無相依套件）
 * 產出 public/music-bright.wav：48kHz 16-bit 立體聲，84.5 秒
 *
 * 感覺：科技發表會的樂觀明亮——溫暖類比 pad、pluck 琶音、sidechain 律動，
 * 結尾解決到 C 大調。與諾蘭版（莊嚴小調）互為對比。
 *
 * 對動畫轉折逐點同步：
 *   5.4–8.5  計數器滾動 → 濾波上掃，8.5 落定鐘音
 *  14.3–16.4 因果 log 逐行 → 四個上行 pluck 點
 *  26.0      chip 彈出 → 鈴聲三連瀑；27.8–29.8 時間軸 → 小上掃
 *  33.5/34.3/35.2 三層亮起 → 三個上行 stab
 *  43–45.6   打字 → 16 分 hat；45.7 送出 → whoosh+chime
 *  50.4/51.5/52.5 引擎三步 → 上行 stab；54.4 預測帶完成 → chime
 *  60.0–62.6 執行 log 四行 → 四個 pluck 點；64.4 核准 → 大暖和弦
 *  69.7–73.1 曲線爬升 → 長上掃；73.2 終點 → chime
 *  76.4      硬切 → C 大調巨浪 + 鈴聲動機回歸
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

const dryL = new Float64Array(N);
const dryR = new Float64Array(N);
const wetL = new Float64Array(N);
const wetR = new Float64Array(N);
/* sidechain 目標 bus（pad/bass/arp 收進來，之後被 kick 壓） */
const scL = new Float64Array(N);
const scR = new Float64Array(N);

function mix(i, l, r, send) {
  dryL[i] += l;
  dryR[i] += r;
  wetL[i] += l * send;
  wetR[i] += r * send;
}
function mixSC(i, l, r, send) {
  scL[i] += l;
  scR[i] += r;
  wetL[i] += l * send;
  wetR[i] += r * send;
}

/* ---------- 樂器 ---------- */

/* 溫暖 supersaw pad：5 層失諧鋸齒 + 低通，慢起音 */
function pad(sec, len, midi, level, atkSec = 0.8, send = 0.42) {
  const s = at(sec);
  const L = Math.round((len + 1.4) * SR);
  const f0 = n2f(midi);
  const dets = [-0.008, -0.004, 0, 0.004, 0.008];
  const atk = atkSec * SR;
  const body = len * SR;
  const rel = 1.4 * SR;
  for (const chan of [0, 1]) {
    let lp = 0;
    const phases = dets.map(() => Math.random());
    for (let i = s, k = 0; k < L && i < N; i++, k++) {
      let env = k < atk ? k / atk : 1;
      if (k > body) env *= Math.max(0, 1 - (k - body) / rel);
      if (env <= 0) continue;
      let v = 0;
      for (let d = 0; d < dets.length; d++) {
        phases[d] += (f0 * (1 + dets[d] * (chan ? 1.1 : 0.9))) / SR;
        v += 2 * (phases[d] - Math.floor(phases[d])) - 1;
      }
      lp += 0.09 * (v / 5 - lp);
      const out = lp * env * level * 0.34;
      if (chan === 0) mixSC(i, out, out * 0.5, send);
      else mixSC(i, out * 0.5, out, send);
    }
  }
}
const padChord = (sec, len, midis, level, atk = 0.8) => {
  for (const m of midis) pad(sec, len, m, level, atk);
};

/* Pluck 琶音：亮音色快衰減 + 內建兩次 echo */
function pluck(sec, midi, level, panRight, send = 0.35) {
  const f0 = n2f(midi);
  const taps = [
    [0, 1],
    [0.45, 0.4],
    [0.9, 0.17],
  ];
  for (const [dt, g] of taps) {
    const s = at(sec + dt);
    const L = Math.round(0.3 * SR);
    const flip = taps.indexOf.length; // no-op
    const right = dt === 0 ? panRight : !panRight; // echo 彈到另一邊
    for (let i = s, k = 0; k < L && i < N; i++, k++) {
      const t = k / SR;
      const env = Math.exp(-t / 0.07);
      const v =
        (Math.sin((TWO_PI * f0 * k) / SR) * 0.7 +
          Math.sin((TWO_PI * f0 * 2 * k) / SR) * 0.35 +
          Math.sin((TWO_PI * f0 * 3 * k) / SR) * 0.12) *
        env *
        level *
        g *
        0.16;
      if (right) mixSC(i, v * 0.45, v, send);
      else mixSC(i, v, v * 0.45, send);
    }
  }
}

/* 和弦 stab：短促明亮 */
function stab(sec, midis, level) {
  for (const m of midis) {
    const s = at(sec);
    const L = Math.round(0.5 * SR);
    const f0 = n2f(m);
    const dets = [-0.005, 0, 0.005];
    const phases = dets.map(() => Math.random());
    for (let i = s, k = 0; k < L && i < N; i++, k++) {
      const t = k / SR;
      const env = Math.min(1, t / 0.01) * Math.exp(-t / 0.16);
      let v = 0;
      for (let d = 0; d < dets.length; d++) {
        phases[d] += (f0 * (1 + dets[d])) / SR;
        v += 2 * (phases[d] - Math.floor(phases[d])) - 1;
      }
      const out = (v / 3) * env * level * 0.2;
      mix(i, out, out, 0.4);
    }
  }
}

/* FM 鐘音 chime */
function chime(sec, midi, level, len = 1.8) {
  const s = at(sec);
  const L = Math.round(len * SR);
  const f0 = n2f(midi);
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const mod = Math.sin((TWO_PI * f0 * 3.73 * k) / SR) * 2.2 * Math.exp(-t * 3);
    const v = Math.sin((TWO_PI * f0 * k) / SR + mod) * Math.exp(-t * 1.9) * level * 0.16;
    mix(i, v * 0.85, v, 0.55);
  }
}

/* 低音：8 分音符鋸齒 sub */
function bassNote(sec, midi, level) {
  const s = at(sec);
  const L = Math.round(0.28 * SR);
  const f0 = n2f(midi);
  let lp = 0;
  let phv = Math.random();
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.008) * (t > 0.22 ? Math.exp(-(t - 0.22) / 0.03) : 1);
    phv += f0 / SR;
    const saw = 2 * (phv - Math.floor(phv)) - 1;
    lp += 0.12 * (saw - lp);
    const v = (lp * 0.7 + Math.sin((TWO_PI * f0 * 0.5 * k) / SR) * 0.5) * env * level * 0.34;
    mixSC(i, v, v, 0.12);
  }
}

/* Kick：電子軟 kick */
function kick(sec, level) {
  const s = at(sec);
  const L = Math.round(0.28 * SR);
  let ph = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const f = 46 + 85 * Math.exp(-t / 0.04);
    ph += (TWO_PI * f) / SR;
    const v = Math.sin(ph) * Math.exp(-t / 0.1) * level * 0.55;
    mix(i, v, v, 0.18);
  }
}

/* Hat：高通噪音短點 */
function hat(sec, level) {
  const s = at(sec);
  const L = Math.round(0.035 * SR);
  let prev = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const n = Math.random() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const v = hp * Math.exp(-k / (0.008 * SR)) * level * 0.22;
    mix(i, v * (k % 2 ? 1 : 0.5), v * (k % 2 ? 0.5 : 1), 0.3);
  }
}

/* 上掃：噪音濾波 + 音高掃頻（跟著畫面元素長出來） */
function sweep(startSec, endSec, level, octaves = 1) {
  const s = at(startSec);
  const e = at(endSec);
  let lpL = 0;
  let lpR = 0;
  let ph = 0;
  for (let i = s; i < e && i < N; i++) {
    const p = (i - s) / (e - s);
    const cut = 0.02 + 0.3 * p * p;
    lpL += cut * ((Math.random() * 2 - 1) - lpL);
    lpR += cut * ((Math.random() * 2 - 1) - lpR);
    const f = 220 * Math.pow(2, p * octaves);
    ph += (TWO_PI * f) / SR;
    const tone = Math.sin(ph) * 0.3;
    const env = (0.25 + 0.75 * p * p) * level * 0.3;
    mix(i, (lpL + tone) * env, (lpR + tone) * env, 0.5);
  }
}

/* whoosh：短噴氣 */
function whoosh(sec, level) {
  const s = at(sec);
  const L = Math.round(0.5 * SR);
  let lp = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const env = Math.exp(-t / 0.12) * Math.min(1, t / 0.015);
    lp += 0.2 * ((Math.random() * 2 - 1) - lp);
    const v = lp * env * level * 0.5;
    mix(i, v, v, 0.5);
  }
}

/* ---------- 和聲 ---------- */
// 前段 Am–F–C–G（vi–IV–I–V），demo 段 F–C–G–Am，結尾解決 C 大調
const VERSE = [
  { root: 45, chord: [57, 60, 64], bass: 33 }, // Am
  { root: 41, chord: [53, 57, 60], bass: 29 }, // F
  { root: 48, chord: [55, 60, 64], bass: 36 }, // C
  { root: 43, chord: [55, 59, 62], bass: 31 }, // G
];
const DEMO = [
  { root: 41, chord: [53, 57, 60], bass: 29 }, // F
  { root: 48, chord: [55, 60, 64], bass: 36 }, // C
  { root: 43, chord: [55, 59, 62], bass: 31 }, // G
  { root: 45, chord: [57, 60, 64], bass: 33 }, // Am
];
const BAR = BEAT * 4;
const chordAt = (t) =>
  t < 40
    ? VERSE[Math.floor((t - 4.8) / BAR) % 4]
    : DEMO[Math.floor((t - 40.0) / BAR) % 4];

/* ---------- 編曲 ---------- */

// ── S1 序場：空氣感 pad + 上行鈴聲動機（E→G→C）
padChord(0, 4.6, [64, 67, 72], 0.5, 1.6);
chime(0.6, 76, 0.8);
chime(1.6, 79, 0.8);
chime(2.6, 84, 1.0, 2.6);
sweep(2.8, 4.55, 0.5, 1);

// ── Pad 和弦鋪底：4.8 起，階梯上升
for (let t = 4.8; t < 76.3; t += BAR) {
  if (t >= 38.8 && t < 40.0) continue;
  const c = chordAt(t);
  const lvl =
    t < 13.2 ? 0.55 : t < 22.8 ? 0.65 : t < 30.4 ? 0.75 : t < 40 ? 0.85 : t < 57.2 ? 0.9 : t < 66.8 ? 1.0 : 1.15;
  padChord(t, BAR - 0.1, c.chord, lvl, 0.35);
}
padChord(38.8, 1.1, [53, 57, 60], 0.65, 0.3); // 懸浮撐住

// ── Pluck 琶音：4.8 起 8 分，57.2 起 16 分
for (let t = 4.8; t < 76.3; t += BEAT / 2) {
  if (t >= 38.8 && t < 40.0) continue;
  const c = chordAt(t);
  const step = Math.round((t - 4.8) / (BEAT / 2));
  const tones = [c.chord[0], c.chord[1], c.chord[2], c.chord[1]];
  const lvl = t < 13.2 ? 0.5 : t < 40 ? 0.62 : t < 66.8 ? 0.7 : 0.8;
  pluck(t, tones[step % 4] + 12, lvl, step % 2 === 0);
  if (t >= 57.2) pluck(t + BEAT / 4, tones[(step + 2) % 4] + 24, lvl * 0.5, step % 2 === 1);
}

// ── 低音 8 分：13.2 起
for (let t = 13.2; t < 76.3; t += BEAT / 2) {
  if (t >= 38.8 && t < 40.0) continue;
  const c = chordAt(t);
  const lvl = t < 22.8 ? 0.6 : t < 40 ? 0.75 : t < 66.8 ? 0.85 : 1.0;
  bassNote(t, c.bass + 12, lvl);
}

// ── 鼓組：13.2 起 four-on-floor，22.8 起 8 分 hat，57.2 起 16 分 hat
for (let t = 13.2; t < 76.3; t += BEAT) {
  if (t >= 38.8 && t < 40.0) continue;
  kick(t, t < 40 ? 0.45 : t < 66.8 ? 0.58 : 0.68);
}
for (let t = 22.8; t < 76.3; t += BEAT / 2) {
  if (t >= 38.8 && t < 40.0) continue;
  hat(t, 0.5);
}
for (let t = 57.2; t < 76.3; t += BEAT / 4) hat(t, 0.28);
// 終盤 fill：kick 加密
for (let t = 74.6; t < 75.5; t += BEAT / 2) kick(t, 0.7);
for (let t = 75.5; t < 76.35; t += BEAT / 4) kick(t, 0.8);

/* ---------- 動畫轉折逐點同步 ---------- */
// 計數器滾動（5.4–8.5）：上掃跟著數字爬，落定鐘音
sweep(5.4, 8.5, 0.8, 2);
chime(8.5, 84, 1.1);
// 因果 log 四行（14.3–16.4）：上行 pluck 點
[
  [14.3, 76],
  [15.0, 79],
  [15.7, 81],
  [16.4, 84],
].forEach(([t, m]) => pluck(t, m, 0.9, true));
// chip 彈出（26.0）：鈴聲三連瀑；時間軸（27.8–29.8）小上掃
chime(26.0, 88, 0.7, 1.2);
chime(26.15, 91, 0.6, 1.2);
chime(26.3, 96, 0.8, 1.6);
sweep(27.8, 29.8, 0.5, 1);
// 三層引擎逐層亮（33.5/34.3/35.2）：上行 stab
stab(33.5, [53, 57, 60], 0.8);
stab(34.3, [55, 60, 64], 0.9);
stab(35.2, [55, 59, 62, 67], 1.0);
// 懸浮進 demo
sweep(38.8, 40.0, 0.9, 2);
// 打字（43.1–45.6）：16 分 hat 細碎；送出（45.7）whoosh+chime
for (let t = 43.1; t < 45.6; t += BEAT / 4) hat(t, 0.4);
whoosh(45.7, 0.9);
chime(45.75, 88, 0.9);
// 引擎三步（50.4/51.5/52.5）stab；預測帶（53.3–54.3）→ 54.4 chime
stab(50.4, [53, 57, 60], 0.7);
stab(51.5, [55, 60, 64], 0.8);
stab(52.5, [55, 59, 62], 0.9);
sweep(53.3, 54.3, 0.6, 1);
chime(54.4, 91, 0.9);
// 執行 log 四行（60.0–62.6）pluck 點；核准（64.4）全曲最暖大和弦
[
  [60.0, 77],
  [60.9, 79],
  [61.7, 81],
  [62.6, 84],
].forEach(([t, m]) => pluck(t, m, 0.9, false));
stab(64.4, [41, 53, 57, 60, 64], 1.2); // Fmaj add9
chime(64.45, 89, 1.0, 2.2);
// 曲線爬升（69.7–73.1）長上掃；73.2 終點 chime；71.0 異常一記低音色
sweep(69.7, 73.1, 0.7, 2);
pluck(71.0, 64, 0.9, true); // 異常：短暫暗色
chime(73.2, 96, 1.0);
// 終盤 riser
sweep(73.5, 76.38, 1.1, 2);

/* ---------- S7 揭示：硬切 → C 大調巨浪 ---------- */
const cutS = at(76.38);
const cutE = at(76.52);
padChord(76.52, 5.8, [48, 55, 60, 64, 67, 74], 1.5, 1.0); // C 大調 add9 巨浪
bassNote(76.55, 36, 1.2);
kick(76.55, 0.9);
// 鈴聲動機回歸（C 大調版）
chime(77.6, 84, 1.1, 2.6);
chime(78.8, 88, 1.0, 2.6);
chime(80.0, 91, 1.2, 3.2);

/* ---------- Sidechain：kick 律動壓 pad/bass/arp ---------- */
function duckGain(tSec) {
  if (tSec < 13.2 || tSec >= 76.3 || (tSec >= 38.8 && tSec < 40.0)) return 1;
  const phase = (tSec - 13.2) % BEAT;
  return 1 - 0.32 * Math.exp(-phase / 0.09);
}

/* ---------- Schroeder 殘響（亮版：短一點） ---------- */
function reverb(input, combTunings) {
  const out = new Float64Array(N);
  const combs = combTunings.map((len) => ({ buf: new Float64Array(len), idx: 0, filt: 0 }));
  const FB = 0.8;
  const DAMP = 0.24;
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
  const g = duckGain(i / SR);
  let l = dryL[i] + scL[i] * g + revL[i] * 0.8;
  let r = dryR[i] + scR[i] * g + revR[i] * 0.8;
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

/* ---------- 檢查 ---------- */
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
const out = path.join(__dirname, "..", "public", "music-bright.wav");
fs.writeFileSync(out, bytes);
console.log(`\nWrote ${out} (${(bytes.length / 1e6).toFixed(1)} MB, peak norm ${norm.toFixed(2)})`);
