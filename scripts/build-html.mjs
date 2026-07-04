import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';

const pages = ['index.html', 'privacy.html', 'changelog.html'];

await mkdir(new URL('../dist', import.meta.url), { recursive: true });

const options = {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  removeAttributeQuotes: false,
  removeOptionalTags: false,
};

for (const page of pages) {
  const src = await readFile(new URL(`../html/${page}`, import.meta.url), 'utf8');
  const out = await minify(src, options);
  await writeFile(new URL(`../dist/${page}`, import.meta.url), out);
  console.log(`built ${page} (${src.length} -> ${out.length} bytes)`);
}

const changesSrc = await readFile(new URL('../html/changes.js', import.meta.url), 'utf8');
const changesOut = await minifyJs(changesSrc, { format: { comments: false } });
await writeFile(new URL('../dist/changes.js', import.meta.url), changesOut.code);
console.log(`built changes.js (${changesSrc.length} -> ${changesOut.code.length} bytes)`);

for (const asset of ['favicon.svg', 'favicon.ico']) {
  await copyFile(new URL(`../html/${asset}`, import.meta.url), new URL(`../dist/${asset}`, import.meta.url));
  console.log(`copied ${asset}`);
}
