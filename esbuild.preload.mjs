import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['electron/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/electron/preload.js',
  external: ['electron'],
  sourcemap: true,
  alias: {
    '@shared': path.resolve(__dirname, 'shared'),
  },
});

console.log('Preload script bundled successfully');
