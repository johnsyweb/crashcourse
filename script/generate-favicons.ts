#!/usr/bin/env ts-node

import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

interface IconConfig {
  name: string;
  width: number;
  height: number;
  format: 'png' | 'ico';
}

const iconConfigs: IconConfig[] = [
  {
    name: 'apple-touch-icon.png',
    width: 180,
    height: 180,
    format: 'png',
  },
  {
    name: 'favicon-ico-16.png',
    width: 16,
    height: 16,
    format: 'png',
  },
  {
    name: 'favicon-ico-32.png',
    width: 32,
    height: 32,
    format: 'png',
  },
];

async function generateFavicons(): Promise<void> {
  let browser: Browser | null = null;

  try {
    console.log('🎨 Starting favicon generation...');

    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Read the SVG content
    const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');

    // Create a data URL from the SVG
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

    for (const config of iconConfigs) {
      console.log(`📸 Generating ${config.name}...`);

      // Set viewport
      await page.setViewport({
        width: config.width,
        height: config.height,
        deviceScaleFactor: 1,
      });

      // Navigate to a data URL with the SVG
      await page.goto(svgDataUrl);

      // Wait a moment for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Take screenshot
      const screenshotPath = path.join(process.cwd(), 'public', config.name);

      await page.screenshot({
        path: screenshotPath,
        type: 'png',
        omitBackground: false,
      });

      console.log(`✅ Generated: ${screenshotPath}`);
    }

    console.log('🎉 All favicons generated successfully!');
    console.log('💡 Note: favicon.ico will need to be created manually or with a tool like ImageMagick');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
generateFavicons().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

export { generateFavicons };
