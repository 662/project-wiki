import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { diagramFor, isWikiSlug, parseLink, resolveLink, sourceSlug, targetHref, validateWiki, wikiHref } from '../skills/project-wiki/assets/nextjs-wiki/wiki-core';

const page = (id: string, body = '', extra = '') => `---\nid: ${id}\ntitle: 测试\nsummary: 解释机制与边界\n${extra}\n---\n# 测试\n\n${body}\n`;
async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(tmpdir(), 'project-wiki-test-'));
  try { await writeFile(path.join(root, 'index.md'), page('home')); await run(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}
test('small flat Wiki needs no business categories, optional fields or fixed page count', async () => {
  await fixture(async root => {
    await writeFile(path.join(root, 'commands.md'), page('commands', '## 配置\n正文\n\n## 配置\n另一节'));
    const index = await validateWiki(root);
    assert.equal(index.documents.length, 2);
    assert.deepEqual(index.find('commands','id')?.document.headings.slice(1).map(h => h.anchor), ['配置','配置-1']);
  });
});
test('AST links ignore fenced and inline code, resolve reference links and formatted headings', async () => {
  await fixture(async root => {
    await writeFile(path.join(root, 'index.md'), page('home', '[详情][target]\n\n[target]: topic.md#带代码与格式\n\n```md\n[example](missing.md)\n```\n\n`[also code](missing.md)`'));
    await writeFile(path.join(root, 'topic.md'), page('topic', '## 带`代码`与**格式**'));
    const index = await validateWiki(root, { basePath: '/knowledge' });
    assert.equal(resolveLink(index, 'topic.md#带代码与格式', 'index.md'), '/knowledge/topic#%E5%B8%A6%E4%BB%A3%E7%A0%81%E4%B8%8E%E6%A0%BC%E5%BC%8F');
    await writeFile(path.join(root, 'topic.md'), page('topic', '## 改名'));
    await assert.rejects(validateWiki(root), /Missing heading/);
  });
});
test('merged identities resolve to one canonical topic and keep destination anchors', async () => {
  await fixture(async root => {
    await writeFile(path.join(root, 'topic.md'), page('topic', '## 恢复\n正文', 'aliases:\n  - id: old-topic\n    slug: reference/old-topic\n    anchor: 恢复'));
    const index = await validateWiki(root);
    const target = index.find('old-topic', 'id')!;
    assert.equal(target.document.id, 'topic'); assert.equal(target.alias, true);
    assert.equal(targetHref(index, target), '/wiki/topic#%E6%81%A2%E5%A4%8D');
    assert.equal(resolveLink(index, 'reference/old-topic.md#旧章节', 'index.md'), '/wiki/topic#%E6%81%A2%E5%A4%8D');
    assert.equal(index.documents.length, 2);
  });
});
test('canonical and alias ID/route collisions and invalid alias anchors are rejected', async () => {
  await fixture(async root => {
    await mkdir(path.join(root, 'topic'));
    await writeFile(path.join(root, 'topic/index.md'), page('topic'));
    await writeFile(path.join(root, 'topic.md'), page('other'));
    await assert.rejects(validateWiki(root), /Duplicate Wiki/);
    await rm(path.join(root, 'topic.md'));
    await writeFile(path.join(root, 'other.md'), page('other', '', 'aliases: [{id: home, slug: old}]'));
    await assert.rejects(validateWiki(root), /Duplicate Wiki/);
    await writeFile(path.join(root, 'other.md'), page('other', '', 'aliases: [{id: old, slug: old, anchor: missing}]'));
    await assert.rejects(validateWiki(root), /Alias heading/);
  });
});
test('links cannot escape roots, change protocol, inject credentials or bypass slug validation', () => {
  for (const value of ['../../x.md','%2e%2e/%2e%2e/x.md','//evil.test','javascript:alert(1)','data:text/html,x','%255cx.md','/api/logout','/wiki/../x','a.md?x=1','https://user:pass@example.com','/wiki/evil%0a','a\\b.md']) assert.throws(() => parseLink(value, 'rules/page.md'));
  for (const slug of ['a\n','a/','a//b','../a','UPPER','a%2fb']) assert.equal(isWikiSlug(slug), false);
  assert.equal(isWikiSlug('a/b-c'), true);
  assert.equal(sourceSlug('index.md'), '');
  assert.equal(wikiHref('/knowledge', 'guide'), '/knowledge/guide');
  assert.equal(wikiHref('/', 'guide'), '/guide');
  assert.throws(() => wikiHref('//evil.test', 'guide'));
});
test('symlinks, executable frontmatter selection and missing related pages fail closed', async () => {
  await fixture(async root => {
    await symlink(path.join(root, 'index.md'), path.join(root, 'outside.md'));
    await assert.rejects(validateWiki(root), /Symlink/);
    await rm(path.join(root,'outside.md'));
    await writeFile(path.join(root, 'index.md'), '---js\n({id:"home"})\n---\n# X');
    await assert.rejects(validateWiki(root), /YAML frontmatter/);
    await writeFile(path.join(root, 'index.md'), page('home', '', 'related: [absent]'));
    await assert.rejects(validateWiki(root), /missing related/);
  });
});
test('optional diagrams require accessibility metadata and matching source/config assets', async () => {
  await fixture(async root => {
    const source = 'flowchart LR\naccTitle: 状态\naccDescr: A 转向 B\nA-->B';
    assert.throws(() => diagramFor('flowchart LR\nA-->B'), /accTitle/);
    await writeFile(path.join(root, 'index.md'), page('home', '```mermaid\n'+source+'\n```'));
    await assert.rejects(validateWiki(root), /Mermaid is optional/);
    await assert.rejects(validateWiki(root, { diagrams: true }), /Missing diagram/);
    await mkdir(path.join(root, 'diagrams'));
    await writeFile(path.join(root,'diagrams',diagramFor(source).key+'.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const index = await validateWiki(root, { diagrams: true });
    assert.equal(index.documents[0].diagrams[0].title, '状态');
    await writeFile(path.join(root,'index.md'), page('home', '```mermaid\n'+source+'\nB-->C\n```'));
    await assert.rejects(validateWiki(root, { diagrams: true }), /Missing diagram/);
  });
});
