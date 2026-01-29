import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    skipWaiting: true,           // Force new SW to activate immediately
    clientsClaim: true,          // Take control of all clients immediately
    reloadOnOnline: true,        // Reload when back online
    fallbacks: {
        document: '/offline.html',
    },
    // Use NetworkFirst for CSS/JS to always fetch fresh content
    runtimeCaching: [
        {
            urlPattern: /\/_next\/static\/css\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'css-cache',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60, // 1 hour
                },
            },
        },
        {
            urlPattern: /\/_next\/static\/chunks\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'js-cache',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60, // 1 hour
                },
            },
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'image-cache',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                },
            },
        },
        {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'font-cache',
                expiration: {
                    maxEntries: 16,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                },
            },
        },
    ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    // Désactiver le cache webpack en production pour éviter l'erreur de limite de 25Mo sur Cloudflare
    webpack: (config, { dev }) => {
        if (!dev) {
            config.cache = false;
        }
        return config;
    },
};

export default withPWA(nextConfig);
