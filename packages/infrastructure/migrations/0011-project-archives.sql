-- Temporary exports only. No user history rewritten or purged.
CREATE TABLE export_jobs(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),requester_id uuid NOT NULL REFERENCES app_users(id),
 session_hash char(64) NOT NULL,epoch uuid NOT NULL,
 status text NOT NULL CHECK(status IN('queued','running','ready','failed','cancelled','expired')),
 revision bigint NOT NULL CHECK(revision>0),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,
 lease_id uuid,lease_until timestamptz,artifact_name varchar(100),bytes bigint CHECK(bytes>0 AND bytes<=67108864),sha256 char(64),error_code varchar(100),
 CHECK((status='running')=(lease_id IS NOT NULL AND lease_until IS NOT NULL)),
 CHECK((status='ready')=(artifact_name IS NOT NULL AND bytes IS NOT NULL AND sha256 IS NOT NULL)),
 CHECK(artifact_name IS NULL OR artifact_name~'^[a-f0-9-]{36}\.[a-f0-9-]{36}\.zip$')
);
CREATE INDEX export_jobs_work ON export_jobs(status,created_at);
CREATE INDEX export_jobs_owner ON export_jobs(project_id,requester_id,created_at DESC,id DESC);
REVOKE ALL ON export_jobs FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON export_jobs TO storymaster_app;
