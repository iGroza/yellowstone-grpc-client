# Yellowstone Geyser gRPC Client

A fully-typed TypeScript client for the Solana Yellowstone Geyser gRPC service, providing real-time access to Solana blockchain data with complete type safety and `@solana/web3.js` compatibility.

## Installation

```bash
npm install @igroza/yellowstone-grpc-client
```

## Proto Files

Copy the gRPC proto files to your project's `proto` folder:

```bash
cp ./node_modules/@igroza/yellowstone-grpc-client/proto/* ./proto/
```

This will copy the required `.proto` files (`geyser.proto` and `solana-storage.proto`) to your project for gRPC connection.

## Quick Start

```typescript
import { YellowstoneGeyserClient, CommitmentLevel, TransactionFormatter } from '@igroza/yellowstone-grpc-client';

// Create client
const client = new YellowstoneGeyserClient({
  endpoint: 'grpc-url.com:10101'
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
    console.log('New transaction:', formattedTx.transaction.signatures[0]);
  }
});
```

## API Reference

### YellowstoneGeyserClient

#### Constructor

```typescript
const client = new YellowstoneGeyserClient(config: YellowstoneGeyserClientConfig);
```

**Configuration:**
```typescript
interface YellowstoneGeyserClientConfig {
  endpoint: string;              // gRPC endpoint
  credentials?: string;          // Optional authentication token (added to 'x-token' header)
  options?: grpc.ChannelOptions; // Optional gRPC channel options
}
```

**Example with authentication:**
```typescript
const client = new YellowstoneGeyserClient({
  endpoint: 'grpc-url.com:10101',
  credentials: 'your-api-token-here'
});
```

#### Methods

##### `connect(): Promise<void>`
Establishes connection to the gRPC server with a 10-second timeout.

```typescript
await client.connect();
```

##### `subscribe(request: SubscribeRequest, options?: grpc.CallOptions)`
Creates a bidirectional streaming subscription.

```typescript
const stream = client.subscribe({
  transactions: { 'filter': { vote: false } },
  commitment: CommitmentLevel.PROCESSED
});
```

##### `createSubscription(request, onData, onError?, onEnd?)`
Helper method that creates a subscription with automatic error handling.

```typescript
const stream = client.createSubscription(
  request,
  (update) => console.log('Update:', update),
  (error) => console.error('Error:', error),
  () => console.log('Stream ended')
);
```

##### `getVersion(): Promise<GetVersionResponse>`
Retrieves the Geyser server version information.

```typescript
const version = await client.getVersion();
console.log('Version:', version.version);
```

##### `getSlot(request?: GetSlotRequest): Promise<GetSlotResponse>`
Gets the current slot number.

```typescript
const slot = await client.getSlot();
console.log('Current slot:', slot.slot);
```

##### `getBlockHeight(request?: GetBlockHeightRequest): Promise<GetBlockHeightResponse>`
Gets the current block height.

```typescript
const blockHeight = await client.getBlockHeight();
console.log('Block height:', blockHeight.block_height);
```

##### `getLatestBlockhash(request?: GetLatestBlockhashRequest): Promise<GetLatestBlockhashResponse>`
Gets the latest blockhash.

```typescript
const { blockhash, slot, last_valid_block_height } = await client.getLatestBlockhash();
```

##### `isBlockhashValid(request: IsBlockhashValidRequest): Promise<IsBlockhashValidResponse>`
Checks if a blockhash is still valid.

```typescript
const { valid } = await client.isBlockhashValid({ blockhash: 'your-blockhash' });
```

##### `ping(request: PingRequest): Promise<PongResponse>`
Sends a ping to test connectivity.

```typescript
const response = await client.ping({ count: 1 });
```

##### `sendPing(stream, id: number): void`
Sends a ping through an existing subscription stream.

```typescript
client.sendPing(stream, Date.now());
```

##### `close(): void`
Closes the gRPC client connection.

```typescript
client.close();
```

### Events

The client extends `EventEmitter` and emits the following events:

```typescript
client.on('initialized', () => console.log('Client initialized'));
client.on('connected', () => console.log('Connected to server'));
client.on('subscribed', (request) => console.log('Subscription created'));
client.on('error', (error) => console.error('Client error:', error));
client.on('stream-ended', () => console.log('Stream ended'));
client.on('closed', () => console.log('Client closed'));
client.on('status', (status) => console.log('Status:', status));
```

## Subscription Types

### Account Subscriptions

Subscribe to account updates with flexible filtering options.

