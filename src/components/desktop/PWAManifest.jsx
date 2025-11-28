import { useEffect } from 'react';

export default function PWAManifest() {
  useEffect(() => {
    // Create manifest.json dynamically
    const manifest = {
      name: "ATOM × EVE OS",
      short_name: "ATOM×EVE",
      description: "Advanced Gaming Platform and Achievement System",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#3b82f6",
      orientation: "landscape-primary",
      categories: ["games", "entertainment", "productivity"],
      lang: "en-US",
      dir: "ltr",
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%233b82f6'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-weight='bold'%3EA%3C/text%3E%3C/svg%3E",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%233b82f6'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-weight='bold'%3EA%3C/text%3E%3C/svg%3E",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ],
      screenshots: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 800'%3E%3Crect width='1280' height='800' fill='%230f172a'/%3E%3Ctext x='640' y='400' text-anchor='middle' fill='%233b82f6' font-size='48'%3EATOM × EVE OS%3C/text%3E%3C/svg%3E",
          sizes: "1280x800",
          type: "image/svg+xml",
          form_factor: "wide",
          label: "ATOM × EVE OS Dashboard"
        }
      ],
      shortcuts: [
        {
          name: "Dashboard",
          url: "/Dashboard",
          description: "Go to main dashboard"
        },
        {
          name: "Store",
          url: "/Store", 
          description: "Browse the gaming store"
        },
        {
          name: "Achievements",
          url: "/Achievements",
          description: "View your achievements"
        },
        {
          name: "Profile",
          url: "/Profile",
          description: "Manage your profile"
        }
      ],
      related_applications: [],
      prefer_related_applications: false
    };

    // Create and inject manifest
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json'
    });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let linkElement = document.querySelector('link[rel="manifest"]');
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.rel = 'manifest';
      document.head.appendChild(linkElement);
    }
    linkElement.href = manifestURL;

    // Add meta tags for PWA
    const metaTags = [
      { name: 'theme-color', content: '#3b82f6' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'ATOM×EVE' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'application-name', content: 'ATOM×EVE OS' }
    ];

    metaTags.forEach(({ name, content }) => {
      let metaElement = document.querySelector(`meta[name="${name}"]`);
      if (!metaElement) {
        metaElement = document.createElement('meta');
        metaElement.name = name;
        document.head.appendChild(metaElement);
      }
      metaElement.content = content;
    });

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  return null;
}