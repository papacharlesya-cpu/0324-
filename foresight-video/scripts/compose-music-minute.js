/*
 * Foresight 一分鐘版配樂：Google 產品片風格
 * 真木琴 + 真鐵琴 + 真鋼琴（VSCO-2-CE, CC0），輕快彈跳、C 大調
 * 產出 public/music-minute.wav：44.1kHz 16-bit 立體聲，60 秒
 *
 * 場景節點：0 認識 / 3.5 定義 / 8 三張事實卡 / 18 說需求 / 27 預測
 *          36 執行+核准（41.8 核准暖和弦）/ 45 成效圖 / 52 收尾
 */
const fs = require("fs");
const path = require("path");

const VSCO = "/tmp/claude-0/-home-user-0324-/40d19e51-f527-5130-9594-2e18ba4786df/scratchpad/vsco";
const SR = 44100;
const DUR = 60.0;
const N = Math.round(SR * DUR);
const BEAT = 0.6;
const BAR = BEAT * 4;
const TWO_PI = Math.PI * 2;
const at = (sec) => Math.max(0, Math.min(N, Math.round(sec * SR)));

let seed = 20261030;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const dryL = new Float64Array(N);
const dryR = new Float64Array(N);
const wetL = new Float64Array(N);
const wetR = new Float64Array(N);

const cache = new Map();
function loadWav(p) {
  if (cache.has(p)) return cache.get(p);
  const b = fs.readFileSync(p);
  let o = 12;
  let data = null;
  let bits = 16;
  let ch = 1;
  while (o + 8 <= b.length) {
    const id = b.subarray(o, o + 4).toString();
    const sz = b.readUInt32LE(o + 4);
    if (id === "fmt ") {
      ch = b.readUInt16LE(o + 8 + 2);
      bits = b.readUInt16LE(o + 8 + 14);
    } else if (id === "data") {
      data = b.subarray(o + 8, o + 8 + sz);
      break;
    }
    o += 8 + sz + (sz % 2);
  }
  const bytes = bits / 8;
  const frames = Math.floor(data.length / bytes / ch);
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    const off = i * bytes * ch;
    let v;
    if (bits === 16) v = data.readInt16LE(off) / 32768;
    else v = (((data[off] | (data[off + 1] << 8) | (data[off + 2] << 16)) << 8) >> 8) / 8388608;
    out[i] = v;
  }
  cache.set(p, out);
  return out;
}

const PC = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const noteToMidi = (name, oct) => PC[name] + (parseInt(oct) + 1) * 12;

