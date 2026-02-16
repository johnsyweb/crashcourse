#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { updateLastmod } from './sitemap-lastmod.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.argv[2] || path.join(__dirname, '..', 'dist');
const sitemapPath = path.join(distDir, 'sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  console.warn('update-sitemap-lastmod: sitemap.xml not found, skipping');
  process.exit(0);
}

const content = fs.readFileSync(sitemapPath, 'utf8');
fs.writeFileSync(sitemapPath, updateLastmod(content));
