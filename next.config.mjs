import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development', // PWA désactivé en dev, actif en production
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
