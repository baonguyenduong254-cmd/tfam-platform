import { env } from 'cloudflare:workers';
import { adminSession, authorizeWrite, authReply } from '../../../../lib/admin-auth';

export async function GET(req: Request) {
  if (!await adminSession(req)) return authReply({ error: 'Cần đăng nhập.' }, 401);
  const id = new URL(req.url).searchParams.get('id');
  const rows = await env.DB!.prepare(`SELECT id,version_number,is_active,published_at FROM studio_published_snapshots
    WHERE entity_type='manuscript' AND entity_id=? AND visibility='public' ORDER BY version_number DESC`).bind(id).all();
  return authReply({ releases: rows.results });
}

export async function POST(req: Request) {
  const denied = await authorizeWrite(req);
  if (denied) return denied;
  let body;
  try { body = await req.json(); } catch { return authReply({ error: 'Dữ liệu không hợp lệ.' }, 400); }
  const { id, action, expectedVersion, releaseId } = (body ?? {}) as Record<string, unknown>;
  if (typeof id !== 'string' || !id || id.length > 128) return authReply({ error: 'Bản thảo không hợp lệ.' }, 400);

  const db = env.DB!;
  if (action === 'publish' && typeof expectedVersion === 'number' && Number.isSafeInteger(expectedVersion) && expectedVersion > 0) {
    const snapshot = crypto.randomUUID();
    const [insert] = await db.batch([
      db.prepare(`INSERT INTO studio_published_snapshots (id,entity_type,entity_id,version_number,visibility,payload_json,is_active)
        SELECT ?,'manuscript',c.id,
          (SELECT COALESCE(MAX(version_number),0)+1 FROM studio_published_snapshots WHERE entity_type='manuscript' AND entity_id=c.id),
          'public',json_object('title',r.title,'content',r.content,'chapter_number',c.chapter_number,'language',c.language),1
        FROM studio_chapters c JOIN studio_chapter_revisions r ON r.chapter_id=c.id
        WHERE c.id=? AND r.version_number=? AND length(trim(r.content))>0
          AND r.version_number=(SELECT MAX(version_number) FROM studio_chapter_revisions WHERE chapter_id=c.id)`)
        .bind(snapshot,id,expectedVersion),
      db.prepare("UPDATE studio_published_snapshots SET is_active=0 WHERE entity_type='manuscript' AND entity_id=? AND id<>? AND is_active=1 AND changes()=1")
        .bind(id,snapshot),
    ]);
    return insert.meta.changes ? authReply({ ok:true }) : authReply({ error:'Cần lưu bản thảo có nội dung và tải phiên bản mới nhất.' },409);
  }
  if (action === 'restore' && typeof releaseId === 'string') {
    const result = await db.prepare(`UPDATE studio_published_snapshots SET is_active=CASE WHEN id=? THEN 1 ELSE 0 END
      WHERE entity_type='manuscript' AND entity_id=? AND visibility='public'
      AND EXISTS (SELECT 1 FROM studio_published_snapshots WHERE id=? AND entity_type='manuscript' AND entity_id=? AND visibility='public')`)
      .bind(releaseId,id,releaseId,id).run();
    return result.meta.changes ? authReply({ ok:true }) : authReply({ error:'Không tìm thấy bản đã xuất bản.' },404);
  }
  if (action === 'unpublish') {
    await db.prepare("UPDATE studio_published_snapshots SET is_active=0 WHERE entity_type='manuscript' AND entity_id=? AND is_active=1").bind(id).run();
    return authReply({ ok:true });
  }
  return authReply({ error:'Thao tác xuất bản không hợp lệ.' },400);
}
