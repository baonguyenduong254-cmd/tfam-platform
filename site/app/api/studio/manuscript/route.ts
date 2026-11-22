import { env } from 'cloudflare:workers';
import { adminSession, authorizeWrite, authReply } from '../../../../lib/admin-auth';

const version = 'COALESCE((SELECT MAX(version_number) FROM studio_chapter_revisions WHERE chapter_id=studio_chapters.id),0)';
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export async function GET(req: Request) {
  if (!await adminSession(req)) return authReply({ error: 'Cần đăng nhập.' }, 401);
  const db = env.DB!;
  const params = new URL(req.url).searchParams;
  const id = params.get('id');
  const stage = params.get('stage');
  if (stage) {
    const row = await db.prepare('SELECT extracted_payload_json FROM studio_import_staging WHERE id=?').bind(stage).first<string>('extracted_payload_json');
    return row ? authReply({ source: JSON.parse(row) }) : authReply({ error: 'Không tìm thấy bản nhập.' }, 404);
  }
  if (id) {
    const revision = params.get('revision');
    if (revision) {
      const row = await db.prepare('SELECT title,content FROM studio_chapter_revisions WHERE chapter_id=? AND id=?').bind(id, revision).first();
      return row ? authReply({ revision: row }) : authReply({ error: 'Không tìm thấy phiên bản.' }, 404);
    }
    const [chapter, revisions] = await db.batch([
      db.prepare(`SELECT id,chapter_number,title,content,language,${version} AS version FROM studio_chapters WHERE id=?`).bind(id),
      db.prepare('SELECT id,version_number,title,created_at FROM studio_chapter_revisions WHERE chapter_id=? ORDER BY version_number DESC LIMIT 100').bind(id),
    ]);
    return chapter.results[0] ? authReply({ chapter: chapter.results[0], revisions: revisions.results }) : authReply({ error: 'Không tìm thấy bản thảo.' }, 404);
  }
  const [chapters, staging] = await db.batch([
    db.prepare('SELECT id,chapter_number,title,language FROM studio_chapters ORDER BY chapter_number,language'),
    db.prepare("SELECT id,source_filename,extracted_title FROM studio_import_staging WHERE status='pending_review' ORDER BY created_at DESC LIMIT 100"),
  ]);
  return authReply({ chapters: chapters.results, staging: staging.results });
}

export async function POST(req: Request) {
  const denied = await authorizeWrite(req);
  if (denied) return denied;
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > 1_500_000) return authReply({ error: 'Bản thảo quá dài.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return authReply({ error: 'Dữ liệu không hợp lệ.' }, 400); }
  const { id, stage, title, content, chapter_number: number, language, expectedVersion } = body ?? {};
  if (typeof title !== 'string' || !title.trim() || title.length > 500 || typeof content !== 'string' || content.length > 500000) {
    return authReply({ error: 'Kiểm tra lại tiêu đề và độ dài bản thảo.' }, 400);
  }
  const db = env.DB!;
  const chapterId = id || crypto.randomUUID();
  const words = countWords(content);
  let save;
  if (id) {
    if (typeof id !== 'string' || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) return authReply({ error: 'Phiên bản bản thảo không hợp lệ.' }, 400);
    save = db.prepare(`UPDATE studio_chapters SET title=?,content=?,word_count=?,updated_at=datetime('now') WHERE id=? AND ${version}=?`)
      .bind(title.trim(), content, words, id, expectedVersion);
  } else {
    if (!Number.isSafeInteger(number) || number < 1 || number > 99999 || !['vi', 'en'].includes(language) || (stage != null && typeof stage !== 'string')) {
      return authReply({ error: 'Số chương hoặc ngôn ngữ không hợp lệ.' }, 400);
    }
    save = db.prepare(`INSERT INTO studio_chapters (id,volume_id,chapter_number,code,title,language,content,word_count)
      SELECT ?,'unassigned',?,?,?,?,?,? WHERE NOT EXISTS
      (SELECT 1 FROM studio_chapters WHERE chapter_number=? AND language=?)
      AND (? IS NULL OR EXISTS (SELECT 1 FROM studio_import_staging WHERE id=? AND status='pending_review'))`)
      .bind(chapterId, number, `CH-${String(number).padStart(3,'0')}-${language}`, title.trim(), language, content, words, number, language, stage ?? null, stage ?? null);
  }
  const revisionId = crypto.randomUUID();
  const stmts = [save, db.prepare(`INSERT INTO studio_chapter_revisions
    (id,chapter_id,version_number,title,content,word_count)
    SELECT ?,?,COALESCE(MAX(version_number),0)+1,?,?,? FROM studio_chapter_revisions
    WHERE chapter_id=? HAVING changes()=1`).bind(revisionId, chapterId, title.trim(), content, words, chapterId)];
  if (!id && stage) stmts.push(db.prepare("UPDATE studio_import_staging SET status='accepted' WHERE id=? AND changes()=1").bind(stage));
  const [result] = await db.batch(stmts);
  if (!result.meta.changes) return authReply({ error: 'Bản thảo đã thay đổi hoặc chương này đã có. Nội dung đang sửa vẫn còn trong trình soạn thảo.' }, 409);
  return authReply({ id: chapterId }, id ? 200 : 201);
}
