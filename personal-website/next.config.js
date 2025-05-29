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

  // File watching improvements
  webpack: (config, { dev, isServer }) => {
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
    return config
  },

  // Improve development performance  
  // swcMinify: true, // DEPRECATED: SWC minification is now enabled by default in Next.js 13+
  
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

  // Bundle analyzer (only in production)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../analyze/client.html',
            openAnalyzer: false,
          })
        )
      }
      return config
    },
  }),

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

  // Development optimizations - REMOVED devIndicators.buildActivity as it's deprecated
  // ...(process.env.NODE_ENV === 'development' && {
  //   devIndicators: {
  //     buildActivity: false, // DEPRECATED: No longer configurable
  //   },
  // }),
}

// Only add webpack configuration when NOT using Turbopack
const isUsingTurbopack = process.argv.includes('--turbopack') || process.env.TURBOPACK === '1'

if (!isUsingTurbopack) {
  nextConfig.webpack = (config, { isServer }) => {
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
  }
}

module.exports = nextConfig 