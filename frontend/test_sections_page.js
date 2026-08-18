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
    });
    page.on('requestfailed', request => {
        console.log('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
    });
    page.on('requestfinished', request => {
        if (request.url().includes('/api/')) {
            console.log('[REQUEST FINISHED]', request.url(), request.response()?.status());
        }
    });

    try {
        console.log('Navigating to login page...');
        await page.goto('http://127.0.0.1:5174/login', { waitUntil: 'networkidle2' });

        console.log('Logging in...');
        await page.type('input[type="text"]', 'ERPSADMIN');
        await page.type('input[type="password"]', 'ErpsAdmin@123!');
        await page.click('button[type="submit"]');

        console.log('Waiting for login redirect...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Navigating to sections page...');
        await page.goto('http://127.0.0.1:5174/sections', { waitUntil: 'networkidle2' });

        console.log('Waiting for data to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('Searching for STOR...');
        const searchInput = await page.$('input[placeholder="Search records..."]');
        if (searchInput) {
            await searchInput.type('STOR');
        } else {
            console.log('Could not find search input!');
        }

        console.log('Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        await page.screenshot({ path: 'sections_debug.png' });
        console.log('Saved debug screenshot to sections_debug.png');

    } catch (err) {
        console.error('Puppeteer error:', err);
    } finally {
        await browser.close();
    }
})();
