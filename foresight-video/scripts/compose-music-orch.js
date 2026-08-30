/*
 * Foresight teaser 配樂・真實管弦樂版
 * 音源：VSCO-2-CE（CC0 公有領域，真人錄製管弦樂樣本）
 * 產出 public/music-orch.wav：44.1kHz 16-bit 立體聲，84.5 秒
 *
 * 相對合成版的根本改變：
 *  - 真樂器錄音（小提琴組/大提琴組/法國號/鋼琴/豎琴/定音鼓/大鼓）
 *  - 最近音高取樣 + 變速播放，不用會 alias 的數學波形
 *  - 輪替樣本（round robin）+ 時間 ±7ms / 力度 ±12% 人性化抖動
 *  - 只保留無 alias 的電子層（sub 正弦、滴答、riser）做 hybrid
 */
const fs = require("fs");
const path = require("path");

const VSCO = "/tmp/claude-0/-home-user-0324-/40d19e51-f527-5130-9594-2e18ba4786df/scratchpad/vsco";
const SR = 44100;
const DUR = 84.5;
const N = Math.round(SR * DUR);
const BEAT = 0.6;
const BAR = BEAT * 4;
const TWO_PI = Math.PI * 2;
const at = (sec) => Math.max(0, Math.min(N, Math.round(sec * SR)));

/* 確定性偽隨機（同一份輸出可重現） */
let seed = 20261031;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const dryL = new Float64Array(N);
const dryR = new Float64Array(N);
const wetL = new Float64Array(N);
const wetR = new Float64Array(N);

/* ---------- WAV 讀取（mono 16/24-bit） ---------- */
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
    const off = i * bytes * ch; // 多聲道只取第一軌（本庫皆 mono）
    let v;
    if (bits === 16) v = b.readInt16LE ? data.readInt16LE(off) / 32768 : 0;
    else v = ((data[off] | (data[off + 1] << 8) | (data[off + 2] << 16)) << 8 >> 8) / 8388608;
    out[i] = v;
  }
  cache.set(p, out);
  return out;
}

/* ---------- 音名 → MIDI ---------- */
const PC = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const noteToMidi = (name, oct) => PC[name] + (parseInt(oct) + 1) * 12;

