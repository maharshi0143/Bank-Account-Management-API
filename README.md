# Bank Account Management with Event Sourcing and CQRS

A fully functional bank account management API implementing Event Sourcing and Command Query Responsibility Segregation (CQRS) patterns. This project demonstrates advanced architectural patterns for building auditable, scalable, and resilient financial systems.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Event Sourcing Implementation](#event-sourcing-implementation)
- [CQRS Implementation](#cqrs-implementation)
- [Snapshotting Strategy](#snapshotting-strategy)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Design Decisions](#design-decisions)

## 🎯 Overview

This project implements a bank account management system using Event Sourcing and CQRS patterns. Instead of storing just the current state of accounts, the system maintains a complete, immutable log of all state-changing events. This provides:

- **Full Audit Trail**: Every change is recorded permanently
- **Temporal Queries**: Reconstruct account state at any point in time
- **Event Replay**: Rebuild read models from the event stream
- **Business Insights**: Analyze historical patterns and behaviors

## 🏗️ Architecture

### Event Sourcing

All state changes are captured as immutable events stored in an event store. The current state of any account is derived by replaying its event history.

```
Command → Aggregate → Events → Event Store
                              ↓
                         Projections → Read Models
```

### CQRS

The system separates write operations (commands) from read operations (queries):

- **Write Side**: Commands modify state by generating events
- **Read Side**: Queries read from optimized projection tables
- **Projections**: Event handlers that update read models asynchronously

## ✨ Features

### Core Functionality

- ✅ Create bank accounts
- ✅ Deposit money
- ✅ Withdraw money (with balance validation)
- ✅ Close accounts (with zero-balance requirement)
- ✅ Query account state
- ✅ View transaction history with pagination
- ✅ Time-travel queries (balance at specific timestamp)
- ✅ Full event audit trail

### Advanced Features

- ✅ **Snapshotting**: Automatic state snapshots every 50 events
- ✅ **Idempotency**: Duplicate transaction detection
- ✅ **Projection Rebuild**: Reconstruct read models from events
- ✅ **Projection Status**: Monitor projection lag
- ✅ **Eventual Consistency**: Asynchronous read model updates
- ✅ **Business Rule Enforcement**: Overdraft prevention, closure validation

## 🛠️ Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Language**: JavaScript (ES6 Modules)

## 📦 Prerequisites

- Docker Desktop
- Docker Compose
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Bank Account Management with Event Sourcing and CQRS"
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default configuration in `.env.example` works out of the box:

```env
API_PORT=8080
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=bank_db
DATABASE_URL=postgresql://postgres:postgres@db:5432/bank_db
```

### 3. Start the Application

```bash
docker-compose up --build
```

This will:
- Build the application Docker image
- Start PostgreSQL database
- Run database migrations
- Start the API server on port 8080

### 4. Verify Installation

Check the health endpoint:

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok"
}
```

## 📚 API Documentation

### Base URL

```
http://localhost:8080/api
```

### Commands (Write Operations)

#### 1. Create Account

```http
POST /api/accounts
Content-Type: application/json

{
  "accountId": "acc-123",
  "ownerName": "John Doe",
  "initialBalance": 1000.00,
  "currency": "USD"
}
```

**Responses:**
- `202 Accepted`: Account creation accepted
- `400 Bad Request`: Invalid input
- `409 Conflict`: Account already exists

#### 2. Deposit Money

```http
POST /api/accounts/{accountId}/deposit
Content-Type: application/json

{
  "amount": 500.00,
  "description": "Salary deposit",
  "transactionId": "tx-001"
}
```

**Responses:**
- `202 Accepted`: Deposit accepted
- `400 Bad Request`: Invalid amount
- `404 Not Found`: Account not found
- `409 Conflict`: Account is closed

#### 3. Withdraw Money

```http
POST /api/accounts/{accountId}/withdraw
Content-Type: application/json

{
  "amount": 200.00,
  "description": "ATM withdrawal",
  "transactionId": "tx-002"
}
```

**Responses:**
- `202 Accepted`: Withdrawal accepted
- `400 Bad Request`: Invalid amount
- `404 Not Found`: Account not found
- `409 Conflict`: Insufficient funds or account closed

#### 4. Close Account

```http
POST /api/accounts/{accountId}/close
Content-Type: application/json

{
  "reason": "Account no longer needed"
}
```

**Responses:**
- `202 Accepted`: Account closed
- `404 Not Found`: Account not found
- `409 Conflict`: Balance is not zero

### Queries (Read Operations)

#### 1. Get Account Details

```http
GET /api/accounts/{accountId}
```

**Response (200 OK):**
```json
{
  "accountId": "acc-123",
  "ownerName": "John Doe",
  "balance": 1300.00,
  "currency": "USD",
  "status": "OPEN"
}
```

#### 2. Get Transaction History

```http
GET /api/accounts/{accountId}/transactions?page=1&pageSize=10
```

**Response (200 OK):**
```json
{
  "currentPage": 1,
  "pageSize": 10,
  "totalPages": 2,
  "totalCount": 15,
  "items": [
    {
      "transactionId": "tx-001",
      "type": "DEPOSIT",
      "amount": 500.00,
      "description": "Salary deposit",
      "timestamp": "2026-02-25T10:30:00Z"
    }
  ]
}
```

#### 3. Get Event Stream

```http
GET /api/accounts/{accountId}/events
```

**Response (200 OK):**
```json
[
  {
    "eventId": "uuid",
    "eventType": "AccountCreated",
    "eventNumber": 1,
    "data": {
      "accountId": "acc-123",
      "ownerName": "John Doe",
      "initialBalance": 1000.00,
      "currency": "USD"
    },
    "timestamp": "2026-02-25T10:00:00Z"
  }
]
```

#### 4. Get Balance at Timestamp (Time Travel)

```http
GET /api/accounts/{accountId}/balance-at/{timestamp}
```

Example:
```bash
curl "http://localhost:8080/api/accounts/acc-123/balance-at/2026-02-25T10:30:00Z"
```

**Response (200 OK):**
```json
{
  "accountId": "acc-123",
  "balanceAt": 1000.00,
  "timestamp": "2026-02-25T10:30:00Z"
}
```

### Administrative Endpoints

#### 1. Rebuild Projections

Rebuilds all read models from the event store.

```http
POST /api/projections/rebuild
```

**Response (202 Accepted):**
```json
{
  "message": "Projection rebuild initiated."
}
```

**Use Cases:**
- Fix corrupted read models
- Add new projection types
- Recover from data issues

#### 2. Get Projection Status

```http
GET /api/projections/status
```

**Response (200 OK):**
```json
{
  "totalEventsInStore": 150,
  "projections": [
    {
      "name": "AccountSummaries",
      "lastProcessedEventNumberGlobal": 150,
      "lag": 0
    },
    {
      "name": "TransactionHistory",
      "lastProcessedEventNumberGlobal": 150,
      "lag": 0
    }
  ]
}
```

## 🔄 Event Sourcing Implementation

### Event Types

1. **AccountCreated**: Initial account creation
2. **MoneyDeposited**: Funds added to account
3. **MoneyWithdrawn**: Funds removed from account
4. **AccountClosed**: Account permanently closed

### Event Store Schema

```sql
CREATE TABLE events (
    event_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    event_number INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    version INTEGER NOT NULL,
    UNIQUE (aggregate_id, event_number)
);
```

### Event Flow

1. **Command Received**: API receives a command (e.g., deposit money)
2. **Load Aggregate**: Reconstruct current state from events (or snapshot + events)
3. **Validate**: Check business rules (e.g., sufficient balance)
4. **Generate Events**: Create new event(s) if valid
5. **Persist Events**: Append to event store in a transaction
6. **Update Projections**: Synchronously update read models
7. **Create Snapshot**: If event number is divisible by 50

## 📊 CQRS Implementation

### Write Model (Commands)

Commands are handled by aggregate roots that:
- Validate business rules
- Generate domain events
- Ensure consistency

### Read Model (Projections)

Two optimized read models:

1. **Account Summaries**: Current account state
   - Account ID, owner, balance, currency, status
   - Optimized for single-account queries

2. **Transaction History**: All transactions
   - Transaction ID, type, amount, description, timestamp
   - Optimized for paginated transaction lists

### Projection Updates

Projections are updated synchronously after events are committed. In a production system, this would be done asynchronously using a message queue.

## 📸 Snapshotting Strategy

### Why Snapshots?

As aggregates accumulate events, replaying all events becomes expensive. Snapshots provide performance optimization.

### Implementation

- **Frequency**: Every 50 events per aggregate
- **Storage**: Snapshots table with full aggregate state
- **Loading**: Load latest snapshot + subsequent events

### Snapshot Schema

```sql
CREATE TABLE snapshots (
    snapshot_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) UNIQUE NOT NULL,
    snapshot_data JSONB NOT NULL,
    last_event_number INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL
);
```

### Example

For an account with 125 events:
- Snapshot exists at event 100
- Only replay events 101-125
- 80% reduction in events to process

## 📁 Project Structure

```
.
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Application container
├── package.json                # Dependencies
├── .env.example               # Environment variables template
├── submission.json            # Test configuration
├── seeds/
│   └── 01_schema.sql         # Database schema
└── src/
    ├── app.js                # Application entry point
    ├── commands/
    │   ├── loadAggregate.js  # Aggregate loader with snapshotting
    │   └── handlers/
    │       ├── createAccount.js
    │       ├── depositMoney.js
    │       ├── withdrawMoney.js
    │       └── closeAccount.js
    ├── db/
    │   └── connection.js     # PostgreSQL connection pool
    ├── domain/
    │   └── bankAccount/
    │       ├── BankAccount.js    # Aggregate root
    │       └── events.js         # Event definitions
    ├── projections/
    │   └── projector.js      # Projection engine
    ├── queries/
    │   └── handlers/
    │       ├── getAccount.js
    │       ├── getBalanceAt.js
    │       ├── getEvents.js
    │       └── getTransactions.js
    ├── routes/
    │   ├── commandRoutes.js  # Write endpoints
    │   ├── queryRoutes.js    # Read endpoints
    │   └── projectionRoutes.js
    ├── services/
    │   ├── eventStore.js     # Event persistence
    │   └── snapshotStore.js  # Snapshot persistence
    └── utils/                # Utility functions
```

## 🧪 Testing

### Manual Testing Examples

#### Create and Fund Account

```bash
# Create account
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc-demo-001",
    "ownerName": "Alice Smith",
    "initialBalance": 1000,
    "currency": "USD"
  }'

