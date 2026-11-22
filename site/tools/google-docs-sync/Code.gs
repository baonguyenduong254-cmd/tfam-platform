/**
 * TFAM Google Docs -> TFAM Studio Live Sync (Google Apps Script)
 * Paste into https://script.google.com and set Script Properties:
 *   - TFAM_SYNC_URL: https://studio.your-domain.com/api/studio/import  (or local tunnel URL)
 *   - TFAM_SYNC_KEY: matching TFAM_GDOCS_SYNC_KEY secret configured in Cloudflare Workers
 *
 * Pre-mapped with your 6 TFAM Google Docs Volume IDs from Google Drive.
 * Strictly 1-way sync into `studio_import_staging` (never overwrites Canon automatically).
 */

const TFAM_VOLUMES = [
  { code: 'VOL-I',   docId: '1eHK4W6fAn-k-DsSOWt185SiVX0WtKAJe9i3-CqssBIw', lang: 'vi' },
  { code: 'VOL-I-EN',docId: '1ATMH8p1rQHyz9lf5RgF-MX8-5eXE5sfpxvQS-b8P_yo', lang: 'en' },
  { code: 'VOL-II',  docId: '1DGvtSUHBvQqnCZmzfHgQNDvrNcTxKN6ieS_p1x_N7s4', lang: 'vi' },
  { code: 'VOL-III', docId: '1cx0Ol6pgi_QDsNPk-itQxzi9XIy7XqkTbPdxZ92-BiE', lang: 'vi' },
  { code: 'VOL-IV',  docId: '1VTZFZTkYmaPmTyM159XaMFHVexsUbBh1rxXmf8-qwmA', lang: 'vi' },
  { code: 'VOL-V',   docId: '1TzJrdgdMo15Q-GyEPBtqnGj6srOObIruPw827n9CUi4', lang: 'vi' },
  { code: 'VOL-VI',  docId: '13q6lrltmtsXOfAJ_2dXhyFG_M7FtP2vLB_-tx6lxBao', lang: 'vi' },
];

const CHAPTER_RE = /^(?:Chương|Chapter)\s+(\d+)\s*[:.\-]?\s*(.*)$/i;

function syncModifiedVolumes() {
  const props = PropertiesService.getScriptProperties();
  const endpoint = props.getProperty('TFAM_SYNC_URL');
  const syncKey = props.getProperty('TFAM_SYNC_KEY');
  if (!endpoint || !syncKey) {
    throw new Error('Set TFAM_SYNC_URL and TFAM_SYNC_KEY in Project Settings -> Script Properties.');
  }

  for (const vol of TFAM_VOLUMES) {
    const file = DriveApp.getFileById(vol.docId);
    const modified = file.getLastUpdated().toISOString();
    const lastSyncedKey = 'LAST_SYNC_' + vol.code;
    if (props.getProperty(lastSyncedKey) === modified) {
      continue; // Unchanged since last sync
    }

    const doc = DocumentApp.openById(vol.docId);
    const chapters = chaptersFromTabs_(doc.getTabs(), vol.lang);
    if (!chapters.length) continue;

    // Push in chunks of 10 chapters to keep webhook payloads lean
    for (let i = 0; i < chapters.length; i += 10) {
      const batch = chapters.slice(i, i + 10);
      const res = UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'X-TFAM-Sync-Key': syncKey },
        payload: JSON.stringify({
          source_filename: file.getName(),
          source_format: 'gdocs',
          chapters: batch,
        }),
        muteHttpExceptions: true,
      });
      if (res.getResponseCode() >= 300) {
        throw new Error('Sync failed for ' + vol.code + ': ' + res.getContentText());
      }
    }

    props.setProperty(lastSyncedKey, modified);
    Logger.log('Synced ' + chapters.length + ' chapters from ' + vol.code + ' into staging.');
  }
}

function chaptersFromTabs_(tabs, language) {
  const chapters = [];
  for (const tab of tabs) {
    const title = tab.getTitle().trim();
    const match = title.match(CHAPTER_RE);
    const content = tab.asDocumentTab().getBody().getText().trim();
    if (match && content) {
      chapters.push({ chapter_number: Number(match[1]), title, content, language });
    } else {
      chapters.push(...splitChapters_(content, language));
    }
    chapters.push(...chaptersFromTabs_(tab.getChildTabs(), language));
  }
  return chapters;
}

function splitChapters_(text, lang) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let cur = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(CHAPTER_RE);
    if (m) {
      if (cur) out.push({ chapter_number: cur.num, title: cur.title, content: cur.lines.join('\n').trim(), language: lang });
      cur = { num: Number(m[1]), title: trimmed, lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) out.push({ chapter_number: cur.num, title: cur.title, content: cur.lines.join('\n').trim(), language: lang });
  return out;
}
