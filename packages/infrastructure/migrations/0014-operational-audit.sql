-- Operator metadata only; no narrative content, auth proof, filename or secret.
CREATE TABLE operational_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 operator_uid integer NOT NULL CHECK(operator_uid>=0),
 action text NOT NULL CHECK(action IN('export.cleanup_requested','export.cleanup_completed')),
 resource_id uuid NOT NULL,
 target_digest char(64) NOT NULL CHECK(target_digest~'^[a-f0-9]{64}$'),
 correlation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON operational_events FROM PUBLIC;
GRANT SELECT,INSERT ON operational_events TO storymaster_app;
