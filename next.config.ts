import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Build information: from CI, or git commit hash
let buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA; 
try {
  if (!buildHash)
    buildHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  buildHash = '2-dev';
}

process.env.NEXT_PUBLIC_BUILD_HASH = (buildHash || '').slice(0, 10);
process.env.NEXT_PUBLIC_BUILD_PKGVER = JSON.parse('' + readFileSync(new URL('./package.json', import.meta.url))).version;
process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = new Date().toISOString();
process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE || (process.env.VERCEL_ENV ? `vercel-${process.env.VERCEL_ENV}` : 'local');
console.log(` 🧠 \x1b[1mbig-AGI\x1b[0m v${process.env.NEXT_PUBLIC_BUILD_PKGVER} (@${process.env.NEXT_PUBLIC_BUILD_HASH})`);

/** @type {import('next').NextConfig} */
let nextConfig = {
  // FORÇANDO STANDALONE PARA O DOCKER
  output: 'standalone',
  
  reactStrictMode: !process.env.NO_STRICT_MODE,

  serverExternalPackages: ['puppeteer-core'],

  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias['@mui/material'] = '@mui/joy';
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    if (!isServer) {
      const serverToClientMocks = [
        [/\/posthog\.server/, '/posthog.client-mock'],
        [/\/env\.server/, '/env.client-mock'],
      ];
      config.plugins = [
        ...config.plugins,
        ...serverToClientMocks.map(([pattern, replacement]) =>
          new webpack.NormalModuleReplacementPlugin(pattern, (resource) => {
            resource.request = resource.request.replace(pattern, replacement);
          }),
        ),
      ];
      config.output.environment = { ...config.output.environment, asyncFunction: true };
    }

    if (typeof config.optimization.splitChunks === 'object' && config.optimization.splitChunks.minSize) {
      config.optimization.splitChunks.minSize = 40 * 1024;
    }

    return config;
  },

  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/a/ph/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/a/ph/:path*', destination: 'https://us.i.posthog.com/:path*' },
      { source: '/a/ph/decide', destination: 'https://us.i.posthog.com/decide' },
      { source: '/a/ph/flags', destination: 'https://us.i.posthog.com/flags' },
    ];
  },
};

// Importações dinâmicas para evitar quebra no build
const validateEnv = await import('./src/server/env.server.mjs').then(m => m.env).catch(() => ({}));
const withPostHogConfig = await import('@posthog/nextjs-config').then(m => m.withPostHogConfig).catch(() => null);

if (withPostHogConfig && process.env.POSTHOG_API_KEY && process.env.POSTHOG_ENV_ID) {
  nextConfig = withPostHogConfig(nextConfig, {
    personalApiKey: process.env.POSTHOG_API_KEY,
    envId: process.env.POSTHOG_ENV_ID,
    host: 'https://us.i.posthog.com',
    logLevel: 'error',
    sourcemaps: {
      enabled: process.env.NODE_ENV === 'production',
      project: 'big-agi',
      version: process.env.NEXT_PUBLIC_BUILD_HASH,
      deleteAfterUpload: false,
    },
  });
}

export default nextConfig;
