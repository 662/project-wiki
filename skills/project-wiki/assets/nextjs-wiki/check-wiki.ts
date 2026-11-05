import path from 'node:path';
import { validateWiki } from './wiki-core';
const root = path.resolve(process.argv[2] ?? 'content/wiki');
validateWiki(root, { basePath: process.env.WIKI_BASE_PATH ?? '/wiki', diagrams: process.env.WIKI_DIAGRAMS === 'true' })
  .then(index => console.info(`Wiki valid: ${index.documents.length} pages`))
  .catch(error => { console.error(error instanceof Error ? error.message : 'Wiki validation failed'); process.exitCode = 1; });
