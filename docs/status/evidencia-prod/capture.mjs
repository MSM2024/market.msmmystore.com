import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const tag = process.argv[2] || 'now';
const base = process.argv[3] || 'https://zafiro.msmmystore.com';
const outDir = 'docs/status/evidencia-prod';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(path, name) {
  try {
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) {
    console.log(`[${name}] goto warn: ${e.message.split('\n')[0]}`);
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/${tag}-${name}.png`, fullPage: true });
  console.log(`saved ${outDir}/${tag}-${name}.png (${page.url()})`);
}

await shot('/', 'portada');
await shot('/marketplace', 'marketplace');
await shot('/universo', 'universo');
await shot('/login', 'login');
await shot('/eliana', 'eliana');
await shot('/dashboard', 'dashboard');
await shot('/biblioteca', 'biblioteca');

await browser.close();
console.log('DONE');
