/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable TypeScript checking (security fix)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Re-enable ESLint during build (security fix)
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Comprehensive Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // WebLLM specific headers
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for WebLLM
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' https: wss: blob:",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; '),
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // HSTS (only in production)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
        ],
      },
    ]
  },

  // Webpack configuration for WebLLM with enhanced security
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add support for WebAssembly
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      }
      
      // Configure for WebLLM with security considerations
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      }
      
      // Add bundle analyzer in development
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        )
      }
    }
    
    return config
  },

  // Image optimization with security considerations
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features for better performance
  experimental: {
    // optimizeCss: true, // Temporarily disabled due to critters dependency issue
    gzipSize: true,
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },
}

module.exports = nextConfig 