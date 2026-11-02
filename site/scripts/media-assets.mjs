import fs from 'node:fs';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('../lib/media/manifest.json',import.meta.url),'utf8'));
export const mediaRecord=asset=>manifest.assets?.[asset];
export const mediaExists=asset=>fs.existsSync('public'+asset)||!!mediaRecord(asset);
export const mediaHash=asset=>fs.existsSync('public'+asset)?crypto.createHash('sha256').update(fs.readFileSync('public'+asset)).digest('hex'):mediaRecord(asset)?.sha256;
export const mediaSize=asset=>fs.existsSync('public'+asset)?fs.statSync('public'+asset).size:mediaRecord(asset)?.bytes;

export function mediaFiles(directory){const prefix=directory.replace(/\/$/,'')+'/';return [...new Set([...(fs.existsSync('public'+directory)?fs.readdirSync('public'+directory):[]),...Object.keys(manifest.assets||{}).filter(k=>k.startsWith(prefix)&&!k.slice(prefix.length).includes('/')).map(k=>k.slice(prefix.length))])];}
