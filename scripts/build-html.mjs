import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import CleanCSS from 'clean-css';

const pages = ['index.html', 'privacy.html', 'changelog.html', 'admin.html'];
const styles = ['style.css', 'header.css', 'index.css', 'privacy.css', 'changelog.css', 'admin.css'];
const scripts = ['index.js', 'changelog.js', 'changes.js', 'admin.js'];

await mkdir(new URL('../dist', import.meta.url), { recursive: true });

const htmlOptions = {
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
  const out = await minify(src, htmlOptions);
  await writeFile(new URL(`../dist/${page}`, import.meta.url), out);
  console.log(`built ${page} (${src.length} -> ${out.length} bytes)`);
}

for (const style of styles) {
  const src = await readFile(new URL(`../html/${style}`, import.meta.url), 'utf8');
  const out = new CleanCSS({}).minify(src);
  await writeFile(new URL(`../dist/${style}`, import.meta.url), out.styles);
  console.log(`built ${style} (${src.length} -> ${out.styles.length} bytes)`);
}

for (const script of scripts) {
  const src = await readFile(new URL(`../html/${script}`, import.meta.url), 'utf8');
  const out = await minifyJs(src, { format: { comments: false } });
  await writeFile(new URL(`../dist/${script}`, import.meta.url), out.code);
  console.log(`built ${script} (${src.length} -> ${out.code.length} bytes)`);
}

for (const asset of ['favicon.svg', 'favicon.ico']) {
  await copyFile(new URL(`../html/${asset}`, import.meta.url), new URL(`../dist/${asset}`, import.meta.url));
  console.log(`copied ${asset}`);
}
