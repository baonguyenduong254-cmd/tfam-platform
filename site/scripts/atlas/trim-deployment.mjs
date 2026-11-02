import {rmSync,existsSync} from 'node:fs';
// The replacement is live; retain the retired painting in source control only.
const retired='dist/client/map-art/painted-world-v1';
if(existsSync(retired))rmSync(retired,{recursive:true});

// z5 is retained as source; the subtle raster overscales from z4 beneath sharp 1:10m vectors.
rmSync('dist/client/map-art/natural-earth/tiles/5',{recursive:true,force:true});

// Soundtracks are served from the owner-managed R2 bucket; keep originals in source only.
rmSync('dist/client/audio',{recursive:true,force:true});

// v172: regional static plates replace the public tile/GIS renderer. Sources stay in Git.
for(const dir of ['map-art/natural-earth','map-art/frost-terrain','map-art/faction-display','map-runtime'])rmSync('dist/client/'+dir,{recursive:true,force:true});
rmSync('dist/client/map-art/faction-topology-v2.json',{force:true});