```typescript
const stream = client.subscribe({
  accounts: {
    'my_accounts': {
      account: ['AccountPubkey1', 'AccountPubkey2'], // Specific accounts
      owner: ['ProgramId1', 'ProgramId2'],           // Accounts owned by programs
      filters: [
        { memcmp: { offset: 0, base58: 'SomeData' } }, // Memory comparison
        { datasize: 165 },                             // Account data size
        { token_account_state: true },                 // Token account filter
        { lamports: { gt: 1000000 } }                  // Lamport balance filter
      ],
      nonempty_txn_signature: true                     // Only accounts with txn signature
    }
  },
  commitment: CommitmentLevel.CONFIRMED
});

stream.on('data', (update) => {
  if (update.account) {
    const { account, slot, is_startup } = update.account;
    console.log('Account updated:', {
      pubkey: Buffer.from(account.pubkey).toString('base64'),
      lamports: account.lamports,
      owner: Buffer.from(account.owner).toString('base64'),
      slot: slot
    });
  }
});
```

### Transaction Subscriptions

Subscribe to transactions with account and vote filtering.

```typescript
const stream = client.subscribe({
  transactions: {
    'my_transactions': {
      vote: false,                                    // Exclude vote transactions
      failed: false,                                  // Exclude failed transactions
      signature: 'specific-signature',                // Filter by specific signature
      account_include: ['Account1', 'Account2'],      // Include txs involving these accounts
      account_exclude: ['Account3'],                  // Exclude txs involving these accounts
      account_required: ['Account4']                  // Only txs with these accounts
    }
  },
  commitment: CommitmentLevel.PROCESSED,
  from_slot: 100000000                                // Start from specific slot
});

stream.on('data', (update) => {
  if (update.transaction) {
    const tx = TransactionFormatter.formTransactionFromJson(update);
    console.log('Transaction:', {
      signature: tx.transaction.signatures[0],
      slot: tx.slot,
      success: tx.meta?.err === null
    });
  }
});
```

### Slot Subscriptions

Subscribe to slot status updates.

```typescript
const stream = client.subscribe({
  slots: {
    'my_slots': {
      filter_by_commitment: true,  // Filter by commitment level
      interslot_updates: true      // Include intermediate slot updates
    }
  },
  commitment: CommitmentLevel.FINALIZED
});

stream.on('data', (update) => {
  if (update.slot) {
    console.log('Slot update:', {
      slot: update.slot.slot,
      parent: update.slot.parent,
      status: update.slot.status // PROCESSED, CONFIRMED, FINALIZED, etc.
    });
  }
});
```

### Block Subscriptions

Subscribe to complete block data.

```typescript
const stream = client.subscribe({
  blocks: {
    'my_blocks': {
      account_include: ['AccountToMonitor'],
      include_transactions: true,  // Include full transaction data
      include_accounts: true,      // Include account updates
      include_entries: true        // Include entry data
    }
  },
  commitment: CommitmentLevel.CONFIRMED
});

stream.on('data', (update) => {
  if (update.block) {
    const block = update.block;
    console.log('Block:', {
      slot: block.slot,
      blockhash: block.blockhash,
      transactions: block.executed_transaction_count,
      accounts: block.updated_account_count
    });
  }
});
```

### Block Meta Subscriptions

Subscribe to lightweight block metadata (without full transaction/account data).

```typescript
const stream = client.subscribe({
  blocks_meta: {
    'my_block_meta': {}
  },
  commitment: CommitmentLevel.FINALIZED
});

stream.on('data', (update) => {
  if (update.block_meta) {
    console.log('Block meta:', {
      slot: update.block_meta.slot,
      blockhash: update.block_meta.blockhash,
      parent_slot: update.block_meta.parent_slot
    });
  }
});
```

### Entry Subscriptions

Subscribe to entry updates.

```typescript
const stream = client.subscribe({
  entry: {
    'my_entries': {}
  }
});

stream.on('data', (update) => {
  if (update.entry) {
    console.log('Entry:', {
      slot: update.entry.slot,
      index: update.entry.index,
      num_hashes: update.entry.num_hashes
    });
  }
});
```

### Transaction Status Subscriptions

Subscribe to lightweight transaction status updates (without full transaction data).

```typescript
const stream = client.subscribe({
  transactions_status: {
    'my_tx_status': {
      vote: false,
      failed: false
    }
  }
});

stream.on('data', (update) => {
  if (update.transaction_status) {
    console.log('Transaction status:', {
      signature: Buffer.from(update.transaction_status.signature).toString('hex'),
      slot: update.transaction_status.slot,
      has_error: !!update.transaction_status.err
    });
  }
});
```

## TransactionFormatter

The `TransactionFormatter` utility converts raw Yellowstone Geyser transaction data into Solana web3.js compatible `VersionedTransactionResponse` format.

