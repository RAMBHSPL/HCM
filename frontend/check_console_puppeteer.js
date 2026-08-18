import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message);
    console.error(err.stack);
  });
  
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
  });

  console.log('Navigating to http://127.0.0.1:5174/position-screen-mappings ...');
  try {
    await page.goto('http://127.0.0.1:5174/position-screen-mappings', { waitUntil: 'networkidle2', timeout: 5000 });
  } catch (err) {
    console.log('Navigation timed out/failed, but continuing to inspect...');
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const currentUrl = page.url();
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('CURRENT URL:', currentUrl);
  console.log('BODY HTML LENGTH:', html.length);
  console.log('BODY HTML SNIPPET:', html.substring(0, 1000));
  
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Saved screenshot to screenshot.png');
  
  await browser.close();
})();
