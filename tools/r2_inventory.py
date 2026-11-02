"""Read-only inventory classification. No R2 write/delete operations."""
import json
import pathlib
import subprocess
import sys
import urllib.parse

def classify(objects, mapping, source):
    mapped = set(mapping.values())
    keys = {obj["Key"] for obj in objects}
    rows = []
    for obj in objects:
        key = obj["Key"]
        decoded = urllib.parse.unquote(key)
        if key in mapped:
            status = "keep-mapped"
        elif key in source or decoded in source:
            status = "keep-static-reference"
        else:
            status = "needs-dynamic-and-live-content-review"
        rows.append({**obj, "status": status, "deleteApproved": False})
    return {"objects": rows, "missingMappedKeys": sorted(mapped - keys),
            "deletionManifest": [], "liveContentChecked": False,
            "dynamicReferencesChecked": False,
            "warning": "Absence from static source is not evidence that an object is unused."}

def self_test():
    result = classify([{"Key": "images/keep.webp"}, {"Key": "audio/song.mp3"},
                       {"Key": "images/unknown.webp"}],
                      {"/keep": "images/keep.webp", "/missing": "images/missing.webp"},
                      'play("audio/song.mp3")')
    assert [r["status"] for r in result["objects"]] == [
        "keep-mapped", "keep-static-reference", "needs-dynamic-and-live-content-review"]
    assert result["missingMappedKeys"] == ["images/missing.webp"]
    assert result["deletionManifest"] == []
    assert all(not r["deleteApproved"] for r in result["objects"])
    print("Classification checks passed; unknown references never authorize deletion.")

if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
        raise SystemExit
    raw = json.loads(pathlib.Path("reports/r2-objects.json").read_text())
    if raw.get("IsTruncated"):
        raise RuntimeError("Incomplete object listing; refusing to classify")
    objects = raw.get("Contents", [])
    mapping = json.loads(pathlib.Path("site/lib/media/external-paths.json").read_text())
    chunks = []
    for name in subprocess.check_output(["git", "ls-files", "-z", "site"]).decode().split("\0"):
        if not name or name == "site/lib/media/external-paths.json":
            continue
        path = pathlib.Path(name)
        if not path.is_file():
            continue
        try:
            value = path.read_text(encoding="utf-8")
            if "\0" not in value:
                chunks.append(value)
        except (UnicodeError, OSError):
            continue
    report = classify(objects, mapping, "\n".join(chunks))
    report["bucket"] = "tfam-assets"
    report["sourceCommit"] = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    report["objectCount"] = len(objects)
    report["totalBytes"] = sum(obj.get("Size", 0) for obj in objects)
    pathlib.Path("reports/r2-reference-review.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({"objectCount": report["objectCount"],
                      "totalBytes": report["totalBytes"],
                      "missingMappedKeys": len(report["missingMappedKeys"]),
                      "approvedDeletions": 0}))
