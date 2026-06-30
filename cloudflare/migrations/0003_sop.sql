CREATE TABLE IF NOT EXISTS sop_rows (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  kategori    TEXT NOT NULL DEFAULT '',
  pic         TEXT NOT NULL DEFAULT '',
  product     TEXT NOT NULL DEFAULT '',
  topik       TEXT NOT NULL DEFAULT '',
  sub_topik   TEXT NOT NULL DEFAULT '',
  sop_dokumen TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sop_kategori ON sop_rows(kategori);
CREATE INDEX IF NOT EXISTS idx_sop_order    ON sop_rows(sort_order);

CREATE TABLE IF NOT EXISTS sop_files (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sop_row_id  TEXT NOT NULL REFERENCES sop_rows(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_size   INTEGER NOT NULL DEFAULT 0,
  file_type   TEXT NOT NULL DEFAULT '',
  r2_key      TEXT NOT NULL UNIQUE,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sop_files_row ON sop_files(sop_row_id);
