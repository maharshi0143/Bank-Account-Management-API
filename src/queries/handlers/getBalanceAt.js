import { pool } from "../../db/connection.js";

export async function getBalanceAt(accountId, isoTimestamp) {
  const res = await pool.query(
    `
    SELECT event_type, event_data
    FROM events
    WHERE aggregate_id = $1 AND timestamp <= $2
    ORDER BY event_number ASC
    `,
    [accountId, isoTimestamp]
  );

  let balance = 0;
  let exists = false;

  for (const row of res.rows) {
    const { event_type, event_data } = row;

    if (event_type === "AccountCreated") {
      balance = Number(event_data.initialBalance);
      exists = true;
    } else if (event_type === "MoneyDeposited") {
      balance += Number(event_data.amount);
    } else if (event_type === "MoneyWithdrawn") {
      balance -= Number(event_data.amount);
    }
  }

  if (!exists) {
    return null;
  }

  return {
    accountId,
    balanceAt: balance,
    timestamp: isoTimestamp,
  };
}