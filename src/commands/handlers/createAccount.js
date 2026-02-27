import { appendEvents } from "../../services/eventStore.js";
import { saveSnapshot } from "../../services/snapshotStore.js";
import { loadBankAccount } from "../loadAggregate.js";
import { BankAccount } from "../../domain/bankAccount/BankAccount.js";
import { runProjection } from "../../projections/projector.js";

export async function handleCreateAccount(command) {
  const { accountId, ownerName, initialBalance, currency } = command;

  // Load existing (if any)
  const { account } = await loadBankAccount(accountId);

  // New aggregate
  const newAccount = account.id ? account : new BankAccount();

  const events = newAccount.createAccount({
    accountId,
    ownerName,
    initialBalance,
    currency,
  });

  if (events.length === 0) {
    return; // idempotent no-op
  }

  const lastEventNumber = await appendEvents(accountId, "BankAccount", events);

  // Snapshot every 50 events
  if (lastEventNumber % 50 === 0) {
    const snapshotData = {
      id: newAccount.id || accountId,
      ownerName,
      balance: initialBalance,
      currency,
      status: "OPEN",
      version: lastEventNumber,
      processedTransactionIds: [],
    };
    await saveSnapshot(accountId, snapshotData, lastEventNumber);
  }

  // Update projections
  await runProjection("AccountSummaries");
  await runProjection("TransactionHistory");
}