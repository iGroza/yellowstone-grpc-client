import {
  ConfirmedTransactionMeta,
  Message,
  MessageV0,
  PublicKey,
  VersionedMessage,
  VersionedTransactionResponse,
} from '@solana/web3.js';
import bs58 from 'bs58';

import {
  SubscribeUpdate,
  SubscribeUpdateTransaction,
  TransactionStatusMeta,
  UpdateType,
} from './types';

export class TransactionFormatter {
  private static convertMeta(
    meta: ConfirmedTransactionMeta | null,
  ): TransactionStatusMeta {
    if (!meta) {
      return {} as TransactionStatusMeta;
    }

    return {
      err: meta.err ? {err: new Uint8Array()} : ({} as any),
      fee: meta.fee || 0,
      pre_balances: meta.preBalances || [],
      post_balances: meta.postBalances || [],
      inner_instructions:
        meta.innerInstructions?.map(inner => ({
          index: inner.index,
          instructions: inner.instructions.map(ix => ({
            program_id_index: ix.programIdIndex,
            accounts: Uint8Array.from(ix.accounts),
            data: bs58.decode(ix.data),
          })),
        })) || [],
      inner_instructions_none: !meta.innerInstructions,
      log_messages: meta.logMessages || [],
      log_messages_none: !meta.logMessages,
      pre_token_balances: (meta.preTokenBalances || []) as any,
      post_token_balances: (meta.postTokenBalances || []) as any,
      rewards: [],
      loaded_writable_addresses:
        meta.loadedAddresses?.writable?.map(addr => addr.toBytes()) || [],
      loaded_readonly_addresses:
        meta.loadedAddresses?.readonly?.map(addr => addr.toBytes()) || [],
      return_data: {} as any,
      return_data_none: true,
    };
  }

  private static formMeta(meta: any): ConfirmedTransactionMeta {
    return {
      err: meta?.errorInfo ? {err: meta?.errorInfo} : null,
      fee: meta.fee,
      preBalances: meta.preBalances || meta.pre_balances,
      postBalances: meta.postBalances || meta.post_balances,
      preTokenBalances: meta.preTokenBalances || meta.pre_token_balances || [],
      postTokenBalances:
        meta.postTokenBalances || meta.post_token_balances || [],
      logMessages: meta.logMessages || meta.log_messages || [],
      loadedAddresses:
        meta.loadedWritableAddresses ||
        meta.loaded_readonly_addresses ||
        meta.loaded_writable_addresses
          ? {
              writable:
                (
                  meta.loadedWritableAddresses || meta.loaded_writable_addresses
                )?.map((address: PublicKey) => {
                  // @ts-ignore
                  if (address.type === 'Buffer') {
                    // @ts-ignore
                    return new PublicKey(new Uint8Array(address.data));
                  }
                  return new PublicKey(address);
                }) || [],
              readonly:
                (
                  meta.loadedReadonlyAddresses || meta.loaded_readonly_addresses
                )?.map((address: PublicKey) => {
                  // @ts-ignore
                  if (address.type === 'Buffer') {
                    // @ts-ignore
                    return new PublicKey(new Uint8Array(address.data));
                  }
                  return new PublicKey(address);
                }) || [],
            }
          : undefined,
      innerInstructions:
        (meta.innerInstructions || meta.inner_instructions)?.map(
          (i: {index: number; instructions: any}) => ({
            index: i.index || 0,
            instructions: i.instructions.map((instruction: any) => ({
              programIdIndex:
                instruction.programIdIndex || instruction.program_id_index,
              accounts: Array.from(instruction.accounts),
              data: bs58.encode(Buffer.from(instruction.data || '', 'base64')),
            })),
          }),
        ) || [],
    };
  }

  public static formTransactionFromJson(
    data: SubscribeUpdate,
  ): VersionedTransactionResponse {
    if (!data || !data['transaction']) {
      throw new Error('Transaction not found');
    }

    const rawTx = data['transaction']['transaction']!;

    const slot = data['transaction']?.['slot']!;
    const version = rawTx.transaction?.message?.versioned ? 0 : 'legacy';

    const meta = this.formMeta(rawTx.meta);
    const signatures = rawTx.transaction?.signatures.map(s => {
      // @ts-ignore
      if (s.type === 'Buffer') {
        // @ts-ignore
        return bs58.encode(new Uint8Array(s.data));
      }
      return typeof s === 'string' ? s : bs58.encode(s);
    });

    const message = this.formTxnMessage(rawTx.transaction?.message);

    let blockTime = Date.now();
    if (data.created_at) {
      blockTime =
        data.created_at.seconds * 1000 +
        Math.floor(data.created_at.nanos / 1e6);
    }

    return {
      slot: parseInt(slot),
      version,
      blockTime,
      meta,
      transaction: {
        signatures,
        message,
      },
    };
  }

