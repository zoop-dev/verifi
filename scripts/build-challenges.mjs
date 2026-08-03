import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../public/challenges');
const CELL = 100;
const UA = 'verifi-challenge-builder/1.0 (https://verifi.zo0p.dev)';

const CHALLENGES = [
  { id: 'g001', question: 'Select all images containing a bicycle', ans: [0, 2, 6],
    positive: 'intitle:bicycle -path -lane -parking -rack -diagram -map -logo -icon',
    negative: 'intitle:"parked car" -diagram -map -logo' },
  { id: 'g002', question: 'Select all images containing a traffic light', ans: [1, 3, 8],
    positive: 'intitle:"traffic light" -diagram -icon -logo',
    negative: 'intitle:"stop sign" -diagram -icon' },
  { id: 'g003', question: 'Select all images containing a fire hydrant', ans: [0, 4, 7],
    positive: 'intitle:"fire hydrant" -diagram -icon -logo',
    negative: 'intitle:"street lamp" -diagram -icon -logo' },
  { id: 'g004', question: 'Select all images containing a crosswalk', ans: [2, 5, 6],
    positive: 'intitle:crosswalk -diagram -icon',
    negative: 'intitle:sidewalk -diagram -icon' },
  { id: 'g005', question: 'Select all images containing a bus', ans: [1, 4, 6, 8],
    positive: 'intitle:"city bus" -diagram -icon -logo -toy',
    negative: 'intitle:taxicab -diagram -icon -logo' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchSearch(query, needed) {
  console.log(`    search: "${query}" (need ${needed})`);
  await sleep(3000);

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrsearch', query);
  url.searchParams.set('gsrlimit', '50');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|mediatype');
  url.searchParams.set('iiurlwidth', String(CELL));
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const r = await fetch(url.toString(), { headers: { 'User-Agent': UA } });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('API parse fail: ' + text.slice(0, 80)); }
  if (!data.query) throw new Error('no results for: ' + query);

  const urls = [];
  for (const page of Object.values(data.query.pages)) {
    if (!page.imageinfo || !page.imageinfo[0]) continue;
    const ii = page.imageinfo[0];
    const u = ii.url;
    if (!u || !/\.(jpe?g|png|webp)/i.test(u)) continue;
    urls.push(u);
  }

  console.log(`    ${urls.length} usable URLs`);
  return urls;
}

async function downloadAndResize(url) {
  await sleep(500);
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  return sharp(buf).resize(CELL, CELL, { fit: 'cover' }).png().toBuffer();
}

async function getImages(query, count) {
  const urls = await fetchSearch(query, count);
  const results = [];
  for (const url of urls) {
    if (results.length >= count) break;
    try {
      const buf = await downloadAndResize(url);
      results.push(buf);
      process.stdout.write('.');
    } catch { process.stdout.write('x'); }
  }
  process.stdout.write('\n');
  if (results.length < count) {
    throw new Error(`got ${results.length}/${count} from "${query}"`);
  }
  return results;
}

async function buildGrid(posImages, negImages, ans) {
  const cells = new Array(9).fill(null);
  ans.forEach((idx, i) => { cells[idx] = posImages[i]; });
  const negPos = Array.from({ length: 9 }, (_, i) => i).filter(i => !ans.includes(i));
  negPos.forEach((idx, i) => { cells[idx] = negImages[i]; });

  return sharp({
    create: { width: CELL * 3, height: CELL * 3, channels: 3, background: { r: 17, g: 24, b: 32 } },
  }).composite(
    cells.map((buf, i) => ({
      input: buf,
      left: (i % 3) * CELL,
      top: Math.floor(i / 3) * CELL,
    }))
  ).webp({ quality: 88 }).toBuffer();
}

const usedUrls = new Set();

async function getImagesUniq(query, count) {
  console.log(`    [${query}] need ${count}`);
  const urls = await fetchSearch(query, count);
  const filtered = urls.filter(u => !usedUrls.has(u));
  const results = [];
  for (const url of filtered) {
    if (results.length >= count) break;
    try {
      const buf = await downloadAndResize(url);
      results.push(buf);
      usedUrls.add(url);
      process.stdout.write('.');
    } catch { process.stdout.write('x'); }
  }
  process.stdout.write('\n');
  if (results.length < count) throw new Error(`got ${results.length}/${count} from "${category}"`);
  return results;
}

const REBUILD = new Set(process.argv[2] ? process.argv[2].split(',') : ['g001', 'g002', 'g003', 'g004', 'g005']);
mkdirSync(OUT, { recursive: true });

for (const ch of CHALLENGES) {
  if (!REBUILD.has(ch.id)) { console.log(`\nSkipping ${ch.id}`); continue; }
  console.log(`\nBuilding ${ch.id}…`);
  try {
    const posCount = ch.ans.length;
    const negCount = 9 - posCount;
    const posImgs = await getImagesUniq(ch.positive, posCount);
    const negImgs = await getImagesUniq(ch.negative, negCount);
    const grid = await buildGrid(posImgs, negImgs, ch.ans);
    const outPath = join(OUT, `${ch.id}.webp`);
    writeFileSync(outPath, grid);
    console.log(`  saved ${(grid.length / 1024).toFixed(1)} kb`);
  } catch (e) {
    console.error(`  FAILED: ${e.message}`);
  }
  await sleep(2000);
}

console.log('\ndone.');
