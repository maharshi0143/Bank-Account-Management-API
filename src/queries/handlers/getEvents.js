import { pool } from "../../db/connection.js";

export async function getEventsForAccount(accountId) {
  const res = await pool.query(
    `
    SELECT event_id, event_type, event_number, event_data, timestamp
    FROM events
    WHERE aggregate_id = $1
    ORDER BY event_number ASC
    `,
    [accountId]
  );

  return res.rows.map((row) => ({
    eventId: row.event_id,
    eventType: row.event_type,
    eventNumber: row.event_number,
    data: row.event_data,
    timestamp: row.timestamp,
  }));
}