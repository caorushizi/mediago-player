#!/usr/bin/env node

/**
 * Generate package.json files for all npm packages with consistent versioning
 * Usage: node scripts/generate-npm-packages.js <version>
 */

const fs = require('fs');
const path = require('path');

const VERSION = process.argv[2] || '0.0.0';
const ROOT_DIR = path.join(__dirname, '..');
const NPM_DIR = path.join(ROOT_DIR, 'npm');

const PLATFORMS = [
  { name: 'darwin-x64', os: ['darwin'], cpu: ['x64'], bin: 'mediago-player' },
  { name: 'darwin-arm64', os: ['darwin'], cpu: ['arm64'], bin: 'mediago-player' },
  { name: 'linux-x64', os: ['linux'], cpu: ['x64'], bin: 'mediago-player' },
  { name: 'linux-arm64', os: ['linux'], cpu: ['arm64'], bin: 'mediago-player' },
  { name: 'win32-x64', os: ['win32'], cpu: ['x64'], bin: 'mediago-player.exe' },
  { name: 'win32-arm64', os: ['win32'], cpu: ['arm64'], bin: 'mediago-player.exe' },
];

function generatePlatformPackage(platform) {
  return {
    name: `@mediago/player-${platform.name}`,
    version: VERSION,
    description: `MediaGo Player binary for ${platform.os[0]} ${platform.cpu[0]}`,
    os: platform.os,
    cpu: platform.cpu,
    bin: {
      'mediago-player': `bin/${platform.bin}`,
    },
    files: [`bin/${platform.bin}`],
    license: 'ISC',
  };
}

function generateRootPackage() {
  const optionalDependencies = {};
  for (const platform of PLATFORMS) {
    optionalDependencies[`@mediago/player-${platform.name}`] = VERSION;
  }

  return {
    name: '@mediago/player',
    version: VERSION,
    description: 'MediaGo Player - A hybrid Go+React video player server',
    main: 'install.js',
    scripts: {
      postinstall: 'node install.js',
    },
    bin: {
      'mediago-player': 'bin/mediago-player',
    },
    optionalDependencies,
    files: ['install.js', 'bin'],
    keywords: ['video', 'player', 'server', 'go', 'react', 'mediago'],
    author: '',
    license: 'ISC',
    repository: {
      type: 'git',
      url: 'https://github.com/mediago/mediago-player',
    },
  };
}

function writePackageJson(pkgPath, data) {
  fs.mkdirSync(pkgPath, { recursive: true });
  const pkgFile = path.join(pkgPath, 'package.json');
  fs.writeFileSync(pkgFile, JSON.stringify(data, null, 2) + '\n');
  console.log(`Generated ${pkgFile}`);
}

function generateREADME(pkgPath, platform) {
  const readmePath = path.join(pkgPath, 'README.md');
  let content;

  if (platform) {
    content = `# @mediago/player-${platform.name}

This package contains the MediaGo Player binary for ${platform.os[0]} ${platform.cpu[0]}.

It is typically installed automatically as an optional dependency of [@mediago/player](https://www.npmjs.com/package/@mediago/player).

## Direct Usage

\`\`\`bash
npx @mediago/player-${platform.name}
\`\`\`

## License

ISC
`;
  } else {
    content = `# @mediago/player

MediaGo Player is a hybrid Go+React video player server that combines a powerful Go backend with a responsive React frontend.

## Installation

\`\`\`bash
npm install @mediago/player
# or
pnpm add @mediago/player
# or
yarn add @mediago/player
\`\`\`

## Usage

### As a CLI

\`\`\`bash
npx @mediago/player
\`\`\`

### With Custom Flags

\`\`\`bash
npx @mediago/player -host 0.0.0.0 -port 8080
\`\`\`

### Available Flags

- \`-host\` - Server host address (default: \`0.0.0.0\`)
- \`-port\` - Server port (default: \`8080\`)
- \`-video-root\` - Path to video directory
- \`-enable-docs\` - Enable Swagger API documentation at \`/docs\`

### Environment Variables

You can also configure the server using environment variables:

- \`HTTP_ADDR\` - Server address in \`host:port\` format
- \`GIN_MODE\` - Gin mode: \`debug\`, \`release\`, or \`test\`
- \`VIDEO_ROOT_PATH\` - Local folder for video files

## Supported Platforms

This package automatically installs the correct binary for your platform:

- macOS (x64 and ARM64)
- Linux (x64 and ARM64)
- Windows (x64)

## Features

- Hybrid Go backend with embedded React frontend
- RESTful API with Swagger documentation
- Responsive UI that adapts to desktop and mobile
- Built-in video player with XGPlayer
- Modern UI with shadcn/ui components

## License

ISC

## Repository

https://github.com/mediago/mediago-player
`;
  }

  fs.writeFileSync(readmePath, content);
  console.log(`Generated ${readmePath}`);
}

function main() {
  console.log(`Generating npm packages for version ${VERSION}...`);

  // Generate root package
  const rootPkgPath = path.join(NPM_DIR, '@mediago', 'player');
  writePackageJson(rootPkgPath, generateRootPackage());
  generateREADME(rootPkgPath);

  // Generate platform packages
  for (const platform of PLATFORMS) {
    const platformPkgPath = path.join(NPM_DIR, '@mediago', `player-${platform.name}`);
    writePackageJson(platformPkgPath, generatePlatformPackage(platform));
    generateREADME(platformPkgPath, platform);
  }

  console.log(`\nSuccessfully generated all package files for version ${VERSION}`);
}

main();
