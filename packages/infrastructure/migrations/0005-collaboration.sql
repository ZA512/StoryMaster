-- Additive Lot 3. Never rewrites scenes, canonical objects or their previous revisions.
ALTER TABLE sessions ADD COLUMN verified_email varchar(320);
CREATE TABLE collaboration_clocks(project_id uuid PRIMARY KEY REFERENCES projects(id),sequence bigint NOT NULL DEFAULT 0 CHECK(sequence>=0));
INSERT INTO collaboration_clocks(project_id) SELECT id FROM projects;
CREATE FUNCTION initialize_collaboration_clock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO collaboration_clocks(project_id) VALUES(NEW.id);RETURN NEW;END $$;
CREATE TRIGGER project_collaboration_clock AFTER INSERT ON projects FOR EACH ROW EXECUTE FUNCTION initialize_collaboration_clock();
ALTER TABLE project_memberships ADD COLUMN change_sequence bigint NOT NULL DEFAULT 0;
ALTER TABLE project_memberships ADD COLUMN created_at timestamptz NOT NULL DEFAULT clock_timestamp();
ALTER TABLE project_memberships ADD COLUMN updated_at timestamptz NOT NULL DEFAULT clock_timestamp();
CREATE TABLE invitations(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),email_canonical varchar(320) NOT NULL,role text NOT NULL CHECK(role IN('admin','author','reviewer','reader')),token_hash char(64) NOT NULL UNIQUE,
 inviter_id uuid NOT NULL REFERENCES app_users(id),status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','accepted','revoked','expired')),revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),issued_sequence bigint NOT NULL,
 expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),accepted_by uuid REFERENCES app_users(id),declined_by uuid REFERENCES app_users(id),reason text,
 UNIQUE(project_id,id),CHECK(expires_at>created_at),CHECK((status='accepted')=(accepted_by IS NOT NULL))
);
CREATE INDEX invitation_project_state ON invitations(project_id,status,created_at DESC,id);
CREATE INDEX invitation_recipient ON invitations(project_id,email_canonical,status);
CREATE TABLE comment_threads(
 root_comment_id uuid NOT NULL,id uuid PRIMARY KEY,project_id uuid NOT NULL,target_type text NOT NULL CHECK(target_type IN('scene','object')),target_id uuid NOT NULL,
 scene_id uuid GENERATED ALWAYS AS(CASE WHEN target_type='scene' THEN target_id END) STORED,object_id uuid GENERATED ALWAYS AS(CASE WHEN target_type='object' THEN target_id END) STORED,
 author_id uuid NOT NULL REFERENCES app_users(id),author_name varchar(200) NOT NULL,state text NOT NULL CHECK(state IN('open','resolved')),revision bigint NOT NULL CHECK(revision>0),comment_count integer NOT NULL CHECK(comment_count>0),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,
 UNIQUE(project_id,id),FOREIGN KEY(project_id,scene_id) REFERENCES scenes(project_id,id),FOREIGN KEY(project_id,object_id) REFERENCES narrative_objects(project_id,id)
);
CREATE INDEX thread_target_page ON comment_threads(project_id,target_type,target_id,state,created_at DESC,id DESC);
CREATE INDEX thread_project_page ON comment_threads(project_id,created_at DESC,id DESC);
CREATE TABLE comments(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,thread_id uuid NOT NULL,author_id uuid NOT NULL REFERENCES app_users(id),author_name varchar(200) NOT NULL,body text,status text NOT NULL CHECK(status IN('active','withdrawn')),revision bigint NOT NULL CHECK(revision>0),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,updated_by uuid NOT NULL REFERENCES app_users(id),updated_by_name varchar(200) NOT NULL,withdrawal_reason varchar(1000),
 UNIQUE(project_id,id),UNIQUE(project_id,thread_id,id),FOREIGN KEY(project_id,thread_id) REFERENCES comment_threads(project_id,id),CHECK((status='active' AND body IS NOT NULL AND length(btrim(body))>0 AND length(body)<=20000) OR (status='withdrawn' AND body IS NULL))
);
ALTER TABLE comment_threads ADD CONSTRAINT thread_root_comment FOREIGN KEY(project_id,id,root_comment_id) REFERENCES comments(project_id,thread_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX comments_thread_page ON comments(project_id,thread_id,created_at,id);
CREATE TABLE text_anchors(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,thread_id uuid NOT NULL,scene_id uuid NOT NULL,scene_revision bigint NOT NULL,from_pos integer NOT NULL CHECK(from_pos>=0),to_pos integer NOT NULL CHECK(to_pos>from_pos),quote text NOT NULL CHECK(length(quote)>0 AND length(quote)<=4000),prefix text NOT NULL,suffix text NOT NULL,state text NOT NULL DEFAULT 'valid' CHECK(state='valid'),author_id uuid NOT NULL REFERENCES app_users(id),created_at timestamptz NOT NULL,
 UNIQUE(project_id,thread_id),FOREIGN KEY(project_id,thread_id) REFERENCES comment_threads(project_id,id),FOREIGN KEY(project_id,scene_id,scene_revision) REFERENCES scene_revisions(project_id,scene_id,revision)
);
CREATE INDEX anchor_scene_revision ON text_anchors(project_id,scene_id,scene_revision);
CREATE FUNCTION ensure_anchor_target() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM comment_threads WHERE project_id=NEW.project_id AND id=NEW.thread_id AND target_type='scene' AND target_id=NEW.scene_id) THEN RAISE EXCEPTION 'anchor_thread_target_required' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER anchor_target BEFORE INSERT ON text_anchors FOR EACH ROW EXECUTE FUNCTION ensure_anchor_target();
CREATE TABLE collaboration_revisions(
 project_id uuid NOT NULL REFERENCES projects(id),resource_type text NOT NULL CHECK(resource_type IN('membership','invitation','thread','comment')),resource_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),snapshot jsonb NOT NULL,actor_id uuid REFERENCES app_users(id),actor_name varchar(200),actor_type text NOT NULL CHECK(actor_type IN('human','system')),action text NOT NULL,correlation_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(project_id,resource_type,resource_id,revision),CHECK((actor_type='human')=(actor_id IS NOT NULL))
);
CREATE FUNCTION collaboration_state(p uuid,k text,i uuid) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$ DECLARE result jsonb;BEGIN
 IF k='membership' THEN SELECT to_jsonb(m) INTO result FROM project_memberships m WHERE project_id=p AND user_id=i;
 ELSIF k='invitation' THEN SELECT to_jsonb(v)-'token_hash' INTO result FROM invitations v WHERE project_id=p AND id=i;
 ELSIF k='thread' THEN SELECT to_jsonb(t)-'scene_id'-'object_id' INTO result FROM comment_threads t WHERE project_id=p AND id=i;
 ELSE SELECT to_jsonb(c) INTO result FROM comments c WHERE project_id=p AND id=i;END IF;RETURN result;
 END $$;
