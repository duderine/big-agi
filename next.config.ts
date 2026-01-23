import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Build information
let buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || process.env.GITHUB_SHA || '2-dev';
try {
  if (!process.env.NEXT_PUBLIC_BUILD_HASH && !process.env.GITHUB_SHA) {
    buildHash = execSync('git rev-parse --short HEAD').toString().trim();
  }
} catch (e) {
  buildHash = '2-dev';
}

const pkgVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version;

console.log(` 🧠 big-AGI v${pkgVersion} (@${buildHash.slice(0, 10)})`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false, // Desativado para evitar warnings chatos no build
  serverExternalPackages: ['puppeteer-core'],
  
  // Imagens unotimized para evitar erros de biblioteca no build do Docker
  images: { unoptimized: true },

  webpack: (config, { isServer, webpack }) => {
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