-- Bind archive historical visibility to the role used for its snapshot.
ALTER TABLE export_jobs ADD COLUMN snapshot_role text CHECK(snapshot_role IN('owner','admin','author'));
