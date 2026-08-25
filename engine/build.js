import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import ejs from 'ejs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DIST_DIR = path.resolve(__dirname, '../dist');
const MANIFEST_PATH = path.resolve(__dirname, '../manifest.json');
const TEMPLATES_DIR = path.resolve(__dirname, 'templates');

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'span', 'div', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, 'img': ['src', 'alt', 'loading'], 'a': ['href', 'target', 'rel'] }
};

async function buildContent(slug, siteConfig, isShowcase, allInstitutions = null, buildTime) {
  const instPath = path.join(PUBLIC_DIR, slug);
  const distInstPath = path.join(DIST_DIR, slug);
  
  const files = await fs.readdir(instPath);
  const markdownFiles = files.filter(f => f.endsWith('.md'));
  
  const templateName = isShowcase ? 'showcase.ejs' : 'layout.ejs';
  const template = await fs.readFile(path.join(TEMPLATES_DIR, templateName), 'utf-8');

  for (const file of markdownFiles) {
    const content = await fs.readFile(path.join(instPath, file), 'utf-8');
    const { data: frontmatter, content: markdownBody } = matter(content);
    
    const rawHtml = marked.parse(markdownBody);
    const cleanHtml = sanitizeHtml(rawHtml, sanitizeOptions);
    
    const isIndex = file === 'site.md';
    const pageSlug = isIndex ? '' : file.replace('.md', '');
    const canonicalUrl = isShowcase 
      ? `https://maskanwa.com/${pageSlug}` 
      : `https://${slug}.maskanwa.com/${pageSlug}`;

    const pageTitle = isIndex ? siteConfig.name : `${frontmatter.title} - ${siteConfig.name}`;
    
    const renderedPage = ejs.render(template, {
      site: siteConfig,
      page: { title: pageTitle, canonical: canonicalUrl, ...frontmatter },
      content: cleanHtml,
      slug: slug,
      institutions: allInstitutions,
      buildTime: buildTime
    });

    const outputPath = isIndex 
      ? path.join(distInstPath, 'index.html') 
      : path.join(distInstPath, pageSlug, 'index.html');
      
    await fs.outputFile(outputPath, renderedPage);
  }

  const assetsPath = path.join(instPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    await fs.copy(assetsPath, path.join(distInstPath, 'assets'));
  }
}

async function buildPlatform() {
  console.log('Starting Maskanwa Engine Build...');
  await fs.emptyDir(DIST_DIR);
  const manifest = await fs.readJson(MANIFEST_PATH);
  
  // Format the exact build time for IST
  const buildTime = new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });

  console.log(`Build Time: ${buildTime}`);

  console.log('Building Showcase (www)...');
  const allInstitutions = Object.values(manifest.sites);
  await buildContent('www', manifest.platform, true, allInstitutions, buildTime);

  for (const slug of Object.keys(manifest.sites)) {
    console.log(`Building Tenant: ${slug}...`);
    await buildContent(slug, manifest.sites[slug], false, null, buildTime);
  }

  await fs.copy(MANIFEST_PATH, path.join(DIST_DIR, 'manifest.json'));

  await fs.outputFile(path.join(DIST_DIR, '404.html'), `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>404 - Not Found | Maskanwa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f9fafb; color: #111827; }
        .card { text-align: center; background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
        h1 { font-size: 4rem; margin: 0; color: #2563eb; letter-spacing: -0.05em; }
        p { color: #6b7280; margin: 1rem 0 2rem 0; font-size: 1.1rem; }
        a { background: #111827; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s; }
        a:hover { background: #374151; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>404</h1>
        <h2>Entity Not Found</h2>
        <p>The requested Maskanwa subdomain does not exist.</p>
        <a href="https://maskanwa.com">Return to Directory</a>
      </div>
    </body>
    </html>
  `);

  console.log('[SUCCESS] Platform successfully built to /dist');
}

buildPlatform().catch(err => {
  console.error('[BUILD ERROR]', err);
  process.exit(1);
});
