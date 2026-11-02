"""One-run RSA-OAEP relay. Private key and decrypted Sites token exist in runner memory only."""
import base64,json,os,pathlib,subprocess,time
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import rsa,padding
repo=os.environ["GITHUB_REPOSITORY"]
reviewed=os.environ["TFAM_REVIEWED_GITHUB_SHA"]
branch="task/update210-key-exchange-"+os.environ["GITHUB_RUN_ID"]
def git(*args):
    return subprocess.check_output(["git",*args],text=True).strip()
key=rsa.generate_private_key(public_exponent=65537,key_size=3072)
public=key.public_key().public_bytes(serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo).decode()
git("config","user.name","github-actions[bot]")
git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
git("switch","-c",branch)
path=pathlib.Path("ops/transfer/210-public-key.pem");path.parent.mkdir(parents=True,exist_ok=True);path.write_text(public)
git("add",str(path));git("commit","-m","Publish one-run public encryption key; no credentials [skip ci]")
git("push","origin","HEAD:"+branch)
print("Public key ready on "+branch,flush=True)
try:
    sealed=None
    for _ in range(120):
        git("fetch","--no-tags","--depth=1","origin","refs/heads/"+branch)
        response=subprocess.run(["git","show","FETCH_HEAD:ops/transfer/210-sealed-token.txt"],capture_output=True,text=True)
        if response.returncode==0:
            sealed=base64.b64decode(response.stdout.strip(),validate=True);break
        time.sleep(5)
    if sealed is None:raise RuntimeError("One-run credential handoff timed out; no source was pushed")
    payload=json.loads(key.decrypt(sealed,padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),algorithm=hashes.SHA256(),label=None)))
    assert payload["project_id"]=="appgprj_6abf3718495481919a2cd6954776f57e"
    assert payload["github_commit"]==reviewed
    assert payload["branch"]=="main"
    child=dict(os.environ,TFAM_SITES_TOKEN=payload["token"],TFAM_SITES_BRANCH=payload["branch"])
    result=subprocess.run(["python3","tools/push210-source.py"],env=child)
    child.clear();payload.clear();sealed=None
    if result.returncode:raise RuntimeError("Sites source push failed; inspect the safe source-step logs")
    git("switch","-c","task/update210-release-receipt",reviewed)
    git("add","ops/releases/210-source.json")
    git("commit","-m","Record exact Sites source commit for TFAM210")
    git("push","origin","HEAD:task/update210-release-receipt")
finally:
    key=None
    subprocess.run(["git","push","origin","--delete",branch],check=False)
