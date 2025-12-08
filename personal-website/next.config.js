/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable TypeScript checking (security fix)
  typescript: {
    ignoreBuildErrors: false,
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
    optimizePackageImports: ['@mlc-ai/web-llm'],
    // optimizeCss: true, // Temporarily disabled due to critters dependency issue
    gzipSize: true,
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    // Configure Turbopack-specific settings
    rules: {
      // Add any specific Turbopack rules here
    },
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },

  // Better error handling
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // PWA and manifest
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/api/manifest',
      },
    ]
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Unified webpack configuration
  webpack: (config, { dev, isServer, buildId, defaultLoaders, webpack }) => {
    // Development optimizations
    if (dev) {
      // Improve file watching stability
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['node_modules/**', '.next/**', '.git/**'],
      }
      
      // Reduce memory usage during development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }

    // Client-side configuration
    if (!isServer) {
      // Add support for WebAssembly with proper async/await support
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
        topLevelAwait: true,
      }
      
      // Set target to support modern browsers with async/await
      config.target = 'web'
      
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
      
      // Add bundle analyzer in development or when ANALYZE=true
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: dev ? '../analyze/client.html' : '../analyze/client.html',
            openAnalyzer: false,
          })
        )
      }
    }
    
    return config
  },
}

module.exports = nextConfig 