import { rpcConnectionManager } from '../../core/wallet/RpcConnectionManager';
import { BlockhashDTO, LookupTableDTO } from '../../core/api/TransactionDTOs';
import { logger } from '../../utils/logger';

export interface TransactionRemoteDataSource {
  fetchRecentBlockhash(): Promise<BlockhashDTO>;
  fetchLookupTable(address: string): Promise<LookupTableDTO>;
}

export class TransactionRemoteDataSourceImpl implements TransactionRemoteDataSource {

  public async fetchRecentBlockhash(): Promise<BlockhashDTO> {
    logger.debug('[TransactionRemoteDataSource] Fetching fresh blockhash from Solana RPC');
    
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      // Invoke RPC method getLatestBlockhash
      const res = await client.request<{ blockhash: string; lastValidBlockHeight: number }>('getLatestBlockhash', [
        { commitment: 'confirmed' }
      ]);

      return {
        blockhash: res.blockhash,
        last_valid_block_height: res.lastValidBlockHeight,
        timestamp: Date.now(),
      };
    });
  }

  public async fetchLookupTable(address: string): Promise<LookupTableDTO> {
    logger.debug(`[TransactionRemoteDataSource] Fetching address lookup table: ${address}`);
    
    // Simulate lookup table accounts lookup
    // In production, gets account info and parses ALT structures
    return {
      address,
      addresses: [
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        'So11111111111111111111111111111111111111112'
      ],
    };
  }
}
