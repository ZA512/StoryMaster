-- Lot 5 phase A: additive schema. No canonical text or existing snapshots rewritten.
CREATE TABLE provider_credentials(
 id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES app_users(id),provider text NOT NULL CHECK(provider='local-simulator'),label varchar(200) NOT NULL,
 revision bigint NOT NULL CHECK(revision>0),key_version bigint NOT NULL CHECK(key_version>0),protection_version text NOT NULL,envelope jsonb NOT NULL CHECK(jsonb_typeof(envelope)='object'),status text NOT NULL CHECK(status IN('active','revoked')),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,
 UNIQUE(owner_id,id)
);
CREATE TABLE ai_budgets(
 project_id uuid NOT NULL REFERENCES projects(id),owner_id uuid NOT NULL REFERENCES app_users(id),revision bigint NOT NULL CHECK(revision>0),limits jsonb NOT NULL,
 spent_calls bigint NOT NULL DEFAULT 0 CHECK(spent_calls>=0),spent_tokens bigint NOT NULL DEFAULT 0 CHECK(spent_tokens>=0),spent_cost bigint NOT NULL DEFAULT 0 CHECK(spent_cost>=0),reserved_calls bigint NOT NULL DEFAULT 0 CHECK(reserved_calls>=0),reserved_tokens bigint NOT NULL DEFAULT 0 CHECK(reserved_tokens>=0),reserved_cost bigint NOT NULL DEFAULT 0 CHECK(reserved_cost>=0),active_executions integer NOT NULL DEFAULT 0 CHECK(active_executions>=0),PRIMARY KEY(project_id,owner_id),CHECK(jsonb_typeof(limits)='object' AND spent_calls+reserved_calls<=(limits->>'maxCalls')::bigint AND spent_tokens+reserved_tokens<=(limits->>'maxTokens')::bigint AND active_executions<=(limits->>'maxConcurrent')::integer AND ((limits->>'maxCostMicros') IS NULL OR spent_cost+reserved_cost<=(limits->>'maxCostMicros')::bigint))
);
CREATE TABLE ai_conversations(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),owner_id uuid NOT NULL REFERENCES app_users(id),credential_id uuid NOT NULL,credential_revision bigint NOT NULL,provider text NOT NULL CHECK(provider='local-simulator'),model varchar(100) NOT NULL CHECK(model IN('discussion-v1','narrative-v1','slow-v1','unknown-v1','unavailable-v1')),title varchar(200) NOT NULL,status text NOT NULL CHECK(status IN('active','closed')),revision bigint NOT NULL CHECK(revision>0),retention_days integer CHECK(retention_days BETWEEN 1 AND 3650),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,
 UNIQUE(project_id,owner_id,id),UNIQUE(project_id,id),FOREIGN KEY(owner_id,credential_id) REFERENCES provider_credentials(owner_id,id)
);
CREATE INDEX ai_conversations_private_page ON ai_conversations(project_id,owner_id,created_at DESC,id DESC);
CREATE TABLE ai_context_plans(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,owner_id uuid NOT NULL,conversation_id uuid NOT NULL,context_hash char(64) NOT NULL,payload jsonb NOT NULL,expires_at timestamptz NOT NULL,
 UNIQUE(project_id,owner_id,id),UNIQUE(project_id,owner_id,conversation_id,id),FOREIGN KEY(project_id,owner_id,conversation_id) REFERENCES ai_conversations(project_id,owner_id,id),CHECK(payload->>'contextHash'=context_hash)
);
CREATE TABLE ai_executions(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,owner_id uuid NOT NULL,conversation_id uuid NOT NULL,credential_id uuid NOT NULL,credential_revision bigint NOT NULL,provider text NOT NULL CHECK(provider='local-simulator'),model varchar(100) NOT NULL CHECK(model IN('discussion-v1','narrative-v1','slow-v1','unknown-v1','unavailable-v1')),plan_id uuid NOT NULL,
 status text NOT NULL CHECK(status IN('queued','running','succeeded','failed','cancelled','unknown')),revision bigint NOT NULL CHECK(revision>0),session_hash char(64) NOT NULL,capability_hash char(64),worker_id uuid,lease_until timestamptz,payload jsonb NOT NULL,
 UNIQUE(project_id,owner_id,id),UNIQUE(project_id,owner_id,conversation_id,id),UNIQUE(project_id,id),UNIQUE(project_id,id,owner_id,provider,model),FOREIGN KEY(project_id,owner_id,conversation_id) REFERENCES ai_conversations(project_id,owner_id,id),FOREIGN KEY(project_id,owner_id,conversation_id,plan_id) REFERENCES ai_context_plans(project_id,owner_id,conversation_id,id),FOREIGN KEY(owner_id,credential_id) REFERENCES provider_credentials(owner_id,id),
 CHECK(payload->>'id'=id::text AND payload->>'status'=status AND (payload->>'revision')::bigint=revision)
);
CREATE UNIQUE INDEX ai_one_running_conversation ON ai_executions(conversation_id) WHERE status IN('queued','running');
CREATE INDEX ai_queued_work ON ai_executions(id) WHERE status='queued';
CREATE TABLE ai_consents(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,owner_id uuid NOT NULL,conversation_id uuid NOT NULL,plan_id uuid NOT NULL,execution_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),revoked_at timestamptz,
 UNIQUE(execution_id),FOREIGN KEY(project_id,owner_id,conversation_id) REFERENCES ai_conversations(project_id,owner_id,id),FOREIGN KEY(project_id,owner_id,conversation_id,plan_id) REFERENCES ai_context_plans(project_id,owner_id,conversation_id,id),FOREIGN KEY(project_id,owner_id,conversation_id,execution_id) REFERENCES ai_executions(project_id,owner_id,conversation_id,id)
);
CREATE TABLE ai_messages(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,owner_id uuid NOT NULL,conversation_id uuid NOT NULL,execution_id uuid,sequence bigint NOT NULL CHECK(sequence>0),role text NOT NULL CHECK(role IN('human','assistant','tool_call','tool_result')),text varchar(16000) NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL,
 UNIQUE(project_id,conversation_id,sequence),FOREIGN KEY(project_id,owner_id,conversation_id) REFERENCES ai_conversations(project_id,owner_id,id),FOREIGN KEY(project_id,owner_id,conversation_id,execution_id) REFERENCES ai_executions(project_id,owner_id,conversation_id,id)
);
CREATE TABLE ai_tool_results(
 project_id uuid NOT NULL,execution_id uuid NOT NULL,call_id varchar(128) NOT NULL,name varchar(100) NOT NULL,arguments_hash char(64) NOT NULL,result jsonb NOT NULL,
 PRIMARY KEY(project_id,execution_id,call_id),FOREIGN KEY(project_id,execution_id) REFERENCES ai_executions(project_id,id)
);
CREATE TABLE ai_provider_calls(
 project_id uuid NOT NULL,execution_id uuid NOT NULL,number integer NOT NULL CHECK(number>0),input_hash char(64) NOT NULL,status text NOT NULL CHECK(status IN('admitted','returned','unknown')),usage jsonb,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(project_id,execution_id,number),FOREIGN KEY(project_id,execution_id) REFERENCES ai_executions(project_id,id)
);
CREATE TABLE ai_events(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),owner_id uuid NOT NULL REFERENCES app_users(id),execution_id uuid,action varchar(100) NOT NULL,details jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),FOREIGN KEY(project_id,execution_id) REFERENCES ai_executions(project_id,id)
);
ALTER TABLE change_proposals DROP CONSTRAINT change_proposals_origin_check;
ALTER TABLE change_proposals ADD CONSTRAINT change_proposals_origin_check CHECK(origin IN('human','integrated_ai'));
ALTER TABLE change_proposals ADD COLUMN ai_execution_id uuid,ADD COLUMN ai_provider text,ADD COLUMN ai_model varchar(100);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_ai_provenance FOREIGN KEY(project_id,ai_execution_id,creator_id,ai_provider,ai_model) REFERENCES ai_executions(project_id,id,owner_id,provider,model);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_ai_origin CHECK((origin='human' AND ai_execution_id IS NULL AND ai_provider IS NULL AND ai_model IS NULL) OR (origin='integrated_ai' AND ai_execution_id IS NOT NULL AND ai_provider IS NOT NULL AND ai_model IS NOT NULL));
CREATE FUNCTION immutable_ai_proposal_provenance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.ai_execution_id IS DISTINCT FROM OLD.ai_execution_id OR NEW.ai_provider IS DISTINCT FROM OLD.ai_provider OR NEW.ai_model IS DISTINCT FROM OLD.ai_model THEN RAISE EXCEPTION 'proposal_provenance_immutable' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER immutable_ai_proposal_provenance BEFORE UPDATE ON change_proposals FOR EACH ROW EXECUTE FUNCTION immutable_ai_proposal_provenance();
ALTER TABLE proposal_revisions ADD COLUMN ai_execution_id uuid,ADD CONSTRAINT revision_ai_execution FOREIGN KEY(project_id,ai_execution_id) REFERENCES ai_executions(project_id,id);
ALTER TABLE audit_events ADD COLUMN ai_execution_id uuid,ADD COLUMN ai_provider text,ADD COLUMN ai_model varchar(100);
ALTER TABLE audit_events ADD CONSTRAINT audit_ai_execution FOREIGN KEY(project_id,ai_execution_id) REFERENCES ai_executions(project_id,id);
REVOKE ALL ON provider_credentials,ai_budgets,ai_conversations,ai_context_plans,ai_executions,ai_consents,ai_messages,ai_tool_results,ai_provider_calls,ai_events FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON provider_credentials,ai_budgets,ai_conversations,ai_executions,ai_consents,ai_provider_calls TO storymaster_app;
GRANT SELECT,INSERT ON ai_context_plans,ai_messages,ai_tool_results,ai_events TO storymaster_app;