# Deposit money
curl -X POST http://localhost:8080/api/accounts/acc-demo-001/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "description": "Paycheck",
    "transactionId": "tx-001"
  }'

# Check balance
curl http://localhost:8080/api/accounts/acc-demo-001
```

#### Test Snapshot Creation

```bash
# Generate 51 small deposits to trigger snapshot
for i in {1..51}; do
  curl -X POST http://localhost:8080/api/accounts/acc-demo-001/deposit \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 1,
      \"description\": \"Test deposit $i\",
      \"transactionId\": \"tx-snapshot-$i\"
    }"
done

# Verify snapshot was created in database
docker exec -it <postgres-container-id> psql -U postgres -d bank_db \
  -c "SELECT aggregate_id, last_event_number FROM snapshots WHERE aggregate_id='acc-demo-001';"
```

#### Test Time-Travel Query

```bash
# Note current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Make a deposit
curl -X POST http://localhost:8080/api/accounts/acc-demo-001/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "description": "Large deposit",
    "transactionId": "tx-time-travel"
  }'

# Query balance before the deposit
curl "http://localhost:8080/api/accounts/acc-demo-001/balance-at/$TIMESTAMP"
```

## 💡 Design Decisions

### 1. Synchronous Projections

**Decision**: Update projections synchronously after event persistence.

**Rationale**:
- Simplifies implementation for educational purposes
- Ensures immediate consistency for demo/testing
- In production, use asynchronous processing with message queues

### 2. Idempotency via Transaction IDs

**Decision**: Use `transactionId` to prevent duplicate transactions.

**Rationale**:
- Network retries shouldn't create duplicate transactions
- Transaction IDs tracked in aggregate state
- Safe retry mechanism for clients

### 3. Snapshot Frequency (50 events)

**Decision**: Create snapshots every 50 events per aggregate.

**Rationale**:
- Balances performance with storage
- Reasonable for typical account activity
- Configurable for production use cases

### 4. Event Versioning

**Decision**: Include version field in all events.

**Rationale**:
- Supports schema evolution
- Enables event upcasting in future
- Best practice for long-lived systems

### 5. Decimal Precision

**Decision**: Use `DECIMAL(19, 4)` for monetary values.

**Rationale**:
- Avoids floating-point precision issues
- Supports currencies with 4 decimal places
- Standard for financial applications

### 6. Single Event Store Table

**Decision**: Store all event types in one table.

**Rationale**:
- Simplifies event replay
- Natural ordering via timestamps
- Event type discrimination via `event_type` column

### 7. Account Closure Rules

**Decision**: Accounts can only be closed with zero balance.

**Rationale**:
- Prevents accidental fund loss
- Clear business rule
- Forces explicit fund withdrawal

## 🔒 Business Rules

1. **Initial Balance**: Must be non-negative
2. **Deposits**: Must be positive amounts
3. **Withdrawals**: Must be positive and ≤ current balance
4. **Account Operations**: Only on OPEN accounts
5. **Closure**: Only when balance is exactly zero
6. **Transaction IDs**: Must be unique (idempotency)

## 🔧 Maintenance

### View Database Logs

```bash
docker-compose logs db
```

### View Application Logs

```bash
docker-compose logs app
```

### Access PostgreSQL

```bash
docker exec -it <postgres-container-name> psql -U postgres -d bank_db
```

### Stop Services

```bash
docker-compose down
```

### Clean Reset

```bash
docker-compose down -v  # Removes volumes
docker-compose up --build
```

## 📈 Performance Considerations

1. **Snapshotting**: Reduces event replay overhead
2. **Indexes**: On `aggregate_id` and `account_id` for fast lookups
3. **Pagination**: Transaction history supports paging to handle large datasets
4. **Connection Pooling**: PostgreSQL pool for efficient database connections

## 🚀 Production Recommendations

For a production deployment, consider:

1. **Asynchronous Projections**: Use message queue (Kafka, RabbitMQ)
2. **Horizontal Scaling**: Run multiple API instances
3. **Read Replicas**: Separate read/write database instances
4. **Monitoring**: Add metrics, logging, and alerting
5. **Security**: Authentication, authorization, encrypted connections
6. **Backup Strategy**: Regular event store backups
7. **Event Archival**: Archive old events to cold storage
8. **Rate Limiting**: Prevent abuse
9. **Circuit Breakers**: Handle downstream failures gracefully
10. **Distributed Tracing**: Track requests across services

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

This is a learning project. Feel free to explore, modify, and experiment!

## 📧 Support

For questions or issues, please refer to the project documentation or raise an issue in the repository.

---

**Built with ❤️ to demonstrate Event Sourcing and CQRS patterns**

## 📹 Video Explanation

[Project Overview Video](https://drive.google.com/file/d/1E1wE3s7IIRs916_FnhNzop3zVJBNTrig/view?usp=sharing)

