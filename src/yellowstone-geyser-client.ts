import {EventEmitter} from 'events';
import * as path from 'path';

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Solana Storage Types (from solana-storage.proto)
export interface ConfirmedBlock {
  previous_blockhash: string;
  blockhash: string;
  parent_slot: number;
  transactions: ConfirmedTransaction[];
  rewards: Reward[];
  block_time: UnixTimestamp;
  block_height: BlockHeight;
  num_partitions: NumPartitions;
}

export interface ConfirmedTransaction {
  transaction: Transaction;
  meta: TransactionStatusMeta;
}

export interface Transaction {
  signatures: Uint8Array[];
  message: Message;
}

export interface Message {
  header: MessageHeader;
  account_keys: Uint8Array[];
  recent_blockhash: Uint8Array;
  instructions: CompiledInstruction[];
  versioned: boolean;
  address_table_lookups: MessageAddressTableLookup[];
}

export interface MessageHeader {
  num_required_signatures: number;
  num_readonly_signed_accounts: number;
  num_readonly_unsigned_accounts: number;
}

export interface MessageAddressTableLookup {
  account_key: Uint8Array;
  writable_indexes: Uint8Array;
  readonly_indexes: Uint8Array;
}

export interface TransactionStatusMeta {
  err: TransactionError | null;
  fee: number;
  pre_balances: number[];
  post_balances: number[];
  inner_instructions: InnerInstructions[];
  inner_instructions_none: boolean;
  log_messages: string[];
  log_messages_none: boolean;
  pre_token_balances: TokenBalance[];
  post_token_balances: TokenBalance[];
  rewards: Reward[];
  loaded_writable_addresses: Uint8Array[];
  loaded_readonly_addresses: Uint8Array[];
  return_data: ReturnData | null;
  return_data_none: boolean;
  compute_units_consumed?: number;
  cost_units?: number;
}

export interface TransactionError {
  err: Uint8Array;
}

export interface InnerInstructions {
  index: number;
  instructions: InnerInstruction[];
}

export interface InnerInstruction {
  program_id_index: number;
  accounts: Uint8Array;
  data: Uint8Array;
  stack_height?: number;
}

export interface CompiledInstruction {
  program_id_index: number;
  accounts: Uint8Array;
  data: Uint8Array;
}

export interface TokenBalance {
  account_index: number;
  mint: string;
  ui_token_amount: UiTokenAmount;
  owner: string;
  program_id: string;
}

export interface UiTokenAmount {
  ui_amount: number;
  decimals: number;
  amount: string;
  ui_amount_string: string;
}

export interface ReturnData {
  program_id: Uint8Array;
  data: Uint8Array;
}

export enum RewardType {
  UNSPECIFIED = 0,
  FEE = 1,
  RENT = 2,
  STAKING = 3,
  VOTING = 4,
}

export interface Reward {
  pubkey: string;
  lamports: number;
  post_balance: number;
  reward_type: RewardType;
  commission: string;
}

export interface Rewards {
  rewards: Reward[];
  num_partitions: NumPartitions;
}

export interface UnixTimestamp {
  timestamp: number;
}

export interface BlockHeight {
  block_height: number;
}

export interface NumPartitions {
  num_partitions: number;
}

// Type definitions for the gRPC service and messages
export interface YellowstoneGeyserClient {
  subscribe(
    request: SubscribeRequest,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate>;

  subscribeReplayInfo(
    request: SubscribeReplayInfoRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: SubscribeReplayInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;

  ping(
    request: PingRequest,
    callback: (error: grpc.ServiceError | null, response: PongResponse) => void,
  ): grpc.ClientUnaryCall;

  getLatestBlockhash(
    request: GetLatestBlockhashRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetLatestBlockhashResponse,
    ) => void,
  ): grpc.ClientUnaryCall;

  getBlockHeight(
    request: GetBlockHeightRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetBlockHeightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;

  getSlot(
    request: GetSlotRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetSlotResponse,
    ) => void,
  ): grpc.ClientUnaryCall;

  isBlockhashValid(
    request: IsBlockhashValidRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: IsBlockhashValidResponse,
    ) => void,
  ): grpc.ClientUnaryCall;

