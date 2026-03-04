import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable server-side external packages for yahoo-finance2
  serverExternalPackages: ['yahoo-finance2'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://assets.coingecko.com; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.coingecko.com https://api.stlouisfed.org https://data-api.ecb.europa.eu https://api.alternative.me https://api.llama.fi https://query1.finance.yahoo.com; frame-ancestors 'none'",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
