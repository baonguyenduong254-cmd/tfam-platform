"""Web delivery preparation for individually generated flag masters.
Run with a JSON list of {id, source} paths. Does not generate or repaint artwork.
"""
import json,sys,shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for job in json.load(open(sys.argv[1])):
    source=Path(job['source'])
    master=root/'art/flags-imagen-20261029'/f"{job['id']}.png"
    shutil.copy2(source,master)
    image=Image.open(master).convert('RGB')
    if abs(image.width/image.height-1.5)>.04:
        raise ValueError(f"Unexpected flag proportions: {job['id']} {image.size}")
    image.resize((1200,800),Image.Resampling.LANCZOS).save(root/'public/heraldry/painted-v2'/f"{job['id']}.webp",quality=90,method=6)
print('Prepared painted flag WebP assets.')