  getVersion(
    request: GetVersionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetVersionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
}

// Enums
export enum CommitmentLevel {
  PROCESSED = 0,
  CONFIRMED = 1,
  FINALIZED = 2,
}

export enum SlotStatus {
  SLOT_PROCESSED = 0,
  SLOT_CONFIRMED = 1,
  SLOT_FINALIZED = 2,
  SLOT_FIRST_SHRED_RECEIVED = 3,
  SLOT_COMPLETED = 4,
  SLOT_CREATED_BANK = 5,
  SLOT_DEAD = 6,
}

export enum UpdateType {
  ACCOUNT = 'account',
  SLOT = 'slot',
  TRANSACTION = 'transaction',
  TRANSACTION_STATUS = 'transaction_status',
  BLOCK = 'block',
  PING = 'ping',
  PONG = 'pong',
  BLOCK_META = 'block_meta',
  ENTRY = 'entry',
}

// Request/Response message interfaces
export interface SubscribeRequest {
  accounts?: {[key: string]: SubscribeRequestFilterAccounts};
  slots?: {[key: string]: SubscribeRequestFilterSlots};
  transactions?: {[key: string]: SubscribeRequestFilterTransactions};
  transactions_status?: {[key: string]: SubscribeRequestFilterTransactions};
  blocks?: {[key: string]: SubscribeRequestFilterBlocks};
  blocks_meta?: {[key: string]: SubscribeRequestFilterBlocksMeta};
  entry?: {[key: string]: SubscribeRequestFilterEntry};
  commitment?: CommitmentLevel;
  accounts_data_slice?: SubscribeRequestAccountsDataSlice[];
  ping?: SubscribeRequestPing;
  from_slot?: number;
}

export interface SubscribeRequestFilterAccounts {
  account?: string[];
  owner?: string[];
  filters?: SubscribeRequestFilterAccountsFilter[];
  nonempty_txn_signature?: boolean;
}

export interface SubscribeRequestFilterAccountsFilter {
  memcmp?: SubscribeRequestFilterAccountsFilterMemcmp;
  datasize?: number;
  token_account_state?: boolean;
  lamports?: SubscribeRequestFilterAccountsFilterLamports;
}

export interface SubscribeRequestFilterAccountsFilterMemcmp {
  offset: number;
  bytes?: Uint8Array;
  base58?: string;
  base64?: string;
}

export interface SubscribeRequestFilterAccountsFilterLamports {
  eq?: number;
  ne?: number;
  lt?: number;
  gt?: number;
}

export interface SubscribeRequestFilterSlots {
  filter_by_commitment?: boolean;
  interslot_updates?: boolean;
}

export interface SubscribeRequestFilterTransactions {
  vote?: boolean;
  failed?: boolean;
  signature?: string;
  account_include?: string[];
  account_exclude?: string[];
  account_required?: string[];
}

export interface SubscribeRequestFilterBlocks {
  account_include?: string[];
  include_transactions?: boolean;
  include_accounts?: boolean;
  include_entries?: boolean;
}

export interface SubscribeRequestFilterBlocksMeta {}

export interface SubscribeRequestFilterEntry {}

export interface SubscribeRequestAccountsDataSlice {
  offset: number;
  length: number;
}

export interface SubscribeRequestPing {
  id: number;
}

export interface SubscribeUpdate {
  filters?: string[];
  update_oneof?: UpdateType;
  account?: SubscribeUpdateAccount;
  slot?: SubscribeUpdateSlot;
  transaction?: SubscribeUpdateTransaction;
  transaction_status?: SubscribeUpdateTransactionStatus;
  block?: SubscribeUpdateBlock;
  ping?: SubscribeUpdatePing;
  pong?: SubscribeUpdatePong;
  block_meta?: SubscribeUpdateBlockMeta;
  entry?: SubscribeUpdateEntry;
  created_at: {seconds: number; nanos: number};
}

export interface SubscribeUpdateAccount {
  account: SubscribeUpdateAccountInfo;
  slot: number;
  is_startup: boolean;
}

export interface SubscribeUpdateAccountInfo {
  pubkey: Uint8Array;
  lamports: number;
  owner: Uint8Array;
  executable: boolean;
  rent_epoch: number;
  data: Uint8Array;
  write_version: number;
  txn_signature?: Uint8Array;
}

export interface SubscribeUpdateSlot {
  slot: number;
  parent?: number;
  status: SlotStatus;
  dead_error?: string;
}

export interface SubscribeUpdateTransaction {
  transaction: SubscribeUpdateTransactionInfo;
  slot: number;
}

export interface SubscribeUpdateTransactionInfo {
  signature: Uint8Array;
  is_vote: boolean;
  transaction: Transaction;
  meta: TransactionStatusMeta;
  index: number;
}

export interface SubscribeUpdateTransactionStatus {
  slot: number;
  signature: Uint8Array;
  is_vote: boolean;
  index: number;
  err: TransactionError | null;
}

export interface SubscribeUpdateBlock {
  slot: number;
  blockhash: string;
  rewards: Reward[];
  block_time: UnixTimestamp;
  block_height: BlockHeight;
  parent_slot: number;
  parent_blockhash: string;
  executed_transaction_count: number;
  transactions: SubscribeUpdateTransactionInfo[];
  updated_account_count: number;
  accounts: SubscribeUpdateAccountInfo[];
  entries_count: number;
  entries: SubscribeUpdateEntry[];
}

export interface SubscribeUpdateBlockMeta {
  slot: number;
  blockhash: string;
  rewards: Reward[];
  block_time: UnixTimestamp;
  block_height: BlockHeight;
  parent_slot: number;
  parent_blockhash: string;
  executed_transaction_count: number;
  entries_count: number;
}

export interface SubscribeUpdateEntry {
  slot: number;
  index: number;
  num_hashes: number;
  hash: Uint8Array;
  executed_transaction_count: number;
  starting_transaction_index: number;
}

export interface SubscribeUpdatePing {}

export interface SubscribeUpdatePong {
  id: number;
}

// Non-streaming request/response interfaces
export interface SubscribeReplayInfoRequest {}

export interface SubscribeReplayInfoResponse {
  first_available?: number;
}

export interface PingRequest {
  count: number;
}

export interface PongResponse {
  count: number;
}

export interface GetLatestBlockhashRequest {
  commitment?: CommitmentLevel;
}

export interface GetLatestBlockhashResponse {
  slot: number;
  blockhash: string;
  last_valid_block_height: number;
}

export interface GetBlockHeightRequest {
  commitment?: CommitmentLevel;
}

export interface GetBlockHeightResponse {
  block_height: number;
}

export interface GetSlotRequest {
  commitment?: CommitmentLevel;
}

export interface GetSlotResponse {
  slot: number;
}

export interface GetVersionRequest {}

export interface GetVersionResponse {
  version: string;
}

export interface IsBlockhashValidRequest {
  blockhash: string;
  commitment?: CommitmentLevel;
}

export interface IsBlockhashValidResponse {
  slot: number;
  valid: boolean;
}

// Client configuration interface
export interface YellowstoneGeyserClientConfig {
  endpoint: string;
  credentials?: string;
  options?: grpc.ChannelOptions;
}

// Main client class
export class YellowstoneGeyserClient
  extends EventEmitter
  implements YellowstoneGeyserClient
{
  private client: any;
  private readonly config: YellowstoneGeyserClientConfig;
  private grpcObject: any;

  constructor(config: YellowstoneGeyserClientConfig) {
    super();
    this.config = config;
    this.initializeClient(config);
  }

  close(): void {
    try {
      this.client.close();
      this.emit('closed');
    } catch (error) {
      this.emit('error', error);
    }
  }
  // Convenience methods for common operations
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);

