import { pool } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

// Get events for an aggregate (optionally after a given event number)
export async function getEvents(aggregateId, fromEventNumber = 0) {
  const result = await pool.query(
    `
    SELECT event_id, aggregate_id, aggregate_type, event_type, event_data, event_number, timestamp, version
    FROM events
    WHERE aggregate_id = $1 AND event_number > $2
    ORDER BY event_number ASC
    `,
    [aggregateId, fromEventNumber]
  );

  return result.rows.map((row) => ({
    eventId: row.event_id,
    aggregateId: row.aggregate_id,
    aggregateType: row.aggregate_type,
    eventType: row.event_type,
    data: row.event_data,
    eventNumber: row.event_number,
    timestamp: row.timestamp,
    version: row.version,
  }));
}

// Get all events (for projection rebuild)
export async function getAllEvents() {
  const result = await pool.query(
    `
    SELECT event_id, aggregate_id, aggregate_type, event_type, event_data, event_number, timestamp, version
    FROM events
    ORDER BY timestamp ASC, event_number ASC
    `
  );

  return result.rows.map((row) => ({
    eventId: row.event_id,
    aggregateId: row.aggregate_id,
    aggregateType: row.aggregate_type,
    eventType: row.event_type,
    data: row.event_data,
    eventNumber: row.event_number,
    timestamp: row.timestamp,
    version: row.version,
  }));
}

// Append new events for an aggregate (in a transaction)
export async function appendEvents(aggregateId, aggregateType, newEvents) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current max event_number for this aggregate
    const res = await client.query(
      `SELECT COALESCE(MAX(event_number), 0) AS max FROM events WHERE aggregate_id = $1`,
      [aggregateId]
    );

    let currentEventNumber = Number(res.rows[0].max);

    for (const event of newEvents) {
      currentEventNumber += 1;

      await client.query(
        `
        INSERT INTO events (
          event_id,
          aggregate_id,
          aggregate_type,
          event_type,
          event_data,
          event_number,
          version
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          uuidv4(),
          aggregateId,
          aggregateType,
          event.eventType,
          event.data,
          currentEventNumber,
          event.version || 1,
        ]
      );
    }

    await client.query("COMMIT");

    return currentEventNumber; 
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}