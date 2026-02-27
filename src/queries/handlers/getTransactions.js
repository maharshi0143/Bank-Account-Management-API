import { pool } from "../../db/connection.js";

export async function getTransactions(accountId, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;

  const countRes = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM transaction_history
    WHERE account_id = $1
    `,
    [accountId]
  );

  const totalCount = Number(countRes.rows[0].count);
  const totalPages = Math.ceil(totalCount / pageSize);

  const res = await pool.query(
    `
    SELECT transaction_id, type, amount, description, timestamp
    FROM transaction_history
    WHERE account_id = $1
    ORDER BY timestamp ASC
    LIMIT $2 OFFSET $3
    `,
    [accountId, pageSize, offset]
  );

  const items = res.rows.map((row) => ({
    transactionId: row.transaction_id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    timestamp: row.timestamp,
  }));

  return {
    currentPage: page,
    pageSize,
    totalPages,
    totalCount,
    items,
  };
}