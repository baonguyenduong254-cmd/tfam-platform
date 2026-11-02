"""Validate the artwork paths actually published by the collection builder."""
import argparse, json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--require-all', action='store_true')
args = parser.parse_args()
manifest = json.loads(Path('public/vestigium/manifest.json').read_text())
groups = [g for g in manifest['categories'] if g['id'] != 'royal-guard']
records = [m for g in groups for m in json.loads(Path('public', g['url'].lstrip('/')).read_text())]
issues, missing, used = [], [], {}
for record in records:
    ident = record['id']
    if not record.get('artwork'):
        missing.append(ident)
        continue
    used.setdefault(record['artwork'], []).append(ident)
    for field, limit in [('artwork', 1024), ('thumbnail', 300)]:
        try:
            file = Path('public', record[field].lstrip('/'))
            with Image.open(file) as image:
                image.load()
                if max(image.size) > limit:
                    issues.append([ident, field, 'oversize', list(image.size)])
                if record['category'] != 'phenomenon':
                    alpha = image.convert('RGBA').getchannel('A')
                    low, high = alpha.getextrema()
                    if low != 0:
                        issues.append([ident, field, 'opaque background'])
                    if high == 0:
                        issues.append([ident, field, 'empty subject'])
                    histogram = alpha.histogram()
                    if sum(histogram[254:]) / (image.width * image.height) > .97:
                        issues.append([ident, field, 'nearly opaque rectangular canvas'])
        except Exception as error:
            issues.append([ident, field, str(error)])
print(json.dumps({'records': len(records), 'illustrated': len(records)-len(missing),
    'missing': len(missing), 'shared_artwork': [ids for ids in used.values() if len(ids)>1],
    'issues': issues}, ensure_ascii=False))
if issues or (args.require_all and missing):
    raise SystemExit(1)
