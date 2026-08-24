export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname; 
    
    // The static origin built by GitHub Actions
    const ORIGIN = env.GH_PAGES_URL || "https://ratiojuris.github.io/maskanwa-web";
    
    let targetPath = url.pathname;
    if (!targetPath.includes('.')) {
      targetPath = targetPath.endsWith('/') ? `${targetPath}index.html` : `${targetPath}/index.html`;
    }

    // ==========================================
    // ROUTE MODE 1: Platform Showcase
    // ==========================================
    if (hostname === 'maskanwa.com' || hostname === 'www.maskanwa.com') {
      return fetch(`${ORIGIN}/www${targetPath}`, {
        headers: { 'User-Agent': 'Maskanwa-Edge-Router/2.1' }
      });
    } 

    // ==========================================
    // ROUTE MODE 2: Metadata-Driven Tenant Routing
    // ==========================================
    const subdomain = hostname.split('.')[0];
    
    // 1. Consume Routing Metadata (cached at the edge for 5 minutes)
    const manifestResponse = await fetch(`${ORIGIN}/manifest.json`, {
      cf: { cacheTtl: 300, cacheEverything: true }
    });

    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      
      // 2. Edge-Level Authorization
      // If the manifest exists, but the subdomain isn't in the sites object, reject immediately.
      if (!manifest.sites[subdomain]) {
        return fetch(`${ORIGIN}/404.html`);
      }
    }

    // 3. Proxy Validated Tenant Request
    const originUrl = `${ORIGIN}/${subdomain}${targetPath}`;
    const response = await fetch(originUrl, {
      headers: { 'User-Agent': 'Maskanwa-Edge-Router/2.1' }
    });

    if (response.status === 404) {
      return fetch(`${ORIGIN}/404.html`);
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type'),
        'Cache-Control': 'public, max-age=3600',
        'X-Maskanwa-Tenant': subdomain
      }
    });
  }
};
