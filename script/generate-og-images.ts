#!/usr/bin/env ts-node

import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';

interface ScreenshotConfig {
  name: string;
  url: string;
  waitForSelector?: string;
  waitForTimeout?: number;
  viewport?: { width: number; height: number };
}

const screenshotConfigs: ScreenshotConfig[] = [
  {
    name: 'og-image',
    url: 'http://localhost:5173',
    waitForSelector: '#root',
    waitForTimeout: 3000,
    viewport: { width: 1200, height: 630 }, // Standard OG image size
  },
  {
    name: 'og-image-with-course',
    url: 'http://localhost:5173',
    waitForSelector: '#root',
    waitForTimeout: 5000,
    viewport: { width: 1200, height: 630 },
  },
];

async function generateOGImages(): Promise<void> {
  let browser: Browser | null = null;

  try {
    console.log('🚀 Starting OG image generation...');
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    if (isCI) {
      console.log('📝 Running in CI mode (headless browser)');
    } else {
      console.log('📝 Make sure the dev server is running: pnpm dev');
    }

    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: isCI ? true : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    for (const config of screenshotConfigs) {
      console.log(`📸 Capturing screenshot: ${config.name}`);

      // Set viewport if specified
      if (config.viewport) {
        await page.setViewport(config.viewport);
      }

      // Navigate to the app
      console.log(`🌐 Navigating to ${config.url}...`);
      try {
        await page.goto(config.url, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
      } catch {
        console.warn(`⚠️  Could not navigate to ${config.url}. Is the dev server running?`);
        continue;
      }

      // Wait for content to load
      if (config.waitForSelector) {
        try {
          await page.waitForSelector(config.waitForSelector, {
            timeout: 10000,
          });
        } catch {
          console.warn(`⚠️  Selector ${config.waitForSelector} not found, continuing...`);
        }
      }

      // Additional wait if specified
      if (config.waitForTimeout) {
        await new Promise((resolve) => setTimeout(resolve, config.waitForTimeout));
      }

      // For the course-specific screenshot, we might want to inject some sample data
      if (config.name === 'og-image-with-course') {
        // Inject sample course data via localStorage
        await page.evaluate(() => {
          const sampleCourse = {
            points: [
              [-37.8136, 144.9631], // Melbourne
              [-37.8142, 144.9625],
              [-37.8148, 144.9619],
              [-37.8154, 144.9613],
              [-37.816, 144.9607],
            ],
            metadata: {
              name: 'Sample Running Course',
              description: 'A demonstration course for the crash course simulator',
            },
          };
          localStorage.setItem('sampleCourse', JSON.stringify(sampleCourse));
        });
        // Reload to pick up the changes
        await page.reload();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Take screenshot
      const screenshotPath = path.join(process.cwd(), 'public', `${config.name}.png`);

      await page.screenshot({
        path: screenshotPath as `${string}.png`,
        type: 'png',
      });
      console.log(`✅ Screenshot saved: ${screenshotPath}`);
    }

    console.log('🎉 All OG images generated successfully!');
  } catch (error) {
    console.error('❌ Error generating OG images:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
if (require.main === module) {
  generateOGImages().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { generateOGImages };
