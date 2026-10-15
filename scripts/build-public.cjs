// Publish browser assets only. Python services and credentials never belong on the CDN.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'app.js']) fs.copyFileSync(path.join(root, file), path.join(out, file));
for (const dir of ['assets', 'vendor']) fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true, filter: file => !/\.(py|key|pem|log)$|\/\.env/.test(file) });
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
