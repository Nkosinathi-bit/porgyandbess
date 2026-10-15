const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH);
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:8765';
const deadline = setTimeout(() => {console.error('Browser checks timed out'); process.exit(1);}, 150000);
deadline.unref();
async function checkWidth(page, label) {
  const size = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth, viewport: innerWidth,
    wide: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,5).map(el => el.tagName+'.'+el.className)
  }));
  assert.ok(size.content <= size.viewport+1, label+': '+JSON.stringify(size));
}
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const context = await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/*', route => ['127.0.0.1','cdn.jsdelivr.net'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#overture-skip').click();
  await page.locator('#enter-btn').click();
  await page.locator('#intro-overlay').waitFor({state:'hidden'});
  async function openScene(name) {
    await page.waitForFunction(() => !animating);
    await page.locator('#menu-toggle').click();
    await page.locator('#menu-nav button[data-page="'+name+'"]').click();
    await page.locator('.page[data-page="'+name+'"].active').waitFor({state:'visible'});
    await page.waitForFunction(() => !animating);
  }
  await openScene('creative');
  const first = await page.locator('.windmill-card.pos-center').innerText();
  await page.locator('#windmill-next').click();
  assert.notEqual(await page.locator('.windmill-card.pos-center').innerText(),first);
  await openScene('music');
  const missingAudio = [];
  page.on('request', request => {if(request.url().endsWith('.mp3'))missingAudio.push(request.url());});
  await page.locator('.song-card').first().click();
  assert.equal(await page.locator('.song-card.open').count(),1);
  await page.locator('.song-card').nth(1).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.song-card.open').count(),1);
  assert.equal(await page.locator('.song-card.playing').count(),0);
  assert.deepEqual(missingAudio,[]);
  assert.equal(await page.locator('.page').count(),13);
  for (const src of await page.locator('img').evaluateAll(images=>images.map(img=>img.getAttribute('src')))) {
    assert.equal((await context.request.get(new URL(src,base).toString())).status(),200,src);
  }
  console.log('PASS: opening controls, scene navigation, rotating cards, keyboard song notes and all bundled illustrations.');
  assert.deepEqual(errors, []);
 } finally { await browser.close(); }
})().catch(error => {console.error(error.stack);process.exit(1);});
