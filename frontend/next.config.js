/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
        NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
    },
    webpack(config) {
        config.resolve.alias['zustand'] = path.resolve(__dirname, 'node_modules/zustand');
        return config;
    },
};

module.exports = nextConfig;
