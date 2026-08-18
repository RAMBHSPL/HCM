import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
    // Ensure screenshot directory exists
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    const browser = await puppeteer.launch({ headless: "new", args: ['--disable-web-security'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Listen for console messages, including errors
    page.on('console', msg => {
        const type = msg.type().toUpperCase();
        if (type === 'ERROR' || type === 'WARNING' || msg.text().includes('crash') || msg.text().includes('Exception')) {
            console.log(`[PAGE CONSOLE ${type}] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}\nStack: ${error.stack}`);
    });

    try {
        console.log('1. Navigating to Login Page...');
        await page.goto('http://127.0.0.1:5174/login', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(screenshotDir, '01_login_page.png') });

        console.log('2. Entering Credentials...');
        await page.waitForSelector('#login-username');
        await page.type('#login-username', 'testadmin');
        await page.type('#login-password', 'Admin@123');
        await page.screenshot({ path: path.join(screenshotDir, '02_credentials_entered.png') });

        console.log('3. Clicking Sign In Button...');
        // Find the visible login button containing text "Sign In" or similar
        const buttons = await page.$$('button');
        let loginButtonClicked = false;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Sign In') || text.includes('Dashboard')) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
                }, btn);
                if (isVisible) {
                    await btn.click();
                    loginButtonClicked = true;
                    console.log('Login button clicked.');
                    break;
                }
            }
        }

        if (!loginButtonClicked) {
            console.log('Failed to find visible Sign In button, trying general type="submit" click...');
            await page.click('form button[type="submit"]');
        }

        console.log('4. Waiting for Dashboard redirection...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.screenshot({ path: path.join(screenshotDir, '03_dashboard.png') });

        // Function to test a specific master view and open its form modal
        const testMasterPage = async (pageUrl, name, addBtnText = 'Add New') => {
            console.log(`\n--- Testing ${name} Page ---`);
            console.log(`Navigating to ${pageUrl}...`);
            await page.goto(`http://127.0.0.1:5174${pageUrl}`, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await page.screenshot({ path: path.join(screenshotDir, `04_${name}_table.png`) });

            console.log('Looking for Add button...');
            const buttons = await page.$$('button');
            let clicked = false;
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes(addBtnText)) {
                    const isVisible = await page.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
                    }, btn);
                    if (isVisible) {
                        await btn.click();
                        clicked = true;
                        console.log(`Clicked ${addBtnText} button for ${name}`);
                        break;
                    }
                }
            }

            if (!clicked) {
                console.log(`Could not find or click ${addBtnText} button for ${name}`);
            } else {
                console.log(`Waiting 2 seconds for ${name} Modal Form to open...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await page.screenshot({ path: path.join(screenshotDir, `05_${name}_modal.png`) });

                // Try to interact with Project dropdown if present
                const dropdowns = await page.$$('select');
                console.log(`Found ${dropdowns.length} select dropdowns in ${name} Modal`);
                
                // Let's print out what dropdowns are available
                for (let i = 0; i < dropdowns.length; i++) {
                    const nameAttr = await page.evaluate((el, index) => el.name || el.id || `select-${index}`, dropdowns[i], i);
                    const optionsCount = await page.evaluate(el => el.options.length, dropdowns[i]);
                    console.log(`  Dropdown ${i}: name/id="${nameAttr}", options count = ${optionsCount}`);
                }

                // If this is Roles/Shifts/PositionTypes, select the first project option (index 1 usually, index 0 is placeholder)
                for (const select of dropdowns) {
                    const nameAttr = await page.evaluate(el => el.name || el.id || '', select);
                    if (nameAttr.toLowerCase().includes('project')) {
                        console.log('Selecting a project option...');
                        await page.evaluate(el => {
                            if (el.options.length > 1) {
                                el.selectedIndex = 1;
                                el.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, select);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        await page.screenshot({ path: path.join(screenshotDir, `06_${name}_modal_project_selected.png`) });
                        console.log('Project selected screenshot taken.');
                    }
                }
            }
        };

        // Test the four pages in sequence
        await testMasterPage('/roles', 'Roles');
        await testMasterPage('/position-types', 'PositionTypes');
        await testMasterPage('/shifts', 'Shifts');
        await testMasterPage('/positions', 'Positions');

        console.log('\nAll pages tested.');

    } catch (err) {
        console.error('Test script error:', err);
    } finally {
        await browser.close();
    }
})();
