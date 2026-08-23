/* The URL rules from SCHEMA.md, in one place.
 *
 * WHY THIS IS SHARED HERE AND LAYERED ELSEWHERE. Margin, the relay and this repository each
 * keep their own copy of these rules on purpose: they are checking different things (its own
 * output for mistakes, a stranger's input for attacks, what enters the repository), so drift
 * between them degrades in the safe direction. That argument does not extend to two tools in
 * one repository checking the same file for the same reason. Here duplication would just be
 * two places to fix, so `validate.mjs` and `build-index.mjs` import this.
 *
 * No dependencies, so there is nothing to install and nothing to trust.
 */

/* Hosts where a path is somebody's own space, or where the address is the password.
   Kept in step with NEVER_SHARE in Margin's config.js. */
export const NEVER_HOSTS = [
  'google.com', 'googleusercontent.com', 'gle', 'goo.gl',
  'dropbox.com', 'box.com', 'onedrive.live.com', '1drv.ms', 'sharepoint.com',
  'icloud.com', 'wetransfer.com', 'mega.nz',
  'instructure.com', 'schoology.com', 'canvas.net', 'blackboard.com', 'moodlecloud.com',
  'seesaw.me', 'classdojo.com', 'padlet.com', 'wakelet.com', 'flip.com', 'flipgrid.com',
  'nearpod.com', 'peardeck.com', 'quizizz.com', 'blooket.com', 'kahoot.it', 'gimkit.com',
  'exploros.com',
  'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'rebrand.ly'
];

/* An opaque id in the path: long, mixed letters and digits, and no separator. Real page slugs use
   hyphens (`humid-subtropical-climate`); ids do not. Narrow on purpose — a rule that also refused
   ordinary slugs would get switched off. */
export const IDISH = /(^|\/)(?=[^/]{16,})(?=[^/]*[A-Za-z])(?=[^/]*\d)[A-Za-z0-9]+(\/|$)/;
export const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
export const FILE = /\.(png|jpe?g|gif|svg|webp|ico|pdf|zip|docx?|pptx?|xlsx?|mp[34]|mov|avi|css|js)$/i;
export const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i;

export const MAX_LABEL = 120;
export const MAX_BYTES = 4 * 1024 * 1024;
export const MAX_PER_HOST = 400;

/* Returns the reason a url may not appear, or '' if it may. */
export function refuse(raw) {
  let u = null;
  try { u = new URL(String(raw || '')); } catch (e) { return 'not a url'; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'not http(s)';
  if (u.search) return 'has a query string, which is where tokens live';
  if (u.hash) return 'has a fragment';
  if (u.username || u.password) return 'carries credentials';
  if (LOOPBACK.test(u.hostname)) return 'is a loopback address';
  if (!u.hostname.includes('.')) return 'hostname has no dot, so it is a private network name';
  for (const bad of NEVER_HOSTS) {
    if (u.hostname === bad || u.hostname.endsWith('.' + bad)) return 'is on ' + bad;
  }
  if (UUID.test(u.pathname)) return 'has a uuid in the path';
  if (IDISH.test(u.pathname)) return 'has an opaque id in the path — the address may be the password';
  if (FILE.test(u.pathname)) return 'is a file, not a page';
  if (u.pathname !== '/' && u.pathname.endsWith('/')) return 'has a trailing slash';
  return '';
}

/* THE FILENAME IS THE HOST CLAIM.
 *
 * `trails/earthhow.com.json` describes earthhow.com and nothing else, and CI checks the contents
 * against the name. That is what lets a contribution be merged without a person reading it: the
 * path alone bounds what the change can affect, before anybody looks inside.
 *
 * It needs no list of exceptions, which is the point. `index.json` and `example.json` are not host
 * files because `index` and `example` are not hosts — they have no dot — so the same rule that
 * validates a host also sorts the aggregate and the example out of the way. A file added later
 * called `sample.json` is likewise not a host file, and nobody has to remember to say so.
 */
export function hostOfFile(path) {
  const base = String(path).replace(/\\/g, '/').split('/').pop() || '';
  if (!base.toLowerCase().endsWith('.json')) return '';
  const name = base.slice(0, -'.json'.length);
  if (!name || /[/:?#]/.test(name)) return '';
  if (!name.includes('.')) return '';                      // index, example, sample — not hosts
  if (refuse('https://' + name + '/')) return '';
  let host = '';
  try { host = new URL('https://' + name + '/').host; } catch (e) { return ''; }
  return host === name ? host : '';
}

/* `checked` is the day this host's list was last derived FROM THE SITE. A reformat is not a
   re-crawl, so it is only ever moved by whoever fetched the pages. Plain YYYY-MM-DD: a wall-clock
   day is all the precision a crawl deserves, and it carries no time zone to argue about. */
export const CHECKED_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

export function badChecked(value, todayIso) {
  if (typeof value !== 'string' || !CHECKED_SHAPE.test(value)) return 'is not a YYYY-MM-DD date';
  const t = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(t)) return 'is not a real date';
  /* Re-serialising catches 2026-02-31, which Date.parse accepts and rolls forward. */
  if (new Date(t).toISOString().slice(0, 10) !== value) return 'is not a real date';
  if (todayIso && value > todayIso) return 'is in the future';
  return '';
}
