import { updateLastmod } from './sitemap-lastmod.js';

describe('updateLastmod', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2020-01-01</lastmod>
    <changefreq>monthly</changefreq>
  </url>
</urlset>`;

  it('replaces lastmod with current date in YYYY-MM-DD', () => {
    const result = updateLastmod(xml);
    const match = result.match(/<lastmod>([^<]*)<\/lastmod>/);
    expect(match).not.toBeNull();
    expect(match[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('preserves rest of document', () => {
    const result = updateLastmod(xml);
    expect(result).toContain('<loc>https://example.com/</loc>');
    expect(result).toContain('<changefreq>monthly</changefreq>');
    expect(result).not.toContain('2020-01-01');
  });
});
