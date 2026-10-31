-- Additive Lot 2: versioned registry, private graph, scene-reference snapshots, lexical projections.
CREATE TABLE module_definitions(module_key text NOT NULL,module_version integer NOT NULL CHECK(module_version=1),definition jsonb NOT NULL,checksum char(64) NOT NULL,PRIMARY KEY(module_key,module_version));
CREATE TABLE module_activations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_id uuid NOT NULL REFERENCES projects(id),module_key text NOT NULL,module_version integer NOT NULL DEFAULT 1,enabled boolean NOT NULL DEFAULT false,revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(project_id,id),UNIQUE(project_id,module_key),FOREIGN KEY(module_key,module_version) REFERENCES module_definitions(module_key,module_version));
CREATE TABLE narrative_objects(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),type_key text NOT NULL CHECK(type_key IN('character','place','event')),schema_version integer NOT NULL CHECK(schema_version=1),
 name varchar(200) NOT NULL CHECK(length(btrim(name))>0),summary varchar(4000) NOT NULL DEFAULT '',attributes jsonb NOT NULL CHECK(jsonb_typeof(attributes)='object'),notes varchar(20000) NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN('active','archived')),revision bigint NOT NULL CHECK(revision>0),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,created_by uuid NOT NULL REFERENCES app_users(id),updated_by uuid NOT NULL REFERENCES app_users(id),
 parent_place_id uuid GENERATED ALWAYS AS(CASE WHEN type_key='place' THEN (attributes->'parentPlaceRef'->>'id')::uuid END) STORED,
 parent_type text GENERATED ALWAYS AS(CASE WHEN type_key='place' AND attributes->'parentPlaceRef'->>'id' IS NOT NULL THEN 'place' END) STORED,
 ordinal_position numeric GENERATED ALWAYS AS(CASE WHEN type_key='event' AND attributes->'temporalExpression'->>'kind'='ordinal' THEN (attributes->'temporalExpression'->>'position')::numeric END) STORED,
 search_text text NOT NULL,search_vector tsvector GENERATED ALWAYS AS(to_tsvector('french',search_text)) STORED,
 UNIQUE(project_id,id),UNIQUE(project_id,id,type_key),CHECK(parent_place_id IS DISTINCT FROM id),
 FOREIGN KEY(project_id,parent_place_id,parent_type) REFERENCES narrative_objects(project_id,id,type_key) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE narrative_relations(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,source_object_id uuid NOT NULL,target_object_id uuid NOT NULL,
 relation_type text NOT NULL CHECK(relation_type IN('related_to','knows','located_in','participates_in','precedes')),attributes jsonb NOT NULL CHECK(jsonb_typeof(attributes)='object'),status text NOT NULL CHECK(status IN('active','removed')),revision bigint NOT NULL CHECK(revision>0),
 created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,created_by uuid NOT NULL REFERENCES app_users(id),updated_by uuid NOT NULL REFERENCES app_users(id),
 UNIQUE(project_id,id),FOREIGN KEY(project_id,source_object_id) REFERENCES narrative_objects(project_id,id),FOREIGN KEY(project_id,target_object_id) REFERENCES narrative_objects(project_id,id),CHECK(source_object_id<>target_object_id),CHECK(relation_type<>'related_to' OR source_object_id<target_object_id)
);
CREATE UNIQUE INDEX narrative_relation_active_pair ON narrative_relations(project_id,relation_type,source_object_id,target_object_id) WHERE status='active';
CREATE UNIQUE INDEX narrative_one_location ON narrative_relations(project_id,source_object_id) WHERE status='active' AND relation_type='located_in';
CREATE TABLE scene_references(
 id uuid PRIMARY KEY,project_id uuid NOT NULL,scene_id uuid NOT NULL,object_id uuid NOT NULL,reference_type text NOT NULL CHECK(reference_type IN('present','mentioned','point_of_view','setting','depicts_event')),metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(metadata='{}'::jsonb),revision bigint NOT NULL CHECK(revision>0),status text NOT NULL CHECK(status IN('active','removed')),
 UNIQUE(project_id,id),UNIQUE(project_id,scene_id,object_id,reference_type),FOREIGN KEY(project_id,scene_id) REFERENCES scenes(project_id,id),FOREIGN KEY(project_id,object_id) REFERENCES narrative_objects(project_id,id)
);
CREATE UNIQUE INDEX scene_one_point_of_view ON scene_references(project_id,scene_id) WHERE status='active' AND reference_type='point_of_view';
CREATE TABLE narrative_changes(
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES projects(id),resource_id uuid NOT NULL,resource_type text NOT NULL CHECK(resource_type IN('object','relation','module')),after_revision bigint NOT NULL CHECK(after_revision>0),actor_user_id uuid REFERENCES app_users(id),actor_type text NOT NULL CHECK(actor_type IN('human','system')),action varchar(100) NOT NULL,correlation_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(project_id,id)
);
CREATE TABLE narrative_revisions(
 project_id uuid NOT NULL,resource_type text NOT NULL CHECK(resource_type IN('object','relation','module')),resource_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),snapshot jsonb NOT NULL,actor_user_id uuid REFERENCES app_users(id),actor_display_name varchar(200) NOT NULL,actor_type text NOT NULL CHECK(actor_type IN('human','system')),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),change_set_id uuid NOT NULL,action varchar(100) NOT NULL,restored_from_revision bigint,
 PRIMARY KEY(project_id,resource_type,resource_id,revision),FOREIGN KEY(project_id,change_set_id) REFERENCES narrative_changes(project_id,id),FOREIGN KEY(project_id,resource_type,resource_id,restored_from_revision) REFERENCES narrative_revisions(project_id,resource_type,resource_id,revision)
);
CREATE FUNCTION narrative_state(p uuid,k text,i uuid) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE result jsonb;
BEGIN
 IF k='object' THEN SELECT jsonb_build_object('id',id,'projectId',project_id,'typeKey',type_key,'schemaVersion',schema_version,'name',name,'summary',summary,'attributes',attributes,'notes',notes,'status',status,'revision',revision,'createdBy',created_by,'updatedBy',updated_by) INTO result FROM narrative_objects WHERE project_id=p AND id=i;
 ELSIF k='relation' THEN SELECT jsonb_build_object('id',id,'projectId',project_id,'sourceObjectId',source_object_id,'targetObjectId',target_object_id,'relationType',relation_type,'attributes',attributes,'status',status,'revision',revision,'createdBy',created_by,'updatedBy',updated_by) INTO result FROM narrative_relations WHERE project_id=p AND id=i;
 ELSE SELECT jsonb_build_object('id',id,'projectId',project_id,'moduleKey',module_key,'moduleVersion',module_version,'enabled',enabled,'revision',revision) INTO result FROM module_activations WHERE project_id=p AND id=i;
 END IF;RETURN result;
