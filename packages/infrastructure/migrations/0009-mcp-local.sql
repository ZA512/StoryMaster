-- Additive local MCP delegation; no previous narrative row is rewritten.
CREATE TABLE external_clients(
 id uuid PRIMARY KEY,oauth_client_id varchar(200) NOT NULL UNIQUE,name varchar(200) NOT NULL,redirect_uris jsonb NOT NULL,allowed_scopes text[] NOT NULL,status text NOT NULL CHECK(status IN('active','disabled')),revision bigint NOT NULL CHECK(revision>0),UNIQUE(id,oauth_client_id)
);
CREATE TABLE delegated_grants(
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_users(id),client_id uuid NOT NULL REFERENCES external_clients(id),scopes text[] NOT NULL CHECK(cardinality(scopes)>0 AND scopes<@ARRAY['projects:read','project:read','proposal:read','proposal:write','proposal:submit']::text[]),expires_at timestamptz NOT NULL,status text NOT NULL CHECK(status IN('active','revoked')),revision bigint NOT NULL CHECK(revision>0),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,revoked_at timestamptz,
 UNIQUE(id,user_id,client_id),CHECK((status='active' AND revoked_at IS NULL) OR(status='revoked' AND revoked_at IS NOT NULL))
);
CREATE TABLE delegated_grant_projects(grant_id uuid NOT NULL REFERENCES delegated_grants(id),project_id uuid NOT NULL REFERENCES projects(id),PRIMARY KEY(grant_id,project_id));
CREATE TABLE delegated_grant_events(id uuid PRIMARY KEY,grant_id uuid NOT NULL REFERENCES delegated_grants(id),revision bigint NOT NULL,action varchar(100) NOT NULL,snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(grant_id,revision));
CREATE FUNCTION protect_revoked_grant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.status='revoked' OR NEW.user_id<>OLD.user_id OR NEW.client_id<>OLD.client_id OR NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'grant_transition_forbidden' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER protect_revoked_grant BEFORE UPDATE ON delegated_grants FOR EACH ROW EXECUTE FUNCTION protect_revoked_grant();
CREATE TABLE mcp_authorizations(
 id uuid PRIMARY KEY,user_id uuid NOT NULL,client_id uuid NOT NULL,grant_id uuid NOT NULL,token_fingerprint char(64) NOT NULL,capability_hash char(64) NOT NULL,grant_revision bigint NOT NULL CHECK(grant_revision>0),scopes text[] NOT NULL,expires_at timestamptz NOT NULL,
 FOREIGN KEY(grant_id,user_id,client_id) REFERENCES delegated_grants(id,user_id,client_id),UNIQUE(id,user_id,client_id,grant_id)
);
CREATE TABLE mcp_calls(
 id uuid PRIMARY KEY,authorization_id uuid NOT NULL,user_id uuid NOT NULL,client_id uuid NOT NULL,grant_id uuid NOT NULL,project_id uuid REFERENCES projects(id),method varchar(100) NOT NULL,status text NOT NULL CHECK(status IN('succeeded','denied')),code varchar(100),resource_references jsonb NOT NULL,created_at timestamptz NOT NULL,
 FOREIGN KEY(authorization_id,user_id,client_id,grant_id) REFERENCES mcp_authorizations(id,user_id,client_id,grant_id),UNIQUE(id,user_id,client_id,grant_id),UNIQUE(project_id,id,user_id,client_id,grant_id)
);
ALTER TABLE change_proposals DROP CONSTRAINT change_proposals_origin_check;
ALTER TABLE change_proposals ADD CONSTRAINT change_proposals_origin_check CHECK(origin IN('human','integrated_ai','external_ai'));
ALTER TABLE change_proposals ADD COLUMN external_request_id uuid,ADD COLUMN external_client_id uuid,ADD COLUMN external_grant_id uuid,ADD COLUMN external_grant_revision bigint,ADD COLUMN external_oauth_client_id varchar(200);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_external_origin FOREIGN KEY(project_id,external_request_id,creator_id,external_client_id,external_grant_id) REFERENCES mcp_calls(project_id,id,user_id,client_id,grant_id);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_external_client FOREIGN KEY(external_client_id,external_oauth_client_id) REFERENCES external_clients(id,oauth_client_id);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_external_grant_version FOREIGN KEY(external_grant_id,external_grant_revision) REFERENCES delegated_grant_events(grant_id,revision);
ALTER TABLE change_proposals DROP CONSTRAINT proposal_ai_origin;
ALTER TABLE change_proposals ADD CONSTRAINT proposal_channel_provenance CHECK(
 (origin='human' AND ai_execution_id IS NULL AND ai_provider IS NULL AND ai_model IS NULL AND external_request_id IS NULL AND external_client_id IS NULL AND external_grant_id IS NULL AND external_grant_revision IS NULL AND external_oauth_client_id IS NULL) OR
 (origin='integrated_ai' AND ai_execution_id IS NOT NULL AND ai_provider IS NOT NULL AND ai_model IS NOT NULL AND external_request_id IS NULL AND external_client_id IS NULL AND external_grant_id IS NULL AND external_grant_revision IS NULL AND external_oauth_client_id IS NULL) OR
 (origin='external_ai' AND ai_execution_id IS NULL AND ai_provider IS NULL AND ai_model IS NULL AND external_request_id IS NOT NULL AND external_client_id IS NOT NULL AND external_grant_id IS NOT NULL AND external_grant_revision IS NOT NULL AND external_grant_revision>0 AND external_oauth_client_id IS NOT NULL)
);
CREATE FUNCTION immutable_external_provenance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF ROW(NEW.external_request_id,NEW.external_client_id,NEW.external_grant_id,NEW.external_grant_revision,NEW.external_oauth_client_id) IS DISTINCT FROM ROW(OLD.external_request_id,OLD.external_client_id,OLD.external_grant_id,OLD.external_grant_revision,OLD.external_oauth_client_id) THEN RAISE EXCEPTION 'proposal_provenance_immutable' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER immutable_external_provenance BEFORE UPDATE ON change_proposals FOR EACH ROW EXECUTE FUNCTION immutable_external_provenance();
ALTER TABLE proposal_revisions ADD COLUMN external_request_id uuid,ADD CONSTRAINT revision_external_request FOREIGN KEY(external_request_id) REFERENCES mcp_calls(id);
ALTER TABLE audit_events ADD COLUMN external_client_id uuid,ADD COLUMN external_grant_id uuid,ADD COLUMN external_request_id uuid,ADD CONSTRAINT audit_external_request FOREIGN KEY(external_request_id) REFERENCES mcp_calls(id);
REVOKE ALL ON external_clients,delegated_grants,delegated_grant_projects,delegated_grant_events,mcp_authorizations,mcp_calls FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON external_clients,delegated_grants TO storymaster_app;
GRANT SELECT,INSERT,DELETE ON delegated_grant_projects TO storymaster_app;
GRANT SELECT,INSERT ON delegated_grant_events,mcp_authorizations,mcp_calls TO storymaster_app;
CREATE TABLE mcp_call_resources(call_id uuid NOT NULL REFERENCES mcp_calls(id),resource_type varchar(40) NOT NULL,resource_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),PRIMARY KEY(call_id,resource_type,resource_id,revision));
REVOKE ALL ON mcp_call_resources FROM PUBLIC;
GRANT SELECT,INSERT ON mcp_call_resources TO storymaster_app;
