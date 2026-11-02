"""Backup only the exact owner-requested legacy oil portrait keys. Never deletes."""
import concurrent.futures,hashlib,json,pathlib,urllib.request,zipfile
paths=json.loads(pathlib.Path("site/lib/retired-portraits.json").read_text())
assert len(paths)==72 and len(set(paths))==72
root=pathlib.Path("reports/legacy-portraits-backup");root.mkdir(parents=True,exist_ok=True)
base="https://pub-a2e7030237c14362985465386fcae671.r2.dev"
def fetch(path):
    key="images"+path
    with urllib.request.urlopen(base+"/"+key,timeout=60) as response:
        assert response.status==200
        data=response.read()
    assert len(data)>1000
    assert data[:4]==b"RIFF" and data[8:12]==b"WEBP"
    filename=root/path.split("/")[-1];filename.write_bytes(data)
    return {"key":key,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    entries=sorted(pool.map(fetch,paths),key=lambda row:row["key"])
manifest={"bucket":"tfam-assets","count":72,"objects":entries,"deleted":False,"purpose":"Owner requested retirement of exactly 72 historical oil portraits; all anime paths excluded."}
(root/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
with zipfile.ZipFile("reports/legacy-portraits-72.zip","w",zipfile.ZIP_DEFLATED) as archive:
    for path in root.iterdir():archive.write(path,path.name)
pathlib.Path("maintenance/portrait-retirement-210.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("Backed up all 72 legacy portraits with checksums; no deletion performed.")
