-- The publication clock must not upgrade a shared project fence to an exclusive lock.
CREATE TABLE editorial_clocks(project_id uuid PRIMARY KEY REFERENCES projects(id),revision bigint NOT NULL CHECK(revision>0));
INSERT INTO editorial_clocks(project_id,revision) SELECT id,editorial_revision FROM projects;
CREATE FUNCTION create_editorial_clock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN INSERT INTO editorial_clocks(project_id,revision) VALUES(NEW.id,1);RETURN NEW;END $$;
CREATE TRIGGER project_editorial_clock AFTER INSERT ON projects FOR EACH ROW EXECUTE FUNCTION create_editorial_clock();
GRANT SELECT,INSERT,UPDATE ON editorial_clocks TO storymaster_app;
