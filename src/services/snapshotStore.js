import { pool } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

// Get latest snapshot for an aggregate
export async function getLatestSnapshot(aggregateId) {
  const result = await pool.query(
    `
    SELECT snapshot_id, aggregate_id, snapshot_data, last_event_number, created_at
    FROM snapshots
    WHERE aggregate_id = $1
    `,
    [aggregateId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    snapshotId: row.snapshot_id,
    aggregateId: row.aggregate_id,
    data: row.snapshot_data,
    lastEventNumber: row.last_event_number,
    createdAt: row.created_at,
  };
}

// Save or replace snapshot
export async function saveSnapshot(aggregateId, snapshotData, lastEventNumber) {
  await pool.query(
    `
    INSERT INTO snapshots (snapshot_id, aggregate_id, snapshot_data, last_event_number)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (aggregate_id)
    DO UPDATE SET
      snapshot_data = EXCLUDED.snapshot_data,
      last_event_number = EXCLUDED.last_event_number,
      created_at = NOW()
    `,
    [uuidv4(), aggregateId, snapshotData, lastEventNumber]
  );
}