### Usage

```typescript
import { TransactionFormatter } from '@igroza/yellowstone-grpc-client';

stream.on('data', (update) => {
  if (update.transaction) {
    const formattedTx = TransactionFormatter.formTransactionFromJson(update);
    
    // Access transaction properties
    console.log('Signature:', formattedTx.transaction.signatures[0]);
    console.log('Slot:', formattedTx.slot);
    console.log('Version:', formattedTx.version); // 'legacy' or 0
    console.log('Block Time:', new Date(formattedTx.blockTime));
    
    // Access transaction metadata
    console.log('Fee:', formattedTx.meta.fee);
    console.log('Success:', formattedTx.meta.err === null);
    console.log('Logs:', formattedTx.meta.logMessages);
    console.log('Pre Balances:', formattedTx.meta.preBalances);
    console.log('Post Balances:', formattedTx.meta.postBalances);
    console.log('Token Balances:', formattedTx.meta.postTokenBalances);
    
    // Access message and instructions
    console.log('Instructions:', formattedTx.transaction.message.compiledInstructions);
  }
});
```

## Update Types

When handling stream data, check the `update_oneof` field to determine the update type:

```typescript
import { UpdateType } from '@igroza/yellowstone-grpc-client';

stream.on('data', (update) => {
  switch (update.update_oneof) {
    case UpdateType.ACCOUNT:
      // Handle account update
      console.log('Account:', update.account);
      break;
    
    case UpdateType.TRANSACTION:
      // Handle transaction update
      const tx = TransactionFormatter.formTransactionFromJson(update);
      console.log('Transaction:', tx);
      break;
    
    case UpdateType.SLOT:
      // Handle slot update
      console.log('Slot:', update.slot);
      break;
    
    case UpdateType.BLOCK:
      // Handle block update
      console.log('Block:', update.block);
      break;
    
    case UpdateType.BLOCK_META:
      // Handle block meta update
      console.log('Block Meta:', update.block_meta);
      break;
    
    case UpdateType.ENTRY:
      // Handle entry update
      console.log('Entry:', update.entry);
      break;
    
    case UpdateType.TRANSACTION_STATUS:
      // Handle transaction status update
      console.log('Tx Status:', update.transaction_status);
      break;
    
    case UpdateType.PING:
      console.log('Ping received');
      break;
    
    case UpdateType.PONG:
      console.log('Pong received:', update.pong?.id);
      break;
  }
});
```

## Advanced Filtering

### Memory Comparison (memcmp)

Filter accounts by comparing bytes at specific offsets:

```typescript
{
  accounts: {
    'token_accounts': {
      owner: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'],
      filters: [
        {
          memcmp: {
            offset: 32,  // Check bytes at offset 32
            base58: 'YourMintAddressHere' // Match this base58 value
          }
        }
      ]
    }
  }
}
```

### Data Size Filter

Filter accounts by data size:

```typescript
{
  accounts: {
    'token_accounts': {
      filters: [
        { datasize: 165 } // Standard token account size
      ]
    }
  }
}
```

### Lamports Filter

Filter accounts by lamport balance:

```typescript
{
  accounts: {
    'funded_accounts': {
      filters: [
        { lamports: { gt: 1000000 } }  // Greater than 1 SOL
        // Also available: eq, ne, lt
      ]
    }
  }
}
```

### Account Data Slicing

Receive only specific portions of account data to reduce bandwidth:

```typescript
{
  accounts: {
    'large_accounts': {
      account: ['LargeAccountPubkey']
    }
  },
  accounts_data_slice: [
    { offset: 0, length: 32 },   // Get first 32 bytes
    { offset: 64, length: 8 }    // Get 8 bytes at offset 64
  ]
}
```

## Commitment Levels

```typescript
enum CommitmentLevel {
  PROCESSED = 0,  // Fastest, may be rolled back
  CONFIRMED = 1,  // Confirmed by supermajority, may be rolled back
  FINALIZED = 2   // Finalized, cannot be rolled back
}
```

## Slot Status

```typescript
enum SlotStatus {
  SLOT_PROCESSED = 0,
  SLOT_CONFIRMED = 1,
  SLOT_FINALIZED = 2,
  SLOT_FIRST_SHRED_RECEIVED = 3,
  SLOT_COMPLETED = 4,
  SLOT_CREATED_BANK = 5,
  SLOT_DEAD = 6
}
```

## Error Handling

### Stream Errors

