import { TransactionDTO, InstructionDTO, LookupTableDTO, BlockhashDTO, TransactionSummaryDTO } from '../api/TransactionDTOs';
import { logger } from '../../utils/logger';


export class InstructionComposer {
  
  
  public static composeSystemTransfer(from: string, to: string, lamports: number): InstructionDTO {
    return {
      program_id: '11111111111111111111111111111111',
      accounts: [
        { pubkey: from, is_signer: true, is_writable: true },
        { pubkey: to, is_signer: false, is_writable: true }
      ],
      // Transfer Instruction index = 2 (standard Solana layout)
      data: '02000000' + this.toLittleEndianHex(lamports, 8),
    };
  }

 
  private static toLittleEndianHex(val: number, bytesCount: number): string {
    const arr = new ArrayBuffer(bytesCount);
    const view = new DataView(arr);
    if (bytesCount === 8) {
      // split number to handle 64-bit safely
      const low = val & 0xffffffff;
      const high = Math.floor(val / 0x100000000);
      view.setUint32(0, low, true);
      view.setUint32(4, high, true);
    } else {
      view.setUint32(0, val, true);
    }
    return Array.from(new Uint8Array(arr))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export class TransactionValidator {
  
  // Maximum transaction package size limits on Solana = 1232 bytes
  private static readonly MAX_TX_SIZE_BYTES = 1232;

  public static estimateTransactionSize(instructions: InstructionDTO[], addressTableCount = 0): number {
    let size = 64; // base envelope header sizing (signatures and count offsets)

    instructions.forEach(inst => {
      size += inst.program_id.length;
      inst.accounts.forEach(acc => {
        size += acc.pubkey.length + 2; // key length plus config flags bytes
      });
      size += inst.data.length / 2; // hex encoded payload halves size
    });

    // Reduce sizing overhead when Address Lookup Tables are leveraged
    if (addressTableCount > 0) {
      size = Math.floor(size * 0.85); 
    }

    return size;
  }

  public static validateComposedPayload(
    feePayer: string,
    recentBlockhash: string,
    instructions: InstructionDTO[],
    sizeBytes: number
  ): { isValid: boolean; warnings: string[]; code?: string } {
    const warnings: string[] = [];

    if (!feePayer || feePayer.length < 32) {
      return { isValid: false, warnings: ['CRITICAL: Invalid fee payer address.'], code: 'INVALID_FEE_PAYER' };
    }
    if (!recentBlockhash || recentBlockhash.length < 32) {
      return { isValid: false, warnings: ['CRITICAL: Recent blockhash parameter is missing.'], code: 'MISSING_BLOCKHASH' };
    }
    if (instructions.length === 0) {
      return { isValid: false, warnings: ['CRITICAL: Composed transaction has zero instructions.'], code: 'ZERO_INSTRUCTIONS' };
    }

    // Size limit overflow checks
    if (sizeBytes > this.MAX_TX_SIZE_BYTES) {
      return {
        isValid: false,
        warnings: [`CRITICAL: Composed payload size (${sizeBytes} bytes) exceeds Solana max constraint (${this.MAX_TX_SIZE_BYTES} bytes).`],
        code: 'TX_SIZE_EXCEEDED'
      };
    }

    // Inspect signers alignment checks
    const signers = new Set<string>();
    instructions.forEach(inst => {
      inst.accounts.forEach(acc => {
        if (acc.is_signer) signers.add(acc.pubkey);
      });
    });

    if (!signers.has(feePayer)) {
      warnings.push('WARNING: Fee payer public key is not registered as a signer inside transaction instructions.');
    }

    return {
      isValid: true,
      warnings,
    };
  }
}

// Sub-Engine: Recent Blockhash Cache Manager (30-second TTL)
export class RecentBlockhashManager {
  private cache: BlockhashDTO | null = null;
  private readonly TTL_MS = 30_000; // 30 seconds expiration threshold

  public isCacheExpired(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.timestamp > this.TTL_MS;
  }

  public getCachedBlockhash(): string | null {
    if (this.isCacheExpired()) return null;
    return this.cache?.blockhash || null;
  }

  public setCache(dto: BlockhashDTO): void {
    this.cache = dto;
    logger.debug(`[RecentBlockhashManager] Blockhash cached: ${dto.blockhash}`);
  }

  public invalidate(): void {
    this.cache = null;
  }
}
class TransactionBuilder {
  private blockhashManager = new RecentBlockhashManager();

  public getComposer() { return InstructionComposer; }
  public getValidator() { return TransactionValidator; }
  public getBlockhashManager() { return this.blockhashManager; }

  // Orchestrator Builder mapping pipeline
  public buildTransaction(params: {
    feePayer: string;
    recentBlockhash: string;
    instructions: InstructionDTO[];
    version?: 'legacy' | '0';
    lookupTables?: LookupTableDTO[];
  }): TransactionDTO {
    const { feePayer, recentBlockhash, instructions, version = '0', lookupTables = [] } = params;

    const size = TransactionValidator.estimateTransactionSize(instructions, lookupTables.length);
    const check = TransactionValidator.validateComposedPayload(feePayer, recentBlockhash, instructions, size);

    const summary: TransactionSummaryDTO = {
      instruction_count: instructions.length,
      account_count: instructions.reduce((acc, inst) => acc + inst.accounts.length, 0),
      estimated_size_bytes: size,
      network_fee_lamports: 5000,
      priority_fee_lamports: 10000,
      compute_units_limit: 200000,
      fee_payer: feePayer,
      risk_score: check.isValid ? 0 : 80,
      warnings: check.warnings,
    };

    return {
      transaction_id: 'tx_composed_' + Math.random().toString(36).substr(2, 9),
      serialized_transaction: 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
      version,
      fee_payer: feePayer,
      recent_blockhash: recentBlockhash,
      instructions,
      address_lookup_tables: lookupTables,
      summary,
      is_valid: check.isValid,
      timestamp: Date.now(),
    };
  }
}

export const transactionBuilder = new TransactionBuilder();
export default transactionBuilder;
