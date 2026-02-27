import express from "express";
import { getAccount } from "../queries/handlers/getAccount.js";
import { getEventsForAccount } from "../queries/handlers/getEvents.js";
import { getBalanceAt } from "../queries/handlers/getBalanceAt.js";
import { getTransactions } from "../queries/handlers/getTransactions.js";

const router = express.Router();

router.get("/accounts/:accountId", async (req, res) => {
  const { accountId } = req.params;
  const result = await getAccount(accountId);
  if (!result) return res.status(404).json({ message: "Account not found" });
  res.json(result);
});

router.get("/accounts/:accountId/events", async (req, res) => {
  const { accountId } = req.params;
  const events = await getEventsForAccount(accountId);
  res.json(events);
});

router.get("/accounts/:accountId/balance-at/:timestamp", async (req, res) => {
  const { accountId, timestamp } = req.params;
  const result = await getBalanceAt(accountId, decodeURIComponent(timestamp));
  if (!result) return res.status(404).json({ message: "Account not found" });
  res.json(result);
});

router.get("/accounts/:accountId/transactions", async (req, res) => {
  const { accountId } = req.params;
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 10);

  const result = await getTransactions(accountId, page, pageSize);
  res.json(result);
});

export default router;