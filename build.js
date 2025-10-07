const esbuild = require('esbuild');
const { dtsPlugin } = require("esbuild-plugin-d.ts");

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  target: ['es2020'],
  outdir: 'dist',
  plugins: [
    dtsPlugin(),
  ],
})