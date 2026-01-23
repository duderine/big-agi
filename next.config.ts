import { readFileSync } from 'node:fs';

const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || process.env.GITHUB_SHA || '2-dev';

let pkgVersion = '2.0.2';
try {
  const pkgData = readFileSync(new URL('./package.json', import.meta.url)).toString('utf8');
  pkgVersion = JSON.parse(pkgData).version;
} catch (e) {
  console.log('⚠️ Erro ao ler package.json');
}

console.log(` 🧠 big-AGI v${pkgVersion} (@${buildHash.slice(0, 10)})`);

/** @type {import('next').NextConfig} */
const nextConfig: any = {
  output: 'standalone',
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['puppeteer-core'],
  images: { unoptimized: true },

  webpack: (config: any, context: any) => {
    const { isServer, webpack } = context;
    
    config.resolve.alias['@mui/material'] = '@mui/joy';
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    if (!isServer) {
      config.output.environment = { ...config.output.environment, asyncFunction: true };
    }

    return config;
  },
};

export default nextConfig;