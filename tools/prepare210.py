import json, pathlib, subprocess, urllib.request, tarfile, io, hashlib, re
root=pathlib.Path('.'); site=root/'site'
pins={"Leonxlnx/taste-skill":"12af471f627f866411b4bd785b19646d3672784c","pbakaus/impeccable":"e89e3ada3e875a89ac2c5d33d11e65ebef6fe285","vercel-labs/agent-skills":"1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62","microsoft/playwright-mcp":"ec572ee8354015293bed67145db21eed386e876d","ChromeDevTools/chrome-devtools-mcp":"aade3be8f65d8afc941c97b498b9752ef562f181"}
selected=[('Leonxlnx/taste-skill','skills/taste-skill','design-taste-frontend'),('pbakaus/impeccable','.agents/skills/impeccable','impeccable'),('vercel-labs/agent-skills','skills/react-best-practices','vercel-react-best-practices'),('vercel-labs/agent-skills','skills/web-design-guidelines','web-design-guidelines')]
records=[]
for repo in dict.fromkeys(x[0] for x in selected):
    data=urllib.request.urlopen('https://codeload.github.com/'+repo+'/tar.gz/'+pins[repo],timeout=120).read()
    archive=tarfile.open(fileobj=io.BytesIO(data),mode='r:gz')
    members=archive.getmembers()
    prefix=members[0].name.split('/')[0]+'/'
    for repo2,folder,name in selected:
        if repo2!=repo: continue
        dest=root/'.agents/skills'/name
        count=0
        for m in members:
            rel=m.name.removeprefix(prefix)
            if not m.isfile() or not rel.startswith(folder+'/'):continue
            part=pathlib.PurePosixPath(rel[len(folder)+1:])
            if '..' in part.parts: raise RuntimeError('Unsafe archive path')
            target=dest/pathlib.Path(str(part)); target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(archive.extractfile(m).read()); count+=1
        if not (dest/'SKILL.md').exists():raise RuntimeError('Missing skill '+name)
        records.append({'repository':repo,'commit':pins[repo],'path':str(dest),'files':count,'executed':False})
    for m in members:
        rel=m.name.removeprefix(prefix)
        if m.isfile() and '/' not in rel and re.match(r'(?i)^(license|notice|copying)',rel):
            dest=root/'third_party/notices'/repo.replace('/','--')/rel
            dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(archive.extractfile(m).read())
tracked=subprocess.check_output(['git','ls-files','site/'],text=True).splitlines()
texts=[]
for p in tracked:
    f=pathlib.Path(p)
    if f.suffix in {'.tsx','.ts','.js','.mjs','.cjs','.json','.css','.html','.py','.sh','.md'} and f.stat().st_size<3000000:
        try:texts.append((p,f.read_text()))
        except UnicodeError:pass
mapping=json.loads((site/'lib/media/external-paths.json').read_text())
byhash={}
for p in tracked:
    f=pathlib.Path(p)
    if f.is_file() and f.stat().st_size:
        h=hashlib.sha256(f.read_bytes()).hexdigest();byhash.setdefault(h,[]).append(p)
duplicates=[v for v in byhash.values() if len(v)>1]
generated=[p for p in tracked if p.endswith('.tsbuildinfo')]
removed=[]
for p in generated:
    name=pathlib.Path(p).name
    refs=[a for a,t in texts if a!=p and name in t]
    if not refs:
        subprocess.run(['git','rm','--',p],check=True);removed.append(p)
report={'baseline':209,'trackedFiles':len(tracked),'r2Mappings':len(mapping),'r2DeletionAllowed':False,'reason':'Complete bucket inventory and live D1 references must be reconciled before object deletion.','duplicateGroups':duplicates,'removedGeneratedFiles':removed,'skills':records,'unreferencedMappingCandidates':[]}
for legacy,key in mapping.items():
    refs=[p for p,t in texts if p!='site/lib/media/external-paths.json' and (legacy in t or key in t or legacy.rsplit('/',1)[-1] in t)]
    if not refs:report['unreferencedMappingCandidates'].append({'legacy':legacy,'key':key,'status':'candidate-only-live-DB-and-dynamic-use-unverified'})
out=root/'maintenance/audit-210.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
(root/'references/toolchain-210.lock.json').write_text(json.dumps({'pins':pins,'skills':records,'mcpStatus':'reviewed-upstreams-not-activated-in-host','upstreamCodeExecuted':False},indent=2)+'\n')
print('TFAM_AUDIT_SUMMARY='+json.dumps({'trackedFiles':len(tracked),'duplicateGroups':len(duplicates),'mappingCandidates':len(report['unreferencedMappingCandidates']),'generatedRemoved':removed,'skills':len(records)}))
