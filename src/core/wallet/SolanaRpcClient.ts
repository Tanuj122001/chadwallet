import { ApiClient } from '../api/ApiClient';
import { logger } from '../../utils/logger';
import { RpcError } from '../errors';

export interface RpcResponse<T> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: string;
}

export class SolanaRpcClient {
  private client: ApiClient;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.client = new ApiClient(endpoint);
  }

  // Generic JSON-RPC POST dispatcher
  public async request<T>(method: string, params: unknown[] = []): Promise<T> {
    const payload = {
      jsonrpc: '2.0',
      id: 'rpc-' + Math.random().toString(36).substr(2, 9),
      method,
      params,
    };

    logger.debug(`[SolanaRpcClient] RPC Request: ${method} to ${this.endpoint}`);
    try {
      const response = await this.client.post<RpcResponse<T>>('', payload);
      const resData = response.data;

      if (resData.error) {
        throw new RpcError(
          `RPC_METHOD_ERROR_${resData.error.code}`,
          resData.error.message,
          this.endpoint,
          resData.error
        );
      }

      if (resData.result === undefined) {
        throw new RpcError('RPC_EMPTY_RESULT', 'RPC response returned empty result payload.', this.endpoint);
      }

      return resData.result;
    } catch (e: any) {
      logger.error(`[SolanaRpcClient] RPC Request failed for method ${method}`, e);
      if (e instanceof RpcError) throw e;
      throw new RpcError('RPC_TRANSPORT_FAILED', `RPC HTTP call failed: ${e.message}`, this.endpoint, e);
    }
  }

  // Native SOL balance query (returns lamports)
  public async getBalance(publicKey: string): Promise<number> {
    const res = await this.request<{ value: number }>('getBalance', [publicKey]);
    return res.value;
  }

  // SPL Token account discovery
  public async getTokenAccountsByOwner(publicKey: string): Promise<Array<{ pubkey: string; account: any }>> {
    // Solana program ID for Token Program
    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const res = await this.request<Array<{ pubkey: string; account: any }>>('getTokenAccountsByOwner', [
      publicKey,
      { programId: TOKEN_PROGRAM_ID },
      { encoding: 'jsonParsed' }
    ]);
    return res;
  }

  // Transaction Signature histories
  public async getSignaturesForAddress(publicKey: string, limit = 20): Promise<any[]> {
    return this.request<any[]>('getSignaturesForAddress', [publicKey, { limit }]);
  }

  // Detailed Transaction Decoder info
  public async getTransaction(signature: string): Promise<any> {
    return this.request<any>('getTransaction', [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
  }

  public getEndpoint(): string {
    return this.endpoint;
  }
}
