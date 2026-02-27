import express from "express";
import { handleCreateAccount } from "../commands/handlers/createAccount.js";
import { handleDepositMoney } from "../commands/handlers/depositMoney.js";
import { handleWithdrawMoney } from "../commands/handlers/withdrawMoney.js";
import { handleCloseAccount } from "../commands/handlers/closeAccount.js";

const router = express.Router();

router.post("/accounts", async (req, res) => {
  try {
    await handleCreateAccount(req.body);
    res.status(202).json({ message: "Account creation accepted." });
  } catch (err) {
    if (err.message.includes("exists")) return res.status(409).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
});

router.post("/accounts/:accountId/deposit", async (req, res) => {
  try {
    await handleDepositMoney(req.params.accountId, req.body);
    res.status(202).json({ message: "Deposit accepted." });
  } catch (err) {
    if (err.message.includes("not found")) return res.status(404).json({ message: err.message });
    if (err.message.includes("not open")) return res.status(409).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
});

router.post("/accounts/:accountId/withdraw", async (req, res) => {
  try {
    await handleWithdrawMoney(req.params.accountId, req.body);
    res.status(202).json({ message: "Withdrawal accepted." });
  } catch (err) {
    if (err.message.includes("not found")) return res.status(404).json({ message: err.message });
    if (err.message.includes("Insufficient")) return res.status(409).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
});

router.post("/accounts/:accountId/close", async (req, res) => {
  try {
    await handleCloseAccount(req.params.accountId, req.body);
    res.status(202).json({ message: "Account closed." });
  } catch (err) {
    if (err.message.includes("not found")) return res.status(404).json({ message: err.message });
    if (err.message.includes("balance")) return res.status(409).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
});

export default router;