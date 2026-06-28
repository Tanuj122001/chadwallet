import { TransactionSimulationDTO } from '../../core/api/SimulationDTOs';
import { TransactionDTO } from '../../core/api/TransactionDTOs';

export interface ISimulationRepository {
  simulateAndValidate(tx: TransactionDTO): Promise<TransactionSimulationDTO>;
  
  getCachedSimulation(txId: string): Promise<TransactionSimulationDTO | null>;
}
