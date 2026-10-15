const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8770');await page.waitForFunction(()=>HauntWisp?.inspect().ready);
 assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Dashboard must not overflow a phone-width viewport');
 assert.equal(await page.locator('#conversationMode').inputValue(),'realtime');
 assert(!/Assisted mode/.test(await page.locator('#conversationStatus').textContent()),'Default status must describe native mode');
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const result=await page.evaluate(()=>axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../test-results/accessibility.json'),JSON.stringify({violations:result.violations,incomplete:result.incomplete.map(x=>({id:x.id,count:x.nodes.length})),scope:'Automated WCAG checks; manual usability and contrast review remain necessary'},null,2));
 assert.deepEqual(result.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[]);
 await browser.close();console.log('PASS mobile overflow, default-mode instructions and automated accessibility checks.');
})().catch(e=>{console.error(e);process.exit(1)});
