export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname; 
    
    // The static origin built by GitHub Actions
    const ORIGIN = env.GH_PAGES_URL || "https://ratiojuris.github.io/maskanwa-web";
    
    let targetPath = url.pathname;
    
    // Clean URL Resolution: Append index.html to directory requests
    if (!targetPath.includes('.')) {
      targetPath = targetPath.endsWith('/') ? `${targetPath}index.html` : `${targetPath}/index.html`;
    }

    let originUrl;

    // ==========================================
    // ROUTE MODE 1: Platform Showcase
    // ==========================================
    if (hostname === 'maskanwa.com' || hostname === 'www.maskanwa.com') {
      originUrl = `${ORIGIN}/www${targetPath}`;
    } 
    // ==========================================
    // ROUTE MODE 2: Institution Tenant Network
    // ==========================================
    else {
      // Extract the slug (e.g., 'gvm' from 'gvm.maskanwa.com')
      const subdomain = hostname.split('.')[0];
      originUrl = `${ORIGIN}/${subdomain}${targetPath}`;
    }

    // Fetch from GitHub Pages static origin
    const response = await fetch(originUrl, {
      headers: { 'User-Agent': 'Maskanwa-Edge-Router/2.0' }
    });

    // Handle unknown pages or unknown subdomains securely
    if (response.status === 404) {
      return fetch(`${ORIGIN}/404.html`);
    }

    // Proxy the response
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type'),
        'Cache-Control': 'public, max-age=3600',
        'X-Maskanwa-Route': hostname === 'maskanwa.com' || hostname === 'www.maskanwa.com' ? 'showcase' : 'tenant'
      }
    });
  }
};
