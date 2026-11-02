const {chromium}=require('/tmp/tfam-qa/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(30000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 let ready=false;
 for(let i=0;i<30;i++){try{await page.goto('http://127.0.0.1:8787',{waitUntil:'domcontentloaded',timeout:3000});ready=true;break;}catch{await new Promise(r=>setTimeout(r,1000));}}
 // Wrangler uses its default 8787 unless start's configuration overrides the port.
 if(!ready){for(let i=0;i<30;i++){try{await page.goto('http://127.0.0.1:8787',{waitUntil:'domcontentloaded',timeout:3000});ready=true;break;}catch{await new Promise(r=>setTimeout(r,1000));}}}
 if(!ready){console.error(fs.existsSync('reports/preview.log')?fs.readFileSync('reports/preview.log','utf8'):'No preview log');throw Error('Cloud preview did not start');}
 const origin=new URL(page.url()).origin;
 const check=async(condition,message)=>{if(!condition)throw Error(message);};
 await page.getByRole('link',{name:'DISCOVER THE WORLD',exact:true}).waitFor({state:'visible'});
 await check(await page.locator('.opening-actions a').count()===2,'Opening must have exactly two actions');
 await check(await page.getByRole('button',{name:/Pause scene|Achievements|Choose a track/i}).count()===0,'Obsolete opening widgets present');
 await page.screenshot({path:'reports/opening-desktop.png'});
 await page.getByRole('link',{name:'DISCOVER THE WORLD',exact:true}).click();
 await page.getByRole('heading',{name:'Choose Your Horizon',exact:true}).waitFor({state:'visible'});
 await check(await page.locator('.faction-card').count()===28,'Expected 28 banners in five groups');
 await check(await page.locator('.faction-group').count()===5,'Expected five faction groups');
 await check(await page.locator('.faction-card:not(.is-locked)').count()===2,'Fresh reader should have exactly two unlocked factions');
 await check(await page.getByRole('searchbox').count()===0,'Old search must be removed');
 await page.screenshot({path:'reports/horizons-desktop.png'});
 await page.locator('[data-faction-id="holy_french_kingdom"]').click({force:true});
 await page.getByRole('status').filter({hasText:/Complete Arc|Loading reading progress/}).waitFor({state:'visible'});
 await page.locator('[data-faction-id="castilian_empire"]').click();
 await page.waitForURL(/#map\/castilian_empire\/1715/);
 for(const width of [390,768]){
  await page.setViewportSize({width,height:844});await page.goto(origin);
  await page.getByRole('link',{name:'DISCOVER THE WORLD',exact:true}).waitFor({state:'visible'});
  await page.screenshot({path:'reports/opening-'+width+'.png'});
  await page.getByRole('link',{name:'DISCOVER THE WORLD',exact:true}).click();
  await page.getByRole('heading',{name:'Choose Your Horizon',exact:true}).waitFor({state:'visible'});
  await check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
  await page.screenshot({path:'reports/horizons-'+width+'.png'});
 }
 await page.goto(origin);await page.getByRole('link',{name:'BEGIN THE CHRONICLES',exact:true}).click();
 await page.waitForURL(/\/chronicles$/);
 await check(await page.locator('.atlas-opening').count()===0,'Reader link did not exit opening');
 await page.screenshot({path:'reports/chronicles-route.png'});
 fs.writeFileSync('reports/browser-checks.json',JSON.stringify({passed:true,errors,origin,checked:['two working actions','28 factions/five groups','two initial unlocks','lock notice','castilian route','390/768/1920 layouts','chronicles route']},null,2));
 await browser.close();
 if(errors.length)throw Error('Browser errors: '+errors.join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
