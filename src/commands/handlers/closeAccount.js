import { appendEvents } from "../../services/eventStore.js";
import { saveSnapshot } from "../../services/snapshotStore.js";
import { loadBankAccount } from "../loadAggregate.js";
import { runProjection } from "../../projections/projector.js";

export async function handleCloseAccount(accountId, command) {
  const { reason } = command;

  const { account } = await loadBankAccount(accountId);

  if (!account.id) {
    throw new Error("Account not found");
  }

  const newEvents = account.close({ reason });

  const lastEventNumber = await appendEvents(accountId, "BankAccount", newEvents);

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