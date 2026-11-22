-- TFAM Studio — Relational Database Schema (SQLite / Cloudflare D1 Compatible)
-- Migration: 0001_initial.sql
-- Supports 3 data tiers (canon | draft | what_if) and 3 visibility tiers (private | public | paid)

PRAGMA foreign_keys = ON;

-- 1. Users & Role-Based Access Control (Owner, Editor, Reader, Guest)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reader', 'guest')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Manuscript Hierarchy: Volumes -> Arcs -> Chapters -> Revisions
CREATE TABLE IF NOT EXISTS volumes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  language TEXT NOT NULL DEFAULT 'vi',
  sort_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  synopsis TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS arcs (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  timeline_period TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  arc_id TEXT REFERENCES arcs(id) ON DELETE SET NULL,
  chapter_number INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'vi',
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'preview', 'approved', 'published')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  data_state TEXT NOT NULL DEFAULT 'draft' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  spoiler_gate_chapter INTEGER DEFAULT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  author_notes TEXT DEFAULT '',
  published_at TEXT DEFAULT NULL,
  scheduled_publish_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chapter_revisions (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  change_summary TEXT DEFAULT '',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Character Studio
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  epithet TEXT DEFAULT '',
  faction TEXT DEFAULT '',
  affiliation TEXT DEFAULT '',
  rank_title TEXT DEFAULT '',
  age_display TEXT DEFAULT '',
  appearance TEXT DEFAULT '',
  biography TEXT DEFAULT '',
  personality TEXT DEFAULT '',
  voice_profile TEXT DEFAULT '',
  speech_conventions TEXT DEFAULT '',
  abilities TEXT DEFAULT '',
  vestigium_signature TEXT DEFAULT '',
  arc_progression TEXT DEFAULT '',
  private_notes TEXT DEFAULT '',
  public_summary TEXT DEFAULT '',
  first_appearance_chapter INTEGER DEFAULT NULL,
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  spoiler_gate_chapter INTEGER DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS character_relationships (
  id TEXT PRIMARY KEY,
  source_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  target_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  as_of_chapter INTEGER DEFAULT 1,
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Canon Database & Canon Graph Links
CREATE TABLE IF NOT EXISTS canon_entries (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'organization', 'nation', 'faction', 'location', 'historical_event',
    'artifact', 'weapon', 'ability', 'vestigium', 'family', 'hierarchy', 'rule', 'fact'
  )),
  summary TEXT DEFAULT '',
  body TEXT DEFAULT '',
  source_chapter INTEGER DEFAULT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  spoiler_gate_chapter INTEGER DEFAULT NULL,
  private_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canon_links (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('character', 'canon', 'chapter', 'timeline', 'campaign', 'asset')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('character', 'canon', 'chapter', 'timeline', 'campaign', 'asset')),
  target_id TEXT NOT NULL,
  relation_label TEXT NOT NULL DEFAULT 'references',
  notes TEXT DEFAULT '',
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Timeline, Continuity & Character Knowledge State
CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  event_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  in_world_date TEXT NOT NULL,
  sort_year REAL NOT NULL DEFAULT 1715,
  era TEXT DEFAULT '',
  location TEXT DEFAULT '',
  chapter_number INTEGER DEFAULT NULL,
  summary TEXT DEFAULT '',
  participants_json TEXT NOT NULL DEFAULT '[]',
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS character_knowledge_states (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_statement TEXT NOT NULL,
  keywords_json TEXT NOT NULL DEFAULT '[]',
  learned_chapter INTEGER DEFAULT NULL, -- NULL means character NEVER knows this fact yet
  source_event_id TEXT REFERENCES timeline_events(id) ON DELETE SET NULL,
  certainty TEXT NOT NULL DEFAULT 'known' CHECK (certainty IN ('known', 'partial', 'rumor', 'unknown')),
  notes TEXT DEFAULT '',
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Worldbuilding Studio & War Room + What-if Sandbox
CREATE TABLE IF NOT EXISTS world_entities (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('geography', 'polity', 'faction', 'house', 'power_system', 'history')),
  name TEXT NOT NULL,
  region TEXT DEFAULT '',
  description TEXT DEFAULT '',
  attributes_json TEXT NOT NULL DEFAULT '{}',
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS war_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theater TEXT NOT NULL,
  period TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'concluded', 'what_if')),
  commanders_json TEXT NOT NULL DEFAULT '[]',
  forces_json TEXT NOT NULL DEFAULT '[]',
  frontlines_json TEXT NOT NULL DEFAULT '[]',
  objectives TEXT DEFAULT '',
  logistics_notes TEXT DEFAULT '',
  data_state TEXT NOT NULL DEFAULT 'canon' CHECK (data_state IN ('canon', 'draft', 'what_if')),
  parent_campaign_id TEXT REFERENCES war_campaigns(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS what_if_scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  divergence_chapter INTEGER NOT NULL DEFAULT 1,
  base_event_id TEXT REFERENCES timeline_events(id) ON DELETE SET NULL,
  premise TEXT NOT NULL,
  changes_json TEXT NOT NULL DEFAULT '[]',
  impacted_entities_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'exploring' CHECK (status IN ('exploring', 'archived', 'promoted_to_draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Narrative QA Findings
CREATE TABLE IF NOT EXISTS qa_findings (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  source_engine TEXT NOT NULL DEFAULT 'deterministic' CHECK (source_engine IN ('deterministic', 'ai_assisted')),
  excerpt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  suggested_revision TEXT DEFAULT '',
  evidence_ref TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Asset Library (Cloudflare R2 Metadata Registry — never auto-deletes R2 objects)
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  r2_key TEXT UNIQUE NOT NULL,
  public_url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cover', 'character_art', 'map', 'military', 'vestigium', 'landmark', 'audio', 'misc')),
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]',
  usage_refs_json TEXT NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'paid')),
  publish_permission TEXT NOT NULL DEFAULT 'restricted' CHECK (publish_permission IN ('restricted', 'approved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. Publishing Center (Immutable Published Snapshots + Rollback)
CREATE TABLE IF NOT EXISTS published_snapshots (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('chapter', 'character', 'canon', 'asset')),
  entity_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'paid')),
  spoiler_gate_chapter INTEGER DEFAULT NULL,
  payload_json TEXT NOT NULL,
  approved_by TEXT REFERENCES users(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  release_notes TEXT DEFAULT '',
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. Commerce & Reader Analytics
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('volume', 'chapter_bundle', 'subscription', 'artbook', 'lore_pack')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  active INTEGER NOT NULL DEFAULT 1,
  entitlement_scope_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reader_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  scope_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  granted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  provider TEXT NOT NULL DEFAULT 'sandbox',
  status TEXT NOT NULL CHECK (status IN ('sandbox_pending', 'sandbox_completed', 'paid', 'refunded', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_events (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  reader_hash TEXT NOT NULL,
  completion_pct INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'vi',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. Module 14: TFAM Data Importer Staging Queue (Never auto-writes to Canon)
CREATE TABLE IF NOT EXISTS import_staging (
  id TEXT PRIMARY KEY,
  source_filename TEXT NOT NULL,
  source_format TEXT NOT NULL CHECK (source_format IN ('docx', 'markdown', 'json', 'gdocs')),
  target_type TEXT NOT NULL CHECK (target_type IN ('chapter', 'character', 'canon', 'timeline')),
  extracted_title TEXT NOT NULL,
  extracted_payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved_draft', 'approved_canon', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT DEFAULT NULL
);

-- 12. System Audit Log & Settings
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chapters_volume ON chapters(volume_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status, visibility);
CREATE INDEX IF NOT EXISTS idx_knowledge_char ON character_knowledge_states(character_id, learned_chapter);
CREATE INDEX IF NOT EXISTS idx_canon_links_src ON canon_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_canon_links_tgt ON canon_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_active ON published_snapshots(entity_type, entity_id, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
