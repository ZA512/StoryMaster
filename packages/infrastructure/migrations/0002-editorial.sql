ALTER TABLE projects ADD COLUMN editorial_revision bigint NOT NULL DEFAULT 1 CHECK (editorial_revision>0);
ALTER TABLE projects ADD COLUMN editorial_structure_revision bigint NOT NULL DEFAULT 1 CHECK (editorial_structure_revision>0);
CREATE TABLE manuscripts (
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),title varchar(200) NOT NULL CHECK(length(btrim(title))>0),
 description varchar(4000) NOT NULL DEFAULT '',position integer NOT NULL CHECK(position>0),revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 structure_revision bigint NOT NULL DEFAULT 1 CHECK(structure_revision>0),archived boolean NOT NULL DEFAULT false,
 writing_statuses jsonb NOT NULL DEFAULT '["Brouillon","En cours","À relire","Terminé"]'::jsonb CHECK(jsonb_typeof(writing_statuses)='array'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(project_id,id),UNIQUE(project_id,position) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE chapters (
 id uuid PRIMARY KEY,project_id uuid NOT NULL,manuscript_id uuid NOT NULL,title varchar(200) NOT NULL CHECK(length(btrim(title))>0),
 summary varchar(4000) NOT NULL DEFAULT '',position integer NOT NULL CHECK(position>0),revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 structure_revision bigint NOT NULL DEFAULT 1 CHECK(structure_revision>0),archived boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(project_id,id),FOREIGN KEY(project_id,manuscript_id) REFERENCES manuscripts(project_id,id),
 UNIQUE(project_id,manuscript_id,position) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE editorial_changes (
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),resource_id uuid NOT NULL,
 resource_type text NOT NULL CHECK(resource_type IN ('manuscript','chapter','scene')),action varchar(100) NOT NULL,
 before_revision bigint,after_revision bigint NOT NULL CHECK(after_revision>0),
 actor_user_id uuid NOT NULL REFERENCES app_users(id),correlation_id uuid NOT NULL,details jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(project_id,id)
);
CREATE TABLE scenes (
 id uuid PRIMARY KEY,project_id uuid NOT NULL,chapter_id uuid NOT NULL,title varchar(200) NOT NULL CHECK(length(btrim(title))>0),
 summary varchar(4000) NOT NULL DEFAULT '',status varchar(40) NOT NULL DEFAULT 'Brouillon',archived boolean NOT NULL DEFAULT false,
 position integer NOT NULL CHECK(position>0),revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),content_format_version integer NOT NULL DEFAULT 1 CHECK(content_format_version=1),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND content->>'type'='doc'),content_hash char(64) NOT NULL,
 word_count integer NOT NULL CHECK(word_count>=0),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(project_id,id),FOREIGN KEY(project_id,chapter_id) REFERENCES chapters(project_id,id),
 UNIQUE(project_id,chapter_id,position) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE scene_revisions (
 project_id uuid NOT NULL,scene_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),
 content_snapshot jsonb NOT NULL,content_hash char(64) NOT NULL,metadata_snapshot jsonb NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES app_users(id),actor_display_name varchar(200) NOT NULL,
 change_set_id uuid NOT NULL,action varchar(100) NOT NULL,restored_from_revision bigint,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(project_id,scene_id,revision),
 FOREIGN KEY(project_id,scene_id) REFERENCES scenes(project_id,id),
 FOREIGN KEY(project_id,change_set_id) REFERENCES editorial_changes(project_id,id),
 FOREIGN KEY(project_id,scene_id,restored_from_revision) REFERENCES scene_revisions(project_id,scene_id,revision)
);
ALTER TABLE scenes ADD CONSTRAINT scene_current_snapshot FOREIGN KEY(project_id,id,revision) REFERENCES scene_revisions(project_id,scene_id,revision) DEFERRABLE INITIALLY DEFERRED;
CREATE FUNCTION ensure_scene_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_scene scenes;
BEGIN
 SELECT * INTO current_scene FROM scenes WHERE id=NEW.id AND project_id=NEW.project_id;
 IF NOT EXISTS(SELECT 1 FROM scene_revisions r WHERE r.project_id=current_scene.project_id AND r.scene_id=current_scene.id AND r.revision=current_scene.revision
  AND r.content_snapshot=current_scene.content AND r.content_hash=current_scene.content_hash
  AND r.metadata_snapshot=jsonb_build_object('title',current_scene.title,'summary',current_scene.summary,'status',current_scene.status,'archived',current_scene.archived,'chapterId',current_scene.chapter_id)) THEN
  RAISE EXCEPTION 'scene_snapshot_required' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER scene_snapshot_consistency AFTER INSERT OR UPDATE ON scenes DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_scene_snapshot();
CREATE INDEX chapters_parent_order ON chapters(project_id,manuscript_id,position);
CREATE INDEX scenes_parent_order ON scenes(project_id,chapter_id,position);
CREATE INDEX editorial_changes_project_time ON editorial_changes(project_id,created_at DESC);
REVOKE ALL ON manuscripts,chapters,scenes,scene_revisions,editorial_changes FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON manuscripts,chapters,scenes TO storymaster_app;
GRANT SELECT,INSERT ON scene_revisions,editorial_changes TO storymaster_app;
