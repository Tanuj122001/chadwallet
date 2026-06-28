import { SwapDTO, SimulationDTO } from '../../core/api/SwapDTOs';

export interface ISwapRepository {
  prepareSwapTransaction(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    userAddress: string;
    slippageBps: number;
  }): Promise<SwapDTO>;

  prepareSimulationRequest(swap: SwapDTO): Promise<SimulationDTO>;
}
