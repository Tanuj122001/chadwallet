import { rpcConnectionManager } from '../../core/wallet/RpcConnectionManager';
import { ConfirmationDTO, ReceiptDTO } from '../../core/api/ExecutionDTOs';
import { logger } from '../../utils/logger';

export interface ExecutionRemoteDataSource {
  broadcastTransaction(serializedBase64: string): Promise<string>;
  querySignatureStatus(signature: string): Promise<ConfirmationDTO | null>;
  fetchTransactionReceipt(signature: string): Promise<ReceiptDTO | null>;
}

export class ExecutionRemoteDataSourceImpl implements ExecutionRemoteDataSource {

  public async broadcastTransaction(serializedBase64: string): Promise<string> {
    logger.debug('[ExecutionRemoteDataSource] Broadcasting serialized payload to Solana RPC');
    
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      // Send raw transaction base64 using RPC method sendTransaction
      const signature = await client.request<string>('sendTransaction', [
        serializedBase64,
        { encoding: 'base64', skipPreflight: true }
      ]);
      
      logger.info(`[ExecutionRemoteDataSource] Broadcast successful! Signature: ${signature}`);
      return signature;
    });
  }

  public async querySignatureStatus(signature: string): Promise<ConfirmationDTO | null> {
    logger.debug(`[ExecutionRemoteDataSource] Querying confirmation status for signature: ${signature}`);
    
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      const res = await client.request<{ value: any[] }>('getSignatureStatuses', [
        [signature],
        { searchTransactionHistory: true }
      ]);

      const status = res.value?.[0];
      if (!status) return null;

      return {
        signature,
        slot: status.slot,
        err: status.err,
        confirmation_status: status.confirmationStatus || 'processed',
        confirmations_count: status.confirmations || 0,
      };
    });
  }

  public async fetchTransactionReceipt(signature: string): Promise<ReceiptDTO | null> {
    logger.debug(`[ExecutionRemoteDataSource] Loading execution receipt parameters for signature: ${signature}`);
    
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      const txDetails = await client.request<any>('getTransaction', [
        signature,
        { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
      ]);

      if (!txDetails) return null;

      const meta = txDetails.meta;
      const status = meta?.err ? 'failed' : 'success';
      const errMsg = meta?.err ? JSON.stringify(meta.err) : undefined;

      return {
        signature,
        slot: txDetails.slot,
        timestamp: (txDetails.blockTime || 0) * 1000,
        fee_payer: txDetails.transaction.message.accountKeys[0]?.pubkey || 'unknown',
        fees_paid_lamports: meta?.fee || 5000,
        compute_units_consumed: meta?.computeUnitsConsumed || 0,
        status,
        error_message: errMsg,
        block_time: txDetails.blockTime || 0,
      };
    });
  }
}
