-- External durable witness is sealed by the trusted API before committing a security-reducing mutation.
ALTER TABLE runtime_authorization_state ADD COLUMN mutation_txid xid8,ADD COLUMN mutation_counter bigint NOT NULL DEFAULT 0 CHECK(mutation_counter>=0);
CREATE FUNCTION mark_authorization_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 IF to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD) THEN UPDATE public.runtime_authorization_state SET mutation_txid=pg_current_xact_id(),mutation_counter=mutation_counter+1 WHERE singleton=true;END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mark_authorization_mutation() FROM PUBLIC;
CREATE TRIGGER witness_session_revocation AFTER UPDATE OF revoked_at ON sessions FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_grant_change AFTER UPDATE ON delegated_grants FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_membership_change AFTER UPDATE OF status,role ON project_memberships FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_client_change AFTER UPDATE ON external_clients FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_credential_change AFTER UPDATE ON provider_credentials FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_ai_consent AFTER UPDATE OF revoked_at ON ai_consents FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_ai_capability AFTER UPDATE OF capability_hash ON ai_executions FOR EACH ROW WHEN(OLD.capability_hash IS NOT NULL AND NEW.capability_hash IS DISTINCT FROM OLD.capability_hash) EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_export_cancellation AFTER UPDATE OF status ON export_jobs FOR EACH ROW WHEN(NEW.status IN('cancelled','expired','failed') AND NEW.status<>OLD.status) EXECUTE FUNCTION mark_authorization_mutation();
GRANT UPDATE(epoch,changed_at) ON runtime_authorization_state TO storymaster_app;
CREATE TRIGGER witness_user_suspension AFTER UPDATE OF status ON app_users FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_project_status AFTER UPDATE OF status ON projects FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
CREATE TRIGGER witness_grant_projects AFTER DELETE ON delegated_grant_projects FOR EACH ROW EXECUTE FUNCTION mark_authorization_mutation();
