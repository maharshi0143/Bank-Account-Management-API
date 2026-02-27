-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EVENTS TABLE (Event Store)
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    event_number INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT unique_aggregate_event_number UNIQUE (aggregate_id, event_number)
);

CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events(aggregate_id);

-- 2. SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id UUID PRIMARY KEY NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL UNIQUE,
    snapshot_data JSONB NOT NULL,
    last_event_number INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate_id ON snapshots(aggregate_id);

-- 3. ACCOUNT SUMMARIES (READ MODEL)
CREATE TABLE IF NOT EXISTS account_summaries (
    account_id VARCHAR(255) PRIMARY KEY NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    balance DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    version BIGINT NOT NULL
);

-- 4. TRANSACTION HISTORY (READ MODEL)
CREATE TABLE IF NOT EXISTS transaction_history (
    transaction_id VARCHAR(255) PRIMARY KEY NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    description TEXT,
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transaction_history_account_id ON transaction_history(account_id);

-- 5. PROJECTION OFFSETS (TRACK PROGRESS)
CREATE TABLE IF NOT EXISTS projection_offsets (
    projection_name VARCHAR(100) PRIMARY KEY NOT NULL,
    last_processed_event_id UUID,
    last_processed_event_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);