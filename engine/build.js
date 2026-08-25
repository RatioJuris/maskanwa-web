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
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'span', 'div']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, 'img': ['src', 'alt', 'loading'] }
};

async function buildContent(slug, siteConfig, isShowcase, allInstitutions = null) {
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
      institutions: allInstitutions
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

  console.log('Building Showcase (www)...');
  const allInstitutions = Object.values(manifest.sites);
  await buildContent('www', manifest.platform, true, allInstitutions);

  for (const slug of Object.keys(manifest.sites)) {
    console.log(`Building Institution: ${slug}...`);
    await buildContent(slug, manifest.sites[slug], false);
  }

  await fs.copy(MANIFEST_PATH, path.join(DIST_DIR, 'manifest.json'));

  await fs.outputFile(path.join(DIST_DIR, '404.html'), `
    <!DOCTYPE html>
    <html lang="en">
    <head><title>404 - Not Found | Maskanwa Web</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: system-ui, sans-serif; text-align: center; padding: 10% 20px; background: #f8f9fa;">
      <h1 style="color: #dc3545; font-size: 3rem; margin-bottom: 10px;">404</h1>
      <h2>Institution Not Found</h2>
      <p style="color: #6c757d; max-width: 500px; margin: 0 auto 30px;">The requested Maskanwa Web subdomain does not exist or the institution has been removed.</p>
      <a href="https://maskanwa.com" style="background: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to Maskanwa.com</a>
    </body>
    </html>
  `);

  console.log('[SUCCESS] Platform successfully built to /dist');
}

buildPlatform().catch(err => {
  console.error('[BUILD ERROR]', err);
  process.exit(1);
});
