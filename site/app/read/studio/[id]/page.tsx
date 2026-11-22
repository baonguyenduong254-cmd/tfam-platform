import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import '../../../studio/studio.css';

export const dynamic = 'force-dynamic';
export const metadata = { title:'Through Frost and Myth · Chronicles' };
type PublishedChapter = { title: string; content: string; chapter_number: number; language: string };

export default async function PublishedManuscript({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await env.DB!.prepare(`SELECT payload_json FROM studio_published_snapshots
    WHERE entity_type='manuscript' AND entity_id=? AND is_active=1 AND visibility='public'`)
    .bind(id).first<string>('payload_json');
  if (!payload) notFound();
  const chapter = JSON.parse(payload) as PublishedChapter;
  return <main className="studio-shell" lang={chapter.language}>
    <header className="studio-header"><a href="/chronicles">Through Frost and Myth · Chronicles</a></header>
    <article className="studio-reading">
      <h1>{chapter.title}</h1>
      {chapter.content.split(/\r?\n/).filter(line => line.trim()).map((line,index) => <p key={index}>{line}</p>)}
    </article>
  </main>;
}