  private static formTxnMessage(message: any): VersionedMessage {
    if (!message?.versioned) {
      return new Message({
        header: {
          numRequiredSignatures:
            message.header.numRequiredSignatures ||
            message.header.num_required_signatures,
          numReadonlySignedAccounts:
            message.header.numReadonlySignedAccounts ||
            message.header.num_readonly_signed_accounts,
          numReadonlyUnsignedAccounts:
            message.header.numReadonlyUnsignedAccounts ||
            message.header.num_readonly_unsigned_accounts,
        },
        recentBlockhash: bs58.encode(
          Buffer.from(
            message.recentBlockhash || message.recent_blockhash,
            'base64',
          ),
        ),
        accountKeys: (message.accountKeys || message.account_keys)?.map(
          (d: string) => Buffer.from(d, 'base64'),
        ),
        instructions: (message.instructions || message.instruction_list).map(
          ({
            data,
            programIdIndex,
            program_id_index,
            accounts,
          }: {
            data: any;
            programIdIndex: any;
            program_id_index: any;
            accounts: any;
          }) => ({
            programIdIndex: programIdIndex || program_id_index,
            accounts: Array.from(accounts || []),
            data: bs58.encode(Buffer.from(data || '', 'base64')),
          }),
        ),
      });
    } else {
      return new MessageV0({
        header: {
          numRequiredSignatures:
            message.header.numRequiredSignatures ||
            message.header.num_required_signatures,
          numReadonlySignedAccounts:
            message.header.numReadonlySignedAccounts ||
            message.header.num_readonly_signed_accounts,
          numReadonlyUnsignedAccounts:
            message.header.numReadonlyUnsignedAccounts ||
            message.header.num_readonly_unsigned_accounts,
        },
        recentBlockhash: bs58.encode(
          Buffer.from(
            message.recentBlockhash || message.recent_blockhash,
            'base64',
          ),
        ),
        staticAccountKeys: (message.accountKeys || message.account_keys).map(
          (k: string) => new PublicKey(Buffer.from(k, 'base64')),
        ),
        compiledInstructions: (
          message.instructions || message.instruction_list
        ).map(
          ({
            programIdIndex,
            program_id_index,
            accounts,
            data,
          }: {
            programIdIndex: any;
            program_id_index: any;
            accounts: any;
            data: any;
          }) => ({
            programIdIndex: programIdIndex || program_id_index,
            accountKeyIndexes: Array.from(accounts),
            data: Uint8Array.from(Buffer.from(data || '', 'base64')),
          }),
        ),
        addressTableLookups:
          (message.addressTableLookups || message.address_table_lookups)?.map(
            ({
              accountKey,
              account_key,
              writableIndexes,
              writable_indexes,
              readonlyIndexes,
              readonly_indexes,
            }: {
              accountKey: any;
              account_key: any;
              writableIndexes: any;
              writable_indexes: any;
              readonlyIndexes: any;
              readonly_indexes: any;
            }) => ({
              writableIndexes: writableIndexes || writable_indexes || [],
              readonlyIndexes: readonlyIndexes || readonly_indexes || [],
              accountKey: new PublicKey(
                Buffer.from(accountKey || account_key, 'base64'),
              ),
            }),
          ) || [],
      });
    }
  }

  public static toJSON(
    transaction: VersionedTransactionResponse,
  ): SubscribeUpdateTransaction {
    const message = transaction.transaction.message;
    const isVersioned = transaction.version !== 'legacy';

    let account_keys: Uint8Array[];
    let instructions: any[];
    let address_table_lookups: any[] = [];

    if ('staticAccountKeys' in message) {
      // MessageV0
      account_keys = message.staticAccountKeys.map((k: PublicKey) =>
        k.toBytes(),
      );
      instructions = message.compiledInstructions.map(
        (ix: {
          programIdIndex: number;
          accountKeyIndexes: number[];
          data: Uint8Array;
        }) => ({
          program_id_index: ix.programIdIndex,
          accounts: ix.accountKeyIndexes,
          data: ix.data,
        }),
      );
      address_table_lookups = message.addressTableLookups.map(
        (lookup: {
          accountKey: PublicKey;
          writableIndexes: number[];
          readonlyIndexes: number[];
        }) => ({
          account_key: lookup.accountKey.toBytes(),
          writable_indexes: Uint8Array.from(lookup.writableIndexes),
          readonly_indexes: Uint8Array.from(lookup.readonlyIndexes),
        }),
      );
    } else {
      // Legacy Message
      const legacyMessage = message as Message;
      account_keys = legacyMessage.accountKeys.map((k: PublicKey) =>
        k.toBytes(),
      );
      instructions = legacyMessage.instructions.map(
        (ix: {programIdIndex: number; accounts: number[]; data: string}) => ({
          program_id_index: ix.programIdIndex,
          accounts: Uint8Array.from(ix.accounts),
          data: bs58.decode(ix.data),
        }),
      );
    }

    return {
      transaction: {
        signature: bs58.decode(
          transaction.transaction.signatures[0],
        ) as Uint8Array,
        is_vote: false,
        transaction: {
          signatures: transaction.transaction.signatures.map(s =>
            bs58.decode(s),
          ),
          message: {
            header: {
              num_required_signatures: message.header.numRequiredSignatures,
              num_readonly_signed_accounts:
                message.header.numReadonlySignedAccounts,
              num_readonly_unsigned_accounts:
                message.header.numReadonlyUnsignedAccounts,
            },
            account_keys,
            recent_blockhash: bs58.decode(message.recentBlockhash),
            instructions,
            versioned: isVersioned,
            address_table_lookups,
          },
        },
        meta: this.convertMeta(transaction.meta),
        index: 0,
      },
      slot: transaction.slot.toString(),
    };
  }

  public static toSubscribeUpdate(
    transaction: VersionedTransactionResponse,
  ): SubscribeUpdate {
    const tx = this.toJSON(transaction);
    const blockTime = transaction.blockTime || Math.floor(Date.now() / 1000);

    return {
      filters: [],
      created_at: {
        seconds: blockTime,
        nanos: 0,
      },
      update_oneof: UpdateType.TRANSACTION,
      transaction: tx,
    };
  }
}
