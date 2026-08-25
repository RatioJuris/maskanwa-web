import fs from 'fs-extra'; import path from 'path'; import matter from 'gray-matter'; import { marked } from 'marked'; import sanitizeHtml from 'sanitize-html'; import ejs from 'ejs'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public'); const DIST_DIR = path.resolve(__dirname, '../dist'); const MANIFEST_PATH = path.resolve(__dirname, '../manifest.json'); const TEMPLATES_DIR = path.resolve(__dirname, 'templates');
const PLATFORM_SLUG = 'www'; const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
/*
============================================================
SAFE FILESYSTEM RESOLUTION
============================================================ */
function resolveInside(baseDir, relativePath) { if ( typeof relativePath !== 'string' || !relativePath ) { throw new Error( Unsafe filesystem path detected: ${relativePath} ); }
if (path.isAbsolute(relativePath)) {
    throw new Error(
        `Unsafe filesystem path detected: ${relativePath}`
    );
}

const normalized =
    relativePath.replace(/\\/g, '/');

if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.includes('\0')
) {
    throw new Error(
        `Unsafe filesystem path detected: ${relativePath}`
    );
}

const base = path.resolve(baseDir);
const resolved =
    path.resolve(baseDir, relativePath);

const relative =
    path.relative(base, resolved);

if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
) {
    throw new Error(
        `Unsafe filesystem path detected: ${relativePath}`
    );
}

return resolved;
}
function resolvePlatformSource() { return resolveInside( PUBLIC_DIR, PLATFORM_SLUG ); }
function resolveTenantSource(slug) { if ( typeof slug !== 'string' || !SAFE_SLUG_PATTERN.test(slug) || slug.toLowerCase() === PLATFORM_SLUG ) { throw new Error( Unsafe tenant slug detected: ${slug} ); }
return resolveInside(
    PUBLIC_DIR,
    slug
);
}
function resolveTenantOutput(slug) { if ( typeof slug !== 'string' || !SAFE_SLUG_PATTERN.test(slug) ) { throw new Error( Unsafe tenant output slug detected: ${slug} ); }
return resolveInside(
    DIST_DIR,
    slug
);
}
/*
============================================================
HTML SANITIZATION
============================================================
Markdown may contain useful HTML such as:
forms
video
audio
iframe / YouTube
tables
details / summary
semantic HTML
Dangerous scripting remains prohibited. */
const sanitizeOptions = { allowedTags: [ ...sanitizeHtml.defaults.allowedTags,
    'img',

    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',

    'span',
    'div',

    'strong',
    'em',

    'ul',
    'ol',
    'li',

    'a',

    'blockquote',

    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',

    'figure',
    'figcaption',

    'picture',
    'source',

    'video',
    'audio',
    'track',

    'iframe',

    'details',
    'summary',

    'section',
    'article',
    'aside',
    'header',
    'footer',
    'main',
    'nav',

    'form',
    'label',
    'input',
    'textarea',
    'select',
    'option',
    'button',

    'br',
    'hr',

    'pre',
    'code',

    'kbd',
    'mark',
    'small',
    'sub',
    'sup'
],

allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,

    img: [
        'src',
        'alt',
        'title',
        'width',
        'height',
        'loading',
        'decoding'
    ],

    a: [
        'href',
        'target',
        'rel',
        'title'
    ],

    iframe: [
        'src',
        'title',
        'width',
        'height',
        'allow',
        'allowfullscreen',
        'loading',
        'referrerpolicy',
        'frameborder'
    ],

    video: [
        'src',
        'poster',
        'width',
        'height',
        'controls',
        'autoplay',
        'muted',
        'loop',
        'playsinline',
        'preload'
    ],

    audio: [
        'src',
        'controls',
        'autoplay',
        'muted',
        'loop',
        'preload'
    ],

    source: [
        'src',
        'srcset',
        'type',
        'media'
    ],

    track: [
        'src',
        'kind',
        'srclang',
        'label',
        'default'
    ],

    form: [
        'action',
        'method',
        'target',
        'autocomplete'
    ],

    input: [
        'type',
        'name',
        'value',
        'placeholder',
        'required',
        'checked',
        'disabled',
        'readonly',
        'min',
        'max',
        'step',
        'pattern',
        'autocomplete'
    ],

    textarea: [
        'name',
        'placeholder',
        'required',
        'readonly',
        'disabled',
        'rows',
        'cols'
    ],

    select: [
        'name',
        'required',
        'disabled'
    ],

    option: [
        'value',
        'selected',
        'disabled'
    ],

    button: [
        'type',
        'name',
        'value',
        'disabled'
    ],

    details: [
        'open'
    ]
},

