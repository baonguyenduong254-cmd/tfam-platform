import fs from 'node:fs';
import path from 'node:path';

const distServerDir = path.resolve(process.cwd(), 'dist/server');
const sourcePath = path.join(distServerDir, 'wrangler.json');
const targetPath = path.join(distServerDir, 'wrangler.cloudflare.json');

if (!fs.existsSync(sourcePath)) {
  console.error('Missing dist/server/wrangler.json. Run `pnpm run build` first.');
  process.exit(1);
}

const workerName = (process.env.CF_WORKER_NAME || 'through-frost-and-myth').trim();
const d1Name = (process.env.CF_D1_DATABASE_NAME || 'tfam-content').trim();
const d1Id = (process.env.CLOUDFLARE_D1_DATABASE_ID || '').trim();

if (!d1Id) {
  console.error('Missing CLOUDFLARE_D1_DATABASE_ID environment variable.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
config.name = workerName;
config.topLevelName = workerName;
config.d1_databases = [
  {
    binding: 'DB',
    database_name: d1Name,
    database_id: d1Id,
  },
];

// Keep workers.dev enabled by default; custom domains can be attached in Cloudflare Dashboard.
config.workers_dev = true;

fs.writeFileSync(targetPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
console.log(`Prepared ${targetPath} (worker=${workerName}, d1=${d1Name})`);