/* ---------- 樣本地圖 ---------- */
function scanMap(dir, re) {
  const map = new Map(); // midi -> [{p, v, rr}]
  for (const f of fs.readdirSync(path.join(VSCO, dir))) {
    const m = f.match(re);
    if (!m) continue;
    const midi = noteToMidi(m[1], m[2]);
    const v = m[3] ? parseInt(m[3]) : 1;
    if (!map.has(midi)) map.set(midi, []);
    map.get(midi).push({ p: path.join(VSCO, dir, f), v });
  }
  return map;
}
const INST = {
  vlnSpic: scanMap("Strings/Violin Section/Spic", /Spic_([A-G]#?)(\d)_v(\d)_rr\d/),
  vlnSus: scanMap("Strings/Violin Section/susVib", /susVib_([A-G]#?)(\d)_v(\d)/),
  vcSpic: scanMap("Strings/Cello Section/spic", /spic_([A-G]#?)(\d)_v(\d)_RR\d/),
  vcSus: scanMap("Strings/Cello Section/susvib", /susvib_([A-G]#?)(\d)_v(\d)/),
  horn: scanMap("Brass/F Horn/sus", /sus_([A-G]#?)(\d)_v(\d)/),
  harp: scanMap("Strings/Harp", /KSHarp_([A-G]#?)(\d)_/),
};
/* 鋼琴：MappingChart 000=MIDI21，每檔差 2 半音 */
const pianoFiles = new Map(); // `${dyn}_${idx}` -> path
for (const f of fs.readdirSync(path.join(VSCO, "Keys/Upright Piano"))) {
  const m = f.match(/Player_dyn(\d)_rr1_(\d{3})\.wav/);
  if (m) pianoFiles.set(`${m[1]}_${parseInt(m[2])}`, path.join(VSCO, "Keys/Upright Piano", f));
}
/* 打擊：整批列出 */
const percDir = (sub, re) =>
  fs.readdirSync(path.join(VSCO, sub)).filter((f) => re.test(f)).map((f) => path.join(VSCO, sub, f));
const timpHits = percDir("Percussion/Timpani", /Hit_v\d_rr\d/);
const timpRolls = percDir("Percussion/Timpani/Rolls", /Roll_v5/);
const bdrums = fs.readdirSync(path.join(VSCO, "Percussion")).filter((f) => /^BDrumNewhit/.test(f)).map((f) => path.join(VSCO, "Percussion", f));
const crash = percDir("Percussion", /^cymbal-crash1/);
const susCresc = percDir("Percussion", /^susCymb1-cresc-Median/);
const susCrescL = percDir("Percussion", /^susCymb1-cresc-Long/);
const snares = percDir("Percussion", /^Snare2-Hit/);
const snareRolls = percDir("Percussion", /^Snare2-roll/);
const tambs = percDir("Percussion", /^Tamb1-Hit/);
const gongs = percDir("Percussion", /^gongHit/);
console.log(`rhythm: crash:${crash.length} cresc:${susCresc.length}/${susCrescL.length} snare:${snares.length} roll:${snareRolls.length} tamb:${tambs.length} gong:${gongs.length}`);

for (const [k, m] of Object.entries(INST)) if (!m.size) throw new Error(`empty map: ${k}`);
console.log("sample maps:", Object.entries(INST).map(([k, m]) => `${k}:${m.size}`).join(" "), `piano:${pianoFiles.size} timp:${timpHits.length} rolls:${timpRolls.length} bd:${bdrums.length}`);

/* ---------- 播放：最近音高 + 變速 + 人性化 ---------- */
const rrState = new Map();
function play(sec, buf, { rate = 1, gain = 1, pan = 0, atk = 0.002, maxLen = 0, rel = 0.25, send = 0.35 }) {
  const jitterT = (rnd() - 0.5) * 0.014;
  const s = at(sec + jitterT);
  const g = gain * (1 + (rnd() - 0.5) * 0.24);
  const outFrames = Math.min(
    Math.floor((buf.length - 1) / rate),
    maxLen > 0 ? Math.round(maxLen * SR) : Infinity,
    N - s,
  );
  const atkF = Math.max(1, Math.round(atk * SR));
  const relF = Math.round(rel * SR);
  const gl = Math.SQRT1_2 * (1 - pan) * g;
  const gr = Math.SQRT1_2 * (1 + pan) * g;
  for (let k = 0; k < outFrames; k++) {
    const src = k * rate;
    const i0 = Math.floor(src);
    const fr = src - i0;
    let v = buf[i0] * (1 - fr) + buf[i0 + 1] * fr;
    if (k < atkF) v *= k / atkF;
    if (k > outFrames - relF) v *= Math.max(0, (outFrames - k) / relF);
    const i = s + k;
    dryL[i] += v * gl;
    dryR[i] += v * gr;
    wetL[i] += v * gl * send;
    wetR[i] += v * gr * send;
  }
}
function note(sec, inst, midi, { dyn = 1, ...opt } = {}) {
  const map = INST[inst];
  let best = null;
  for (const key of map.keys()) if (best === null || Math.abs(key - midi) < Math.abs(best - midi)) best = key;
  if (Math.abs(best - midi) > 5) return;
  const layers = map.get(best);
  const vWant = Math.min(dyn, Math.max(...layers.map((x) => x.v)));
  const pool = layers.filter((x) => x.v === vWant);
  const rk = `${inst}${best}${vWant}`;
  const idx = (rrState.get(rk) || 0) % pool.length;
  rrState.set(rk, idx + 1);
  play(sec, loadWav(pool[idx].p), { rate: Math.pow(2, (midi - best) / 12), ...opt });
}
function pianoNote(sec, midi, { dyn = 2, ...opt } = {}) {
  const idx = Math.round((midi - 21) / 2);
  const p = pianoFiles.get(`${dyn}_${idx}`) || pianoFiles.get(`2_${idx}`) || pianoFiles.get(`1_${idx}`);
  if (!p) return;
  const srcMidi = 21 + idx * 2;
  play(sec, loadWav(p), { rate: Math.pow(2, (midi - srcMidi) / 12), ...opt });
}
function hit(sec, files, opt = {}) {
  play(sec, loadWav(files[Math.floor(rnd() * files.length)]), opt);
}
/* 樣本「結束點」對準 sec：吊鈸漸強頂點卡在轉場上 */
function hitEnd(sec, files, opt = {}) {
  const buf = loadWav(files[Math.floor(rnd() * files.length)]);
  play(sec - buf.length / SR, buf, opt);
}
/* 電子 kick：正弦掃頻，hybrid 律動的底 */
function ekick(sec, gain) {
  const s = at(sec);
  const L = Math.round(0.26 * SR);
  let ph = 0;
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const f = 44 + 80 * Math.exp(-t / 0.04);
    ph += (TWO_PI * f) / SR;
    const v = Math.sin(ph) * Math.exp(-t / 0.1) * gain * 0.5;
    dryL[i] += v;
    dryR[i] += v;
  }
}

/* ---------- 電子層（無 alias：正弦與噪音） ---------- */
function sub(sec, len, freq, gain) {
  const s = at(sec);
  const L = Math.round(len * SR);
  for (let i = s, k = 0; k < L && i < N; i++, k++) {
    const t = k / SR;
    const edge = Math.min(1, t / 0.8, (len - t) / 1.2);
    if (edge <= 0) continue;
    const v = Math.sin((TWO_PI * freq * k) / SR) * edge * gain * 0.13;
    dryL[i] += v;
    dryR[i] += v;
  }
}
function tick(sec, gain) {
  const s = at(sec);
  let prev = 0;
  for (let i = s, k = 0; k < 1300 && i < N; i++, k++) {
    const n = rnd() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const v = hp * Math.exp(-k / 260) * gain * 0.25;
    dryL[i] += v * (k % 2 ? 1 : 0.6);
    dryR[i] += v * (k % 2 ? 0.6 : 1);
  }
}
function riser(endSec, len, gain) {
  const e = at(endSec);
  const s = at(endSec - len);
  let lpL = 0;
  let lpR = 0;
  for (let i = s; i < e && i < N; i++) {
    const p = (i - s) / (e - s);
    const cut = 0.015 + 0.3 * p * p;
    lpL += cut * ((rnd() * 2 - 1) - lpL);
    lpR += cut * ((rnd() * 2 - 1) - lpR);
    const env = p * p * gain * 0.4;
    dryL[i] += lpL * env;
    dryR[i] += lpR * env;
    wetL[i] += lpL * env * 0.5;
    wetR[i] += lpR * env * 0.5;
  }
}

/* ---------- 和聲：Am–Em–G–D ---------- */
const PROG = [
  { root: 45, chord: [57, 60, 64], low: 33 },
  { root: 40, chord: [55, 59, 64], low: 28 },
  { root: 43, chord: [55, 59, 62], low: 31 },
  { root: 38, chord: [54, 57, 62], low: 26 },
];
const Fch = { root: 41, chord: [53, 57, 60], low: 29 };
const Gch = { root: 43, chord: [55, 59, 62], low: 31 };
// B 段（demo）：C 大調 I–V–vi–IV
const DEMO_PROG = [
  { root: 48, chord: [55, 60, 64], low: 36 }, // C
  Gch, // G
  { root: 45, chord: [57, 60, 64], low: 33 }, // Am
  Fch, // F
];
const chordAt = (t) => {
  if (t >= 40.0) return DEMO_PROG[Math.floor((t - 40.0) / BAR) % 4];
  if (t >= 38.8) return Gch; // V：屬和弦懸掛，指向 C
  if (t >= 36.0) return Fch; // IV：轉調預備
  return PROG[Math.floor((t - 4.8) / BAR) % 4];
};
const inBreath = (t) => (t >= 38.8 && t < 40.0) || (t >= 57.2 && t < 62.0);

/* ---------- 編曲 ---------- */

// S1 序場：真鋼琴動機 + 大提琴長音 + 滴答
pianoNote(0.5, 69, { dyn: 2, gain: 0.9, send: 0.55 });
pianoNote(1.4, 72, { dyn: 1, gain: 0.8, send: 0.55 });
pianoNote(2.3, 76, { dyn: 2, gain: 0.9, send: 0.55 });
pianoNote(3.2, 74, { dyn: 1, gain: 0.75, send: 0.55 });
note(0.2, "vcSus", 45, { dyn: 1, gain: 0.5, atk: 0.9, maxLen: 5.2, rel: 1.0, send: 0.5, pan: -0.2 });
sub(0, 5.4, 55, 0.7);
for (let t = 0.3; t < 4.6; t += BEAT) tick(t, 0.5);
riser(4.6, 2.2, 0.5);

// 大提琴 + 小提琴長音和弦：每小節，階梯上升
for (let t = 4.8; t < 76.3; t += BAR) {
  if (inBreath(t)) continue;
  const c = chordAt(t);
  const lvl = t < 13.2 ? 0.42 : t < 22.8 ? 0.6 : t < 30.4 ? 0.6 : t < 40 ? 0.7 : t < 66.8 ? 0.75 : 0.9;
  // 大提琴：根音 + 五度
  note(t, "vcSus", c.low + 12, { dyn: t < 40 ? 1 : 3, gain: lvl, atk: 0.5, maxLen: BAR + 0.3, rel: 0.9, send: 0.45, pan: -0.25 });
  note(t + 0.02, "vcSus", c.low + 19, { dyn: 1, gain: lvl * 0.7, atk: 0.6, maxLen: BAR + 0.2, rel: 0.9, send: 0.45, pan: -0.15 });
  // 小提琴組長音：13.2 起兩聲部
  if (t >= 13.2) {
    note(t + 0.01, "vlnSus", c.chord[1], { dyn: t < 40 ? 1 : 2, gain: lvl, atk: 0.55, maxLen: BAR + 0.3, rel: 0.9, send: 0.5, pan: 0.2 });
    note(t + 0.03, "vlnSus", c.chord[2], { dyn: 1, gain: lvl * 0.65, atk: 0.6, maxLen: BAR + 0.2, rel: 0.9, send: 0.5, pan: 0.3 });
  }
  // sub 跟根音
  sub(t, BAR + 0.2, 440 * Math.pow(2, (c.low - 69) / 12), t < 22.8 ? 0.7 : 1.0);
}
// 38.8–40 懸浮：小提琴長音撐住
note(38.8, "vlnSus", 55, { dyn: 1, gain: 0.5, atk: 0.3, maxLen: 1.4, rel: 0.6, send: 0.6 });
note(38.82, "vlnSus", 62, { dyn: 1, gain: 0.45, atk: 0.3, maxLen: 1.4, rel: 0.6, send: 0.6 });

// 小提琴斷奏 ostinato：8 分（音型 根-根-5度-8度），66.8 起 16 分
for (let t = 4.8; t < 76.3; t += BEAT / 2) {
  if (inBreath(t) && !(t >= 57.2 && t < 62.0)) continue; // 57.2 呼吸段保留 ostinato
  if (t >= 38.8 && t < 40.0) continue;
  const c = chordAt(t);
  const step = Math.round((t - 4.8) / (BEAT / 2));
  if (t < 38.8) {
    // A 段：小提琴 ostinato + 大提琴正拍
    const patt = [0, 0, 7, 12];
    const dyn = t < 22.8 ? 1 : 2;
    const lvl = t < 13.2 ? 0.5 : t < 30.4 ? 0.6 : 0.7;
    note(t, "vlnSpic", c.root + 12 + patt[step % 4], { dyn, gain: lvl, pan: 0.15, send: 0.3 });
    if (t >= 22.8 && step % 2 === 0) note(t, "vcSpic", c.root, { dyn, gain: lvl * 0.8, pan: -0.2, send: 0.3 });
  } else {
    // B 段：大提琴 riff 當節奏引擎，小提琴讓位給 B 主題
    const patt = [0, 0, 7, 0];
    const lvl = t < 66.8 ? 0.75 : 0.85;
    note(t, "vcSpic", c.root + patt[step % 4], { dyn: 2, gain: lvl, pan: -0.2, send: 0.3 });
    if (t >= 66.8) note(t + BEAT / 4, "vlnSpic", c.root + 24, { dyn: 2, gain: 0.5, pan: 0.25, send: 0.3 });
  }
}

// A 主題（敘事段）：法國號長音，尾音 B = 新調的屬音預備
for (const [t, m, len] of [[30.4, 57, 4.6], [35.2, 59, 3.4]]) {
  note(t, "horn", m, { dyn: 2, gain: 0.55, atk: 0.25, maxLen: len, rel: 1.0, send: 0.55 });
  note(t + 0.025, "horn", m - 12, { dyn: 1, gain: 0.28, atk: 0.3, maxLen: len, rel: 1.0, send: 0.55 });
}

// B 主題（demo 段，C 大調）：全新旋律身分，2 小節一句，兩種句尾輪替
const BT_A = [[0, 64, 0.85], [0.9, 67, 0.28], [1.2, 69, 1.15], [2.4, 67, 0.55], [3.0, 64, 0.55], [3.6, 62, 0.55], [4.2, 60, 0.55]];
const BT_B = [[0, 64, 0.85], [0.9, 67, 0.28], [1.2, 69, 1.15], [2.4, 71, 0.55], [3.0, 72, 1.6]];
function bTheme(t0, oct, vGain, withHorn) {
  const phrase = Math.round((t0 - 40) / 4.8) % 2 === 1 ? BT_B : BT_A;
  for (const [dt, m, len] of phrase) {
    note(t0 + dt, "vlnSus", m + oct, { dyn: 2, gain: vGain, atk: 0.09, maxLen: len, rel: 0.35, send: 0.5, pan: 0.15 });
    if (withHorn) note(t0 + dt + 0.02, "horn", m - 12, { dyn: 2, gain: vGain * 0.55, atk: 0.12, maxLen: len, rel: 0.4, send: 0.5 });
  }
}
bTheme(40.0, 0, 0.8, false);
bTheme(44.8, 0, 0.85, true);
bTheme(49.6, 0, 0.9, true);
for (const [dt, m, len] of BT_A.slice(0, 3)) note(54.4 + dt, "vlnSus", m, { dyn: 2, gain: 0.8, atk: 0.09, maxLen: len, rel: 0.5, send: 0.5, pan: 0.15 });
bTheme(62.0, 12, 0.9, true);
bTheme(66.8, 12, 1.0, true);
bTheme(71.6, 12, 1.0, true);

// 鋼琴動機回聲：稀疏點綴（每 8 小節一句）
for (const [t, m] of [[14.4, 81], [24.0, 84], [33.6, 81], [43.2, 88], [52.8, 84], [62.4, 88]]) {
  pianoNote(t, m, { dyn: 1, gain: 0.5, send: 0.6, pan: 0.1 });
}

// 豎琴：段落開頭上行琶音（40 / 47.6 / 62 / 66.8）
for (const t0 of [40.0, 47.6, 62.0, 66.8]) {
  const c = chordAt(t0);
  [0, 1, 2, 3].forEach((i) => {
    note(t0 + i * 0.09, "harp", c.chord[i % 3] + 12 * Math.floor(i / 3) + 12, { gain: 0.55, pan: 0.35, send: 0.5 });
  });
}

/* ── 40 秒風格切換：The Drop ──
   進場 fill（定音鼓加速）+ 吊鈸漸強頂點卡在 40.0，
   然後 crash + 大鼓齊下，節奏組進場。 */
hit(38.85, timpHits, { gain: 0.35, send: 0.4 });
hit(39.15, timpHits, { gain: 0.42, send: 0.4 });
hit(39.45, timpHits, { gain: 0.5, send: 0.4 });
hit(39.6, timpHits, { gain: 0.58, send: 0.4 });
hit(39.75, timpHits, { gain: 0.68, send: 0.4 });
hit(39.9, timpHits, { gain: 0.8, send: 0.4 });
hitEnd(40.0, susCresc, { gain: 0.55, send: 0.5 });
hit(40.0, crash, { gain: 0.75, send: 0.5 });

// 半速律動（40–57.2）：kick 1、3 拍，軍鼓 3 拍 backbeat（重量感）
for (let t = 40.0; t < 57.2; t += BAR) {
  ekick(t, 0.85);
  ekick(t + BEAT * 2, 0.7);
  hit(t + BEAT * 2, snares, { gain: 0.42, send: 0.45 });
}
// 鈴鼓 8 分：47.6 起加入
for (let t = 47.6; t < 57.2; t += BEAT / 2) hit(t, tambs, { gain: 0.26, send: 0.3 });
// 呼吸段（57.2–62）：只留 kick 心跳
for (let t = 57.2; t < 62.0; t += BAR) ekick(t, 0.5);
// 全速律動（62–76.3）：four-on-floor + 軍鼓 2、4 拍（雙倍時感 = 再升一級）
for (let t = 62.0; t < 76.3; t += BEAT) ekick(t, 0.8);
for (let t = 62.0 + BEAT; t < 76.3; t += BEAT * 2) hit(t, snares, { gain: 0.46, send: 0.45 });
for (let t = 62.0; t < 71.0; t += BEAT / 2) hit(t, tambs, { gain: 0.28, send: 0.3 });
for (let t = 71.0; t < 76.3; t += BEAT / 4) hit(t, tambs, { gain: 0.3, send: 0.3 });

// 定音鼓：22.8 起小節重拍（前段不變），62 起每兩拍，71 起加密
for (let t = 22.8; t < 38.8; t += BAR) hit(t, timpHits, { gain: 0.55, send: 0.4 });
for (let t = 40.0; t < 62.0; t += BAR) hit(t, timpHits, { gain: 0.6, send: 0.4 });
for (let t = 62.0; t < 71.0; t += BEAT * 2) hit(t, timpHits, { gain: 0.65, send: 0.4 });
for (let t = 71.0; t < 74.6; t += BEAT) hit(t, timpHits, { gain: 0.7, send: 0.4 });
for (let t = 74.6; t < 76.3; t += BEAT / 2) hit(t, timpHits, { gain: 0.8, send: 0.4 });
// 終點推進：定音鼓滾奏 + 軍鼓滾奏 + 吊鈸長漸強
hit(73.6, timpRolls, { gain: 0.7, maxLen: 2.8, rel: 0.5, send: 0.5 });
hit(74.6, snareRolls, { gain: 0.5, maxLen: 1.7, rel: 0.3, send: 0.5 });
hitEnd(76.38, susCrescL, { gain: 0.7, send: 0.5 });
// 大鼓：結構重音
for (const [t, g] of [[4.6, 0.7], [22.8, 0.8], [40.0, 1.1], [62.0, 0.9], [66.8, 1.0]]) hit(t, bdrums, { gain: g, send: 0.45 });

// 呼吸段（57.2–62）：鋼琴高音動機獨白
pianoNote(57.5, 76, { dyn: 2, gain: 0.65, send: 0.6 });
pianoNote(58.4, 79, { dyn: 1, gain: 0.55, send: 0.6 });
pianoNote(58.7, 81, { dyn: 2, gain: 0.7, send: 0.6 });
pianoNote(59.9, 79, { dyn: 1, gain: 0.55, send: 0.6 });
pianoNote(60.5, 76, { dyn: 2, gain: 0.6, send: 0.6 });
pianoNote(61.1, 74, { dyn: 1, gain: 0.5, send: 0.6 });

// 滴答貫穿 demo
for (let t = 40.0; t < 76.3; t += BEAT / 2) tick(t, 0.14);
for (let t = 38.8; t < 40.0; t += BEAT / 2) tick(t, 0.6);
riser(40.0, 2.8, 0.7);
riser(76.4, 3.4, 1.0);

// S7 揭示：硬切 → 大鼓 + 定音鼓 + 全體長音 Am add9 + 鋼琴動機
const cutS = at(76.36);
const cutE = at(76.5);
hit(76.52, bdrums, { gain: 1.3, send: 0.6 });
hit(76.52, gongs, { gain: 0.9, send: 0.65 });
hit(76.54, crash, { gain: 0.55, send: 0.6 });
hit(76.55, timpHits, { gain: 0.9, send: 0.6 });
note(76.55, "vcSus", 48, { dyn: 3, gain: 1.4, atk: 0.4, maxLen: 6.4, rel: 1.6, send: 0.6, pan: -0.2 });
note(76.6, "vcSus", 55, { dyn: 1, gain: 1.0, atk: 0.5, maxLen: 6.2, rel: 1.6, send: 0.6 });
note(76.6, "vlnSus", 60, { dyn: 2, gain: 1.15, atk: 0.5, maxLen: 6.2, rel: 1.6, send: 0.6, pan: 0.2 });
note(76.65, "vlnSus", 64, { dyn: 1, gain: 1.0, atk: 0.6, maxLen: 6.0, rel: 1.6, send: 0.6, pan: 0.3 });
note(76.65, "vlnSus", 74, { dyn: 1, gain: 0.9, atk: 0.7, maxLen: 6.0, rel: 1.6, send: 0.6, pan: 0.1 });
note(76.7, "horn", 60, { dyn: 3, gain: 1.15, atk: 0.3, maxLen: 5.6, rel: 1.6, send: 0.6 });
sub(76.5, 7.4, 65.41, 1.6);
pianoNote(78.4, 69, { dyn: 3, gain: 1.0, send: 0.65 });
pianoNote(79.6, 72, { dyn: 2, gain: 0.9, send: 0.65 });
pianoNote(80.8, 76, { dyn: 3, gain: 1.05, send: 0.65 });

/* ---------- 殘響（加長版 Schroeder + 預延遲） ---------- */
function reverb(input, tunings) {
  const out = new Float64Array(N);
  const pre = Math.round(0.02 * SR);
  const combs = tunings.map((len) => ({ buf: new Float64Array(len), idx: 0, filt: 0 }));
  const FB = 0.88;
  const DAMP = 0.35;
  const aps = [347, 113, 41].map((ms) => ({ buf: new Float64Array(Math.round((ms * SR) / 10000)), idx: 0 }));
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
const revL = reverb(wetL, [1687, 1931, 2053, 2251, 1422, 1789]);
const revR = reverb(wetR, [1721, 1963, 2087, 2293, 1447, 1823]);

/* ---------- 混音、母帶 ---------- */
const outL = new Float64Array(N);
const outR = new Float64Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  let l = dryL[i] + revL[i] * 1.1;
  let r = dryR[i] + revR[i] * 1.1;
  if (i >= cutS && i < cutE) {
    l = 0;
    r = 0;
  }
  l = Math.tanh(l * 1.1);
  r = Math.tanh(r * 1.1);
  outL[i] = l;
  outR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const norm = 0.92 / peak;
const fadeOutStart = at(82.6);
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < 1800) g *= i / 1800;
  if (i > fadeOutStart) g *= Math.max(0, 1 - (i - fadeOutStart) / (N - fadeOutStart));
  outL[i] *= g;
  outR[i] *= g;
}

for (let w = 0; w < DUR; w += 2.5) {
  const s = at(w);
  const e = at(Math.min(w + 2.5, DUR));
  let sum = 0;
  for (let i = s; i < e; i++) sum += outL[i] * outL[i] + outR[i] * outR[i];
  const rms = Math.sqrt(sum / (2 * (e - s)));
  console.log(`${w.toFixed(1).padStart(5)}s  RMS ${rms.toFixed(3)}  ${"#".repeat(Math.round(rms * 110))}`);
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
const out = path.join(__dirname, "..", "public", "music-orch.wav");
fs.writeFileSync(out, bytes);
console.log(`\nWrote ${out} (${(bytes.length / 1e6).toFixed(1)} MB, peak norm ${norm.toFixed(2)})`);
