'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Session = { authenticated: boolean; csrf?: string };
type Draft = { id?: string; stage?: string; title: string; content: string; chapter_number: number; language: 'vi' | 'en'; version?: number };
type DraftList = { chapters: Pick<Draft,'id'|'title'|'language'|'chapter_number'>[]; staging: { id: string; extracted_title: string; source_filename: string }[] };
type Release = { id: string; version_number: number; is_active: number };
type Revision = { id: string; version_number: number; created_at: string };
const blank: Draft = { title: '', content: '', chapter_number: 1, language: 'vi' };
const endpoint = '/api/studio/manuscript';
const releaseEndpoint = '/api/studio/releases';

async function request<T>(path: string, body?: unknown, csrf?: string): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    ...(body !== undefined && { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' }, body: JSON.stringify(body) }),
  });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Yêu cầu chưa hoàn tất.');
  return data as T;
}

export default function Studio() {
  const [session,setSession] = useState<Session>();
  const [library,setLibrary] = useState<DraftList>({ chapters: [], staging: [] });
  const [draft,setDraft] = useState<Draft>();
  const [releases,setReleases] = useState<Release[]>([]);
  const [revisions,setRevisions] = useState<Revision[]>([]);
  const [mode,setMode] = useState<'edit'|'preview'|'import'>('edit');
  const [busy,setBusy] = useState(false);
  const [dirty,setDirty] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');

  async function run(action: () => Promise<void>) {
    setBusy(true); setNotice(''); setError('');
    try { await action(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Yêu cầu chưa hoàn tất.'); }
    finally { setBusy(false); }
  }
  async function refresh() { setLibrary(await request<DraftList>(endpoint)); }
  useEffect(() => {
    void request<Session>('/api/admin/session').then(async current => {
      setSession(current);
      if (current.authenticated) await refresh();
    }).catch(() => { setSession({ authenticated:false }); setError('Chưa kiểm tra được phiên đăng nhập.'); });
  },[]);
  useEffect(() => {
    if (!dirty) return;
    const handle = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  },[dirty]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await run(async () => {
      setSession(await request<Session>('/api/admin/login', { username: values.get('username'), password: values.get('password') }));
      await refresh();
    });
  }
  function replaceDraft(next: Draft, history: Revision[] = []) {
    setDraft(next); setRevisions(history); setReleases([]); setDirty(false); setMode('edit');
  }
  async function openChapter(id: string) {
    const query = '?id='+encodeURIComponent(id);
    const [data, publication] = await Promise.all([
      request<{ chapter: Draft; revisions: Revision[] }>(endpoint+query),
      request<{releases:Release[]}>(releaseEndpoint+query),
    ]);
    replaceDraft(data.chapter,data.revisions); setReleases(publication.releases);
  }
  async function changeRelease(action: 'publish'|'restore'|'unpublish', releaseId?: string) {
    if (!draft?.id || !session) return;
    const id = draft.id;
    const prompt = action==='publish' ? 'Xuất bản công khai phiên bản đã lưu này trên Atlas?'
      : action==='restore' ? 'Đưa bản xuất bản đã chọn trở lại trang đọc công khai?' : 'Gỡ bản này khỏi trang đọc công khai?';
    if (!window.confirm(prompt)) return;
    await run(async () => {
      await request(releaseEndpoint,{id,action,releaseId,expectedVersion:draft.version},session.csrf);
      const data = await request<{releases:Release[]}>(releaseEndpoint+'?id='+encodeURIComponent(id));
      setReleases(data.releases); setNotice(action==='unpublish' ? 'Đã gỡ bản công khai.' : 'Đã cập nhật trang đọc công khai.');
    });
  }
  function canLeave() { return !dirty || window.confirm('Rời bản thảo đang có thay đổi chưa lưu?'); }
  function edit(changes: Partial<Draft>) { setDraft(current => current && { ...current, ...changes }); setDirty(true); }

  return <main className="studio-shell">
    <header className="studio-header"><a href="/">Through Frost and Myth</a><h1>Studio</h1>
      {session?.authenticated && <button disabled={busy} onClick={() => {
        if (canLeave()) void run(async () => {
          await request('/api/admin/logout',{},session.csrf);
          setSession({authenticated:false}); setDraft(undefined); setDirty(false); setRevisions([]);
          setLibrary({chapters:[],staging:[]});
        });
      }}>Đăng xuất</button>}
    </header>
    <div aria-live="polite">{error && <p className="studio-error">{error}</p>}{notice && <p>{notice}</p>}</div>
    {!session ? <p>Đang kiểm tra phiên đăng nhập…</p> : !session.authenticated ? <form className="studio-login" onSubmit={login}>
      <h2>Đăng nhập tác giả</h2>
      <label>Tên đăng nhập<input name="username" autoComplete="username" required/></label>
      <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required/></label>
      <button disabled={busy}>Đăng nhập</button>
    </form> : <div className="studio-workspace">
      <aside className="studio-library">
        <button disabled={busy} onClick={() => canLeave() && replaceDraft({...blank})}>Tạo bản thảo</button>
        <h2>Bản thảo</h2>
        {library.chapters.map(x => <button disabled={busy} key={x.id} aria-pressed={draft?.id===x.id && !!draft?.id} onClick={() => {
          if (x.id && canLeave()) void run(() => openChapter(x.id!));
        }}>{x.chapter_number} · {x.title} <small>{x.language.toUpperCase()}</small></button>)}
        <h2>Hàng chờ nhập</h2>
        <div className="studio-actions"><button disabled={busy} onClick={() => { if (canLeave()) { setMode('import'); setDraft(undefined); setDirty(false); } }}>Nhập văn bản</button>
          <button disabled={busy} onClick={() => void run(refresh)}>Tải lại</button></div>
        {library.staging.map(row => <button disabled={busy} key={row.id} onClick={() => {
          if (canLeave()) void run(async () => {
            const {source} = await request<{source:Draft}>(endpoint+'?stage='+encodeURIComponent(row.id));
            replaceDraft({...source,stage:row.id});
          });
        }}>{row.extracted_title}<small>{row.source_filename}</small></button>)}
      </aside>
      <section className="studio-editor">
        {mode==='import' ? <form onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void run(async () => {
            const result = await request<{staged_count:number}>('/api/studio/import',{
              source_filename:form.get('source'),source_format:'text',
              chapters:[{chapter_number:Number(form.get('number')),title:form.get('title'),content:form.get('body'),language:form.get('language')}],
            }, session.csrf);
            await refresh(); setNotice(result.staged_count ? 'Đã đưa chương vào hàng chờ.' : 'Bản nhập này đã được tiếp nhận.');
          });
        }}>
          <h2>Nhập chương vào hàng chờ</h2>
          <label>Nguồn<input name="source" required maxLength={500}/></label>
          <label>Số chương<input name="number" type="number" min={1} max={99999} required/></label>
          <label>Ngôn ngữ<select name="language"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
          <label>Tiêu đề<input name="title" required maxLength={500}/></label>
          <label>Nội dung<textarea name="body" required maxLength={500000}/></label>
          <button disabled={busy}>Thêm vào hàng chờ</button>
        </form> : draft ? <>
          <div className="studio-actions">
            <button aria-pressed={mode==='edit'} onClick={() => setMode('edit')}>Soạn thảo</button>
            <button aria-pressed={mode==='preview'} onClick={() => setMode('preview')}>Xem trước</button>
            {dirty && <span>Chưa lưu</span>}
          </div>
          {mode==='preview' ? <article className="studio-reading">
            <p>Chương {draft.chapter_number} · Xem trước nội bộ</p>
            <h2>{draft.title}</h2>
            {draft.content.split(/\r?\n/).filter(line => line.trim()).map((line,index) => <p key={index}>{line}</p>)}
          </article> : <form onSubmit={event => {
            event.preventDefault();
            void run(async () => {
              const result = await request<{id:string}>(endpoint,{...draft,expectedVersion:draft.version},session.csrf);
              await openChapter(result.id); await refresh(); setNotice('Đã lưu bản thảo.');
            });
          }}>
            <div className="studio-fields">
              <label>Số chương<input type="number" min={1} max={99999} required disabled={busy || !!draft.id} value={draft.chapter_number || ''} onChange={e=>edit({chapter_number:Number(e.target.value)})}/></label>
              <label>Ngôn ngữ<select disabled={busy || !!draft.id} value={draft.language} onChange={e=>edit({language:e.target.value as Draft['language']})}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
            </div>
            <label>Tiêu đề<input required maxLength={500} disabled={busy} value={draft.title} onChange={e=>edit({title:e.target.value})}/></label>
            <label>Nội dung<textarea disabled={busy} maxLength={500000} value={draft.content} onChange={e=>edit({content:e.target.value})}/></label>
            <button disabled={busy || (!!draft.id && !dirty)}>{draft.stage ? 'Duyệt vào bản thảo' : 'Lưu bản thảo'}</button>
          </form>}
          {!!draft.id && !!revisions.length && <details><summary>Lịch sử phiên bản</summary>
            {revisions.map(rev => <button disabled={busy || rev.version_number===draft.version} key={rev.id} onClick={() => {
              if (canLeave()) void run(async () => {
                const data = await request<{revision:Pick<Draft,'title'|'content'>}>(endpoint+'?id='+encodeURIComponent(draft.id!)+'&revision='+encodeURIComponent(rev.id));
                edit(data.revision); setMode('preview'); setNotice('Đang xem lại phiên bản '+rev.version_number+'. Lưu để tạo một phiên bản mới.');
              });
            }}>Bản {rev.version_number} · {rev.created_at} UTC</button>)}
          </details>}
          {draft.id && <details>
            <summary>Xuất bản trên Atlas</summary>
            <p>Bản xuất bản có đường dẫn riêng. Chỉnh sửa bản thảo sẽ tạo phiên bản nội bộ.</p>
            <div className="studio-actions">
              <button disabled={busy || dirty || !draft.version || !draft.content.trim()} onClick={() => void changeRelease('publish')}>Duyệt và xuất bản</button>
              {releases.some(release => release.is_active===1) && <>
                <a href={'/read/studio/'+encodeURIComponent(draft.id)} target="_blank" rel="noreferrer">Mở trang đọc công khai</a>
                <button disabled={busy} onClick={() => void changeRelease('unpublish')}>Gỡ xuất bản</button>
              </>}
            </div>
            {releases.filter(release => !release.is_active).map(release =>
              <button key={release.id} disabled={busy} onClick={() => void changeRelease('restore',release.id)}>Khôi phục bản xuất bản {release.version_number}</button>
            )}
          </details>}
        </> : <p>Chọn bản thảo hoặc duyệt một chương từ hàng chờ nhập.</p>}
      </section>
    </div>}
  </main>;
}
