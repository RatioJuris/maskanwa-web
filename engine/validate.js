import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const MANIFEST_PATH = path.resolve(__dirname, '../manifest.json');

const RESERVED_SLUGS = new Set(['www', 'mail', 'admin', 'api', 'static', 'assets', 'engine']);

async function validateAndGenerateManifest() {
  console.log('Initiating Maskanwa Validation Protocol...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    throw new Error('FATAL: /public directory is missing.');
  }

  const manifest = {
    version: "2.1.0",
    generatedAt: new Date().toISOString(),
    platform: {},
    sites: {}
  };

  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
  const directories = entries.filter(dirent => dirent.isDirectory());

  for (const dir of directories) {
    const slug = dir.name;
    const siteMdPath = path.join(PUBLIC_DIR, slug, 'site.md');

    if (!fs.existsSync(siteMdPath)) {
      throw new Error(`[REJECTED] Directory '${slug}' is missing required 'site.md'.`);
    }

    const { data: frontmatter } = matter(await fs.readFile(siteMdPath, 'utf-8'));

    // Platform Namespace
    if (slug === 'www') {
      manifest.platform = {
        name: frontmatter.name || "Maskanwa",
        path: `/public/www/`
      };
      console.log(`[PASS] Validated Platform Showcase (www)`);
      continue;
    }

    // Tenant Namespace
    if (RESERVED_SLUGS.has(slug)) {
      throw new Error(`[REJECTED] Slug '${slug}' is a reserved platform namespace.`);
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(`[REJECTED] Invalid slug '${slug}'. Only a-z, 0-9, and hyphens allowed.`);
    }

    manifest.sites[slug] = {
      slug: slug,
      name: frontmatter.name || slug,
      type: frontmatter.type || 'local entity',
      domain: `${slug}.maskanwa.com`,
      path: `/public/${slug}/`
    };

    console.log(`[PASS] Validated Tenant: ${slug}`);
  }

  await fs.writeJson(MANIFEST_PATH, manifest, { spaces: 2 });
  console.log(`\n[SUCCESS] manifest.json generated.`);
}

validateAndGenerateManifest().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
