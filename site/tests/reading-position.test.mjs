import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReadingPosition,locateReadingPosition,readingFraction,restoreReadingOffset} from '../lib/reading-position.ts';
const checkpoint={version:1,chapterId:'chapter_002',title:'Chương 2',lang:'vi',revision:4,paragraph:1,offset:.5,fraction:.3,savedAt:'2026-10-14T12:00:00Z'};
test('stored checkpoint round trips without storing extra chapter text',()=>{
 const encoded=JSON.stringify({...checkpoint,text_vi:'private chapter body'});const decoded=parseReadingPosition(encoded,['chapter_002']);assert.deepEqual(decoded,checkpoint);assert.equal('text_vi' in decoded,false);
});
test('corrupt or unsupported local data cannot redirect to another chapter or invalid offsets',()=>{
 for(const raw of [null,'{','null','[]',JSON.stringify({...checkpoint,chapterId:'not-in-book'}),JSON.stringify({...checkpoint,offset:2}),JSON.stringify({...checkpoint,fraction:-1}),JSON.stringify({...checkpoint,savedAt:'bad-date'}),JSON.stringify({...checkpoint,paragraph:1.2}),JSON.stringify({...checkpoint,version:2})])assert.equal(parseReadingPosition(raw,['chapter_002']),null);
});
test('position captures current paragraph, clamps beginning and end',()=>{
 const rects=[{top:-100,height:100},{top:25,height:200},{top:250,height:80}];assert.deepEqual(locateReadingPosition(rects,125),{paragraph:1,offset:.5});assert.deepEqual(locateReadingPosition(rects,-500),{paragraph:0,offset:0});assert.deepEqual(locateReadingPosition(rects,999),{paragraph:2,offset:1});assert.deepEqual(locateReadingPosition([],30),{paragraph:0,offset:0});assert.equal(readingFraction(100,1000,50),0);assert.equal(readingFraction(-1000,1000,120),1);
});
test('paragraph position survives text resizing, source or language changes use safe relative fallback',()=>{
 const larger=[{top:-400,height:300},{top:50,height:400}];assert.deepEqual(restoreReadingOffset(checkpoint,4,'vi',larger,-400,1000),{exact:true,top:250});assert.deepEqual(restoreReadingOffset(checkpoint,5,'vi',larger,-400,1000),{exact:false,top:-100});assert.deepEqual(restoreReadingOffset(checkpoint,4,'en',larger,-400,1000),{exact:false,top:-100});assert.equal(restoreReadingOffset({...checkpoint,paragraph:8},4,'vi',larger,-400,1000).exact,false);
});