END $$;
CREATE FUNCTION ensure_narrative_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE k text; current_state jsonb;
BEGIN
 k=CASE TG_TABLE_NAME WHEN 'narrative_objects' THEN 'object' WHEN 'narrative_relations' THEN 'relation' ELSE 'module' END;
 current_state=narrative_state(NEW.project_id,k,NEW.id);
 IF NOT EXISTS(SELECT 1 FROM narrative_revisions r WHERE r.project_id=NEW.project_id AND r.resource_type=k AND r.resource_id=NEW.id AND r.revision=(current_state->>'revision')::bigint AND r.snapshot-'createdAt'-'updatedAt'=current_state) THEN RAISE EXCEPTION 'narrative_snapshot_required' USING ERRCODE='23514';END IF;RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER narrative_object_snapshot AFTER INSERT OR UPDATE ON narrative_objects DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_narrative_snapshot();
CREATE CONSTRAINT TRIGGER narrative_relation_snapshot AFTER INSERT OR UPDATE ON narrative_relations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_narrative_snapshot();
CREATE CONSTRAINT TRIGGER narrative_module_snapshot AFTER INSERT OR UPDATE ON module_activations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_narrative_snapshot();
CREATE FUNCTION initialize_narrative_modules() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m module_definitions; a module_activations;change_id uuid;
BEGIN FOR m IN SELECT * FROM module_definitions ORDER BY module_key LOOP
 INSERT INTO module_activations(project_id,module_key,module_version) VALUES(NEW.id,m.module_key,m.module_version) RETURNING * INTO a;change_id=gen_random_uuid();
 INSERT INTO narrative_changes(id,project_id,resource_id,resource_type,after_revision,actor_type,action,correlation_id) VALUES(change_id,NEW.id,a.id,'module',1,'system','module.initialized',change_id);
 INSERT INTO narrative_revisions(project_id,resource_type,resource_id,revision,snapshot,actor_display_name,actor_type,change_set_id,action) VALUES(NEW.id,'module',a.id,1,narrative_state(NEW.id,'module',a.id)||jsonb_build_object('updatedAt',a.updated_at),'Initialisation de l’application','system',change_id,'module.initialized');
 END LOOP;RETURN NEW;END $$;
