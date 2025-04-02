CREATE SCHEMA webbot;
DROP SCHEMA public;

ALTER USER postgres set SEARCH_PATH = 'webbot';

CREATE TABLE webbot.history
(
    id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    query      TEXT NOT NULL,
    answer     TEXT NOT NULL,
    token      TEXT NOT NULL
);
