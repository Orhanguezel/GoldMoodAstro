import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const WEB_DIR = join(ROOT, 'frontend', 'public', 'sounds', 'relax');
const MOBILE_DIR = join(ROOT, 'mobile', 'app', 'assets', 'sounds', 'relax');
const TMP_DIR = join('/tmp', 'goldmoodastro-relax-stems');
const DURATION = 90;
const HALF = DURATION / 2;

type Stem = {
  id: string;
  description: string;
  filter: string;
};

const loop = (source: string) =>
  `${source},asplit=2[forward][reverse];[reverse]areverse[back];[forward][back]concat=n=2:v=0:a=1`;

const stems: Stem[] = [
  {
    id: 'pad',
    description: 'Generated warm tonal ambient pad, integer-cycle sine layers.',
    filter: loop(
      `sine=frequency=110:sample_rate=44100:duration=${HALF}[a];` +
        `sine=frequency=165:sample_rate=44100:duration=${HALF}[b];` +
        `sine=frequency=220:sample_rate=44100:duration=${HALF}[c];` +
        '[a][b][c]amix=inputs=3:normalize=0,lowpass=f=900,volume=0.08',
    ),
  },
  {
    id: 'rain',
    description: 'Generated soft pink-noise rain bed.',
    filter: loop(`anoisesrc=color=pink:amplitude=0.24:sample_rate=44100:duration=${HALF},highpass=f=900,lowpass=f=6500,volume=0.52`),
  },
  {
    id: 'wind',
    description: 'Generated low airy wind texture.',
    filter: loop(`anoisesrc=color=brown:amplitude=0.28:sample_rate=44100:duration=${HALF},highpass=f=120,lowpass=f=1700,tremolo=f=0.10:d=0.45,volume=0.7`),
  },
  {
    id: 'water',
    description: 'Generated stream-like filtered noise texture.',
    filter: loop(`anoisesrc=color=white:amplitude=0.20:sample_rate=44100:duration=${HALF},highpass=f=450,lowpass=f=3200,tremolo=f=0.22:d=0.28,volume=0.58`),
  },
  {
    id: 'chimes',
    description: 'Generated sparse glass-chime tone bed without a recognizable melody.',
    filter: loop(
      `sine=frequency=660:sample_rate=44100:duration=${HALF}[a];` +
        `sine=frequency=990:sample_rate=44100:duration=${HALF}[b];` +
        `sine=frequency=1320:sample_rate=44100:duration=${HALF}[c];` +
        '[a]tremolo=f=0.12:d=0.95,volume=0.030[aa];' +
        '[b]tremolo=f=0.10:d=0.88,volume=0.020[bb];' +
        '[c]tremolo=f=0.10:d=0.80,volume=0.014[cc];' +
        '[aa][bb][cc]amix=inputs=3:normalize=0,aecho=0.6:0.35:900|2100:0.25|0.16',
    ),
  },
  {
    id: 'forest',
    description: 'Generated soft forest floor texture with non-melodic high chirps.',
    filter: loop(
      `anoisesrc=color=pink:amplitude=0.18:sample_rate=44100:duration=${HALF},lowpass=f=2600,volume=0.42[n];` +
        `sine=frequency=1760:sample_rate=44100:duration=${HALF},tremolo=f=0.18:d=0.82,volume=0.012[c];` +
        '[n][c]amix=inputs=2:normalize=0',
    ),
  },
  {
    id: 'binaural',
    description: 'Generated low-frequency meditation hum.',
    filter: loop(
      `sine=frequency=55:sample_rate=44100:duration=${HALF}[a];` +
        `sine=frequency=59:sample_rate=44100:duration=${HALF}[b];` +
        '[a][b]amix=inputs=2:normalize=0,lowpass=f=220,volume=0.10',
    ),
  },
  {
    id: 'crackle',
    description: 'Generated warm crackle texture from filtered violet noise.',
    filter: loop(`anoisesrc=color=violet:amplitude=0.18:sample_rate=44100:duration=${HALF},highpass=f=1600,lowpass=f=7800,volume=0.34`),
  },
];

async function run(cmd: string, args: string[]) {
  const proc = Bun.spawn([cmd, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    throw new Error(`${cmd} failed (${code})\n${stdout}\n${stderr}`);
  }
}

async function sha256(path: string) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
}

async function main() {
  await mkdir(WEB_DIR, { recursive: true });
  await mkdir(MOBILE_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  const rows: string[] = [];
  rows.push('# Relax Music Stem Licenses');
  rows.push('');
  rows.push('All stems in this manifest are generated inside the GoldMoodAstro project from procedural ffmpeg sources. No third-party samples, melodies, voices, or recordings are included.');
  rows.push('');
  rows.push('| file | source_url | license | downloaded | sha256 | notes |');
  rows.push('|------|------------|---------|------------|--------|-------|');

  for (const stem of stems) {
    const wav = join(TMP_DIR, `${stem.id}.wav`);
    await run('ffmpeg', [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      stem.filter,
      '-t',
      String(DURATION),
      '-ac',
      '1',
      '-ar',
      '44100',
      '-af',
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      wav,
    ]);

    const webm = join(WEB_DIR, `${stem.id}.webm`);
    const mp3 = join(WEB_DIR, `${stem.id}.mp3`);
    const m4a = join(MOBILE_DIR, `${stem.id}.m4a`);

    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '64k', webm]);
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '96k', mp3]);
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '80k', m4a]);

    for (const [file, path] of [
      [`${stem.id}.webm`, webm],
      [`${stem.id}.mp3`, mp3],
      [`${stem.id}.m4a`, m4a],
    ] as const) {
      rows.push(`| ${file} | project-generated:ffmpeg-procedural | Project-generated zero-attribution commercial-use asset | 2026-05-16 | ${await sha256(path)} | ${stem.description} |`);
    }
  }

  rows.push('');
  rows.push('Forbidden sources remain: mynoise.net, personal-use-only assets, CC-BY, CC-NC, and attribution-required free tiers.');
  await writeFile(join(WEB_DIR, 'licenses.md'), `${rows.join('\n')}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