CREATE TRIGGER project_narrative_modules AFTER INSERT ON projects FOR EACH ROW EXECUTE FUNCTION initialize_narrative_modules();
ALTER TABLE scene_revisions ADD COLUMN reference_snapshot jsonb;
CREATE FUNCTION current_scene_references(p uuid,s uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'projectId',project_id,'sceneId',scene_id,'objectId',object_id,'referenceType',reference_type,'metadata',metadata,'revision',revision) ORDER BY id),'[]') FROM scene_references WHERE project_id=p AND scene_id=s AND status='active' $$;
CREATE OR REPLACE FUNCTION ensure_scene_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_scene scenes;
BEGIN
 SELECT * INTO current_scene FROM scenes WHERE id=NEW.id AND project_id=NEW.project_id;
 IF NOT EXISTS(SELECT 1 FROM scene_revisions r WHERE r.project_id=current_scene.project_id AND r.scene_id=current_scene.id AND r.revision=current_scene.revision AND r.content_snapshot=current_scene.content AND r.content_hash=current_scene.content_hash AND r.metadata_snapshot=jsonb_build_object('title',current_scene.title,'summary',current_scene.summary,'status',current_scene.status,'archived',current_scene.archived,'chapterId',current_scene.chapter_id) AND COALESCE(r.reference_snapshot,'[]')=current_scene_references(current_scene.project_id,current_scene.id)) THEN RAISE EXCEPTION 'scene_snapshot_required' USING ERRCODE='23514';END IF;RETURN NULL;
END $$;
CREATE FUNCTION ensure_reference_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_revision bigint;
BEGIN
 SELECT revision INTO current_revision FROM scenes WHERE project_id=NEW.project_id AND id=NEW.scene_id;
 IF NOT EXISTS(SELECT 1 FROM scene_revisions r WHERE r.project_id=NEW.project_id AND r.scene_id=NEW.scene_id AND r.revision=current_revision AND r.reference_snapshot=current_scene_references(NEW.project_id,NEW.scene_id)) THEN RAISE EXCEPTION 'reference_snapshot_required' USING ERRCODE='23514';END IF;RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER scene_reference_snapshot AFTER INSERT OR UPDATE ON scene_references DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_reference_snapshot();
