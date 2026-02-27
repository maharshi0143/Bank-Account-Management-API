import { getLatestSnapshot } from "../services/snapshotStore.js";
import { getEvents } from "../services/eventStore.js";
import { BankAccount } from "../domain/bankAccount/BankAccount.js";

export async function loadBankAccount(accountId) {
  const snapshot = await getLatestSnapshot(accountId);

  let fromEventNumber = 0;
  let snapshotData = null;

  if (snapshot) {
    fromEventNumber = snapshot.lastEventNumber;
    snapshotData = snapshot.data;
  }

  const events = await getEvents(accountId, fromEventNumber);

  const account = BankAccount.fromHistory(events, snapshotData);

  return { account, lastEventNumber: fromEventNumber + events.length };
}