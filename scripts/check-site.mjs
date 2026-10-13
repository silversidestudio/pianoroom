import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'dist');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const fail=m=>{throw new Error(m)};
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)fail('Duplicate IDs');
for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 const u=m[1];
 if(u.startsWith('#')){if(u.length>1&&!ids.includes(u.slice(1)))fail('Missing section '+u);continue}
 if(/^(https?:|data:)/.test(u))continue;
 if(!fs.existsSync(path.join(dir,u.split(/[?#]/)[0])))fail('Missing asset '+u);
}
for(const m of html.matchAll(/<label[^>]+for="([^"]+)"/g))if(!ids.includes(m[1]))fail('Missing form control '+m[1]);
for(const m of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g))for(const id of m[1].split(' '))if(!ids.includes(id))fail('Missing accessible description '+id);
if(!html.includes('content="noindex, follow"'))fail('Missing robots directive');
if(!html.includes('A fictional piano school website concept by'))fail('Missing concept credit');
if(!html.includes('href="https://silverside.co/"'))fail('Missing Silverside link');
if(/<(?:input|textarea)\b/i.test(html))fail('Demo must not request personal free text');
if(!html.includes('Demonstration only.'))fail('Missing demo notice');
if(/<form[^>]*\baction=/i.test(html))fail('Demo has network form action');
const js=fs.readFileSync(path.join(dir,'app.js'),'utf8');
if(/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|sendBeacon)\b/.test(js))fail('Unexpected transmission or persistence');
const syntax=spawnSync(process.execPath,['--check',path.join(dir,'app.js')],{encoding:'utf8'});
if(syntax.status!==0)fail(syntax.stderr);
for(const f of ['favicon.svg','social-card.png','robots.txt'])if(!fs.existsSync(path.join(dir,f)))fail('Missing '+f);
const png=fs.readFileSync(path.join(dir,'social-card.png'));
if(png.readUInt32BE(16)!==1200||png.readUInt32BE(20)!==630)fail('Incorrect social image dimensions');
if(fs.readFileSync(path.join(dir,'robots.txt'),'utf8').includes('Disallow: /'))fail('Crawler cannot read noindex');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'.openai/hosting.json'),'utf8'));
if(manifest.static?.directory!=='dist')fail('Wrong deployment directory');
let total=0;
for(const f of fs.readdirSync(dir)){const size=fs.statSync(path.join(dir,f)).size;if(size>500000)fail('Large production asset '+f);total+=size}
console.log('PASS: assets, fragment routes, labels, concept metadata, personal-data-free demo, JS syntax and static manifest.');
console.log('Production size: '+total+' bytes. Output: dist/');
