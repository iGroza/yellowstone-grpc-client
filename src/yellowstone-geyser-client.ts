import { EventEmitter } from 'events';
import * as path from 'path';

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { IYellowstoneGeyserClient, YellowstoneGeyserClientConfig, SubscribeRequest, SubscribeUpdate, ServiceError, GetBlockHeightRequest, GetBlockHeightResponse, GetLatestBlockhashRequest, GetLatestBlockhashResponse, GetSlotRequest, GetSlotResponse, GetVersionRequest, GetVersionResponse, IsBlockhashValidRequest, IsBlockhashValidResponse, PingRequest, PongResponse, SubscribeReplayInfoRequest, SubscribeReplayInfoResponse } from './types';

export class YellowstoneGeyserClient
  extends EventEmitter
  implements IYellowstoneGeyserClient {
  private _stream: grpc.ClientDuplexStream<
    SubscribeRequest,
    SubscribeUpdate
  > | null = null;
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
      if (this._stream) {
        this._stream.end();
        this._stream = null;
      }
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
    onError?: (error: ServiceError) => void,
    onEnd?: () => void,
  ): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate> {
    const stream = this.subscribe(request);

    stream.on('data', (update: SubscribeUpdate) => {
      try {
        onData(update);
      } catch (error) {
        if (onError) {
          onError(error as ServiceError);
        } else {
          this.emit('error', error);
        }
      }
    });

    stream.on('error', (error: ServiceError) => {
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

  async getBlockHeight(
    request: GetBlockHeightRequest = {},
  ): Promise<GetBlockHeightResponse> {
    return new Promise((resolve, reject) => {
      this.client.GetBlockHeight(
        request,
        (error: ServiceError | null, response: GetBlockHeightResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  getCurrentStream(): grpc.ClientDuplexStream<
    SubscribeRequest,
    SubscribeUpdate
  > | null {
    return this._stream!;
  }
  async getLatestBlockhash(
    request: GetLatestBlockhashRequest = {},
  ): Promise<GetLatestBlockhashResponse> {
    return new Promise((resolve, reject) => {
      this.client.GetLatestBlockhash(
        request,
        (error: ServiceError | null, response: GetLatestBlockhashResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async getSlot(request: GetSlotRequest = {}): Promise<GetSlotResponse> {
    return new Promise((resolve, reject) => {
      this.client.GetSlot(
        request,
        (error: ServiceError | null, response: GetSlotResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async getVersion(
    request: GetVersionRequest = {},
  ): Promise<GetVersionResponse> {
    return new Promise((resolve, reject) => {
      this.client.GetVersion(
        request,
        (error: ServiceError | null, response: GetVersionResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
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
      },
    );

    this.grpcObject = grpc.loadPackageDefinition(packageDefinition);
    const geyserPackage = this.grpcObject.geyser;

    const credentials = config.credentials
      ? grpc.credentials.createFromMetadataGenerator((_, callback) => {
        const metadata = new grpc.Metadata();
        metadata.add('x-token', config.credentials!);
        callback(null, metadata);
      })
      : grpc.credentials.createInsecure();

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
      config.endpoint.replace(/http[s]?:\/\//, ''),
      credentials,
      options,
    );

    this.emit('initialized');
  }

  async isBlockhashValid(
    request: IsBlockhashValidRequest,
  ): Promise<IsBlockhashValidResponse> {
    return new Promise((resolve, reject) => {
      this.client.IsBlockhashValid(
        request,
        (error: ServiceError | null, response: IsBlockhashValidResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async ping(request: PingRequest): Promise<PongResponse> {
    return new Promise((resolve, reject) => {
      this.client.Ping(
        request,
        (error: ServiceError | null, response: PongResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  // Helper to send ping through existing stream
  sendPing(
    stream: grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
    id: number,
  ): void {
    const pingRequest: SubscribeRequest = {
      ping: { id },
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
    this._stream = this.client.Subscribe(options);

    // Write the initial request
    this._stream!.write(request, (err: Error | null) => {
      if (err) {
        this.emit(
          'error',
          new Error(`Failed to write subscribe request: ${err.message}`),
        );
      } else {
        this.emit('subscribed', request);
      }
    });

    return this._stream!;
  }

  async subscribeReplayInfo(
    request: SubscribeReplayInfoRequest = {},
  ): Promise<SubscribeReplayInfoResponse> {
    return new Promise((resolve, reject) => {
      this.client.SubscribeReplayInfo(
        request,
        (error: ServiceError | null, response: SubscribeReplayInfoResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }
}

export default YellowstoneGeyserClient;
