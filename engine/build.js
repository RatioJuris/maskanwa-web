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

// Hardened HTML Sanitization rules supporting secure interactive forms
const sanitizeOptions = {
  // 1. Explicitly allow tags needed for the onboarding form
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe',
    'img', 'span', 'form', 'input', 'select', 'option', 'textarea', 'button', 'label'
  ],

  // 2. Attribute-level locking (Strict isolation)
  allowedAttributes: {
    'a': ['href', 'name', 'target', 'title'],
    'img': ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    'iframe': ['src', 'width', 'height', 'title'],
    'form': ['id', 'class', 'method'], // Action is intentionally handled in JS transformation
    'input': ['type', 'id', 'name', 'placeholder', 'required', 'class', 'value', 'checked'],
    'select': ['id', 'name', 'required', 'class'],
    'option': ['value', 'selected'],
    'textarea': ['id', 'name', 'rows', 'placeholder', 'required', 'class'],
    'button': ['type', 'id', 'class'],
    'label': ['for', 'class'],
    '*': ['id', 'class', 'aria-*', 'data-*'] // Safe global attributes
  },

  // 3. URI Scheme Isolation
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    'a': ['https', 'mailto', 'tel'],
    'img': ['https', 'data'],  
    'iframe': ['https']  
  },
  allowProtocolRelative: false,

  // 4. Advanced heuristics and Anti-Phishing blocks
  exclusiveFilter: (frame) => {
    // Block forms or elements with dynamic formaction hooks
    if ((frame.tag === 'input' || frame.tag === 'button') && frame.attribs.formaction) {
      return true;
    }

    // Force all forms to process locally or only via verified platform channels
    if (frame.tag === 'form' && frame.attribs.action) {
      const isRelative = !frame.attribs.action.includes('://');
      const isInternal = frame.attribs.action.startsWith('https://maskanwa.com');
      if (!isRelative && !isInternal) return true;
    }

    // Clean up empty placeholder markup vectors
    if (['p', 'span', 'div'].includes(frame.tag) && !frame.text.trim() && !Object.keys(frame.attribs).length) {
      return true;
    }

    return false;
  },

  // 5. Node Transformations and security adjustments
  transformTags: {
    'a': (tagName, attribs) => {
      if (attribs.target === '_blank') {
        attribs.rel = attribs.rel
          ? [...new Set([...attribs.rel.split(' '), 'noopener', 'noreferrer'])].join(' ')
          : 'noopener noreferrer';
      }
      return { tagName, attribs };
    },
    'form': (tagName, attribs) => {
      attribs.method = (attribs.method || 'POST').toUpperCase();
      return { tagName, attribs };
    },
    'iframe': (tagName, attribs) => {
      attribs.sandbox = 'allow-scripts allow-same-origin';
      return { tagName, attribs };
    }
  },

  allowVulnerableTags: false,
  stripHtmlByRegexp: /<!--[\s\S]*?-->/g
};

async function buildContent(slug, siteConfig, isShowcase, allInstitutions = null, buildTime) {
  const instPath = path.join(PUBLIC_DIR, slug);
  const distInstPath = isShowcase ? DIST_DIR : path.join(DIST_DIR, slug);

  const files = await fs.readdir(instPath);
  const markdownFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.MD'));

  const templateName = isShowcase ? 'showcase.ejs' : 'layout.ejs';
  const template = await fs.readFile(path.join(TEMPLATES_DIR, templateName), 'utf-8');

  for (const file of markdownFiles) {
    const content = await fs.readFile(path.join(instPath, file), 'utf-8');
    const { data: frontmatter, content: markdownBody } = matter(content);

    const rawHtml = marked.parse(markdownBody);
    const cleanHtml = sanitizeHtml(rawHtml, sanitizeOptions);

    const isIndex = file.toLowerCase() === 'site.md';
    const pageSlug = isIndex ? '' : file.replace(/\.md$/i, '');
    const canonicalUrl = isShowcase
      ? `https://maskanwa.com/${pageSlug}`
      : `https://${slug}.maskanwa.com/${pageSlug}`;

    const pageTitle = isIndex ? siteConfig.name : `${frontmatter.title || pageSlug} - ${siteConfig.name}`;

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

  // Dynamic Build Time stamp synced to Asia/Kolkata (IST)
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

  // Build modern 404 handler
  await fs.outputFile(path.join(DIST_DIR, '404.html'), `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>404 - Not Found | Maskanwa Open Community</title>
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
        <p>The requested Maskanwa network resource does not exist.</p>\n        <a href="https://maskanwa.com">Return to Maskanwa.com</a>
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
