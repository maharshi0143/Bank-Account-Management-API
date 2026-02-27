export const EventTypes = {
  AccountCreated: "AccountCreated",
  MoneyDeposited: "MoneyDeposited",
  MoneyWithdrawn: "MoneyWithdrawn",
  AccountClosed: "AccountClosed",
};

export function AccountCreatedEvent({ accountId, ownerName, initialBalance, currency }) {
  return {
    eventType: EventTypes.AccountCreated,
    data: { accountId, ownerName, initialBalance, currency },
    version: 1,
  };
}

export function MoneyDepositedEvent({ amount, description, transactionId }) {
  return {
    eventType: EventTypes.MoneyDeposited,
    data: { amount, description, transactionId },
    version: 1,
  };
}

export function MoneyWithdrawnEvent({ amount, description, transactionId }) {
  return {
    eventType: EventTypes.MoneyWithdrawn,
    data: { amount, description, transactionId },
    version: 1,
  };
}

export function AccountClosedEvent({ reason }) {
  return {
    eventType: EventTypes.AccountClosed,
    data: { reason },
    version: 1,
  };
}