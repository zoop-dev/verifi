import { readFile, writeFile } from 'node:fs/promises';
import JavaScriptObfuscator from 'javascript-obfuscator';

const path = new URL('../dist/v.js', import.meta.url);
const src = await readFile(path, 'utf8');

const result = JavaScriptObfuscator.obfuscate(src, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  disableConsoleOutput: false,
  stringArray: false,
  identifierNamesGenerator: 'mangled',
  renameGlobals: false,
});

const out = result.getObfuscatedCode();
await writeFile(path, out);
console.log(`obfuscated v.js (${src.length} -> ${out.length} bytes)`);