function scanMap(dir, re) {
  const map = new Map();
  for (const f of fs.readdirSync(path.join(VSCO, dir))) {
    const m = f.match(re);
    if (!m) continue;
    const midi = noteToMidi(m[1], m[2]);
    if (!map.has(midi)) map.set(midi, []);
    map.get(midi).push(path.join(VSCO, dir, f));
  }
  return map;
}
const marimba = scanMap("Percussion/Marimba", /Outrigger_([A-G]#?)(\d)_/);
const glock = scanMap("Percussion/Glock", /glock_medium_([A-G]#?)(\d)/);
const pianoFiles = new Map();
for (const f of fs.readdirSync(path.join(VSCO, "Keys/Upright Piano"))) {
  const m = f.match(/Player_dyn(\d)_rr1_(\d{3})\.wav/);
  if (m) pianoFiles.set(`${m[1]}_${parseInt(m[2])}`, path.join(VSCO, "Keys/Upright Piano", f));
}
const claves = fs.readdirSync(path.join(VSCO, "Percussion")).filter((f) => /^Claves1_/.test(f)).map((f) => path.join(VSCO, "Percussion", f));
const tambs = fs.readdirSync(path.join(VSCO, "Percussion")).filter((f) => /^Tamb1-Hit/.test(f)).map((f) => path.join(VSCO, "Percussion", f));
console.log(`maps: marimba:${marimba.size} glock:${glock.size} piano:${pianoFiles.size} claves:${claves.length} tamb:${tambs.length}`);

function play(sec, buf, { rate = 1, gain = 1, pan = 0, maxLen = 0, rel = 0.15, send = 0.3 }) {
  const s = at(sec + (rnd() - 0.5) * 0.012);
  const g = gain * (1 + (rnd() - 0.5) * 0.2);
  const outFrames = Math.min(
    Math.floor((buf.length - 1) / rate),
    maxLen > 0 ? Math.round(maxLen * SR) : Infinity,
    N - s,
  );
  const relF = Math.round(rel * SR);
  const gl = Math.SQRT1_2 * (1 - pan) * g;
  const gr = Math.SQRT1_2 * (1 + pan) * g;
  for (let k = 0; k < outFrames; k++) {
    const src = k * rate;
    const i0 = Math.floor(src);
    const fr = src - i0;
    let v = buf[i0] * (1 - fr) + buf[i0 + 1] * fr;
    if (k < 60) v *= k / 60;
    if (k > outFrames - relF) v *= Math.max(0, (outFrames - k) / relF);
    dryL[s + k] += v * gl;
    dryR[s + k] += v * gr;
    wetL[s + k] += v * gl * send;
    wetR[s + k] += v * gr * send;
  }
}
const rrState = new Map();
function note(sec, map, midi, opt = {}) {
  let best = null;
  for (const key of map.keys()) if (best === null || Math.abs(key - midi) < Math.abs(best - midi)) best = key;
  if (best === null || Math.abs(best - midi) > 6) return;
  const pool = map.get(best);
  const idx = (rrState.get(`${best}`) || 0) % pool.length;
  rrState.set(`${best}`, idx + 1);
  play(sec, loadWav(pool[idx]), { rate: Math.pow(2, (midi - best) / 12), ...opt });
}
function pianoNote(sec, midi, dyn, opt = {}) {
  const idx = Math.round((midi - 21) / 2);
  const p = pianoFiles.get(`${dyn}_${idx}`) || pianoFiles.get(`2_${idx}`) || pianoFiles.get(`1_${idx}`);
  if (!p) return;
  play(sec, loadWav(p), { rate: Math.pow(2, (midi - (21 + idx * 2)) / 12), ...opt });
}
function hit(sec, files, opt = {}) {
  play(sec, loadWav(files[Math.floor(rnd() * files.length)]), opt);
}
/* 軟 kick（正弦，無 alias） */
function kick(sec, gain) {
  const s = at(sec);
  let ph = 0;
  for (let i = s, k = 0; k < 9000 && i < N; i++, k++) {
    const t = k / SR;
    ph += (TWO_PI * (50 + 70 * Math.exp(-t / 0.035))) / SR;
    const v = Math.sin(ph) * Math.exp(-t / 0.08) * gain * 0.4;
    dryL[i] += v;
    dryR[i] += v;
  }
}

/* ---------- 和聲：C–Am–F–G，2 小節一個 ---------- */
const PROG = [
  { root: 48, third: 52, fifth: 55, chord: [60, 64, 67] }, // C
  { root: 45, third: 48, fifth: 52, chord: [57, 60, 64] }, // Am
  { root: 41, third: 45, fifth: 48, chord: [53, 57, 60] }, // F
  { root: 43, third: 47, fifth: 50, chord: [55, 59, 62] }, // G
];
const chordAt = (t) => PROG[Math.floor(t / (BAR * 2)) % 4];

/* ---------- 編曲 ---------- */
const END = 52.8; // 律動在此收掉，進尾奏

// 木琴 ostinato：8 分 [根,5度,3度,5度]，全曲心臟
for (let t = 0.6; t < END; t += BEAT / 2) {
  const c = chordAt(t);
  const step = Math.round((t - 0.6) / (BEAT / 2));
  const tones = [c.root + 12, c.fifth + 12, c.third + 12, c.fifth + 12];
  const lvl = t < 8 ? 0.85 : t < 18 ? 0.95 : 1.05;
  note(t, marimba, tones[step % 4], { gain: lvl, pan: step % 2 ? 0.25 : -0.15, send: 0.25 });
}
// 木琴低音根音：每兩拍
for (let t = 8.4; t < END; t += BEAT * 2) {
  const c = chordAt(t);
  note(t, marimba, c.root, { gain: 0.6, pan: -0.2, send: 0.2 });
}
// 鋼琴和弦：每兩小節換和弦時輕放
for (let t = 0.6; t < END; t += BAR * 2) {
  const c = chordAt(t);
  for (let i = 0; i < 3; i++) pianoNote(t + i * 0.02, c.chord[i], 1, { gain: 0.75, send: 0.45 });
}
// 鼓組：8 秒起軟 kick 1、3 拍；18 秒起鈴鼓 8 分；27 秒起 claves 2、4 拍
for (let t = 8.4; t < END; t += BEAT * 2) kick(t, 1.0);
for (let t = 18.0; t < END; t += BEAT / 2) hit(t, tambs, { gain: 0.2, send: 0.25 });
for (let t = 27.0 + BEAT; t < END; t += BEAT * 2) hit(t, claves, { gain: 0.35, send: 0.3 });

// 鐵琴：每個場景開頭一撮亮片（音跟當下和弦）
for (const t of [0.15, 3.5, 8.0, 18.0, 27.0, 36.0, 45.0]) {
  const c = chordAt(Math.max(0, t));
  note(t, glock, c.chord[0] + 24, { gain: 0.5, send: 0.5 });
  note(t + 0.12, glock, c.chord[2] + 24, { gain: 0.45, send: 0.5 });
}
// 開場動機：鐵琴 C-E-G 上行（品牌聲音）
note(0.5, glock, 84, { gain: 0.85, send: 0.5 });
note(0.8, glock, 88, { gain: 0.8, send: 0.5 });
note(1.1, glock, 91, { gain: 0.9, send: 0.5 });
// 核准時刻（41.8）：暖鋼琴 F 大和弦 + 鐵琴
for (const [i, m] of [53, 60, 64, 69].entries()) pianoNote(41.8 + i * 0.025, m, 2, { gain: 0.7, send: 0.5 });
note(41.85, glock, 89, { gain: 0.6, send: 0.55 });
// 成效圖爬升（45–48.6）：木琴上行音階跟著曲線
[60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => {
  note(45.2 + i * 0.42, marimba, m + 12, { gain: 0.5, pan: 0.2, send: 0.3 });
});

// 尾奏（52.8–59）：全部收掉，鋼琴 C 和弦 + 鐵琴動機回歸
for (const [i, m] of [48, 55, 60, 64].entries()) pianoNote(53.0 + i * 0.03, m, 2, { gain: 0.85, send: 0.5 });
note(53.6, glock, 84, { gain: 0.6, send: 0.55 });
note(53.9, glock, 88, { gain: 0.55, send: 0.55 });
note(54.2, glock, 91, { gain: 0.7, send: 0.55 });
pianoNote(56.4, 72, 1, { gain: 0.5, send: 0.6 });

/* ---------- 輕殘響 ---------- */
function reverb(input, tunings) {
  const out = new Float64Array(N);
  const pre = Math.round(0.015 * SR);
  const combs = tunings.map((len) => ({ buf: new Float64Array(len), idx: 0, filt: 0 }));
  const FB = 0.76;
  const DAMP = 0.3;
  const aps = [225, 556].map((x) => ({ buf: new Float64Array(Math.round((x * SR) / 44100)), idx: 0 }));
  for (let i = 0; i < N; i++) {
    const x = i >= pre ? input[i - pre] : 0;
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.idx];
      c.filt = y * (1 - DAMP) + c.filt * DAMP;
      c.buf[c.idx] = x + c.filt * FB;
      c.idx = (c.idx + 1) % c.buf.length;
      acc += y;
    }
    let v = acc / combs.length;
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
const revL = reverb(wetL, [1157, 1361, 1493, 1597]);
const revR = reverb(wetR, [1181, 1385, 1511, 1621]);

const outL = new Float64Array(N);
const outR = new Float64Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  let l = Math.tanh((dryL[i] + revL[i] * 0.9) * 1.1);
  let r = Math.tanh((dryR[i] + revR[i] * 0.9) * 1.1);
  outL[i] = l;
  outR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const norm = 0.9 / peak;
const fadeOutStart = at(58.2);
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < 1500) g *= i / 1500;
  if (i > fadeOutStart) g *= Math.max(0, 1 - (i - fadeOutStart) / (N - fadeOutStart));
  outL[i] *= g;
  outR[i] *= g;
}
for (let w = 0; w < DUR; w += 4) {
  const s = at(w);
  const e = at(Math.min(w + 4, DUR));
  let sum = 0;
  for (let i = s; i < e; i++) sum += outL[i] * outL[i] + outR[i] * outR[i];
  const rms = Math.sqrt(sum / (2 * (e - s)));
  console.log(`${w.toFixed(0).padStart(3)}s  RMS ${rms.toFixed(3)}  ${"#".repeat(Math.round(rms * 110))}`);
}

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
fs.writeFileSync(path.join(__dirname, "..", "public", "music-minute.wav"), bytes);
console.log(`\nWrote music-minute.wav (peak norm ${norm.toFixed(2)})`);
