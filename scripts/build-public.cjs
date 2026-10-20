// Publish browser assets only. Python services and credentials never belong on the CDN.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'live.html', 'app.js']) fs.copyFileSync(path.join(root, file), path.join(out, file));
for (const dir of ['assets', 'vendor']) fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true, filter: file => !/\.(py|key|pem|log)$|\/\.env/.test(file) });
// Explicitly approved opt-in preview only; never publish the entire source tree.
const preview = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-film-preview.json'), 'utf8'));
const previewOut = path.join(out, 'assets/wisp-film-preview');
fs.mkdirSync(previewOut, {recursive:true});
for (const item of preview.files) {
  if (!item.source.startsWith('source/wisp-performance-reference/runway-pilots/') || path.basename(item.destination) !== item.destination) throw Error('Invalid preview asset path');
  const bytes = fs.readFileSync(path.join(root, item.source));
  if (bytes.length !== item.bytes || require('node:crypto').createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw Error('Unreviewed preview asset: '+item.destination);
  fs.writeFileSync(path.join(previewOut, item.destination), bytes);
}
// Explicit show desk allowlist. Rejected studies and the rest of source/ remain excluded.
const desk = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-showdesk.json'), 'utf8'));
const deskOut = path.join(out, 'assets/wisp-showdesk');
fs.mkdirSync(deskOut, {recursive:true});
for (const item of desk.files) {
  if (!/^source\/wisp-performance-reference\/(ambient-show|runway-pilots)\//.test(item.source) || path.basename(item.destination) !== item.destination) throw Error('Invalid show desk asset path');
  let bytes = fs.readFileSync(path.join(root, item.source));
  const hash = b => require('node:crypto').createHash('sha256').update(b).digest('hex');
  if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) throw Error('Unreviewed show desk asset: '+item.destination);
  if (item.rewrites) {
    let source = bytes.toString('utf8');
    for (const rewrite of item.rewrites) {
      if (source.split(rewrite.from).length !== 2) throw Error('Ambiguous show desk rewrite');
      source = source.replace(rewrite.from, rewrite.to);
    }
    bytes = Buffer.from(source);
  }
  if (hash(bytes) !== item.publishedSha256) throw Error('Show desk publication checksum mismatch');
  fs.writeFileSync(path.join(deskOut, item.destination), bytes);
}
fs.mkdirSync(path.join(out, 'phone_remote'), { recursive: true });
for (const file of ['index.html', 'phone.js', 'phone.css']) {
  const source = path.join(root, 'phone_remote', file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(out, 'phone_remote', file));
}
const bad = [];
function check(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) check(file);
    else if (/\.(py|key|pem|log)$|^\.env/.test(item.name)) bad.push(file);
  }
}
check(out);
if (bad.length) throw new Error('Private files entered the public build');
fs.writeFileSync(path.join(out, 'build-info.json'), JSON.stringify({version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,commit:process.env.COMMIT_REF||null,builtAt:new Date().toISOString()},null,2));
console.log('Browser-only build ready in dist. Backend functions are bundled separately.');
