/** Bounded tilt keeps wide images readable even when the pointer reaches an edge. */
export function pointerPose(x:number,y:number,width:number,height:number,amplitude=6){
 const clamp=(n:number)=>Math.max(-1,Math.min(1,Number.isFinite(n)?n:0));
 const nx=clamp(width>0?x/width*2-1:0),ny=clamp(height>0?y/height*2-1:0);
 return {rotationX:-ny*amplitude,rotationY:nx*amplitude,spotX:(nx+1)*50,spotY:(ny+1)*50};
}
