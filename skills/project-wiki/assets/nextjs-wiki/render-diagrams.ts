import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { diagramConfig, validateWiki } from './wiki-core';

async function main() {
  const root = path.resolve(process.argv[2] ?? 'content/wiki');
  const index = await validateWiki(root, { diagrams: true, skipDiagramAssets: true });
  const diagrams = [...new Map(index.documents.flatMap(d => d.diagrams).map(d => [d.key, d])).values()];
  if (!diagrams.length) { console.info('No diagrams; no browser or CLI required'); return; }
  const cli = path.join(process.cwd(), 'node_modules/.bin/mmdc');
  const run = promisify(execFile);
  const { stdout } = await run(cli, ['--version']);
  if (stdout.trim() !== diagramConfig.rendererVersion) throw new Error(`Use Mermaid CLI ${diagramConfig.rendererVersion} or update the declared rendererVersion and regenerate`);
  const temporary = await mkdtemp(path.join(tmpdir(), 'project-wiki-diagrams-'));
  const output = path.join(root, 'diagrams');
  try {
    const { rendererVersion: _version, ...config } = diagramConfig;
    const configPath = path.join(temporary, 'config.json'), browserPath = path.join(temporary, 'browser.json');
    await writeFile(configPath, JSON.stringify(config));
    await writeFile(browserPath, JSON.stringify(process.env.WIKI_CHROME_PATH ? { executablePath: process.env.WIKI_CHROME_PATH } : {}));
    // Render all into temporary files before replacing assets or cleaning stale ones.
    for (const d of diagrams) {
      const input = path.join(temporary, d.key + '.mmd');
      await writeFile(input, d.source);
      await run(cli, ['-i', input, '-o', path.join(temporary, d.key + '.svg'), '-c', configPath, '-p', browserPath, '-b', 'transparent', '--no-font-embed', '--svgId', 'wiki-' + d.key.slice(0, 12)]);
    }
    await mkdir(output, { recursive: true });
    for (const d of diagrams) await writeFile(path.join(output, d.key + '.svg'), await readFile(path.join(temporary, d.key + '.svg')));
    const expected = new Set(diagrams.map(d => d.key + '.svg'));
    for (const name of await readdir(output)) if (/^[a-f0-9]{64}\.svg$/.test(name) && !expected.has(name)) await rm(path.join(output, name));
    await validateWiki(root, { diagrams: true });
    console.info(`Generated ${diagrams.length} diagrams`);
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Diagram generation failed'); process.exitCode = 1; });
