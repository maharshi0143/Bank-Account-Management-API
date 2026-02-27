import { EventTypes } from "./events.js";

export class BankAccount {
  constructor() {
    this.id = null;
    this.ownerName = null;
    this.balance = 0;
    this.currency = null;
    this.status = "NEW"; // NEW, OPEN, CLOSED
    this.version = 0;
    this.processedTransactionIds = new Set();
  }

  // Apply an event to mutate state
  apply(event) {
    switch (event.eventType) {
      case EventTypes.AccountCreated:
        this.id = event.data.accountId;
        this.ownerName = event.data.ownerName;
        this.balance = Number(event.data.initialBalance);
        this.currency = event.data.currency;
        this.status = "OPEN";
        break;

      case EventTypes.MoneyDeposited:
        this.balance += Number(event.data.amount);
        this.processedTransactionIds.add(event.data.transactionId);
        break;

      case EventTypes.MoneyWithdrawn:
        this.balance -= Number(event.data.amount);
        this.processedTransactionIds.add(event.data.transactionId);
        break;

      case EventTypes.AccountClosed:
        this.status = "CLOSED";
        break;

      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }

    this.version += 1;
  }

  // Rebuild state from history
  static fromHistory(events = [], snapshot = null) {
    const account = new BankAccount();

    if (snapshot) {
      account.id = snapshot.id;
      account.ownerName = snapshot.ownerName;
      account.balance = Number(snapshot.balance);
      account.currency = snapshot.currency;
      account.status = snapshot.status;
      account.version = snapshot.version || 0;
      if (snapshot.processedTransactionIds) {
        snapshot.processedTransactionIds.forEach((id) => account.processedTransactionIds.add(id));
      }
    }

    for (const event of events) {
      account.apply(event);
    }

    return account;
  }

  // Command handlers (business logic)

  createAccount({ accountId, ownerName, initialBalance, currency }) {
    if (this.status !== "NEW") {
      throw new Error("Account already exists");
    }
    if (Number(initialBalance) < 0) {
      throw new Error("Initial balance cannot be negative");
    }

    return [
      {
        eventType: EventTypes.AccountCreated,
        data: { accountId, ownerName, initialBalance, currency },
        version: 1,
      },
    ];
  }

  deposit({ amount, description, transactionId }) {
    if (this.status !== "OPEN") {
      throw new Error("Account is not open");
    }
    if (Number(amount) <= 0) {
      throw new Error("Deposit amount must be positive");
    }
    if (this.processedTransactionIds.has(transactionId)) {
      // Idempotency: ignore duplicate
      return [];
    }

    return [
      {
        eventType: EventTypes.MoneyDeposited,
        data: { amount, description, transactionId },
        version: 1,
      },
    ];
  }

  withdraw({ amount, description, transactionId }) {
    if (this.status !== "OPEN") {
      throw new Error("Account is not open");
    }
    if (Number(amount) <= 0) {
      throw new Error("Withdraw amount must be positive");
    }
    if (this.processedTransactionIds.has(transactionId)) {
      // Idempotency
      return [];
    }
    if (this.balance - Number(amount) < 0) {
      throw new Error("Insufficient funds");
    }

    return [
      {
        eventType: EventTypes.MoneyWithdrawn,
        data: { amount, description, transactionId },
        version: 1,
      },
    ];
  }

  close({ reason }) {
    if (this.status !== "OPEN") {
      throw new Error("Account is not open");
    }
    if (this.balance !== 0) {
      throw new Error("Account balance must be zero to close");
    }

    return [
      {
        eventType: EventTypes.AccountClosed,
        data: { reason },
        version: 1,
      },
    ];
  }
}