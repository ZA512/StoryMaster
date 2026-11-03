-- UX-3: new explicit character relations, no conversion of existing generic links.
ALTER TABLE narrative_relations DROP CONSTRAINT narrative_relations_relation_type_check;
ALTER TABLE narrative_relations ADD CONSTRAINT narrative_relations_relation_type_check CHECK(relation_type IN('related_to','knows','located_in','participates_in','precedes','parent_of','sibling_of','ally_of','rival_of','mentor_of'));
ALTER TABLE narrative_relations DROP CONSTRAINT narrative_relations_check1;
ALTER TABLE narrative_relations ADD CONSTRAINT narrative_relation_symmetric_order CHECK(relation_type NOT IN('related_to','sibling_of','ally_of','rival_of') OR source_object_id<target_object_id);
ALTER TABLE narrative_relations ADD COLUMN source_character_type text GENERATED ALWAYS AS(CASE WHEN relation_type IN('parent_of','sibling_of','ally_of','rival_of','mentor_of') THEN 'character' END) STORED;
ALTER TABLE narrative_relations ADD COLUMN target_character_type text GENERATED ALWAYS AS(CASE WHEN relation_type IN('parent_of','sibling_of','ally_of','rival_of','mentor_of') THEN 'character' END) STORED;
ALTER TABLE narrative_relations ADD CONSTRAINT narrative_relation_character_source FOREIGN KEY(project_id,source_object_id,source_character_type) REFERENCES narrative_objects(project_id,id,type_key);
ALTER TABLE narrative_relations ADD CONSTRAINT narrative_relation_character_target FOREIGN KEY(project_id,target_object_id,target_character_type) REFERENCES narrative_objects(project_id,id,type_key);
ALTER TABLE narrative_relations ADD CONSTRAINT narrative_relation_parent_qualification CHECK(
 (relation_type='parent_of' AND
  (NOT(attributes?'parentage') OR (jsonb_typeof(attributes->'parentage')='string' AND attributes->>'parentage' IN('unspecified','biological','adoptive','social','guardianship'))) AND
  (NOT(attributes?'parentRole') OR (jsonb_typeof(attributes->'parentRole')='string' AND attributes->>'parentRole' IN('parent','father','mother'))))
 OR (relation_type<>'parent_of' AND NOT(attributes ?| ARRAY['parentage','parentRole']))
);
