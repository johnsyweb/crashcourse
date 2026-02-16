/**
 * Replaces <lastmod> value in sitemap XML with today's date (YYYY-MM-DD).
 * Used at build time so the deployed sitemap reflects the actual build date.
 */
export function updateLastmod(xmlContent) {
  const today = new Date().toISOString().slice(0, 10);
  return xmlContent.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${today}</lastmod>`);
}
