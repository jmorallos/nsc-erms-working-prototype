-- Document versioning for 201 File (multiple files per type)

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS replaces_id CHAR(26) REFERENCES documents (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_employee_recent
  ON documents (employee_id, uploaded_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_emp_type_version
  ON documents (employee_id, document_type_id, version_number DESC)
  WHERE deleted_at IS NULL;
