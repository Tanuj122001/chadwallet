import { ISwapRepository } from './ISwapRepository';
import { SwapRemoteDataSource } from '../datasources/SwapRemoteDataSource';
import { SwapDTO, SimulationDTO } from '../../core/api/SwapDTOs';
import { SwapValidator, SwapRiskAnalyzer, SwapSimulationRequestBuilder } from '../../core/wallet/SwapEngine';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class SwapRepository implements ISwapRepository {
  constructor(private remoteDS: SwapRemoteDataSource) {}

  public async prepareSwapTransaction(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    userAddress: string;
    slippageBps: number;
  }): Promise<SwapDTO> {
    const { inputMint, outputMint, amount, userAddress, slippageBps } = params;

    // 1. Initial Route Parameters validation
    const isRouteValid = SwapValidator.validateRouteIntegrity(userAddress, inputMint, outputMint, amount);
    if (!isRouteValid) {
      throw new RepositoryError('INVALID_SWAP_PARAMETERS', 'Route integrity verification failed due to invalid addresses or input bounds.');
    }

    try {
      // 2. Fetch serialized swap instructions from Jupiter API
      const swapDto = await this.remoteDS.fetchJupiterSwap(inputMint, outputMint, amount, userAddress, slippageBps);

      // 3. Inspect serialized instructions for safety violations
      const txCheck = SwapValidator.validateSerializedTransaction(swapDto.transaction);
      if (!txCheck.isValid) {
        throw new RepositoryError('SWAP_TRANSACTION_SECURITY_ALERT', `Serialized transaction rejected: ${txCheck.reason}`);
      }

      // 4. Enrich risk assessment metadata
      const slippagePercent = slippageBps / 100;
      const riskAnalysis = SwapRiskAnalyzer.evaluateSwapRisk(
        swapDto.price_impact_percent,
        slippagePercent,
        swapDto.simulation.route_complexity
      );

      const enrichedSwap: SwapDTO = {
        ...swapDto,
        risk_score: riskAnalysis.riskScore,
        simulation: {
          ...swapDto.simulation,
          risk_warnings: riskAnalysis.warnings,
        }
      };

      return enrichedSwap;
    } catch (e: any) {
      logger.error('[SwapRepository] Failed to build transaction parameters', e);
      if (e instanceof RepositoryError) throw e;
      throw new RepositoryError('SWAP_PREPARATION_FAILED', `Failed to construct swap transaction parameters: ${e.message}`, e);
    }
  }

  public async prepareSimulationRequest(swap: SwapDTO): Promise<SimulationDTO> {
    try {
      const simEnvelope = SwapSimulationRequestBuilder.buildSimulationRequest(
        swap.transaction.serialized_transaction,
        swap.user_address
      );

      return {
        ...swap.simulation,
        payload_json: simEnvelope.payload,
      };
    } catch (e: any) {
      logger.error('[SwapRepository] Simulation request mapping failed', e);
      throw new RepositoryError('SIMULATION_MAPPING_FAILED', 'Failed to map simulation request headers.', e);
    }
  }
}
