import base64,hashlib,json,pathlib,shutil
from PIL import Image
root=pathlib.Path(".asset-ingest-210")
out=pathlib.Path("site/public")
manifest=[]
def encode(name, source, target, alpha=False):
    image=Image.open(source)
    destination=out/target
    destination.parent.mkdir(parents=True,exist_ok=True)
    if alpha:
        image=image.convert("RGBA")
        assert image.getextrema()[3][0] < 255, "Chain-lock must preserve real transparency"
        image.save(destination,"WEBP",lossless=True,method=6)
    else:
        image.convert("RGB").save(destination,"WEBP",quality=90,method=6)
    manifest.append({"id":name,"path":"/"+target,"width":image.width,"height":image.height,"bytes":destination.stat().st_size,"sha256":hashlib.sha256(destination.read_bytes()).hexdigest(),"generatedBy":"Image Gen","alpha":alpha})
if root.exists():
    encode("court",root/"court.png","art/update210/throne-hall.webp")
    encode("chain-lock",root/"chain-lock.png","art/update210/chain-lock.webp",True)
    for name in ["veldraine","nhemora","khorvait","wardenholf"]:
        data="".join(p.read_text() for p in sorted(root.glob(name+".*.b64")))
        source=root/(name+".png");source.write_bytes(base64.b64decode(data,validate=True))
        encode(name,source,"heraldry/update210/"+name+".webp")
    (out/"heraldry/update210/manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    shutil.rmtree(root)
print(json.dumps(manifest,indent=2))
