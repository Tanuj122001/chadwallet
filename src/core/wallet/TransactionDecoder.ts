import { logger } from '../../utils/logger';

export interface DecodedTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  dateString: string;
  sender: string;
  recipient: string;
  amount: number;
  fee: number;
  status: 'confirmed' | 'failed' | 'pending';
  type: 'send' | 'receive' | 'swap' | 'unknown';
}

class TransactionDecoder {
  
  // Format Explorer Signature URL
  public getExplorerUrl(signature: string, cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'devnet'): string {
    const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
    return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
  }

  // Parse raw JSON-RPC transaction signatures list
  public parseSignaturesList(signatures: any[]): Array<Partial<DecodedTransaction>> {
    return signatures.map(sig => {
      const timestamp = sig.blockTime ? sig.blockTime * 1000 : Date.now();
      return {
        signature: sig.signature,
        slot: sig.slot,
        timestamp,
        dateString: new Date(timestamp).toLocaleString(),
        status: sig.err ? 'failed' : 'confirmed',
      };
    });
  }

  // Decodes full Solana JSON-RPC transaction payload
  public decodeTransaction(txPayload: any, userAddress: string): DecodedTransaction {
    try {
      const signature = txPayload.transaction.signatures[0];
      const slot = txPayload.slot;
      const timestamp = txPayload.blockTime ? txPayload.blockTime * 1000 : Date.now();
      const dateString = new Date(timestamp).toLocaleString();
      
      const meta = txPayload.meta;
      const status = meta?.err ? 'failed' : 'confirmed';
      const fee = meta?.fee ? meta.fee / 1_000_000_000 : 0;

      // Extract balance differences to decode transfer amounts & directions
      const accountKeys = txPayload.transaction.message.accountKeys.map((k: any) => typeof k === 'string' ? k : k.pubkey);
      const userIndex = accountKeys.indexOf(userAddress);
      
      let amount = 0;
      let type: 'send' | 'receive' | 'swap' | 'unknown' = 'unknown';
      let sender = 'unknown';
      let recipient = 'unknown';

      if (userIndex !== -1 && meta) {
        const preBalance = meta.preBalances[userIndex] || 0;
        const postBalance = meta.postBalances[userIndex] || 0;
        const diff = (postBalance - preBalance) / 1_000_000_000;

        if (diff < 0) {
          // User sent SOL (subtracting fee to calculate transfer amount)
          amount = Math.abs(diff) - fee;
          type = 'send';
          sender = userAddress;
          
          // Mapped recipient is the primary receiving index account
          const recipientIndex = accountKeys.findIndex((_: string, idx: number) => {
            if (idx === userIndex) return false;
            const balanceDiff = ((meta.postBalances[idx] || 0) - (meta.preBalances[idx] || 0)) / 1_000_000_000;
            return balanceDiff > 0;
          });
          recipient = recipientIndex !== -1 ? accountKeys[recipientIndex]! : 'unknown';
        } else {
          // User received SOL
          amount = diff;
          type = 'receive';
          recipient = userAddress;
          
          const senderIndex = accountKeys.findIndex((_: string, idx: number) => {
            if (idx === userIndex) return false;
            const balanceDiff = ((meta.postBalances[idx] || 0) - (meta.preBalances[idx] || 0)) / 1_000_000_000;
            return balanceDiff < 0;
          });
          sender = senderIndex !== -1 ? accountKeys[senderIndex]! : 'unknown';
        }
      }

      return {
        signature,
        slot,
        timestamp,
        dateString,
        sender,
        recipient,
        amount,
        fee,
        status,
        type,
      };
    } catch (e: any) {
      logger.error('[TransactionDecoder] Failed decoding raw RPC transaction', e);
      return {
        signature: txPayload?.transaction?.signatures?.[0] || 'unknown',
        slot: txPayload?.slot || 0,
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        sender: 'unknown',
        recipient: 'unknown',
        amount: 0,
        fee: 0,
        status: txPayload?.meta?.err ? 'failed' : 'confirmed',
        type: 'unknown',
      };
    }
  }
}

export const transactionDecoder = new TransactionDecoder();
export default transactionDecoder;
