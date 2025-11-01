import * as grpc from '@grpc/grpc-js';

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
  err: TransactionError;
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
  return_data: ReturnData;
  return_data_none: boolean;
  compute_units_consumed?: number | undefined;
  cost_units?: number | undefined;
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
  stack_height?: number | undefined;
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
  Unspecified = 0,
  Fee = 1,
  Rent = 2,
  Staking = 3,
  Voting = 4,
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
  block_height: string;
}

export interface NumPartitions {
  num_partitions: number;
}

// Type definitions for the gRPC service and messages
export interface IYellowstoneGeyserClient {
  subscribe(
    request: SubscribeRequest,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate>;

  subscribeReplayInfo(
    request?: SubscribeReplayInfoRequest,
  ): Promise<SubscribeReplayInfoResponse>;
  ping(request: PingRequest): Promise<PongResponse>;
  getLatestBlockhash(
    request?: GetLatestBlockhashRequest,
  ): Promise<GetLatestBlockhashResponse>;
  getBlockHeight(
    request?: GetBlockHeightRequest,
  ): Promise<GetBlockHeightResponse>;
  getSlot(request?: GetSlotRequest): Promise<GetSlotResponse>;
  isBlockhashValid(
    request?: IsBlockhashValidRequest,
  ): Promise<IsBlockhashValidResponse>;
  getVersion(request?: GetVersionRequest): Promise<GetVersionResponse>;
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
  commitment?: CommitmentLevel | undefined;
  accounts_data_slice?: SubscribeRequestAccountsDataSlice[];
  ping?: SubscribeRequestPing | undefined;
  from_slot?: number | undefined;
}

export interface SubscribeRequestFilterAccounts {
  account?: string[];
  owner?: string[];
  filters?: SubscribeRequestFilterAccountsFilter[];
  nonempty_txn_signature?: boolean | undefined;
}

export interface SubscribeRequestFilterAccountsFilter {
  memcmp?: SubscribeRequestFilterAccountsFilterMemcmp | undefined;
  datasize?: number | undefined;
  token_account_state?: boolean | undefined;
  lamports?: SubscribeRequestFilterAccountsFilterLamports | undefined;
}

export interface SubscribeRequestFilterAccountsFilterMemcmp {
  offset: number;
  bytes?: Uint8Array | undefined;
  base58?: string | undefined;
  base64?: string | undefined;
}

export interface SubscribeRequestFilterAccountsFilterLamports {
  eq?: number | undefined;
  ne?: number | undefined;
  lt?: number | undefined;
  gt?: number | undefined;
}

export interface SubscribeRequestFilterSlots {
  filter_by_commitment?: boolean | undefined;
  interslot_updates?: boolean | undefined;
}

export interface SubscribeRequestFilterTransactions {
  vote?: boolean | undefined;
  failed?: boolean | undefined;
  signature?: string | undefined;
  account_include?: string[];
  account_exclude?: string[];
  account_required?: string[];
}

export interface SubscribeRequestFilterBlocks {
  account_include?: string[];
  include_transactions?: boolean | undefined;
  include_accounts?: boolean | undefined;
  include_entries?: boolean | undefined;
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
  filters: string[];
  account?: SubscribeUpdateAccount | undefined;
  slot?: SubscribeUpdateSlot | undefined;
  transaction?: SubscribeUpdateTransaction | undefined;
  transaction_status?: SubscribeUpdateTransactionStatus | undefined;
  block?: SubscribeUpdateBlock | undefined;
  ping?: SubscribeUpdatePing | undefined;
  pong?: SubscribeUpdatePong | undefined;
  block_meta?: SubscribeUpdateBlockMeta | undefined;
  entry?: SubscribeUpdateEntry | undefined;
  created_at: {seconds: number; nanos: number};
  update_oneof: UpdateType;
}

export interface SubscribeUpdateAccount {
  account: SubscribeUpdateAccountInfo;
  slot: string;
  is_startup: boolean;
}

export interface SubscribeUpdateAccountInfo {
  pubkey: Uint8Array;
  lamports: number;
  owner: Uint8Array;
  executable: boolean;
  rent_epoch: string;
  data: Uint8Array;
  write_version: number;
  txn_signature?: Uint8Array | undefined;
}

export interface SubscribeUpdateSlot {
  slot: string;
  parent?: string | undefined;
  status: SlotStatus;
  dead_error?: string | undefined;
}

export interface SubscribeUpdateTransaction {
  transaction: SubscribeUpdateTransactionInfo;
  slot: string;
}

export interface SubscribeUpdateTransactionInfo {
  signature: Uint8Array;
  is_vote: boolean;
  transaction: Transaction;
  meta: TransactionStatusMeta;
  index: number;
}

export interface SubscribeUpdateTransactionStatus {
  slot: string;
  signature: Uint8Array;
  is_vote: boolean;
  index: number;
  err: TransactionError;
}

export interface SubscribeUpdateBlock {
  slot: string;
  blockhash: string;
  rewards: Rewards;
  block_time: UnixTimestamp;
  block_height: BlockHeight;
  parent_slot: string;
  parent_blockhash: string;
  executed_transaction_count: number;
  transactions: SubscribeUpdateTransactionInfo[];
  updated_account_count: number;
  accounts: SubscribeUpdateAccountInfo[];
  entries_count: number;
  entries: SubscribeUpdateEntry[];
}

export interface SubscribeUpdateBlockMeta {
  slot: string;
  blockhash: string;
  rewards: Rewards;
  block_time: UnixTimestamp;
  block_height: BlockHeight;
  parent_slot: string;
  parent_blockhash: string;
  executed_transaction_count: number;
  entries_count: number;
}

export interface SubscribeUpdateEntry {
  slot: string;
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
  first_available?: number | undefined;
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
  slot: string;
  blockhash: string;
  last_valid_block_height: string;
}

export interface GetBlockHeightRequest {
  commitment?: CommitmentLevel;
}

export interface GetBlockHeightResponse {
  block_height: string;
}

export interface GetSlotRequest {
  commitment?: CommitmentLevel;
}

export interface GetSlotResponse {
  slot: string;
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
  slot: string;
  valid: boolean;
}

export type StatusObject = grpc.StatusObject;
export type ServiceError = grpc.ServiceError;

// EventEmitter events enum
export enum YellowstoneGeyserClientEvents {
  INITIALIZED = 'initialized',
  CONNECTED = 'connected',
  SUBSCRIBED = 'subscribed',
  CLOSED = 'closed',
  ERROR = 'error',
  STREAM_ENDED = 'stream-ended',
  STATUS = 'status',
}

// EventEmitter event payload types
export interface YellowstoneGeyserClientEventMap {
  [YellowstoneGeyserClientEvents.INITIALIZED]: () => void;
  [YellowstoneGeyserClientEvents.CONNECTED]: () => void;
  [YellowstoneGeyserClientEvents.SUBSCRIBED]: (
    request: SubscribeRequest,
  ) => void;
  [YellowstoneGeyserClientEvents.CLOSED]: () => void;
  [YellowstoneGeyserClientEvents.ERROR]: (error: Error | ServiceError) => void;
  [YellowstoneGeyserClientEvents.STREAM_ENDED]: () => void;
  [YellowstoneGeyserClientEvents.STATUS]: (status: StatusObject) => void;
}

// Client configuration interface
export interface YellowstoneGeyserClientConfig {
  endpoint: string;
  credentials?: string;
  options?: grpc.ChannelOptions;
}
