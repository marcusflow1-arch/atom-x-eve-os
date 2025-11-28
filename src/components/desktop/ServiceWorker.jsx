import { useEffect } from 'react';

export default function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Create service worker code as a string
      const swCode = `
        const CACHE_NAME = 'atom-eve-os-v1';
        const urlsToCache = [
          '/',
          '/Dashboard',
          '/Store', 
          '/Profile',
          '/Achievements',
          '/Blacksmith',
          '/Clan',
          '/AIConsole',
          '/Library'
        ];

        self.addEventListener('install', (event) => {
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.addAll(urlsToCache))
          );
        });

        self.addEventListener('fetch', (event) => {
          event.respondWith(
            caches.match(event.request)
              .then((response) => {
                if (response) {
                  return response;
                }
                return fetch(event.request);
              }
            )
          );
        });

        self.addEventListener('activate', (event) => {
          event.waitUntil(
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => {
                  if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                  }
                })
              );
            })
          );
        });
      `;

      // Register service worker
      const swBlob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(swBlob);

      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });

      return () => {
        URL.revokeObjectURL(swUrl);
      };
    }
  }, []);

  return null;
}