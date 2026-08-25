import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const MANIFEST_PATH = path.resolve(__dirname, '../manifest.json');

async function validateAndGenerateManifest() {
  console.log('Initiating Maskanwa Web Validation Protocol...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    throw new Error('FATAL: /public directory is missing.');
  }

  const manifest = {
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    platform: {},
    sites: {}
  };

  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
  const directories = entries.filter(dirent => dirent.isDirectory());

  for (const dir of directories) {
    const slug = dir.name;
    const dirPath = path.join(PUBLIC_DIR, slug);
    const siteMdPath = path.join(dirPath, 'site.md');

    // Validate Slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(`[REJECTED] Invalid slug '${slug}'. Only a-z, 0-9, and hyphens allowed.`);
    }

    if (!fs.existsSync(siteMdPath)) {
      throw new Error(`[REJECTED] Directory '${slug}' is missing required 'site.md'.`);
    }

    const siteContent = await fs.readFile(siteMdPath, 'utf-8');
    const { data: frontmatter } = matter(siteContent);

    // MODE 1: Platform Showcase Validation
    if (slug === 'www') {
      if (frontmatter.type !== 'platform') {
        throw new Error(`[REJECTED] 'www/site.md' must have type 'platform'.`);
      }
      manifest.platform = {
        name: frontmatter.name || "Maskanwa Web",
        path: `/public/www/`
      };
      console.log(`[PASS] Validated Platform Showcase (www)`);
      continue;
    }

    // MODE 2: Institution Tenant Validation
    if (!frontmatter.name) {
      throw new Error(`[REJECTED] Institution '${slug}' site.md is missing 'name' in frontmatter.`);
    }

    manifest.sites[slug] = {
      slug: slug,
      name: frontmatter.name,
      type: frontmatter.type || 'educational institution',
      domain: `${slug}.maskanwa.com`,
      path: `/public/${slug}/`
    };

    console.log(`[PASS] Validated Institution: ${slug} (${frontmatter.name})`);
  }

  if (!manifest.platform.name) {
    throw new Error(`[REJECTED] The platform showcase directory (/public/www/) is missing or invalid.`);
  }

  await fs.writeJson(MANIFEST_PATH, manifest, { spaces: 2 });
  console.log(`\n[SUCCESS] manifest.json generated. Sites: ${Object.keys(manifest.sites).length}`);
}

validateAndGenerateManifest().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
