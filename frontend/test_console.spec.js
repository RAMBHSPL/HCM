import { test, expect } from '@playwright/test';
test('check console', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.message + '\n' + err.stack);
  });
  await page.goto('http://127.0.0.1:5174/position-screen-mappings');
  await page.waitForTimeout(5000);
  console.log('BROWSER ERRORS:', errors);
});