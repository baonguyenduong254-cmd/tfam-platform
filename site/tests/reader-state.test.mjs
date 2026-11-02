import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReaderPreferences,defaultReaderPreferences,parseReadingHistory,recordReadingVisit,searchChapter,chapterPath} from '../lib/reader-state.ts';
test('page settings survive reload, reject malformed or out-of-range storage',()=>{
 const prefs={theme:'cream',width:'wide',lineHeight:2.1,paragraphGap:.8};
 assert.deepEqual(parseReaderPreferences(JSON.stringify(prefs)),prefs);
 for(const raw of ['null','"x"','{broken',JSON.stringify({theme:'red',width:'huge',lineHeight:100,paragraphGap:-1})])assert.deepEqual(parseReaderPreferences(raw),defaultReaderPreferences);
});
test('reader typeface persists while old preferences remain compatible',()=>{
 const prefs={...defaultReaderPreferences,fontFamily:'sans'};
 assert.deepEqual(parseReaderPreferences(JSON.stringify(prefs)),prefs);
 assert.equal(parseReaderPreferences(JSON.stringify({...prefs,fontFamily:'untrusted'})).fontFamily,undefined);
 assert.deepEqual(parseReaderPreferences(JSON.stringify(defaultReaderPreferences)),defaultReaderPreferences);
});
test('history contains only known chapter metadata, ordered and deduplicated',()=>{
 const raw=JSON.stringify([{chapterId:'one',status:'read',visitedAt:'2026-10-10',text:'private draft'},{chapterId:'two',status:'reading',visitedAt:'2026-10-11'},{chapterId:'one',status:'read',visitedAt:'2026-10-10'},{chapterId:'unknown',status:'read',visitedAt:'2026-10-11'},{chapterId:'three',status:'read',visitedAt:'bad'}]);
 assert.deepEqual(parseReadingHistory(raw,['one','two','three']),[{chapterId:'two',status:'reading',visitedAt:'2026-10-11'},{chapterId:'one',status:'read',visitedAt:'2026-10-10'}]);
 for(const raw of ['null','{}','bad'])assert.deepEqual(parseReadingHistory(raw,['one']),[]);
});
test('opening a read chapter preserves its status; explicit toggle changes it',()=>{
 let h=recordReadingVisit([],'one',undefined,'2026-10-10');assert.equal(h[0].status,'reading');
 h=recordReadingVisit(h,'one','read','2026-10-11');
 h=recordReadingVisit(h,'two',undefined,'2026-10-12');
 h=recordReadingVisit(h,'one',undefined,'2026-10-13');assert.equal(h.length,2);assert.equal(h[0].chapterId,'one');assert.equal(h[0].status,'read');
 h=recordReadingVisit(h,'one','reading','2026-10-14');assert.equal(h[0].status,'reading');
});
test('Vietnamese chapter search accepts unaccented input and chapter links include extras',()=>{
 assert.ok(searchChapter('Đêm Băng · Arc III').includes(searchChapter('dem bang')));
 assert.equal(chapterPath('chapter_001'),'/read/chapter_001');assert.equal(chapterPath('extra_1_12'),'/read/extra_1_12');
 assert.equal(chapterPath('a/b'),'/read/a%2Fb');
});

test('new readers start on cream paper while an explicit dark preference is preserved',()=>{assert.equal(parseReaderPreferences(null).theme,'cream');assert.equal(parseReaderPreferences('{"theme":"dark"}').theme,'dark');});
