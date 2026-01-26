import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    safe: 'src/handlers/safe.ts',
  },
  format: ['esm', 'cjs', 'iife'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  globalName: 'evalculist',
  target: 'es2020',
  outDir: 'dist',
});
