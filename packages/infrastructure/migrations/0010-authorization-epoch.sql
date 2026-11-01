-- Additive authorization checkpoint. No existing narrative or authorization row changed.
CREATE TABLE runtime_authorization_state (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 instance_id uuid NOT NULL, epoch uuid NOT NULL,
 state text NOT NULL CHECK(state IN('active','quarantined')),
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON runtime_authorization_state FROM PUBLIC;
GRANT SELECT ON runtime_authorization_state TO storymaster_app;
