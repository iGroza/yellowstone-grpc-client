import {
  CommitmentLevel,
  ServiceError,
  SubscribeRequest,
  SubscribeUpdate,
  SubscribeUpdateAccount,
  SubscribeUpdateBlock,
  SubscribeUpdateBlockMeta,
  SubscribeUpdateEntry,
  SubscribeUpdateSlot,
  SubscribeUpdateTransactionStatus,
  TransactionFormatter,
  UpdateType,
  YellowstoneGeyserClient,
} from '../dist';

// Simple test to verify the client can be instantiated and basic methods work
async function testClient() {
  console.log('🚀 Testing Yellowstone Geyser gRPC Client...\n');

  const config = {
    endpoint: 'grpc-url.com:10101',
  };

  try {
    // Test client creation
    console.log('📦 Creating client instance...');
    const client = new YellowstoneGeyserClient(config);
    const version = await client.getVersion();
    console.log('\n🔍 Client version:', JSON.stringify(JSON.parse(version.version), null, 2));
    
    const slot = await client.getSlot();
    console.log('\n🎰 Client slot:', JSON.stringify(slot, null, 2));

    const blockHeight = await client.getBlockHeight();
    console.log('\n⬆️ Client block height:', JSON.stringify(blockHeight, null, 2));

    const latestBlockhash = await client.getLatestBlockhash();
    console.log('\n#️⃣ Client latest blockhash:', JSON.stringify(latestBlockhash, null, 2));

    const isBlockhashValid = await client.isBlockhashValid({blockhash: latestBlockhash.blockhash});
    console.log('\n✅ Client is blockhash valid:', JSON.stringify(isBlockhashValid, null, 2));
    
    // Set up client event listeners
    client.on('error', (error: ServiceError) => {
      console.error('❌ Client error:', error.message);
    });

    client.on('connected', () => {
      console.log('🔗 Client connected event received');
    });

    // Subscribe request configuration
    const req: SubscribeRequest = {
      // accounts: {},
      // slots: {},
      transactions: {
        client: {
          vote: false,
          failed: false,
          account_include: [
            'LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj',
            '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
          ],
          account_exclude: [],
          account_required: [],
        },
      },
      // transactions_status: {},
      // entry: {},
      // blocks: {},
      // blocks_meta: {},
      commitment: CommitmentLevel.PROCESSED,
      // accounts_data_slice: [],
      // ping: undefined,
      // from_slot: 371437450, // Uncomment to start from specific slot
    };

    // Connect to server with timeout handling
    console.log('🔌 Connecting to server...');
    const connectTimeout = setTimeout(() => {
      console.error('❌ Connection timeout after 10 seconds');
      process.exit(1);
    }, 10000);

    await client.connect();
    clearTimeout(connectTimeout);
    console.log('✅ Connected to server\n');

    // Create subscription with proper error handling
    console.log('📡 Starting subscription...');

    

    let updateCount = 0;

    const onData = (update: SubscribeUpdate) => {
      updateCount++;

      // Handle different update types
      switch (update.update_oneof) {
        case UpdateType.PING:
          console.log('📍 Ping received');
          client.sendPing(client.getCurrentStream()!, Math.floor(Date.now() / 1000));
          break;

        case UpdateType.PONG:
          console.log('📍 Pong received:', update.pong);
          break;

        case UpdateType.SLOT: {
          const slotUpdate = update.slot as SubscribeUpdateSlot;
          console.log(`🎰 Slot Update #${updateCount}:`, {
            slot: slotUpdate?.slot,
            status: SlotStatusToString(slotUpdate?.status),
            parent: slotUpdate?.parent,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
        }

        case UpdateType.TRANSACTION: {
          const versionedTransaction =
            TransactionFormatter.formTransactionFromJson(update);
          const signature = versionedTransaction.transaction.signatures[0];

          console.log(`💳 Transaction Update #${updateCount}:`, {
            signature,
            slot: versionedTransaction.slot,
            filters: update.filters,
            blockTime: versionedTransaction.blockTime,
          });
          break;
        }

        case UpdateType.ACCOUNT: {
          const accountUpdate = update.account as SubscribeUpdateAccount;
          const pubkey = accountUpdate?.account?.pubkey
            ? bufferToBase58(accountUpdate.account.pubkey)
            : 'unknown';

          console.log(`👤 Account Update #${updateCount}:`, {
            pubkey: pubkey.substring(0, 20) + '...',
            lamports: accountUpdate?.account?.lamports,
            slot: accountUpdate?.slot,
            isStartup: accountUpdate?.is_startup,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
        }

        case UpdateType.BLOCK: {
          const blockUpdate = update.block as SubscribeUpdateBlock;
          console.log(`🧱 Block Update #${updateCount}:`, {
            slot: blockUpdate?.slot,
            blockhash: blockUpdate?.blockhash,
            transactionCount: blockUpdate?.executed_transaction_count,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
        }

        case UpdateType.BLOCK_META: {
          const blockMetaUpdate = update.block_meta as SubscribeUpdateBlockMeta;
          console.log(`📋 Block Meta Update #${updateCount}:`, {
            slot: blockMetaUpdate?.slot,
            blockhash: blockMetaUpdate?.blockhash,
            transactionCount: blockMetaUpdate?.executed_transaction_count,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
        }

        case UpdateType.ENTRY: {
          const entryUpdate = update.entry as SubscribeUpdateEntry;
          console.log(`📝 Entry Update #${updateCount}:`, {
            slot: entryUpdate?.slot,
            index: entryUpdate?.index,
            transactionCount: entryUpdate?.executed_transaction_count,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
        }

        case UpdateType.TRANSACTION_STATUS: {
          const transactionStatusUpdate =
            update.transaction_status as SubscribeUpdateTransactionStatus;
          console.log(`📊 Transaction Status Update #${updateCount}:`, {
            slot: transactionStatusUpdate?.slot,
            signature: bufferToHex(
              transactionStatusUpdate?.signature || new Uint8Array(),
            ),
            isVote: transactionStatusUpdate?.is_vote,
            hasError: !!transactionStatusUpdate?.err,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
        }

        default:
          console.log(`📦 Update #${updateCount} (${update.update_oneof}):`, {
            type: update.update_oneof,
            filters: update.filters,
            timestamp: formatTimestamp(update.created_at),
          });
          break;
      }
    }

    const onError = (error: ServiceError) => {
      console.error('\n❌ Stream error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      // Handle specific error codes
      if (error.code === 14) {
        // UNAVAILABLE
        console.error('⚠️  Server unavailable - connection lost');
      } else if (error.code === 4) {
        // DEADLINE_EXCEEDED
        console.error('⚠️  Deadline exceeded');
      }
    };

    const onEnd = () => {
      console.log('\n📪 Stream ended gracefully');
      console.log(`📊 Total updates received: ${updateCount}`);
    };

    const stream = client.createSubscription(req, 
      onData,
      onError,
      onEnd
    );

    console.log('✅ Subscription started, waiting for updates...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Keep alive loop with graceful shutdown handling
    const keepAlive = async () => {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⚠️  Shutting down gracefully...');
      if (client) {
        client.close();
      }
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    await keepAlive();
  } catch (error: any) {
    console.error('\n❌ Test failed:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });

    process.exit(1);
  }
}

// Helper functions
function bufferToHex(buffer: Uint8Array | Buffer): string {
  return Buffer.from(buffer).toString('hex');
}

function bufferToBase58(buffer: Uint8Array | Buffer): string {
  // Simple base58 encoding (you might want to use a proper library)
  return Buffer.from(buffer).toString('base64');
}

function formatTimestamp(timestamp?: {seconds: number; nanos: number}): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanos / 1000000);
  return date.toISOString();
}

function SlotStatusToString(status?: number): string {
  const statusMap: {[key: number]: string} = {
    0: 'PROCESSED',
    1: 'CONFIRMED',
    2: 'FINALIZED',
    3: 'FIRST_SHRED_RECEIVED',
    4: 'COMPLETED',
    5: 'CREATED_BANK',
    6: 'DEAD',
  };
  return status !== undefined
    ? statusMap[status] || `Unknown(${status})`
    : 'N/A';
}

// Run the test
if (require.main === module) {
  testClient().catch(console.error);
}

export { testClient };

