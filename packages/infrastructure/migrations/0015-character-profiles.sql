-- UX-3: compatible schema extension; old objects and snapshots stay untouched.
ALTER TABLE module_definitions DROP CONSTRAINT module_definitions_module_version_check;
ALTER TABLE module_definitions ADD CONSTRAINT module_definitions_module_version_check CHECK(module_version=1 OR (module_key='characters' AND module_version=2));
ALTER TABLE narrative_objects DROP CONSTRAINT narrative_objects_schema_version_check;
ALTER TABLE narrative_objects ADD CONSTRAINT narrative_objects_schema_version_check CHECK(schema_version=1 OR (type_key='character' AND schema_version=2));
INSERT INTO module_definitions(module_key,module_version,definition,checksum) VALUES('characters',2,'{"key":"characters","version":2,"typeKeys":["character"],"dependencies":[],"schemas":{"character":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"aliases":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":200}},"description":{"type":"string","maxLength":20000},"narrativeRole":{"type":"string","maxLength":200},"motivations":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"goals":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"conflicts":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"traits":{"maxItems":100,"type":"array","items":{"type":"string","maxLength":1000}},"healthSummary":{"type":"string","maxLength":4000},"conditionEventRefs":{"maxItems":100,"type":"array","items":{"type":"object","properties":{"id":{"type":"string","format":"uuid","pattern":"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"}},"required":["id"],"additionalProperties":false}},"background":{"type":"string","maxLength":20000},"speakingStyle":{"type":"string","maxLength":4000}},"additionalProperties":false}},"checksum":"11c4ca07aa5259bee89e355ed8bdc8d1d7e1281c83d378b9ebb2fc5767164446"}'::jsonb,'11c4ca07aa5259bee89e355ed8bdc8d1d7e1281c83d378b9ebb2fc5767164446');
-- Publish a new current activation revision, preserving enabled/off and every old snapshot.
DO $$
DECLARE a module_activations; change_id uuid;
BEGIN
 FOR a IN UPDATE module_activations SET module_version=2,revision=revision+1,updated_at=clock_timestamp() WHERE module_key='characters' AND module_version=1 RETURNING * LOOP
  change_id=gen_random_uuid();
  INSERT INTO narrative_changes(id,project_id,resource_id,resource_type,after_revision,actor_type,action,correlation_id) VALUES(change_id,a.project_id,a.id,'module',a.revision,'system','module.schema_upgraded',change_id);
  INSERT INTO narrative_revisions(project_id,resource_type,resource_id,revision,snapshot,actor_display_name,actor_type,change_set_id,action) VALUES(a.project_id,'module',a.id,a.revision,narrative_state(a.project_id,'module',a.id)||jsonb_build_object('updatedAt',a.updated_at),'Migration UX-3 — schéma compatible','system',change_id,'module.schema_upgraded');
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION initialize_narrative_modules() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m module_definitions; a module_activations; change_id uuid;
BEGIN
 FOR m IN SELECT DISTINCT ON(module_key) * FROM module_definitions ORDER BY module_key,module_version DESC LOOP
  INSERT INTO module_activations(project_id,module_key,module_version) VALUES(NEW.id,m.module_key,m.module_version) RETURNING * INTO a;change_id=gen_random_uuid();
  INSERT INTO narrative_changes(id,project_id,resource_id,resource_type,after_revision,actor_type,action,correlation_id) VALUES(change_id,NEW.id,a.id,'module',1,'system','module.initialized',change_id);
  INSERT INTO narrative_revisions(project_id,resource_type,resource_id,revision,snapshot,actor_display_name,actor_type,change_set_id,action) VALUES(NEW.id,'module',a.id,1,narrative_state(NEW.id,'module',a.id)||jsonb_build_object('updatedAt',a.updated_at),'Initialisation de l’application','system',change_id,'module.initialized');
 END LOOP;RETURN NEW;
END $$;
