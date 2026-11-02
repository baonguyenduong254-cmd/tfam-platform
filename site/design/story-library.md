# Story library

Imported on 2026-10-06 from the three connected Google Docs titled Vol.I, Vol.II and Vol.III — TFAM — Editor Choice. Includes chapters 1–123 and three interleaved supplementary stories, in original tab order. Poster tabs contain no prose and are omitted. The audit records source document revisions, tab IDs, paragraph counts and SHA-256 hashes of normalized chapter bodies.

Prose is copied without rewriting or translation. Nonempty source paragraphs are joined with a blank line. Plain-text authoring retains paragraph boundaries and line breaks; inline word-processor formatting is not stored.

The public client receives the chapter index, then loads one chapter at a time. Server-side seeds provide the imported base. Each saved chapter is an independent record in the existing content table, keyed `story:<chapter id>`, with a monotonic revision. Author saves take precedence over imported seeds in later releases. No bulk atlas save contains the novel.

Writes reuse existing author authentication, same-origin checks, session cookies and CSRF protection. Conditional revisions reject stale writes. Device drafts are recovery copies, not published state. Saving publishes to readers without changing the source Docs. The English fields are empty until the author supplies translations; readers see a Vietnamese availability notice rather than an invented translation.