CREATE FUNCTION editorial_plain_text(d jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE result text;
BEGIN IF d->>'type'='text' THEN RETURN d->>'text';ELSIF d->>'type'='hardBreak' THEN RETURN E'\n';END IF;
 SELECT string_agg(editorial_plain_text(value),CASE WHEN d->>'type' IN('doc','bulletList','orderedList','listItem','blockquote') THEN E'\n' ELSE '' END ORDER BY ordinality) INTO result FROM jsonb_array_elements(COALESCE(d->'content','[]')) WITH ORDINALITY;RETURN COALESCE(result,'');END $$;
ALTER TABLE scenes ADD COLUMN search_text text NOT NULL DEFAULT '';
ALTER TABLE scenes ADD COLUMN search_vector tsvector GENERATED ALWAYS AS(to_tsvector('french',normalize(title||E'\n'||summary||E'\n'||search_text,NFC))) STORED;
CREATE INDEX narrative_object_search ON narrative_objects USING gin(search_vector);
CREATE INDEX narrative_object_project_type ON narrative_objects(project_id,type_key,status,id);
CREATE INDEX narrative_object_parent ON narrative_objects(project_id,parent_place_id);
CREATE INDEX narrative_event_order ON narrative_objects(project_id,ordinal_position,id) WHERE type_key='event';
CREATE INDEX narrative_relation_outgoing ON narrative_relations(project_id,source_object_id,status);
CREATE INDEX narrative_relation_incoming ON narrative_relations(project_id,target_object_id,status);
CREATE INDEX scene_reference_inverse ON scene_references(project_id,object_id,status,id);
CREATE INDEX scene_lexical_search ON scenes USING gin(search_vector);
REVOKE ALL ON module_definitions,module_activations,narrative_objects,narrative_relations,scene_references,narrative_changes,narrative_revisions FROM PUBLIC;
GRANT SELECT ON module_definitions TO storymaster_app;
GRANT SELECT,INSERT,UPDATE ON module_activations,narrative_objects,narrative_relations,scene_references TO storymaster_app;
GRANT SELECT,INSERT ON narrative_changes,narrative_revisions TO storymaster_app;

INSERT INTO module_definitions(module_key,module_version,definition,checksum) VALUES('characters',1,'{"key":"characters","version":1,"typeKeys":["character"],"dependencies":[],"schemas":{"character":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"aliases":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":200}},"description":{"type":"string","maxLength":20000},"narrativeRole":{"type":"string","maxLength":200},"motivations":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"goals":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"conflicts":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"traits":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"healthSummary":{"type":"string","maxLength":4000},"conditionEventRefs":{"maxItems":100,"type":"array","items":{"type":"object","properties":{"id":{"type":"string","format":"uuid","pattern":"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"}},"required":["id"],"additionalProperties":false}}},"additionalProperties":false}},"checksum":"9053dc3ae4217bea287c33fbc563cfb348ad29909ba6bde7dcc9a3be68e5111a"}'::jsonb,'9053dc3ae4217bea287c33fbc563cfb348ad29909ba6bde7dcc9a3be68e5111a');
INSERT INTO module_definitions(module_key,module_version,definition,checksum) VALUES('places',1,'{"key":"places","version":1,"typeKeys":["place"],"dependencies":[],"schemas":{"place":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"description":{"type":"string","maxLength":20000},"category":{"type":"string","maxLength":200},"characteristics":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"parentPlaceRef":{"anyOf":[{"type":"object","properties":{"id":{"type":"string","format":"uuid","pattern":"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"}},"required":["id"],"additionalProperties":false},{"type":"null"}]}},"additionalProperties":false}},"checksum":"ff1fb7a04f4ad2dcc6723f8a902c589716f408e50f0d60503b2ef9919941ab5a"}'::jsonb,'ff1fb7a04f4ad2dcc6723f8a902c589716f408e50f0d60503b2ef9919941ab5a');
INSERT INTO module_definitions(module_key,module_version,definition,checksum) VALUES('timeline',1,'{"key":"timeline","version":1,"typeKeys":["event"],"dependencies":[],"schemas":{"event":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"description":{"type":"string","maxLength":20000},"chronologyPosition":{"type":"number","minimum":-9007199254740991,"maximum":9007199254740991},"temporalExpression":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"unknown"}},"required":["kind"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"ordinal"},"position":{"type":"number","minimum":-9007199254740991,"maximum":9007199254740991}},"required":["kind","position"],"additionalProperties":false}]}},"additionalProperties":false}},"checksum":"13a157be73ba0e99a60d72ec04ea1ade9979bcf3e5f82ea3adfc3980bbc55f94"}'::jsonb,'13a157be73ba0e99a60d72ec04ea1ade9979bcf3e5f82ea3adfc3980bbc55f94');
CREATE TEMP TABLE narrative_existing_projects(id uuid) ON COMMIT DROP;
CREATE TRIGGER initialize_existing_narrative AFTER INSERT ON narrative_existing_projects FOR EACH ROW EXECUTE FUNCTION initialize_narrative_modules();
INSERT INTO narrative_existing_projects SELECT id FROM projects;
DROP TRIGGER initialize_existing_narrative ON narrative_existing_projects;

-- Backfill after DDL: populated Lot 1 tables have deferred snapshot triggers.
-- Do not ALTER TABLE scenes after this UPDATE, or PostgreSQL rejects pending trigger events.
UPDATE scenes SET search_text=normalize(editorial_plain_text(content),NFC);
