import { env } from 'cloudflare:workers';
import { timingSafeEqual } from 'node:crypto';
import { authorizeWrite, authReply, digest } from '../../../../lib/admin-auth';

type Source = { chapter_number: number; title: string; content: string; language: 'vi' | 'en' };
const valid = (item: Source) => item && Number.isSafeInteger(item.chapter_number) && item.chapter_number > 0 && item.chapter_number <= 99999
  && typeof item.title === 'string' && item.title.trim() && item.title.length <= 500
  && typeof item.content === 'string' && item.content.trim() && item.content.length <= 500000
  && ['vi', 'en'].includes(item.language);

export async function POST(req: Request) {
  const key = req.headers.get('x-tfam-sync-key') ?? '';
  const configured = (env as typeof env & { TFAM_GDOCS_SYNC_KEY?: string }).TFAM_GDOCS_SYNC_KEY;
  if (!configured || !key || !timingSafeEqual(Buffer.from(digest(key)), Buffer.from(digest(configured)))) {
    const denied = await authorizeWrite(req);
    if (denied) return denied;
  }
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > 1_500_000) return authReply({ error: 'Gói nhập quá lớn.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return authReply({ error: 'Dữ liệu không hợp lệ.' }, 400); }
  const { source_filename: filename, source_format: format, chapters } = body ?? {};
  if (typeof filename !== 'string' || !filename.trim() || filename.length > 500 || !['gdocs','text','markdown','json'].includes(format)
    || !Array.isArray(chapters) || !chapters.length || chapters.length > 10 || !chapters.every(valid)) {
    return authReply({ error: 'Kiểm tra nguồn, số chương, tiêu đề và nội dung.' }, 400);
  }
  const db = env.DB!;
  const statements = chapters.map(({ chapter_number, title, content, language }: Source) => {
    const payload = JSON.stringify({ chapter_number, title: title.trim(), content, language });
    return db.prepare(`INSERT INTO studio_import_staging
      (id,source_filename,source_format,target_type,extracted_title,extracted_payload_json)
      VALUES (?,?,?,'chapter',?,?) ON CONFLICT(id) DO NOTHING`)
      .bind(digest(payload), filename, format, title.trim(), payload);
  });
  const results = await db.batch(statements);
  return authReply({ staged_count: results.reduce((sum, result) => sum + result.meta.changes, 0) }, 201);
}
