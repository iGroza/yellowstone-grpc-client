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

## Dependency Security

### Production dependencies

These dependencies **will not** be installed in your project, but are included in the release bundle file via [esbuild](https://github.com/igroza/yellowstone-grpc-client/blob/main/build.js).

- [@grpc/grpc-js@1.14.0](https://snyk.io/test/npm/@grpc/grpc-js/1.14.0)
- [@grpc/proto-loader@0.8.0](https://snyk.io/test/npm/@grpc/proto-loader/0.8.0)
- [@solana/web3.js@1.98.4](https://snyk.io/test/npm/@solana/web3.js/1.98.4)
- [bs58@6.0.0](https://snyk.io/test/npm/bs58/6.0.0)

Dependency graph:

![Production dependency graph](https://github.com/igroza/yellowstone-grpc-client/blob/main/img/deps-graph.png?raw=true)

### Development dependencies

These dependencies used for building the package.

- [@typescript-eslint/eslint-plugin@8.32.1](https://snyk.io/test/npm/@typescript-eslint/eslint-plugin/8.32.1)
- [@typescript-eslint/parser@8.32.1](https://snyk.io/test/npm/@typescript-eslint/parser/8.32.1)
- [esbuild@0.25.10](https://snyk.io/test/npm/esbuild/0.25.10)
- [esbuild-plugin-d.ts@1.3.1](https://snyk.io/test/npm/esbuild-plugin-d.ts/1.3.1)
- [eslint@9.27.0](https://snyk.io/test/npm/eslint/9.27.0)
- [eslint-config-prettier@10.1.5](https://snyk.io/test/npm/eslint-config-prettier/10.1.5)
- [eslint-plugin-eslint-comments@3.2.0](https://snyk.io/test/npm/eslint-plugin-eslint-comments/3.2.0)
- [eslint-plugin-import@2.31.0](https://snyk.io/test/npm/eslint-plugin-import/2.31.0)
- [eslint-plugin-prettier@5.4.0](https://snyk.io/test/npm/eslint-plugin-prettier/5.4.0)
- [eslint-plugin-sort-class-members@1.21.0](https://snyk.io/test/npm/eslint-plugin-sort-class-members/1.21.0)
- [prettier@3.6.2](https://snyk.io/test/npm/prettier/3.6.2)
- [ts-proto@2.7.7](https://snyk.io/test/npm/ts-proto/2.7.7)
- [typescript@5.7.3](https://snyk.io/test/npm/typescript/5.7.3)
- [typescript-eslint@8.32.1](https://snyk.io/test/npm/typescript-eslint/8.32.1)

## Quick Start

### Run example from repository

- Clone the repository:

  ```bash
    git clone https://github.com/igroza/yellowstone-grpc-client.git
    cd yellowstone-grpc-client
  ```

- replace `grpc-url.com:10101` with your actual gRPC endpoint in the [example/example.ts](https://github.com/igroza/yellowstone-grpc-client/blob/main/example/example.ts#L22) file

- Install dependencies:

  ```bash
  npm install
  ```

- Run example code:

  ```bash
  npm run example
  ```

### Example code

```typescript
import { YellowstoneGeyserClient, CommitmentLevel, TransactionFormatter } from '@igroza/yellowstone-grpc-client';

// Create client
const client = new YellowstoneGeyserClient({
  endpoint: 'grpc-url.com:10101',
  credentials: 'your-api-token' // optional
});

// Connect to server
await client.connect();

// Subscribe to transactions
const stream = client.createSubscription(
  {
    transactions: {
      'my_filter': {
        vote: false,
        failed: false,
        account_include: ['YourAccountAddressHere']
      }
    },
    commitment: CommitmentLevel.PROCESSED
  },
  (update) => {
    if (update.transaction) {
      const tx = TransactionFormatter.formTransactionFromJson(update);
      console.log('Transaction:', tx.transaction.signatures[0]);
    }
  },
  (error) => console.error('Error:', error),
  () => console.log('Stream ended')
);
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

Establishes connection to the gRPC server.

```typescript
await client.connect();
```

##### `createSubscription(request, onData, onError?, onEnd?)`

Creates a subscription with callback handlers for data, errors, and stream end.

```typescript
const stream = client.createSubscription(
  { transactions: { 'filter': { vote: false } }, commitment: CommitmentLevel.PROCESSED },
  (update) => console.log('Update:', update),
  (error) => console.error('Error:', error),
  () => console.log('Stream ended')
);
```

##### `subscribe(request: SubscribeRequest, options?: grpc.CallOptions)`

Low-level method that creates a bidirectional streaming subscription. Returns a gRPC stream object.

```typescript
const stream = client.subscribe({
  transactions: { 'filter': { vote: false } },
  commitment: CommitmentLevel.PROCESSED
});
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

Sends a ping through an existing subscription stream to keep the connection alive.

```typescript
client.sendPing(stream, Date.now());
```

##### `close(): void`

Closes the gRPC client connection.

```typescript
client.close();
```

## Subscription Types

### Account Subscriptions

Subscribe to account updates with flexible filtering options.

```typescript
client.createSubscription(
  {
    accounts: {
      'my_accounts': {
        account: ['AccountPubkey1', 'AccountPubkey2'],
        owner: ['ProgramId1', 'ProgramId2'],
        filters: [
          { memcmp: { offset: 0, base58: 'SomeData' } },
          { datasize: 165 },
          { token_account_state: true },
          { lamports: { gt: 1000000 } }
        ],
        nonempty_txn_signature: true
      }
    },
    commitment: CommitmentLevel.CONFIRMED
  },
  (update) => {
    if (update.account) {
      const { account, slot } = update.account;
      console.log('Account updated:', {
        pubkey: Buffer.from(account.pubkey).toString('base64'),
        lamports: account.lamports,
        slot: slot
      });
    }
  }
);
```

### Transaction Subscriptions

Subscribe to transactions with filtering options.

```typescript
client.createSubscription(
  {
    transactions: {
      'my_transactions': {
        vote: false,
        failed: false,
        account_include: ['Account1', 'Account2'],
        account_exclude: ['Account3'],
        account_required: ['Account4']
      }
    },
    commitment: CommitmentLevel.PROCESSED,
    from_slot: 100000000
  },
  (update) => {
    if (update.transaction) {
      const tx = TransactionFormatter.formTransactionFromJson(update);
      console.log('Transaction:', {
        signature: tx.transaction.signatures[0],
        slot: tx.slot,
        success: tx.meta?.err === null
      });
    }
  }
);
```

### Slot Subscriptions

Subscribe to slot status updates.

```typescript
client.createSubscription(
  {
    slots: {
      'my_slots': {
        filter_by_commitment: true,
        interslot_updates: true
      }
    },
    commitment: CommitmentLevel.FINALIZED
  },
  (update) => {
    if (update.slot) {
      console.log('Slot:', update.slot.slot, 'Status:', update.slot.status);
    }
  }
);
```

### Block Subscriptions

Subscribe to complete block data.

```typescript
client.createSubscription(
  {
    blocks: {
      'my_blocks': {
        account_include: ['AccountToMonitor'],
        include_transactions: true,
        include_accounts: true,
        include_entries: true
      }
    },
    commitment: CommitmentLevel.CONFIRMED
  },
  (update) => {
    if (update.block) {
      console.log('Block:', update.block.slot, 'Txs:', update.block.executed_transaction_count);
    }
  }
);
```

### Block Meta Subscriptions

Subscribe to lightweight block metadata.

```typescript
client.createSubscription(
  {
    blocks_meta: { 'my_block_meta': {} },
    commitment: CommitmentLevel.FINALIZED
  },
  (update) => {
    if (update.block_meta) {
      console.log('Block:', update.block_meta.slot, update.block_meta.blockhash);
    }
  }
);
```

### Entry Subscriptions

Subscribe to entry updates.

```typescript
client.createSubscription(
  { entry: { 'my_entries': {} } },
  (update) => {
    if (update.entry) {
      console.log('Entry:', update.entry.slot, update.entry.index);
    }
  }
);
```

### Transaction Status Subscriptions

Subscribe to lightweight transaction status updates.

```typescript
client.createSubscription(
  {
    transactions_status: {
      'my_tx_status': {
        vote: false,
        failed: false
      }
    }
  },
  (update) => {
    if (update.transaction_status) {
      console.log('Status:', update.transaction_status.slot);
    }
  }
);
```

## TransactionFormatter

Utility class for converting between Yellowstone transaction data and Solana web3.js compatible formats.

### `formTransactionFromJson(update: SubscribeUpdate): VersionedTransactionResponse`

Converts raw Yellowstone transaction data into Solana web3.js `VersionedTransactionResponse` format.

```typescript
import { TransactionFormatter } from '@igroza/yellowstone-grpc-client';

const tx = TransactionFormatter.formTransactionFromJson(update);
console.log('Signature:', tx.transaction.signatures[0]);
console.log('Fee:', tx.meta.fee);
console.log('Success:', tx.meta.err === null);
console.log('Slot:', tx.slot);
console.log('Block Time:', tx.blockTime);
```

### `toJSON(transaction: VersionedTransactionResponse): any`

Converts a `VersionedTransactionResponse` to plain JSON format for serialization or storage.

```typescript
import { TransactionFormatter } from '@igroza/yellowstone-grpc-client';

const tx = TransactionFormatter.formTransactionFromJson(update);
const json = TransactionFormatter.toJSON(tx);

// Store or transmit as JSON
console.log(JSON.stringify(json, null, 2));

// Save to file or database
fs.writeFileSync('transaction.json', JSON.stringify(json));
```

## Update Types

Check the `update_oneof` field to determine update type:

```typescript
import { UpdateType } from '@igroza/yellowstone-grpc-client';

client.createSubscription(request, (update) => {
  switch (update.update_oneof) {
    case UpdateType.ACCOUNT:
      console.log('Account:', update.account);
      break;
    case UpdateType.TRANSACTION:
      const tx = TransactionFormatter.formTransactionFromJson(update);
      console.log('Transaction:', tx);
      break;
    case UpdateType.SLOT:
      console.log('Slot:', update.slot);
      break;
    case UpdateType.PING:
      client.sendPing(stream, Date.now());
      break;
    case UpdateType.PONG:
      console.log('Pong:', update.pong?.id);
      break;
  }
});
```

## Filtering

### Memory Compare

```typescript
filters: [{ memcmp: { offset: 32, base58: 'YourMintAddress' } }]
```

### Data Size

```typescript
filters: [{ datasize: 165 }]
```

### Lamports

```typescript
filters: [{ lamports: { gt: 1000000 } }] // gt, lt, eq, ne
```

### Data Slicing

```typescript
accounts_data_slice: [{ offset: 0, length: 32 }]
```

## Commitment Levels

```typescript
CommitmentLevel.PROCESSED  // Fastest, may be rolled back
CommitmentLevel.CONFIRMED  // Confirmed by supermajority
CommitmentLevel.FINALIZED  // Finalized, cannot be rolled back
```

## Error Handling

```typescript
client.createSubscription(
  request,
  (update) => { /* handle data */ },
  (error) => {
    console.error('Error:', error.message, error.code);
    // Common codes: 14 (UNAVAILABLE), 4 (DEADLINE_EXCEEDED), 13 (INTERNAL)
  },
  () => console.log('Stream ended')
);

// Graceful shutdown
process.on('SIGINT', () => {
  client.close();
  process.exit(0);
});
```

## Event Handling

The client extends `EventEmitter` and emits various events during its lifecycle. Use the `YellowstoneGeyserClientEvents` enum for type-safe event handling:

```typescript
import { YellowstoneGeyserClient, YellowstoneGeyserClientEvents } from '@igroza/yellowstone-grpc-client';

const client = new YellowstoneGeyserClient({ endpoint: 'grpc-url.com:10101' });

// Listen to lifecycle events
client.on(YellowstoneGeyserClientEvents.INITIALIZED, () => {
  console.log('Client initialized');
});

client.on(YellowstoneGeyserClientEvents.CONNECTED, () => {
  console.log('Connected to server');
});

client.on(YellowstoneGeyserClientEvents.SUBSCRIBED, (request) => {
  console.log('Subscription created:', request);
});

client.on(YellowstoneGeyserClientEvents.ERROR, (error) => {
  console.error('Error occurred:', error);
});

client.on(YellowstoneGeyserClientEvents.STREAM_ENDED, () => {
  console.log('Stream ended');
});

client.on(YellowstoneGeyserClientEvents.CLOSED, () => {
  console.log('Client closed');
});

client.on(YellowstoneGeyserClientEvents.STATUS, (status) => {
  console.log('Status update:', status);
});
```

**Available Events:**

- `INITIALIZED` - Client has been initialized
- `CONNECTED` - Successfully connected to the gRPC server
- `SUBSCRIBED` - Subscription has been created
- `ERROR` - An error occurred
- `STREAM_ENDED` - Subscription stream has ended
- `CLOSED` - Client connection has been closed
- `STATUS` - gRPC status update received

## License

MIT