```typescript
stream.on('error', (error) => {
  console.error('Stream error:', error.message);
  
  // Handle specific gRPC error codes
  switch (error.code) {
    case 14: // UNAVAILABLE
      console.log('Server unavailable - attempting reconnection...');
      break;
    case 4: // DEADLINE_EXCEEDED
      console.log('Deadline exceeded');
      break;
    case 13: // INTERNAL
      console.log('Internal server error');
      break;
  }
});
```

### Client Errors

```typescript
client.on('error', (error) => {
  console.error('Client error:', error);
});
```

### Graceful Shutdown

```typescript
process.on('SIGINT', () => {
  console.log('Shutting down...');
  client.close();
  process.exit(0);
});
```

## Practical Examples

### Monitor Token Transactions

```typescript
import { YellowstoneGeyserClient, CommitmentLevel, TransactionFormatter } from '@igroza/yellowstone-grpc-client';

const client = new YellowstoneGeyserClient({
  endpoint: 'grpc-url.com:10101'
});

await client.connect();

const stream = client.subscribe({
  transactions: {
    'token_transfers': {
      vote: false,
      failed: false,
      account_include: ['TokenProgramId', 'YourTokenMint']
    }
  },
  commitment: CommitmentLevel.CONFIRMED
});

stream.on('data', (update) => {
  if (update.transaction) {
    const tx = TransactionFormatter.formTransactionFromJson(update);
    console.log('Token transaction:', {
      signature: tx.transaction.signatures[0],
      slot: tx.slot,
      fee: tx.meta.fee,
      success: tx.meta.err === null,
      tokenBalances: tx.meta.postTokenBalances
    });
  }
});
```

### Monitor Wallet Changes

```typescript
const stream = client.subscribe({
  accounts: {
    'wallet_monitor': {
      account: ['YourWalletAddress']
    }
  },
  transactions: {
    'wallet_txs': {
      vote: false,
      account_include: ['YourWalletAddress']
    }
  },
  commitment: CommitmentLevel.PROCESSED
});

stream.on('data', (update) => {
  if (update.account) {
    console.log('Balance changed:', {
      lamports: update.account.account.lamports,
      slot: update.account.slot
    });
  }
  
  if (update.transaction) {
    const tx = TransactionFormatter.formTransactionFromJson(update);
    console.log('Wallet transaction:', tx.transaction.signatures[0]);
  }
});
```

### Track Program Accounts

```typescript
const stream = client.subscribe({
  accounts: {
    'program_accounts': {
      owner: ['YourProgramId'],
      filters: [
        { 
          memcmp: { 
            offset: 0, 
            base58: 'DiscriminatorValue' 
          } 
        }
      ]
    }
  }
});

stream.on('data', (update) => {
  if (update.account) {
    const account = update.account.account;
    console.log('Program account updated:', {
      pubkey: Buffer.from(account.pubkey).toString('base64'),
      data: Buffer.from(account.data).toString('base64')
    });
  }
});
```

### Monitor Blocks

```typescript
const stream = client.subscribe({
  blocks_meta: {
    'block_tracker': {}
  },
  commitment: CommitmentLevel.FINALIZED
});

stream.on('data', (update) => {
  if (update.block_meta) {
    console.log('New finalized block:', {
      slot: update.block_meta.slot,
      blockhash: update.block_meta.blockhash,
      height: update.block_meta.block_height?.block_height,
      transactions: update.block_meta.executed_transaction_count,
      time: new Date(update.block_meta.block_time?.timestamp * 1000)
    });
  }
});
```

### Ping/Pong Keepalive

```typescript
const PING_INTERVAL = 30000; // 30 seconds
let lastPing = Date.now();

stream.on('data', (update) => {
  // Send periodic pings to keep connection alive
  const now = Date.now();
  if (now - lastPing > PING_INTERVAL) {
    client.sendPing(stream, Math.floor(now / 1000));
    lastPing = now;
  }
  
  if (update.pong) {
    console.log('Pong received:', update.pong.id);
  }
});
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run example
npm run example
```

## Proto Files Reference

The client is based on two proto files:

- **geyser.proto** - Main gRPC service definition with subscription and RPC methods
- **solana-storage.proto** - Solana transaction and block data structures

These files define the complete interface for the Yellowstone Geyser service.

## TypeScript Support

All types are fully defined and exported:

```typescript
import {
  YellowstoneGeyserClient,
  CommitmentLevel,
  SlotStatus,
  UpdateType,
  SubscribeRequest,
  SubscribeUpdate,
  SubscribeUpdateAccount,
  SubscribeUpdateTransaction,
  SubscribeUpdateSlot,
  SubscribeUpdateBlock,
  TransactionFormatter,
} from '@igroza/yellowstone-grpc-client';
```

## License

MIT
