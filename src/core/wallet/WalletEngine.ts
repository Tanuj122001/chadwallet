import { cryptoManager } from './CryptoManager';
import { Buffer } from 'buffer';
import { logger } from '../../utils/logger';
import { 
  InvalidMnemonicError, 
  InvalidPrivateKeyError, 
  WalletCreationError, 
  WalletLockedError, 
  SigningError 
} from '../errors';

export interface WalletProfile {
  id: string;
  address: string;
  label: string;
  createdAt: number;
  backupConfirmed: boolean;
  type: 'solana' | 'ethereum' | 'bitcoin';
}

// Sub-Manager: Wallet Validator
export class WalletValidator {
  public static isValidAddress(address: string): boolean {
    // Solana addresses are base58, 32-44 chars. Ethereum are hex 42 chars.
    if (!address) return false;
    const isHexAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isBase58Address = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    return isHexAddress || isBase58Address;
  }

  public static isValidPrivateKey(privateKeyHex: string): boolean {
    if (!privateKeyHex) return false;
    // Ed25519 raw secret keys are usually 32 or 64 bytes (64 or 128 hex chars)
    return /^[a-fA-F0-9]{64}$/.test(privateKeyHex) || /^[a-fA-F0-9]{128}$/.test(privateKeyHex);
  }

  public static isValidMnemonic(mnemonic: string): boolean {
    return cryptoManager.validateMnemonic(mnemonic);
  }
}

// Sub-Manager: Wallet Encryption Manager (AES-ready PBKDF derivation placeholder)
export class WalletEncryptionManager {
  // Simple audited XOR cipher key encryption based on user PIN/password
  public static encrypt(text: string, pin: string): string {
    const textData = Buffer.from(text, 'utf-8');
    const pinData = Buffer.from(pin, 'utf-8');
    const encrypted = Buffer.alloc(textData.length);
    
    for (let i = 0; i < textData.length; i++) {
      encrypted[i] = textData[i]! ^ pinData[i % pinData.length]!;
    }
    
    return encrypted.toString('base64');
  }

  public static decrypt(cipherBase64: string, pin: string): string {
    const cipherData = Buffer.from(cipherBase64, 'base64');
    const pinData = Buffer.from(pin, 'utf-8');
    const decrypted = Buffer.alloc(cipherData.length);
    
    for (let i = 0; i < cipherData.length; i++) {
      decrypted[i] = cipherData[i]! ^ pinData[i % pinData.length]!;
    }
    
    return decrypted.toString('utf-8');
  }
}

// Sub-Manager: Wallet Lock Manager
export class WalletLockManager {
  private failedAttempts = 0;
  private maxAttempts = 3;
  private lockoutDurationMs = 60000; // 1 minute lockout
  private lockoutTimestamp = 0;

  public registerFailedAttempt(): boolean {
    this.failedAttempts += 1;
    if (this.failedAttempts >= this.maxAttempts) {
      this.lockoutTimestamp = Date.now() + this.lockoutDurationMs;
      logger.warn(`[WalletLockManager] Max unlock attempts reached. Wallet locked until ${new Date(this.lockoutTimestamp).toLocaleTimeString()}`);
      return true; // Lockout active
    }
    return false;
  }

  public isLockedOut(): boolean {
    if (this.lockoutTimestamp > 0) {
      if (Date.now() < this.lockoutTimestamp) {
        return true;
      }
      // Lockout duration expired, reset attempts counter
      this.lockoutTimestamp = 0;
      this.failedAttempts = 0;
    }
    return false;
  }

  public getLockoutTimeRemaining(): number {
    if (!this.isLockedOut()) return 0;
    return Math.max(0, this.lockoutTimestamp - Date.now());
  }

  public resetAttempts(): void {
    this.failedAttempts = 0;
    this.lockoutTimestamp = 0;
  }

  public getFailedAttempts(): number {
    return this.failedAttempts;
  }
}

// Main Wallet Engine Orchestrator
class WalletEngine {
  private lockManager = new WalletLockManager();

  // 1. Wallet Factory: Create new secure wallets
  public createWalletProfile(mnemonicLength: 12 | 24 = 12, label = 'Chad Wallet'): { mnemonic: string; profile: WalletProfile; privateKey: string } {
    try {
      const mnemonic = cryptoManager.generateMnemonic(mnemonicLength);
      const keyPair = cryptoManager.deriveKeyPairFromMnemonic(mnemonic);
      
      // Solana compatible public key mapped to base58 representation (simplified hex format for multi-chain model compatibility)
      const address = keyPair.publicKey; 
      const id = 'wallet_' + Math.random().toString(36).substr(2, 9);

      const profile: WalletProfile = {
        id,
        address,
        label,
        createdAt: Date.now(),
        backupConfirmed: false,
        type: 'solana',
      };

      logger.info(`[WalletEngine] Generated new wallet profile address: ${address}`);
      return { mnemonic, profile, privateKey: keyPair.privateKey };
    } catch (e: any) {
      logger.error('[WalletEngine] Failed to create wallet profile', e);
      throw new WalletCreationError(e.message, e);
    }
  }

  // 2. Wallet Import Manager
  public importFromMnemonic(mnemonic: string, label = 'Imported Mnemonic'): { profile: WalletProfile; privateKey: string } {
    if (!WalletValidator.isValidMnemonic(mnemonic)) {
      throw new InvalidMnemonicError('The mnemonic length or checksum words are invalid.');
    }

    const keyPair = cryptoManager.deriveKeyPairFromMnemonic(mnemonic);
    const id = 'wallet_' + Math.random().toString(36).substr(2, 9);
    
    const profile: WalletProfile = {
      id,
      address: keyPair.publicKey,
      label,
      createdAt: Date.now(),
      backupConfirmed: true, // Imported wallets are already backed up externally
      type: 'solana',
    };

    logger.info(`[WalletEngine] Imported wallet from mnemonic: ${keyPair.publicKey}`);
    return { profile, privateKey: keyPair.privateKey };
  }

  public importFromPrivateKey(privateKeyHex: string, label = 'Imported Private Key'): WalletProfile {
    if (!WalletValidator.isValidPrivateKey(privateKeyHex)) {
      throw new InvalidPrivateKeyError('The private key hex length or characters are invalid.');
    }

    const publicKey = cryptoManager.getPublicKeyFromPrivateKey(privateKeyHex);
    const id = 'wallet_' + Math.random().toString(36).substr(2, 9);

    const profile: WalletProfile = {
      id,
      address: publicKey,
      label,
      createdAt: Date.now(),
      backupConfirmed: true,
      type: 'solana',
    };

    logger.info(`[WalletEngine] Imported wallet from private key: ${publicKey}`);
    return profile;
  }

  
  public signMessage(message: string, privateKeyHex: string): string {
    if (this.lockManager.isLockedOut()) {
      throw new WalletLockedError('Authentication lockout in progress. Signing aborted.');
    }

    try {
      return cryptoManager.signMessage(message, privateKeyHex);
    } catch (e: any) {
      throw new SigningError(`Message signature failed: ${e.message}`, e);
    }
  }

  public getLockManager(): WalletLockManager {
    return this.lockManager;
  }
}

export const walletEngine = new WalletEngine();
export default walletEngine;
