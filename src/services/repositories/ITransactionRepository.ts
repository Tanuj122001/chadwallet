import { TransactionDTO, InstructionDTO } from '../../core/api/TransactionDTOs';

export interface ITransactionRepository {
  getRecentBlockhash(forceRefresh?: boolean): Promise<string>;
  
  composeTransaction(params: {
    feePayer: string;
    instructions: InstructionDTO[];
    version?: 'legacy' | '0';
    lookupTableAddresses?: string[];
  }): Promise<TransactionDTO>;
}
