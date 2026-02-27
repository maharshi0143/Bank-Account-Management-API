import { pool } from "../../db/connection.js";

export async function getAccount(accountId) {
  const res = await pool.query(
    `
    SELECT account_id, owner_name, balance, currency, status
    FROM account_summaries
    WHERE account_id = $1
    `,
    [accountId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    accountId: row.account_id,
    ownerName: row.owner_name,
    balance: Number(row.balance),
    currency: row.currency,
    status: row.status,
  };
}