CREATE TABLE app_users (
  id uuid PRIMARY KEY,
  display_name varchar(200) NOT NULL CHECK (length(btrim(display_name)) > 0),
  email varchar(320),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE external_identities (
  issuer varchar(2048) NOT NULL,
  subject varchar(255) NOT NULL,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  PRIMARY KEY (issuer, subject)
);
CREATE INDEX external_identities_user_idx ON external_identities(user_id);
CREATE TABLE projects (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  name varchar(200) NOT NULL CHECK (length(btrim(name)) > 0),
  description varchar(4000) NOT NULL DEFAULT '',
  language varchar(35) NOT NULL DEFAULT 'fr',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE project_memberships (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner','admin','author','reviewer','reader')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  PRIMARY KEY (project_id, user_id)
);
CREATE UNIQUE INDEX memberships_owner_unique ON project_memberships(project_id) WHERE role = 'owner' AND status = 'active';
CREATE INDEX memberships_user_idx ON project_memberships(user_id, project_id) WHERE status = 'active';
CREATE INDEX projects_order_idx ON projects(created_at DESC,id DESC);
CREATE FUNCTION ensure_project_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
  IF TG_TABLE_NAME = 'projects' THEN target := COALESCE(NEW.id, OLD.id);
  ELSE target := COALESCE(NEW.project_id, OLD.project_id); END IF;
  IF EXISTS (SELECT 1 FROM projects p WHERE p.id = target AND NOT EXISTS
    (SELECT 1 FROM project_memberships m WHERE m.project_id = p.id AND m.user_id = p.owner_id AND m.role = 'owner' AND m.status = 'active')) THEN
    RAISE EXCEPTION 'project_owner_membership_required' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER project_owner_after_project AFTER INSERT OR UPDATE ON projects DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_project_owner();
CREATE CONSTRAINT TRIGGER project_owner_after_membership AFTER INSERT OR UPDATE OR DELETE ON project_memberships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_project_owner();
CREATE TABLE project_revisions (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  revision bigint NOT NULL CHECK (revision > 0),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  actor_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (project_id, revision)
);
CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  actor_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  actor_type text NOT NULL CHECK (actor_type IN ('human','integrated_ai','external_ai','system')),
  action varchar(100) NOT NULL,
  resource_id uuid NOT NULL,
  before_revision bigint,
  after_revision bigint,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX audit_project_time_idx ON audit_events(project_id,created_at DESC);
CREATE TABLE sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  id_token_cipher text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE login_transactions (
  token_hash char(64) PRIMARY KEY,
  secret_cipher text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE idempotency_records (
  scope_hash char(64) NOT NULL,
  key_hash char(64) NOT NULL,
  fingerprint char(64) NOT NULL,
  response jsonb NOT NULL CHECK (jsonb_typeof(response) = 'object'),
  expires_at timestamptz NOT NULL DEFAULT clock_timestamp() + interval '24 hours',
  PRIMARY KEY (scope_hash,key_hash)
);
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO storymaster_app;
GRANT SELECT,INSERT,UPDATE ON app_users, external_identities, projects, project_memberships, sessions TO storymaster_app;
GRANT SELECT,INSERT ON project_revisions,audit_events TO storymaster_app;
GRANT SELECT,INSERT,DELETE ON login_transactions,idempotency_records TO storymaster_app;
