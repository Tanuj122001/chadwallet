import { DecodedTransaction } from '../../core/wallet/TransactionDecoder';
import { SolanaHoldingDTO } from '../datasources/SolanaRemoteDataSource';

export interface ISolanaRepository {
  getNativeBalance(address: string): Promise<number>;
  getTokenHoldings(address: string): Promise<SolanaHoldingDTO[]>;
  getTransactionHistory(address: string, limit?: number): Promise<Array<Partial<DecodedTransaction>>>;
  getTransactionDetails(signature: string, userAddress: string): Promise<DecodedTransaction>;
}
