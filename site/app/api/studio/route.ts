import { env } from 'cloudflare:workers';
import { adminSession, authorizeWrite, authReply } from '../../../lib/admin-auth';

export async function GET(req: Request) {
  const session = await adminSession(req);
  if (!session) {
    return authReply({ error: 'Authentication required' }, 401);
  }
  const db = env.DB!;
  const [chapters, canon, knowledge, staging, snapshots] = await Promise.all([
    db.prepare('SELECT id, volume_id, chapter_number, code, title, language, word_count, status, visibility, data_state, spoiler_gate_chapter, updated_at FROM studio_chapters ORDER BY chapter_number').all(),
    db.prepare('SELECT id, slug, title, category, summary, data_state, visibility, source_chapter FROM studio_canon_entries ORDER BY updated_at DESC').all(),
    db.prepare('SELECT * FROM studio_knowledge_states ORDER BY character_id, COALESCE(learned_chapter, 9999)').all(),
    db.prepare('SELECT id, source_filename, source_format, target_type, extracted_title, status, created_at FROM studio_import_staging ORDER BY created_at DESC LIMIT 50').all(),
    db.prepare('SELECT id, entity_type, entity_id, version_number, visibility, is_active, published_at FROM studio_published_snapshots ORDER BY published_at DESC LIMIT 30').all(),
  ]);

  return authReply({
    authenticated: true,
    username: session.username,
    csrf: session.csrf,
    r2PublicBaseUrl: 'https://pub-a2e7030237c14362985465386fcae671.r2.dev',
    chapters: chapters.results || [],
    canon: canon.results || [],
    knowledge: knowledge.results || [],
    staging: staging.results || [],
    snapshots: snapshots.results || [],
  });
}

export async function POST(req: Request) {
  const denied = await authorizeWrite(req);
  if (denied) return denied;
  const session = await adminSession(req);
  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action || '');
  const db = env.DB!;

  if (action === 'save_chapter') {
    const id = String(body.id || crypto.randomUUID());
    const title = String(body.title || 'Untitled Chapter');
    const content = String(body.content || '');
    const wc = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chNum = Number(body.chapter_number || 1);
    const code = String(body.code || `CH-${String(chNum).padStart(3, '0')}`);

    const save = db
      .prepare(
        `INSERT INTO studio_chapters (id, volume_id, chapter_number, code, title, language, content, word_count, status, visibility, data_state, author_notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, content=excluded.content, word_count=excluded.word_count, author_notes=excluded.author_notes, updated_at=datetime('now')`
      )
      .bind(
        id,
        String(body.volume_id || 'vol-1'),
        chNum,
        code,
        title,
        String(body.language || 'en'),
        content,
        wc,
        String(body.status || 'draft'),
        String(body.visibility || 'private'),
        String(body.data_state || 'draft'),
        String(body.author_notes || '')
      );

    const audit = db
      .prepare('INSERT INTO studio_audit_logs (id, actor, action, entity_type, entity_id, details_json) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), session?.username || 'owner', 'save_chapter', 'chapter', id, JSON.stringify({ word_count: wc }));
    await db.batch([save, audit]);

    return authReply({ ok: true, id, word_count: wc });
  }

  return authReply({ error: 'Unsupported Studio action' }, 400);
}
