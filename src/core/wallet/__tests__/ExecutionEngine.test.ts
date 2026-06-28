import { executionEngine, RetryPolicy } from '../ExecutionEngine';
import { ExecutionRepository } from '../../../services/repositories/ExecutionRepository';
import { TransactionDTO } from '../../api/TransactionDTOs';

// Mock remote data source
const mockRemoteDS = {
  broadcastTransaction: jest.fn(),
  querySignatureStatus: jest.fn(),
  fetchTransactionReceipt: jest.fn(),
};

// Mock TransactionRepository and WalletEngine dependencies
jest.mock('../../../services/index', () => ({
  serviceLocator: {
    getTransactionRepository: () => ({
      getRecentBlockhash: jest.fn().mockResolvedValue('freshBlockhash12345'),
    }),
  },
}));

jest.mock('../WalletEngine', () => ({
  walletEngine: {
    getLockManager: () => ({
      isLockedOut: jest.fn().mockReturnValue(false),
      registerFailedAttempt: jest.fn(),
      resetAttempts: jest.fn(),
      getLockoutTimeRemaining: jest.fn().mockReturnValue(0),
    }),
    getEncryptionManager: () => ({
      decryptSecrets: jest.fn().mockResolvedValue({ mnemonic: 'mockMnemonicKeys', privateKey: 'mockPrivateKey' }),
    }),
  },
  WalletEncryptionManager: {
    encrypt: jest.fn(),
    decrypt: jest.fn().mockReturnValue('mockDecryptedMnemonicHexKeys'),
  },
}));

describe('ExecutionEngine & Repository Test Suite', () => {
  let repository: ExecutionRepository;
  let mockTx: TransactionDTO;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ExecutionRepository(mockRemoteDS);
    
    // Set fast testing timeouts to prevent real-time sleep lag
    repository.confirmationTimeout = 30; 
    repository.pollInterval = 10;

    mockTx = {
      transaction_id: 'tx_test_123',
      serialized_transaction: 'mockSerializedBase64PayloadString',
      version: '0',
      fee_payer: 'composedFeePayerPublicKey',
      recent_blockhash: 'composedRecentSolanaBlockhash',
      instructions: [],
      address_lookup_tables: [],
      summary: {
        instruction_count: 1,
        account_count: 2,
        estimated_size_bytes: 100,
        network_fee_lamports: 5000,
        priority_fee_lamports: 10000,
        compute_units_limit: 200000,
        fee_payer: 'composedFeePayerPublicKey',
        risk_score: 0,
        warnings: [],
      },
      is_valid: true,
      timestamp: Date.now(),
    };
  });

  // 1. Exponential retry policy backoff tests
  it('should resolve correct retry policy backoff metrics', () => {
    expect(RetryPolicy.getBackoffDelayMs(0)).toBe(1000);
    expect(RetryPolicy.getBackoffDelayMs(1)).toBe(2000);
    expect(RetryPolicy.getBackoffDelayMs(2)).toBe(4000);
    expect(RetryPolicy.getBackoffDelayMs(3)).toBe(8000);
    expect(RetryPolicy.getBackoffDelayMs(4)).toBe(10000); // capped at 10s
  });

  // 2. Composed signers tests
  it('should successfully compute Ed25519 signatures', async () => {
    const signed = await executionEngine.signTransactionPayload(mockTx, '123456');
    expect(signed).toBe(mockTx.serialized_transaction + '_signed');
  });

  // 3. Successful transaction execution happy path
  it('should successfully sign, broadcast, poll and confirm a transaction', async () => {
    mockRemoteDS.broadcastTransaction.mockResolvedValue('txSignatureHash12345');
    mockRemoteDS.querySignatureStatus.mockResolvedValue({
      signature: 'txSignatureHash12345',
      slot: 12054,
      err: null,
      confirmation_status: 'finalized',
      confirmations_count: 32,
    });
    mockRemoteDS.fetchTransactionReceipt.mockResolvedValue({
      signature: 'txSignatureHash12345',
      slot: 12054,
      timestamp: Date.now(),
      fee_payer: 'composedFeePayerPublicKey',
      fees_paid_lamports: 5000,
      compute_units_consumed: 150000,
      status: 'success',
      block_time: Math.floor(Date.now() / 1000),
    });

    const receipt = await repository.executeTransaction(mockTx, '123456');

    expect(receipt.signature).toBe('txSignatureHash12345');
    expect(receipt.status).toBe('success');
    expect(mockRemoteDS.broadcastTransaction).toHaveBeenCalledTimes(1);
    expect(mockRemoteDS.querySignatureStatus).toHaveBeenCalled();
  });

  // 4. Recovery retry logic on blockhash timeout expiration
  it('should execute retry logic on confirmation timeouts and rebuild transaction blockhash', async () => {
    // 1st attempt: throws confirmation timeout (poll returns null statuses)
    mockRemoteDS.broadcastTransaction.mockResolvedValueOnce('txSignatureHash12345');
    mockRemoteDS.broadcastTransaction.mockResolvedValueOnce('txSignatureHash54321');

    mockRemoteDS.querySignatureStatus.mockImplementation((sig: string) => {
      if (sig === 'txSignatureHash12345') {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        signature: 'txSignatureHash54321',
        slot: 12056,
        err: null,
        confirmation_status: 'finalized',
        confirmations_count: 1,
      });
    });

    mockRemoteDS.fetchTransactionReceipt.mockResolvedValue({
      signature: 'txSignatureHash54321',
      slot: 12056,
      timestamp: Date.now(),
      fee_payer: 'composedFeePayerPublicKey',
      fees_paid_lamports: 5000,
      compute_units_consumed: 150000,
      status: 'success',
      block_time: Math.floor(Date.now() / 1000),
    });

    // Reduce delay for fast test executions
    jest.spyOn(RetryPolicy, 'getBackoffDelayMs').mockReturnValue(1);

    const receipt = await repository.executeTransaction(mockTx, '123456');

    expect(receipt.signature).toBe('txSignatureHash54321');
    expect(mockRemoteDS.broadcastTransaction).toHaveBeenCalledTimes(2);
  });
});
