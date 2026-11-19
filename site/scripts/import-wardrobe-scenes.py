"""Package generated environment plates and validate per-artwork associations."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
known = json.loads((root / 'docs/wardrobe-known-scenes.json').read_text())
generated = [json.loads(p.read_text()) for p in (root / 'docs/wardrobe-scenes').glob('*.json')]
records = {r['key'].lower(): r for r in known + generated}
target = root / 'public/wardrobe/scenes'
target.mkdir(parents=True, exist_ok=True)
catalog_path = root / 'lib/wardrobe-collections.json'
catalog = json.loads(catalog_path.read_text())
missing = []
for character in catalog.values():
    for looks in character.values():
        for look in looks:
            record = records.get(look['id'])
            if not record or not record.get('path'):
                missing.append(look['id'])
                continue
            destination = target / (look['id'] + '.webp')
            if not destination.exists():
                image = Image.open(record['path']).convert('RGB')
                image.thumbnail((1920, 1200), Image.Resampling.LANCZOS)
                image.save(destination, 'WEBP', quality=90, method=4)
            if record.get('scene'):
                look['scene'] = record['scene'].split(',')[0].capitalize()
catalog_path.write_text(json.dumps(catalog, indent=2) + '\n')
print(json.dumps({'packaged': len(list(target.glob('*.webp'))), 'missing': missing}))
