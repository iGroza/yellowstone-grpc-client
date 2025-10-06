# Yellowstone Geyser gRPC Client

A TypeScript client for the Solana Yellowstone Geyser gRPC service, providing real-time access to Solana blockchain data with full type safety.

## Installation

```bash
npm install @igroza/yellowstone-grpc-client
```

## Proto Files

Copy the gRPC proto files to your project's `proto` folder:

```bash
cp ./node_modules/@igroza/yellowstone-grpc-client/proto/* ./proto/
```

This will copy the required `.proto` files (`geyser.proto` and `solana-storage.proto`) to your project for gRPC code generation.

## Quick Start

```typescript
import { YellowstoneGeyserClient, CommitmentLevel, TransactionFormatter } from '@igroza/yellowstone-grpc-client';

// Create client
const client = new YellowstoneGeyserClient({
  endpoint: 'http://grpc-url.com:10101'
});

// Connect to server
await client.connect();

// Subscribe to transactions
const stream = client.subscribe({
  transactions: {
    'my_filter': {
      vote: false,
      failed: false,
      account_include: ['YourAccountAddressHere']
    }
  },
  commitment: CommitmentLevel.PROCESSED
});

// Handle updates
stream.on('data', (update) => {
  if (update.transaction) {
    // Convert raw transaction to Solana web3.js format
    const formattedTx = TransactionFormatter.formTransactionFromJson(update);
    console.log('New transaction:', formattedTx);
  }
});
```

## TransactionFormatter

The `TransactionFormatter` utility converts raw Yellowstone Geyser transaction data into Solana web3.js compatible format.

### Usage

```typescript
import { TransactionFormatter } from '@igroza/yellowstone-grpc-client';

// Convert raw transaction data
const formattedTransaction = TransactionFormatter.formTransactionFromJson(update);

// Access transaction properties
console.log('Slot:', formattedTransaction.slot);
console.log('Signatures:', formattedTransaction.transaction.signatures);
console.log('Meta:', formattedTransaction.meta);
console.log('Block Time:', new Date(formattedTransaction.blockTime));
```

### Features

- Converts raw gRPC data to `VersionedTransactionResponse` format
- Handles both legacy and versioned transactions
- Properly formats transaction metadata, balances, and instructions
- Compatible with Solana web3.js ecosystem

## Subscription Types

### Account Subscriptions
```typescript
const stream = client.subscribe({
  accounts: {
    'filter_name': {
      account: ['AccountAddress1', 'AccountAddress2'],
      owner: ['ProgramId1', 'ProgramId2'],
      filters: [
        { memcmp: { offset: 0, base58: 'SomeData' } },
        { datasize: 64 }
      ]
    }
  }
});
```

### Transaction Subscriptions
```typescript
const stream = client.subscribe({
  transactions: {
    'filter_name': {
      vote: false,
      failed: false,
      account_include: ['AccountAddress1'],
      account_exclude: ['AccountAddress2']
    }
  }
});
```

### Block Subscriptions
```typescript
const stream = client.subscribe({
  blocks: {
    'filter_name': {
      include_transactions: true,
      include_accounts: true
    }
  }
});
```

## Examples

### Monitor Token Transactions

```typescript
const stream = client.subscribe({
  transactions: {
    'token_monitor': {
      vote: false,
      failed: false,
      account_include: ['YourTokenMintAddress']
    }
  },
  commitment: CommitmentLevel.PROCESSED
});

stream.on('data', (update) => {
  if (update.transaction) {
    const tx = TransactionFormatter.formTransactionFromJson(update);
    console.log('Token transaction:', {
      signature: tx.transaction.signatures[0],
      slot: tx.slot,
      fee: tx.meta.fee
    });
  }
});
```

### Monitor Account Changes

```typescript
const stream = client.subscribe({
  accounts: {
    'wallet_monitor': {
      account: ['YourWalletAddress'],
      filters: [{ datasize: 165 }] // Token account size
    }
  }
});

stream.on('data', (update) => {
  if (update.account) {
    console.log('Account update:', {
      pubkey: Buffer.from(update.account.account.pubkey).toString('base58'),
      lamports: update.account.account.lamports,
      slot: update.account.slot
    });
  }
});
```

## Error Handling

```typescript
stream.on('error', (error) => {
  console.error('Stream error:', error.message);
  
  if (error.code === 14) { // UNAVAILABLE
    console.log('Server unavailable - attempting reconnection...');
  }
});
```

## Commitment Levels

- `PROCESSED` - Fastest, may be rolled back
- `CONFIRMED` - Confirmed by supermajority, may be rolled back  
- `FINALIZED` - Finalized, cannot be rolled back

## Development

```bash
npm run build    # Build the project
npm run example  # Run example
```

## License

MIT
