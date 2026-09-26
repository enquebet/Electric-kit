import { TOOLS_REGISTRY } from '../src/data/registry';
import * as fs from 'fs';
import * as path from 'path';

const baseUrl = 'https://electrokit.dev';
const now = new Date().toISOString().split('T')[0];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n';

// Home / Root
xml += '  <url>\n';
xml += `    <loc>${baseUrl}/</loc>\n`;
xml += `    <lastmod>${now}</lastmod>\n`;
xml += '    <changefreq>daily</changefreq>\n';
xml += '    <priority>1.0</priority>\n';
xml += '  </url>\n\n';

// Workspace View
xml += '  <url>\n';
xml += `    <loc>${baseUrl}/#/workspace</loc>\n`;
xml += `    <lastmod>${now}</lastmod>\n`;
xml += '    <changefreq>daily</changefreq>\n';
xml += '    <priority>0.95</priority>\n';
xml += '  </url>\n\n';

// Formulas View
xml += '  <url>\n';
xml += `    <loc>${baseUrl}/#/formulas</loc>\n`;
xml += `    <lastmod>${now}</lastmod>\n`;
xml += '    <changefreq>weekly</changefreq>\n';
xml += '    <priority>0.9</priority>\n';
xml += '  </url>\n\n';

// Taxonomy Explorer View
xml += '  <url>\n';
xml += `    <loc>${baseUrl}/#/taxonomy</loc>\n`;
xml += `    <lastmod>${now}</lastmod>\n`;
xml += '    <changefreq>weekly</changefreq>\n';
xml += '    <priority>0.9</priority>\n';
xml += '  </url>\n\n';

let txt = `${baseUrl}/\n${baseUrl}/#/workspace\n${baseUrl}/#/formulas\n${baseUrl}/#/taxonomy\n`;

for (const tool of TOOLS_REGISTRY) {
  const priority = ['circuit', 'power', 'design', 'pcb'].includes(tool.category) ? '0.85' : '0.80';
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/#/${tool.slug}</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '    <changefreq>monthly</changefreq>\n';
  xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>\n';
  txt += `${baseUrl}/#/${tool.slug}\n`;
}

xml += '</urlset>\n';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
fs.writeFileSync(path.join(publicDir, 'sitemap.txt'), txt, 'utf8');

console.log(`Generated sitemap.xml and sitemap.txt with ${TOOLS_REGISTRY.length + 3} indexed routes.`);
