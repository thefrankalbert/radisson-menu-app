import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: false, // DEV NOTE: Enabled for testing PWA install
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
