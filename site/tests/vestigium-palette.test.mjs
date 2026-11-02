import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const palettes=JSON.parse(fs.readFileSync('lib/vestigium-display-palettes.json','utf8'));
const lum=h=>h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
test('all eight exhibition pigments remain readable on ivory and rank washes',()=>{assert.equal(palettes.length,8);assert.equal(new Set(palettes.map(p=>p.ink)).size,8);for(const p of palettes){for(const bg of ['#fffaf0','#f5efe4',p.wash])assert.ok(ratio(p.ink,bg)>=4.5,p.name+' '+bg);}});
