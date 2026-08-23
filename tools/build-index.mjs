#!/usr/bin/env node
/* Rebuild trails/index.json from the per-host files.
 *
 *   node tools/build-index.mjs           write it
 *   node tools/build-index.mjs --check   say whether it is in step, write nothing (for CI)
 *
 * WHY THE AGGREGATE STILL EXISTS. The per-host layout is the one worth reading: a consumer wants
 * the pages on ONE site it is already looking at, so fetching a file that grows with every other
 * site is bytes and latency spent on nothing. But every copy of Margin shipped before the split
 * asks for `trails/index.json`, and one of them is on a laptop that does not get updated often.
 * Deleting it would break a teacher's Options button to save a file nobody has to fetch. So it is
 * generated, never hand-edited, and CI fails if it drifts.
 *
 * IT CARRIES NO `checked` DATE, ON PURPOSE. Its hosts were crawled on different days, and one date
 * over all of them would be a claim about the oldest that is only true of the newest. A reader that
 * wants the age of a site reads that site's own file.
 *
 * No dependencies, so there is nothing to install and nothing to trust.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostOfFile } from './rules.mjs';

const DIR = 'trails';
const OUT = DIR + '/index.json';

/* Highest wins, compared as numbers. Lexically, '1.9.0' beats '1.44.0' and the aggregate would
   claim to have been written by an older Margin than the file it came from. */
function newer(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x > y ? a : b;
  }
  return a;
}

const hostFiles = readdirSync(DIR)
  .filter(n => n.toLowerCase().endsWith('.json'))
  .filter(n => hostOfFile(n))
  .sort();

if (!hostFiles.length) {
  console.log('no per-host files under ' + DIR + '/ — nothing to aggregate');
  process.exit(1);
}

let what = '', rule = '', version = '0.0.0';
const trails = {};
const problems = [];

for (const name of hostFiles) {
  const host = hostOfFile(name);
  let body = null;
  try { body = JSON.parse(readFileSync(DIR + '/' + name, 'utf8')); }
  catch (e) { problems.push(name + ' is not valid JSON: ' + e.message); continue; }

  const list = body && body.trails && body.trails[host];
  if (!Array.isArray(list) || !list.length) {
    problems.push(name + ' has no pages for ' + host);
    continue;
  }

  /* The two sentences that explain the file are the same in every one of them. If they ever are
     not, that is somebody editing prose in one place, and the aggregate must not pick a winner
     silently. */
  if (!what) what = body.what; else if (body.what !== what) problems.push(name + ' has a different "what" line');
  if (!rule) rule = body.rule; else if (body.rule !== rule) problems.push(name + ' has a different "rule" line');
  version = newer(version, body.version || '0.0.0');

  trails[host] = list.slice().sort((a, b) => (a.href < b.href ? -1 : a.href > b.href ? 1 : 0));
}

if (problems.length) {
  console.log('cannot build the aggregate:');
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
}

const ordered = {};
for (const host of Object.keys(trails).sort()) ordered[host] = trails[host];

const built = JSON.stringify({ what, rule, version, trails: ordered }, null, 2) + '\n';
const pages = Object.values(ordered).reduce((n, l) => n + l.length, 0);

if (process.argv.includes('--check')) {
  let have = '';
  try { have = readFileSync(OUT, 'utf8'); } catch (e) { have = ''; }
  if (have === built) {
    console.log('ok   ' + OUT + ' is in step — ' + hostFiles.length + ' site(s), ' + pages + ' page(s)');
    process.exit(0);
  }
  console.log('FAIL ' + OUT + ' is not what the per-host files say it should be.');
  console.log('       Run: node tools/build-index.mjs');
  console.log('       It is generated. Add pages to the host file, never to the aggregate.');
  process.exit(1);
}

writeFileSync(OUT, built);
console.log('wrote ' + OUT + ' — ' + hostFiles.length + ' site(s), ' + pages + ' page(s), version ' + version);
