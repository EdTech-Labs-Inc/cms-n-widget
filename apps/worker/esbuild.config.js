const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/index.js',
  format: 'cjs',
  // External dependencies that shouldn't be bundled (native modules, binary deps)
  external: [
    '@prisma/client',
    'prisma',
    'fluent-ffmpeg',
    'canvas',
    'sharp',
  ],
  // Resolve .ts files
  resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
}).then(() => {
  console.log('Worker bundled successfully');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
