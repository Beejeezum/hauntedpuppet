const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const build=spawnSync(process.execPath,[path.join(root,'scripts/build-public.cjs')],{encoding:'utf8'});assert.equal(build.status,0,build.stderr);
for(const name of ['server.py','credential_store.py','realtime_voice.py','.env','package.json','netlify/functions/api.mts','phone_remote/phone_server.py','vendor/qrcodegen.py'])assert(!fs.existsSync(path.join(out,name)),name+' must stay off the CDN');
let modules=0;
function visit(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())visit(file);else if(item.name.endsWith('.js')){modules++;const text=fs.readFileSync(file,'utf8');for(const match of text.matchAll(/(?:from\s*|import\s*\()(['"])(\/[^'"]+\.js)\1/g))assert(fs.existsSync(path.join(out,match[2])), 'Missing published runtime module '+match[2]);}}}
visit(out);assert(modules>10);assert(fs.existsSync(path.join(out,'assets/scenes/haunted-window.png')));assert(fs.existsSync(path.join(out,'phone_remote/index.html')));
console.log('PASS public build excludes services/credentials and includes',modules,'browser modules with complete local imports.');
