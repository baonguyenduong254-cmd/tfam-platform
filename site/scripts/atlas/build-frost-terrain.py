"""Bake the physical base's custom frost palette; geographic pixels stay aligned."""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
source=Path('public/map-art/natural-earth/tiles')
target=Path('public/map-art/frost-terrain')
def frost(image):
 a=np.array(image.convert('RGB'),dtype=np.float32)/255
 sea=(a[:,:,2]>a[:,:,1]+.012)&(a[:,:,2]>a[:,:,0]+.035)
 l=.2126*a[:,:,0]+.7152*a[:,:,1]+.0722*a[:,:,2]
 t=np.clip((l-.25)/.6,0,1)[...,None]
 land=np.array([.19,.29,.29])+(np.array([.87,.89,.83])-np.array([.19,.29,.29]))*t
 water=np.array([.035,.10,.145])+np.array([.13,.19,.21])*np.clip(l,.1,1)[...,None]
 result=np.where(sea[...,None],water,land)
 return Image.fromarray(np.uint8(np.clip(result*255,0,255))).filter(ImageFilter.UnsharpMask(radius=1.1,percent=135,threshold=3))
for path in source.glob('*/*/*.webp'):
 if int(path.relative_to(source).parts[0])>4:continue
 out=target/path.relative_to(source);out.parent.mkdir(parents=True,exist_ok=True)
 frost(Image.open(path)).save(out,quality=87,method=6)
frost(Image.open('public/map-art/natural-earth/terrain-equirectangular.webp')).save(target/'terrain-equirectangular.webp',quality=88,method=6)
print('Baked',len(list(target.glob('*/*/*.webp'))),'physical relief tiles')
