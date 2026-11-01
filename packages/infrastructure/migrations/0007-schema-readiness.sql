-- Read-only migration metadata for startup compatibility checks. No DDL or migration privilege is granted.
GRANT SELECT ON schema_migrations TO storymaster_app;
