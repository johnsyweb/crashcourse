#!/usr/bin/env ts-node

import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    // Generate favicon.ico from the PNG files using ImageMagick
    console.log('🔧 Generating favicon.ico from PNG files...');
    try {
      const icoPath = path.join(process.cwd(), 'public', 'favicon.ico');
      const png16Path = path.join(process.cwd(), 'public', 'favicon-ico-16.png');
      const png32Path = path.join(process.cwd(), 'public', 'favicon-ico-32.png');

      // Use ImageMagick to combine the 16x16 and 32x32 PNG files into a single ICO file
      const command = `convert ${png16Path} ${png32Path} ${icoPath}`;
      await execAsync(command);

      console.log(`✅ Generated: ${icoPath}`);
    } catch (error) {
      console.warn(
        '⚠️  Could not generate favicon.ico. Make sure ImageMagick is installed: brew install imagemagick'
      );
      console.warn('Error:', error instanceof Error ? error.message : String(error));
    }

    console.log('🎉 All favicons generated successfully!');
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