CREATE FUNCTION ensure_collaboration_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE k text;value jsonb;BEGIN
 k=CASE TG_TABLE_NAME WHEN 'invitations' THEN 'invitation' WHEN 'comment_threads' THEN 'thread' ELSE 'comment' END;value=collaboration_state(NEW.project_id,k,NEW.id);
 IF NOT EXISTS(SELECT 1 FROM collaboration_revisions WHERE project_id=NEW.project_id AND resource_type=k AND resource_id=NEW.id AND revision=(value->>'revision')::bigint AND snapshot=value) THEN RAISE EXCEPTION 'collaboration_snapshot_required' USING ERRCODE='23514';END IF;RETURN NULL;END $$;
CREATE CONSTRAINT TRIGGER invitation_snapshot AFTER INSERT OR UPDATE ON invitations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_collaboration_snapshot();
CREATE CONSTRAINT TRIGGER thread_snapshot AFTER INSERT OR UPDATE ON comment_threads DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_collaboration_snapshot();
CREATE CONSTRAINT TRIGGER comment_snapshot AFTER INSERT OR UPDATE ON comments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_collaboration_snapshot();
-- Membership trigger records even system/bootstrap changes; the service supplies transaction-local provenance.
CREATE FUNCTION version_membership() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='UPDATE' THEN IF NEW.role=OLD.role AND NEW.status=OLD.status THEN RETURN NEW;END IF;IF NEW.revision=OLD.revision THEN NEW.revision=OLD.revision+1;ELSIF NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'membership_revision_required' USING ERRCODE='23514';END IF;NEW.updated_at=clock_timestamp();END IF;
 UPDATE collaboration_clocks SET sequence=sequence+1 WHERE project_id=NEW.project_id RETURNING sequence INTO NEW.change_sequence;NEW.change_sequence=COALESCE(NEW.change_sequence,0);RETURN NEW;END $$;
CREATE TRIGGER membership_version BEFORE INSERT OR UPDATE ON project_memberships FOR EACH ROW EXECUTE FUNCTION version_membership();
CREATE FUNCTION record_membership_revision() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE actor uuid;label text;corr uuid;BEGIN
 IF TG_OP='UPDATE' AND NEW.role=OLD.role AND NEW.status=OLD.status THEN RETURN NULL;END IF;
 actor=NULLIF(current_setting('storymaster.collaboration_actor',true),'')::uuid;corr=COALESCE(NULLIF(current_setting('storymaster.collaboration_correlation',true),'')::uuid,gen_random_uuid());SELECT display_name INTO label FROM app_users WHERE id=actor;
 INSERT INTO collaboration_revisions(project_id,resource_type,resource_id,revision,snapshot,actor_id,actor_name,actor_type,action,correlation_id) VALUES(NEW.project_id,'membership',NEW.user_id,NEW.revision,collaboration_state(NEW.project_id,'membership',NEW.user_id),actor,label,CASE WHEN actor IS NULL THEN 'system' ELSE 'human' END,CASE WHEN TG_OP='INSERT' THEN 'membership.created' WHEN NEW.status='removed' THEN 'membership.removed' WHEN OLD.status='removed' THEN 'membership.reactivated' ELSE 'membership.role_changed' END,corr);RETURN NULL;END $$;
CREATE TRIGGER membership_history AFTER INSERT OR UPDATE ON project_memberships FOR EACH ROW EXECUTE FUNCTION record_membership_revision();
INSERT INTO collaboration_revisions(project_id,resource_type,resource_id,revision,snapshot,actor_type,action,correlation_id) SELECT project_id,'membership',user_id,revision,to_jsonb(m),'system','membership.history_initialized',gen_random_uuid() FROM project_memberships m;
REVOKE ALL ON collaboration_clocks,invitations,comment_threads,comments,text_anchors,collaboration_revisions FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON collaboration_clocks,invitations,comment_threads,comments TO storymaster_app;
GRANT SELECT,INSERT ON text_anchors,collaboration_revisions TO storymaster_app;
