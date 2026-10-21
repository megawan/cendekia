// Records the audio for every sound, word and phrase in the content block of index.html, using the
// macOS English voice Samantha, and writes audio/index.json for the service worker.
//
//   node tools/make-audio.mjs            records only the missing files
//   node tools/make-audio.mjs --force    records every file again
//
// Needs macOS `say` and `ffmpeg`. Replace any file with your own recording of the same name.
//
// Letter sounds cannot be typed for a speech voice ("mmm" is read as "em em em"), so most of them are cut
// out of a recorded word instead (see `cut` in the content block):
//   vowel  the start of a word that begins with the vowel, up to the closure of the next consonant (a from "apple")
//   fric   the hiss at the start of a word, found by its high zero-crossing rate (s from "sun")
//   son    the hum at the start of a word, up to the sharp rise of high frequencies where the vowel begins (m from "mat")
//   final  the end of a word, after its vowel (x from "box")
// Sounds that cannot be said alone (t, p, b ...) use a short spelled syllable in `say` ("tuh").
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const VOICE = 'Samantha';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const C = JSON.parse(html.match(/<script type="application\/json" id="content">([\s\S]*?)<\/script>/)[1]);

// Same rule as slug() in index.html.
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const force = process.argv.includes('--force');
const outDir = join(root, 'audio');
const tmp = mkdtempSync(join(tmpdir(), 'phonics-'));
const aiff = join(tmp, 'say.aiff');
const RATE = 16000, WIN = 160, HOP = 80; // 10 ms windows every 5 ms

function record(text, rate) {
  execFileSync('say', ['-v', VOICE, '-r', String(rate), '-o', aiff, text]);
}
function samples() {
  const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-']);
  return new Int16Array(b.buffer, b.byteOffset, b.length / 2);
}
// Loudness, zero-crossing rate and a high-frequency ratio for each window.
function frames(x) {
  const out = [];
  for (let i = 0; i + WIN <= x.length; i += HOP) {
    let e = 0, z = 0, d = 0;
    for (let k = i; k < i + WIN; k++) {
      e += x[k] * x[k];
      if (k > i) { d += (x[k] - x[k - 1]) ** 2; if ((x[k] >= 0) !== (x[k - 1] >= 0)) z++; }
    }
    out.push({ rms: Math.sqrt(e / WIN), zcr: z / WIN, hf: e ? Math.sqrt(d / e) : 0 });
  }
  return out;
}
// Returns [first, last] window of the sound, or throws when nothing plausible is found.
function findCut(f, kind) {
  const peak = Math.max(...f.map((q) => q.rms));
  const pk = f.findIndex((q) => q.rms === peak);
  const start = f.findIndex((q) => q.rms > 0.03 * peak);
  let a = start, b = -1;
  if (kind === 'vowel') {
    b = f.findIndex((q, i) => i > pk && q.rms < 0.15 * peak);
  } else if (kind === 'fric') {
    a = f.findIndex((q) => q.zcr > 0.2 && q.rms > 0.002 * peak);
    b = f.findIndex((q, i) => i > a && q.zcr < 0.12 && f[i + 1] && f[i + 1].zcr < 0.12);
    a = Math.max(0, a - 1);
  } else if (kind === 'son') {
    const base = f.slice(start, start + 3).map((q) => q.hf).sort((p, q) => p - q)[1];
    b = f.findIndex((q, i) => i > start + 2 && q.hf > Math.max(0.15, base * 1.8));
    b -= 1;
  } else if (kind === 'final') {
    a = f.findIndex((q, i) => i > pk && q.rms < 0.15 * peak);
    b = f.length - 1;
    while (b > a && f[b].rms < 0.03 * peak) b--;
  }
  const ms = (b - a) * HOP / RATE * 1000;
  if (a < 0 || b <= a || ms < 30 || ms > 450) throw new Error(`no ${kind} cut found (${Math.round(ms)} ms)`);
  return [a, b];
}
// Cuts the windows out, evens out the volume, fades the edges and stretches short hums and hisses.
function writeCut(x, a, b, kind, out) {
  const seg = Float32Array.from(x.slice(a * HOP, b * HOP + WIN));
  const peak = seg.reduce((m, v) => Math.max(m, Math.abs(v)), 1);
  const gain = Math.min(20, 0.9 * 32767 / peak);
  const fin = Math.round(0.008 * RATE), fout = Math.round(0.03 * RATE);
  const pcm = new Int16Array(seg.length);
  seg.forEach((v, i) => {
    const f = Math.min(1, i / fin, (seg.length - 1 - i) / fout);
    pcm[i] = Math.round(v * gain * f);
  });
  const ms = seg.length / RATE * 1000;
  const target = kind === 'vowel' ? 240 : 300;
  const total = Math.max(0.3, Math.min(1, ms / target));
  let tempo = total;
  const chain = [];
  while (tempo < 0.5) { chain.push('atempo=0.5'); tempo /= 0.5; }
  chain.push('atempo=' + tempo.toFixed(3));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', '-',
    '-af', chain.join(',') + ',apad=pad_dur=0.08', '-ar', '22050', '-b:a', '48k', out], { input: Buffer.from(pcm.buffer) });
  return Math.round(ms / total);
}
function writeSpoken(out) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08',
    '-ac', '1', '-ar', '22050', '-b:a', '48k', out]);
}

const files = new Map(); // file name -> job
C.sounds.forEach((s) => files.set('sound-' + s.g + '.mp3', s.cut ? { cut: s.cut, from: s.from } : { text: s.say, rate: 110 }));
const phrase = (t, rate) => { if (!files.has(slug(t) + '.mp3')) files.set(slug(t) + '.mp3', { text: t, rate }); };
C.sounds.forEach((s) => phrase(s.key, 120));
C.words.forEach((w) => phrase(w.g.join(''), 120));
C.sentences.forEach((s) => { phrase(s.text, 140); s.text.split(' ').forEach((w) => phrase(w, 120)); });
Object.entries(C.phrases).filter(([k]) => k !== 'retry').flatMap(([, v]) => v).forEach((p) => phrase(p, 150));

let made = 0;
for (const [file, job] of files) {
  const out = join(outDir, file);
  if (!force && existsSync(out)) continue;
  if (job.cut) {
    record(job.from, 110);
    const x = samples();
    try {
      const [a, b] = findCut(frames(x), job.cut);
      const ms = writeCut(x, a, b, job.cut, out);
      console.log(`${file}: ${job.cut} cut from "${job.from}", ${Math.round((b - a) * HOP / RATE * 1000)} ms, played over ${ms} ms`);
    } catch (e) {
      throw new Error(`${file}: ${e.message}. Pick another word in "from" or use "say".`);
    }
  } else {
    record(job.text, job.rate);
    writeSpoken(out);
  }
  made++;
}
rmSync(tmp, { recursive: true, force: true });

const stale = readdirSync(outDir).filter((f) => f.endsWith('.mp3') && !files.has(f));
writeFileSync(join(outDir, 'index.json'), JSON.stringify([...files.keys()].sort()) + '\n');
console.log(`${files.size} files, ${made} recorded.` + (stale.length ? ` Unused files: ${stale.join(', ')}` : ''));
