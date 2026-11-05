import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { isWikiSlug, targetHref, validateWiki, wikiHref } from './wiki-core';
import { WikiView } from './wiki-view';

export type WikiPageOptions = {
  root: string;
  basePath?: string;
  title: string;
  authorize: (requestedPath: string) => Promise<void>;
  diagrams?: boolean;
};
// No default authentication policy. The caller must connect an explicit project policy.
// Public access is also an explicit caller choice, never an inferred template default.
export function createWikiPage(options: WikiPageOptions) {
  return async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug: segments = [] } = await params;
    const slug = segments.join('/');
    if (!isWikiSlug(slug)) notFound();
    const requested = wikiHref(options.basePath ?? '/wiki', slug);
    await options.authorize(requested);
    const index = await validateWiki(options.root, { basePath: options.basePath, diagrams: options.diagrams });
    const target = index.find(slug, 'slug');
    if (!target) notFound();
    if (target.alias) redirect(targetHref(index, target));
    return <WikiView index={index} document={target.document} title={options.title} />;
  };
}
