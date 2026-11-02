"""Verify every generated collection image and resolved public artwork path."""
import json
from pathlib import Path
from PIL import Image

root = Path('public')
base = Path('content/vestigium/editorial/rebuild-v4')
queue = json.loads((base / 'remaining-art-v10.json').read_text())
assert len(queue) == 190
assert all(x['status'] == 'illustrated' for x in queue)
total_bytes = 0
for item in queue:
    for folder, maximum, budget in [('art', 512, 32000), ('thumbs', 240, 8000)]:
        path = root / 'vestigium' / folder / (item['id'] + '.webp')
        with Image.open(path) as image:
            image.load()
            assert max(image.size) <= maximum, path
            if item['category'] not in ['creature', 'entity', 'phenomenon']:
                assert image.convert('RGBA').getextrema()[-1][0] == 0, path
        assert path.stat().st_size <= budget, path
        total_bytes += path.stat().st_size

manifest = json.loads((root / 'vestigium/manifest.json').read_text())
records = {}
for category in manifest['categories']:
    for item in json.loads((root / category['url'].lstrip('/')).read_text()):
        for field in ['artwork', 'thumbnail']:
            assert item.get(field), (item['id'], field)
            assert (root / item[field].lstrip('/')).is_file(), (item['id'], field)
        records[item['id']] = item
assert len(records) == manifest['count'] == manifest['illustrated'] == 602
print(json.dumps({'profiles': len(records), 'illustrated': manifest['illustrated'],
                  'new_art': len(queue), 'missing': 0, 'new_image_bytes': total_bytes}))
