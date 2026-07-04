import { readFile, writeFile } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';

const pages = ['index.html', 'privacy.html'];

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
  await writeFile(new URL(`../${page}`, import.meta.url), out);
  console.log(`built ${page} (${src.length} -> ${out.length} bytes)`);
}
