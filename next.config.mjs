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

const securityHeaders = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://api.qrserver.com",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.exchangerate-api.com",
            "media-src 'self' https://cdn.pixabay.com",
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ].join('; '),
    },
];

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
    compiler: {
        // Retirer les console.* en production (garder error/warn pour le monitoring)
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    // Désactiver le cache webpack en production pour éviter l'erreur de limite de 25Mo sur Cloudflare
    webpack: (config, { dev }) => {
        if (!dev) {
            config.cache = false;
        }
        return config;
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default withPWA(nextConfig);
