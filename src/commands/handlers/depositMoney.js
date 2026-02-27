import { appendEvents } from "../../services/eventStore.js";
import { saveSnapshot } from "../../services/snapshotStore.js";
import { loadBankAccount } from "../loadAggregate.js";
import { runProjection } from "../../projections/projector.js";

export async function handleDepositMoney(accountId, command) {
  const { amount, description, transactionId } = command;

  const { account, lastEventNumber: currentVersion } = await loadBankAccount(accountId);

  if (!account.id) {
    throw new Error("Account not found");
  }

  const newEvents = account.deposit({ amount, description, transactionId });

  if (newEvents.length === 0) {
    return; // idempotent duplicate
  }

  const lastEventNumber = await appendEvents(accountId, "BankAccount", newEvents);

  // Apply events to get new state
  newEvents.forEach((e) => account.apply(e));

  if (lastEventNumber % 50 === 0) {
    const snapshotData = {
      id: account.id,
      ownerName: account.ownerName,
      balance: account.balance,
      currency: account.currency,
      status: account.status,
      version: lastEventNumber,
      processedTransactionIds: Array.from(account.processedTransactionIds),
    };
    await saveSnapshot(accountId, snapshotData, lastEventNumber);
  }

  // Update projections
  await runProjection("AccountSummaries");
  await runProjection("TransactionHistory");
}