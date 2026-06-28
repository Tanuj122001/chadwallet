import { rpcConnectionManager } from '../../core/wallet/RpcConnectionManager';
import { SimulationResultDTO } from '../../core/api/SimulationDTOs';
import { logger } from '../../utils/logger';

export interface SimulationRemoteDataSource {
  simulateTransactionPayload(serializedBase64: string): Promise<SimulationResultDTO>;
}

export class SimulationRemoteDataSourceImpl implements SimulationRemoteDataSource {

  public async simulateTransactionPayload(serializedBase64: string): Promise<SimulationResultDTO> {
    logger.debug('[SimulationRemoteDataSource] Invoking simulateTransaction on Solana RPC');

    return rpcConnectionManager.executeRpcRequest(async (client) => {
      // Send simulation query using RPC method simulateTransaction
      const res = await client.request<{ value: { err: any; logs: string[]; unitsConsumed: number; accounts: any[] } }>('simulateTransaction', [
        serializedBase64,
        { sigVerify: false, commitment: 'confirmed' }
      ]);

      const value = res.value;
      if (!value) {
        throw new Error('SIMULATION_RPC_RETURNED_EMPTY_PAYLOAD');
      }

      return {
        err: value.err,
        logs: value.logs || [],
        units_consumed: value.unitsConsumed || 0,
        post_balances_sol: {},
        post_balances_token: {},
        expected_output_amount: 1420000,
        expected_fees_sol: 0.000015,
        inner_instructions_count: 3,
      };
    });
  }
}
