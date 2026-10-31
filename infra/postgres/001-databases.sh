#!/bin/sh
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  --set=app_password="$APP_DB_PASSWORD" --set=migration_password="$MIGRATION_DB_PASSWORD" \
  --set=keycloak_password="$KEYCLOAK_DB_PASSWORD" <<'SQL'
CREATE ROLE storymaster_migrator LOGIN PASSWORD :'migration_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE storymaster_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE keycloak LOGIN PASSWORD :'keycloak_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE DATABASE storymaster OWNER storymaster_migrator;
CREATE DATABASE storymaster_test OWNER storymaster_migrator;
CREATE DATABASE keycloak OWNER keycloak;
REVOKE CONNECT ON DATABASE storymaster, storymaster_test, keycloak FROM PUBLIC;
GRANT CONNECT ON DATABASE storymaster, storymaster_test TO storymaster_app;
SQL
