"""Create web AAC copies while retaining original soundtrack files in source."""
from pathlib import Path
import json, subprocess
for track in json.loads(Path('lib/soundtrack.json').read_text()):
    src=Path('art/audio-originals')/track['original']
    dest=Path('public')/track['src'].lstrip('/')
    dest.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-map','0:a:0','-vn','-c:a','aac','-b:a','96k','-movflags','+faststart',str(dest)],check=True)
    print(dest, dest.stat().st_size)
