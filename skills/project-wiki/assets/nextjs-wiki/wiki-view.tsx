import Link from 'next/link';
import { isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { resolveLink, targetHref, wikiHref, type WikiDocument, type WikiIndex } from './wiki-core';
import styles from './wiki.module.css';

export function WikiView({ index, document, title }: { index: WikiIndex; document: WikiDocument; title: string }) {
  return <div className={styles.shell}>
    <header className={styles.header}><Link href={wikiHref(index.basePath)}>{title}</Link></header>
    <div className={styles.layout}>
      <nav aria-label="Wiki navigation" className={styles.navigation}>
        {index.documents.map(page => <Link key={page.id} href={wikiHref(index.basePath, page.slug)} aria-current={page.slug === document.slug ? 'page' : undefined}>{page.title}</Link>)}
      </nav>
      <main className={styles.main}>
        <p className={styles.summary}>{document.summary}</p>
        <article className={styles.article}>
          <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={{
            a: ({ href = '', children }) => { const target = resolveLink(index, href, document.sourcePath); return <Link href={target} target={/^https?:/i.test(target) ? '_blank' : undefined} rel={/^https?:/i.test(target) ? 'noopener noreferrer' : undefined}>{children}</Link>; },
            table: ({ children }) => <div className={styles.table}><table>{children}</table></div>,
            pre: ({ children }) => {
              const code = isValidElement<{ className?: string; children?: string }>(children) ? children.props : undefined;
              if (code?.className !== 'language-mermaid') return <pre>{children}</pre>;
              const diagram = document.diagrams.find(d => d.source === String(code.children).trim());
              if (!diagram?.svg) throw new Error('Diagram asset is not generated');
              // SVG is isolated in an image, never inserted as executable Markdown HTML.
              // eslint-disable-next-line @next/next/no-img-element
              return <figure><img src={'data:image/svg+xml;base64,' + Buffer.from(diagram.svg).toString('base64')} alt={diagram.description} /><figcaption>{diagram.title}</figcaption></figure>;
            },
          }}>{document.markdown}</ReactMarkdown>
        </article>
        {document.related.length > 0 && <aside className={styles.related} aria-label="Related topics">{document.related.map(id => { const target = index.find(id, 'id')!; return <Link key={id} href={targetHref(index, target)}>{target.document.title}</Link>; })}</aside>}
      </main>
      <nav aria-label="On this page" className={styles.toc}>{document.headings.filter(h => h.depth === 2 || h.depth === 3).map(h => <a key={h.anchor} href={'#'+encodeURIComponent(h.anchor)}>{h.text}</a>)}</nav>
    </div>
  </div>;
}