allowedSchemes: [
    'http',
    'https',
    'mailto',
    'tel'
],

allowedSchemesByTag: {
    img: [
        'http',
        'https'
    ],

    iframe: [
        'http',
        'https'
    ],

    video: [
        'http',
        'https'
    ],

    audio: [
        'http',
        'https'
    ],

    source: [
        'http',
        'https'
    ],

    track: [
        'http',
        'https'
    ],

    a: [
        'http',
        'https',
        'mailto',
        'tel'
    ]
}
};
/*
============================================================
BUILD CONTENT
============================================================ */
async function buildContent( slug, siteConfig, isShowcase, allInstitutions = null, buildTime ) { const instPath = isShowcase ? resolvePlatformSource() : resolveTenantSource(slug);
const distInstPath = isShowcase
    ? resolveInside(
        DIST_DIR,
        PLATFORM_SLUG
    )
    : resolveTenantOutput(slug);

if (!(await fs.pathExists(instPath))) {
    throw new Error(
        `Content directory not found: ${instPath}`
    );
}

const files =
    await fs.readdir(instPath);

const markdownFiles =
    files.filter(
        file =>
            file
                .toLowerCase()
                .endsWith('.md')
    );

const templateName = isShowcase
    ? 'showcase.ejs'
    : 'layout.ejs';

const template =
    await fs.readFile(
        path.join(
            TEMPLATES_DIR,
            templateName
        ),
        'utf-8'
    );


/*
 * --------------------------------------------------------
 * BUILD EVERY MARKDOWN PAGE
 * --------------------------------------------------------
 */

for (const file of markdownFiles) {

    const filePath =
        resolveInside(
            instPath,
            file
        );

    const content =
        await fs.readFile(
            filePath,
            'utf-8'
        );

    const {
        data: frontmatter,
        content: markdownBody
    } = matter(content);


    /*
     * Markdown → HTML
     */

    const rawHtml =
        marked.parse(
            markdownBody
        );

    const cleanHtml =
        sanitizeHtml(
            rawHtml,
            sanitizeOptions
        );


    /*
     * Page routing
     */

    const isIndex =
        file.toLowerCase() === 'site.md';

    const pageSlug =
        isIndex
            ? ''
            : file.replace(
                /\.md$/i,
                ''
            );


    /*
     * Canonical URL
     */

    const canonicalUrl =
        isShowcase
            ? `https://maskanwa.com/${pageSlug}`
            : `https://${slug}.maskanwa.com/${pageSlug}`;


    /*
     * Page title
     */

    const pageTitle =
        isIndex
            ? siteConfig.name
            : `${frontmatter.title || pageSlug} - ${siteConfig.name}`;


    /*
     * ====================================================
     * JSON-LD
     * ====================================================
     *
     * IMPORTANT:
     * This is deliberately INSIDE buildContent().
     *
     * It depends on page-specific variables such as:
     *
     * - siteConfig
     * - canonicalUrl
     *
     * Therefore it must never exist at module scope.
     */

    const siteType =
        String(
            siteConfig.type || ''
        ).toLowerCase();


    const structuredData =
        JSON.stringify(
            {
                "@context":
                    "https://schema.org",

                "@type":
                    siteType.includes('school') ||
                    siteType.includes('college')
                        ? "EducationalOrganization"
                        : "LocalBusiness",

                "name":
                    siteConfig.name,

                "url":
                    canonicalUrl,

                "areaServed": {
                    "@type": "Place",
                    "name":
                        "Maskanwa, Uttar Pradesh"
                }
            },
            null,
            2
        );


    /*
     * ====================================================
     * EJS RENDER
     * ====================================================
     */

    const renderedPage =
        ejs.render(
            template,
            {
                site:
                    siteConfig,

                page: {
                    title:
                        pageTitle,

                    canonical:
                        canonicalUrl,

                    ...frontmatter
                },

                content:
                    cleanHtml,

                slug,

                institutions:
                    allInstitutions,

                buildTime,

                structuredData
            }
        );


    /*
     * ====================================================
     * OUTPUT
     * ====================================================
     */

    const outputPath =
        isIndex
            ? resolveInside(
                distInstPath,
                'index.html'
            )
            : resolveInside(
                distInstPath,
                path.join(
                    pageSlug,
                    'index.html'
                )
            );

    await fs.outputFile(
        outputPath,
        renderedPage
    );
}


/*
 * --------------------------------------------------------
 * COPY ASSETS
 * --------------------------------------------------------
 */

const assetsPath =
    resolveInside(
        instPath,
        'assets'
    );

if (
    await fs.pathExists(
        assetsPath
    ) &&
    (
        await fs.stat(
            assetsPath
        )
    ).isDirectory()
) {
    await fs.copy(
        assetsPath,
        resolveInside(
            distInstPath,
            'assets'
        )
    );
}
}
/*
============================================================
PLATFORM BUILD
============================================================ */
async function buildPlatform() {
console.log(
    '========================================'
);

console.log(
    '      MASKANWA OPEN COMMUNITY'
);

console.log(
    '          Build Engine'
);

console.log(
    '========================================'
);


/*
 * Clean previous build
 */

await fs.emptyDir(
    DIST_DIR
);


/*
 * Load platform manifest
 */

const manifest =
    await fs.readJson(
        MANIFEST_PATH
    );


/*
 * Build timestamp
 * India Standard Time
 */

const buildTime =
    new Date().toLocaleString(
        'en-IN',
        {
            timeZone:
                'Asia/Kolkata',

            dateStyle:
                'medium',

            timeStyle:
                'short'
        }
    );


console.log(
    `Build Time: ${buildTime}`
);


/*
 * ========================================================
 * 1. MASKANWA SHOWCASE
 * ========================================================
 */

console.log(
    '[1/3] Building Maskanwa showcase...'
);


const allInstitutions =
    Object.values(
        manifest.sites || {}
    );


await buildContent(
    PLATFORM_SLUG,
    manifest.platform,
    true,
    allInstitutions,
    buildTime
);


/*
 * ========================================================
 * 2. INSTITUTION TENANTS
 * ========================================================
 */

console.log(
    '[2/3] Building institutions...'
);


for (
    const slug of Object.keys(
        manifest.sites || {}
    )
) {

    if (
        slug.toLowerCase() ===
        PLATFORM_SLUG
    ) {
        throw new Error(
            'Reserved slug "www" cannot be used as an institution.'
        );
    }


    console.log(
        `Building Tenant: ${slug}...`
    );


    await buildContent(
        slug,
        manifest.sites[slug],
        false,
        null,
        buildTime
    );
}


/*
 * ========================================================
 * 3. FINALIZATION
 * ========================================================
 */

console.log(
    '[3/3] Finalizing...'
);


/*
 * Copy manifest
 */

await fs.copy(
    MANIFEST_PATH,
    resolveInside(
        DIST_DIR,
        'manifest.json'
    )
);


/*
 * ========================================================
 * 404 PAGE
 * ========================================================
 */

await fs.outputFile(
    resolveInside(
        DIST_DIR,
        '404.html'
    ),

    `<!DOCTYPE html>
<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    404 - Not Found | Maskanwa
</title>

<style>

    body {
        font-family:
            Inter,
            system-ui,
            sans-serif;

        display:
            flex;

        align-items:
            center;

        justify-content:
            center;

        min-height:
            100vh;

        margin:
            0;

        background:
            #f9fafb;

        color:
            #111827;
    }

    .card {
        text-align:
            center;

        background:
            white;

        padding:
            3rem;

        border-radius:
            12px;

        box-shadow:
            0 4px 6px -1px
            rgba(0,0,0,.1);

        border:
            1px solid
            #e5e7eb;
    }

    h1 {
        font-size:
            4rem;

        margin:
            0;

        color:
            #2563eb;

        letter-spacing:
            -.05em;
    }

    p {
        color:
            #6b7280;

        margin:
            1rem 0 2rem;

        font-size:
            1.1rem;
    }

    a {
        background:
            #111827;

        color:
            white;

        padding:
            .75rem 1.5rem;

        text-decoration:
            none;

        border-radius:
            8px;

        font-weight:
            500;
    }

    a:hover {
        background:
            #374151;
    }

</style>
<div class="card">

    <h1>404</h1>

    <h2>
        Entity Not Found
    </h2>

    <p>
        The requested Maskanwa page
        or subdomain does not exist.
    </p>

    <a href="https://maskanwa.com">
        Return to Directory
    </a>

</div>
console.log(
    '[SUCCESS] Platform successfully built to /dist'
);
}
/*
============================================================
START BUILD
============================================================ */
buildPlatform().catch( error => {
    console.error(
        '[BUILD ERROR]',
        error
    );

    process.exit(1);
}
);
