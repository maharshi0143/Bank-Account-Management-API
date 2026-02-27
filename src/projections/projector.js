import { pool } from "../db/connection.js";
import { EventTypes } from "../domain/bankAccount/events.js";

// Ensure projection offset row exists
async function ensureOffset(projectionName) {
  await pool.query(
    `
    INSERT INTO projection_offsets (projection_name, last_processed_event_number)
    VALUES ($1, 0)
    ON CONFLICT (projection_name) DO NOTHING
    `,
    [projectionName]
  );
}

// Get last processed event number for a projection
async function getLastProcessedNumber(projectionName) {
  const res = await pool.query(
    `SELECT last_processed_event_number FROM projection_offsets WHERE projection_name = $1`,
    [projectionName]
  );
  if (res.rows.length === 0) return 0;
  return Number(res.rows[0].last_processed_event_number);
}

// Update last processed event number
async function updateLastProcessedNumber(projectionName, eventNumber) {
  await pool.query(
    `
    UPDATE projection_offsets
    SET last_processed_event_number = $1, updated_at = NOW()
    WHERE projection_name = $2
    `,
    [eventNumber, projectionName]
  );
}

// Apply a single event to projections (idempotent logic)
export async function projectEvent(event) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { aggregateId, eventType, data, eventNumber, timestamp } = event;

    switch (eventType) {
      case EventTypes.AccountCreated:
        await client.query(
          `
          INSERT INTO account_summaries (account_id, owner_name, balance, currency, status, version)
          VALUES ($1, $2, $3, $4, 'OPEN', $5)
          ON CONFLICT (account_id) DO NOTHING
          `,
          [aggregateId, data.ownerName, data.initialBalance, data.currency, eventNumber]
        );
        break;

      case EventTypes.MoneyDeposited:
        await client.query(
          `
          UPDATE account_summaries
          SET balance = balance + $1,
              version = $2
          WHERE account_id = $3
          `,
          [data.amount, eventNumber, aggregateId]
        );

        await client.query(
          `
          INSERT INTO transaction_history (transaction_id, account_id, type, amount, description, timestamp)
          VALUES ($1, $2, 'DEPOSIT', $3, $4, $5)
          ON CONFLICT (transaction_id) DO NOTHING
          `,
          [data.transactionId, aggregateId, data.amount, data.description, timestamp]
        );
        break;

      case EventTypes.MoneyWithdrawn:
        await client.query(
          `
          UPDATE account_summaries
          SET balance = balance - $1,
              version = $2
          WHERE account_id = $3
          `,
          [data.amount, eventNumber, aggregateId]
        );

        await client.query(
          `
          INSERT INTO transaction_history (transaction_id, account_id, type, amount, description, timestamp)
          VALUES ($1, $2, 'WITHDRAW', $3, $4, $5)
          ON CONFLICT (transaction_id) DO NOTHING
          `,
          [data.transactionId, aggregateId, data.amount, data.description, timestamp]
        );
        break;

      case EventTypes.AccountClosed:
        await client.query(
          `
          UPDATE account_summaries
          SET status = 'CLOSED',
              version = $1
          WHERE account_id = $2
          `,
          [eventNumber, aggregateId]
        );
        break;

      default:
        throw new Error(`Unknown event type in projector: ${eventType}`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Project all new events for a given projection name
export async function runProjection(projectionName) {
  await ensureOffset(projectionName);

  const lastProcessed = await getLastProcessedNumber(projectionName);

  const res = await pool.query(
    `
    SELECT event_id, aggregate_id, aggregate_type, event_type, event_data, event_number, timestamp, version
    FROM events
    WHERE event_number > $1
    ORDER BY event_number ASC
    `,
    [lastProcessed]
  );

  for (const row of res.rows) {
    const event = {
      eventId: row.event_id,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      eventType: row.event_type,
      data: row.event_data,
      eventNumber: row.event_number,
      timestamp: row.timestamp,
      version: row.version,
    };

    await projectEvent(event);
    await updateLastProcessedNumber(projectionName, event.eventNumber);
  }

  return res.rows.length; // number of events processed
}

// Rebuild projections from scratch
export async function rebuildProjections() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear read models
    await client.query("DELETE FROM transaction_history");
    await client.query("DELETE FROM account_summaries");

    // Reset offsets
    await client.query("DELETE FROM projection_offsets");

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Re-run projections
  await runProjection("AccountSummaries");
  await runProjection("TransactionHistory");
}

// Get projection status
export async function getProjectionStatus() {
  const totalEventsRes = await pool.query(`SELECT COUNT(*) AS count FROM events`);
  const totalEvents = Number(totalEventsRes.rows[0].count);

  const offsetsRes = await pool.query(
    `SELECT projection_name, last_processed_event_number FROM projection_offsets`
  );

  const projections = offsetsRes.rows.map((row) => ({
    name: row.projection_name,
    lastProcessedEventNumberGlobal: Number(row.last_processed_event_number),
    lag: Math.max(0, totalEvents - Number(row.last_processed_event_number)),
  }));

  return {
    totalEventsInStore: totalEvents,
    projections,
  };
}