      this.client.waitForReady(deadline, (err: Error | null) => {
        if (err) {
          reject(
            new Error(
              `Failed to connect to ${this.config.endpoint}: ${err.message}`,
            ),
          );
        } else {
          this.emit('connected');
          resolve();
        }
      });
    });
  }
  // Helper method to create subscription with error handling
  createSubscription(
    request: SubscribeRequest,
    onData: (update: SubscribeUpdate) => void,
    onError?: (error: Error) => void,
    onEnd?: () => void,
  ): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate> {
    const stream = this.subscribe(request);

    stream.on('data', (update: SubscribeUpdate) => {
      try {
        onData(update);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          this.emit('error', error);
        }
      }
    });

    stream.on('error', (error: Error) => {
      if (onError) {
        onError(error);
      } else {
        this.emit('error', error);
      }
    });

    stream.on('end', () => {
      if (onEnd) {
        onEnd();
      }
      this.emit('stream-ended');
    });

    stream.on('status', (status: grpc.StatusObject) => {
      this.emit('status', status);
    });

    return stream;
  }
  // Helper to gracefully end a stream
  endStream(
    stream: grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
  ): void {
    try {
      stream.end();
    } catch (error) {
      this.emit('error', error);
    }
  }
  getBlockHeight(
    request: GetBlockHeightRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetBlockHeightResponse,
    ) => void,
  ): grpc.ClientUnaryCall {
    return this.client.GetBlockHeight(request, callback);
  }
  getLatestBlockhash(
    request: GetLatestBlockhashRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetLatestBlockhashResponse,
    ) => void,
  ): grpc.ClientUnaryCall {
    return this.client.GetLatestBlockhash(request, callback);
  }

  getSlot(
    request: GetSlotRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetSlotResponse,
    ) => void,
  ): grpc.ClientUnaryCall {
    return this.client.GetSlot(request, callback);
  }
  getVersion(
    request: GetVersionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: GetVersionResponse,
    ) => void,
  ): grpc.ClientUnaryCall {
    return this.client.GetVersion(request, callback);
  }
  private initializeClient(config: YellowstoneGeyserClientConfig): void {
    // Load the proto files
    const geyserProtoPath = path.resolve(
      process.cwd(),
      'proto',
      'geyser.proto',
    );
    const solanaStorageProtoPath = path.resolve(
      process.cwd(),
      'proto',
      'solana-storage.proto',
    );

    const packageDefinition = protoLoader.loadSync(
      [geyserProtoPath, solanaStorageProtoPath],
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [process.cwd()],
      },
    );

    this.grpcObject = grpc.loadPackageDefinition(packageDefinition);
    const geyserPackage = this.grpcObject.geyser;

    const credentials = config.credentials ? grpc.credentials.createFromMetadataGenerator(() => config.credentials) : grpc.credentials.createInsecure();
    
    const options: grpc.ChannelOptions = {
      'grpc.max_receive_message_length': -1,
      'grpc.max_send_message_length': -1,
      'grpc.keepalive_time_ms': 20000,
      'grpc.keepalive_timeout_ms': 10000,
      'grpc.keepalive_permit_without_calls': 1,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.http2.min_time_between_pings_ms': 10000,
      'grpc.http2.min_ping_interval_without_data_ms': 10000,
      'grpc.http2.max_ping_strikes': 0,
      ...config.options,
    };

    this.client = new geyserPackage.Geyser(
      config.endpoint.replace('http://', '').replace('https://', ''),
      credentials,
      options,
    );

    this.emit('initialized');
  }

  isBlockhashValid(
    request: IsBlockhashValidRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: IsBlockhashValidResponse,
    ) => void,
  ): grpc.ClientUnaryCall {
    return this.client.IsBlockhashValid(request, callback);
  }
  ping(
    request: PingRequest,
    callback: (error: grpc.ServiceError | null, response: PongResponse) => void,
  ): grpc.ClientUnaryCall {
    return this.client.Ping(request, callback);
  }

  // Helper to send ping through existing stream
  sendPing(
    stream: grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
    id: number,
  ): void {
    const pingRequest: SubscribeRequest = {
      ping: {id},
    };

    stream.write(pingRequest, (err: Error | null) => {
      if (err) {
        this.emit('error', new Error(`Failed to send ping: ${err.message}`));
      }
    });
  }
  // Streaming method - creates bidirectional stream
  subscribe(
    request: SubscribeRequest,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate> {
    const stream = this.client.Subscribe(options);

    // Write the initial request
    stream.write(request, (err: Error | null) => {
      if (err) {
        this.emit(
          'error',
          new Error(`Failed to write subscribe request: ${err.message}`),
        );
      } else {
        this.emit('subscribed', request);
      }
    });

    return stream;
  }

  subscribeReplayInfo(
    request: SubscribeReplayInfoRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: SubscribeReplayInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall {
    return this.client.SubscribeReplayInfo(request, callback);
  }
}

export default YellowstoneGeyserClient;
