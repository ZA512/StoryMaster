-- Lot 4 additive. Canonical data and old migrations remain untouched.
CREATE TABLE change_proposals(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),origin text NOT NULL CHECK(origin='human'),creator_id uuid NOT NULL REFERENCES app_users(id),creator_name varchar(200) NOT NULL,
 proposal_revision bigint NOT NULL CHECK(proposal_revision>0),state_version bigint NOT NULL CHECK(state_version>0),status text NOT NULL CHECK(status IN('draft','submitted','in_review','approved','rejected','withdrawn','conflicted','merged')),
 created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,submitted_at timestamptz,merged_at timestamptz,merged_change_set_id uuid,
 UNIQUE(project_id,id),CHECK((status='merged')=(merged_at IS NOT NULL AND merged_change_set_id IS NOT NULL))
);
CREATE INDEX proposals_project_page ON change_proposals(project_id,created_at DESC,id DESC);
CREATE INDEX proposals_project_state_author ON change_proposals(project_id,status,creator_id,created_at DESC);
CREATE TABLE proposal_revisions(
 project_id uuid NOT NULL,proposal_id uuid NOT NULL,proposal_revision bigint NOT NULL CHECK(proposal_revision>0),content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'),content_hash char(64) NOT NULL CHECK(content_hash~'^[0-9a-f]{64}$'),policy_version integer NOT NULL CHECK(policy_version=1),actor_id uuid NOT NULL REFERENCES app_users(id),actor_name varchar(200) NOT NULL,created_at timestamptz NOT NULL,
 PRIMARY KEY(project_id,proposal_id,proposal_revision),UNIQUE(project_id,proposal_id,proposal_revision,content_hash),FOREIGN KEY(project_id,proposal_id) REFERENCES change_proposals(project_id,id)
);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_current_revision FOREIGN KEY(project_id,id,proposal_revision) REFERENCES proposal_revisions(project_id,proposal_id,proposal_revision) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE proposal_reviews(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,proposal_id uuid NOT NULL,proposal_revision bigint NOT NULL,content_hash char(64) NOT NULL,reviewer_id uuid NOT NULL REFERENCES app_users(id),reviewer_name varchar(200) NOT NULL,reviewer_role text NOT NULL CHECK(reviewer_role IN('owner','admin','author','reviewer')),
 reviewer_membership_revision bigint NOT NULL CHECK(reviewer_membership_revision>0),state_version bigint NOT NULL CHECK(state_version>0),decision text NOT NULL CHECK(decision IN('comment','request_changes','approve','reject')),comment varchar(4000) NOT NULL,created_at timestamptz NOT NULL,
 FOREIGN KEY(project_id,proposal_id,proposal_revision,content_hash) REFERENCES proposal_revisions(project_id,proposal_id,proposal_revision,content_hash),CHECK(decision NOT IN('approve','reject') OR reviewer_role IN('owner','admin'))
);
CREATE INDEX proposal_review_order ON proposal_reviews(project_id,proposal_id,created_at DESC,id DESC);
CREATE TABLE proposal_events(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,proposal_id uuid NOT NULL,proposal_revision bigint NOT NULL,state_version bigint NOT NULL,status text NOT NULL,action text NOT NULL,actor_id uuid NOT NULL REFERENCES app_users(id),actor_name varchar(200) NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),correlation_id uuid NOT NULL,snapshot jsonb NOT NULL,details jsonb NOT NULL,
 UNIQUE(project_id,proposal_id,state_version),FOREIGN KEY(project_id,proposal_id,proposal_revision) REFERENCES proposal_revisions(project_id,proposal_id,proposal_revision)
);
ALTER TABLE proposal_reviews ADD CONSTRAINT review_state_event FOREIGN KEY(project_id,proposal_id,state_version) REFERENCES proposal_events(project_id,proposal_id,state_version) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE proposal_change_sets(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,proposal_id uuid NOT NULL,proposal_revision bigint NOT NULL,content_hash char(64) NOT NULL,actor_id uuid NOT NULL REFERENCES app_users(id),actor_name varchar(200) NOT NULL,created_at timestamptz NOT NULL,result jsonb NOT NULL,
 UNIQUE(project_id,id),UNIQUE(project_id,proposal_id),UNIQUE(project_id,proposal_id,proposal_revision,id),FOREIGN KEY(project_id,proposal_id,proposal_revision,content_hash) REFERENCES proposal_revisions(project_id,proposal_id,proposal_revision,content_hash),CHECK(result->>'proposalStatus'='merged'),CHECK(result->>'changeSetId'=id::text AND result->>'proposalId'=proposal_id::text AND (result->>'proposalRevision')::bigint=proposal_revision)
);
ALTER TABLE change_proposals ADD CONSTRAINT proposal_merged_changeset FOREIGN KEY(project_id,id,proposal_revision,merged_change_set_id) REFERENCES proposal_change_sets(project_id,proposal_id,proposal_revision,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE proposal_change_events(
 project_id uuid NOT NULL,change_set_id uuid NOT NULL,resource_type text NOT NULL CHECK(resource_type IN('object','relation','scene','chapter')),resource_id uuid NOT NULL,before_snapshot jsonb,after_snapshot jsonb NOT NULL,operation_ids jsonb NOT NULL CHECK(jsonb_typeof(operation_ids)='array'),
 PRIMARY KEY(project_id,change_set_id,resource_type,resource_id),FOREIGN KEY(project_id,change_set_id) REFERENCES proposal_change_sets(project_id,id)
);
CREATE FUNCTION ensure_proposal_state_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='UPDATE' AND (OLD.status IN('merged','rejected','withdrawn') OR NEW.state_version<>OLD.state_version+1 OR NEW.proposal_revision NOT IN(OLD.proposal_revision,OLD.proposal_revision+1)) THEN RAISE EXCEPTION 'proposal_transition_revision_required' USING ERRCODE='23514';END IF;
 IF TG_OP='UPDATE' AND (NEW.creator_id<>OLD.creator_id OR NEW.creator_name<>OLD.creator_name OR NEW.origin<>OLD.origin OR NEW.project_id<>OLD.project_id OR NEW.id<>OLD.id OR (NEW.proposal_revision=OLD.proposal_revision+1 AND NEW.status<>'draft') OR (NEW.proposal_revision=OLD.proposal_revision AND NOT (CASE OLD.status WHEN 'draft' THEN NEW.status IN('submitted','withdrawn') WHEN 'submitted' THEN NEW.status IN('in_review','approved','rejected','withdrawn','conflicted') WHEN 'in_review' THEN NEW.status IN('in_review','approved','rejected','withdrawn','conflicted') WHEN 'approved' THEN NEW.status IN('approved','rejected','withdrawn','conflicted','merged') WHEN 'conflicted' THEN NEW.status='withdrawn' ELSE false END))) THEN RAISE EXCEPTION 'proposal_transition_forbidden' USING ERRCODE='23514';END IF;
 IF NOT EXISTS(SELECT 1 FROM proposal_events e JOIN change_proposals p ON p.project_id=e.project_id AND p.id=e.proposal_id WHERE p.project_id=NEW.project_id AND p.id=NEW.id AND e.state_version=p.state_version AND e.snapshot=to_jsonb(p)) THEN RAISE EXCEPTION 'proposal_event_required' USING ERRCODE='23514';END IF;RETURN NULL;END $$;
CREATE CONSTRAINT TRIGGER proposal_state_event AFTER INSERT OR UPDATE ON change_proposals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_proposal_state_event();
CREATE FUNCTION ensure_proposal_merge_result() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM change_proposals p WHERE p.project_id=NEW.project_id AND p.id=NEW.proposal_id AND p.status='merged' AND p.merged_change_set_id=NEW.id AND (NEW.result->>'stateVersion')::bigint=p.state_version) THEN RAISE EXCEPTION 'proposal_merge_state_required' USING ERRCODE='23514';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.result->'resourceRevisions') r WHERE NOT EXISTS(SELECT 1 FROM proposal_change_events e WHERE e.project_id=NEW.project_id AND e.change_set_id=NEW.id AND e.resource_type=r->>'resourceType' AND e.resource_id::text=r->>'resourceId' AND (e.after_snapshot->>'revision')::bigint=(r->>'revision')::bigint)) OR EXISTS(SELECT 1 FROM proposal_change_events e WHERE e.project_id=NEW.project_id AND e.change_set_id=NEW.id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.result->'resourceRevisions') r WHERE r->>'resourceType'=e.resource_type AND r->>'resourceId'=e.resource_id::text)) THEN RAISE EXCEPTION 'proposal_merge_events_required' USING ERRCODE='23514';END IF;RETURN NULL;END $$;
CREATE CONSTRAINT TRIGGER proposal_merge_result AFTER INSERT ON proposal_change_sets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_proposal_merge_result();
REVOKE ALL ON change_proposals,proposal_revisions,proposal_reviews,proposal_events,proposal_change_sets,proposal_change_events FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON change_proposals TO storymaster_app;
GRANT SELECT,INSERT ON proposal_revisions,proposal_reviews,proposal_events,proposal_change_sets,proposal_change_events TO storymaster_app;
