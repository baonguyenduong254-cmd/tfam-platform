"""Push exactly the reviewed GitHub site subtree to the existing Sites source branch."""
import json,os,pathlib,re,subprocess
remote="https://git.chatgpt-team.site/d5e5ae0f-6310-40cc-916a-084c41fe5202/appgprj_6abf3718495481919a2cd6954776f57e.git"
token=os.environ["TFAM_SITES_TOKEN"]
branch=os.environ["TFAM_SITES_BRANCH"]
expected=os.environ["TFAM_EXPECTED_SOURCE"]
assert token and re.fullmatch(r"[0-9a-f]{40}",expected)
assert branch=="main", "Unexpected Sites source branch; review before publishing"
auth=dict(os.environ,GIT_TERMINAL_PROMPT="0",GIT_CONFIG_COUNT="3",GIT_CONFIG_KEY_0="credential.helper",GIT_CONFIG_VALUE_0="",GIT_CONFIG_KEY_1="http."+remote+".extraHeader",GIT_CONFIG_VALUE_1="Authorization: Bearer "+token,GIT_CONFIG_KEY_2="http.followRedirects",GIT_CONFIG_VALUE_2="false")
def git(*args,env=None):
    return subprocess.check_output(["git",*args],env=env,text=True).strip()
github=git("rev-parse","HEAD");tree=git("rev-parse","HEAD:site")
git("fetch","--no-tags","--depth=1",remote,"refs/heads/"+branch,env=auth)
actual=git("rev-parse","FETCH_HEAD")
assert actual==expected, "Sites source advanced; reconcile instead of replacing it"
author=dict(os.environ,GIT_AUTHOR_NAME="TFAM release",GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com",GIT_COMMITTER_NAME="TFAM release",GIT_COMMITTER_EMAIL="41898282+github-actions[bot]@users.noreply.github.com")
commit=subprocess.check_output(["git","commit-tree",tree,"-p",actual],input="TFAM210 from GitHub "+github+"\n",env=author,text=True).strip()
git("push",remote,commit+":refs/heads/"+branch,env=auth)
record={"siteProjectId":"appgprj_6abf3718495481919a2cd6954776f57e","githubCommit":github,"sourceCommit":commit,"sourceTree":tree,"previousSourceCommit":actual,"sourcePushed":True,"siteVersionSaved":False,"productionDeployed":False}
pathlib.Path("ops/releases").mkdir(parents=True,exist_ok=True)
pathlib.Path("ops/releases/210-source.json").write_text(json.dumps(record,indent=2)+"\n")
print(json.dumps(record))
