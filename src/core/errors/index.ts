/**
 * Production-ready Custom Error Classes for ChadWallet
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(
    code: string,
    message: string,
    public readonly statusCode?: number,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    code: string,
    message: string,
    public readonly fields?: Record<string, string>,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiError extends AppError {
  constructor(
    code: string,
    message: string,
    public readonly statusCode?: number,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RpcError extends AppError {
  constructor(
    code: string,
    message: string,
    public readonly endpoint?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'RpcError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WalletError extends AppError {
  constructor(
    code: string,
    message: string,
    public readonly walletAddress?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'WalletError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TradingError extends AppError {
  constructor(
    code: string,
    message: string,
    public readonly quoteId?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'TradingError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RepositoryError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'RepositoryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownError extends AppError {
  constructor(
    message: string,
    details?: unknown
  ) {
    super('UNKNOWN_ERROR', message, details);
    this.name = 'UnknownError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor(
    message: string = 'Session has expired. Please log in again.',
    details?: unknown
  ) {
    super('SESSION_EXPIRED', message, details);
    this.name = 'SessionExpiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(
    message: string = 'Invalid credentials provided.',
    details?: unknown
  ) {
    super('INVALID_CREDENTIALS', message, details);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkAuthenticationError extends AuthenticationError {
  constructor(
    message: string = 'Network failure during authentication.',
    details?: unknown
  ) {
    super('NETWORK_AUTHENTICATION_ERROR', message, details);
    this.name = 'NetworkAuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownAuthenticationError extends AuthenticationError {
  constructor(
    message: string = 'An unknown authentication error occurred.',
    details?: unknown
  ) {
    super('UNKNOWN_AUTHENTICATION_ERROR', message, details);
    this.name = 'UnknownAuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WalletCreationError extends WalletError {
  constructor(message: string = 'Failed to create wallet.', details?: unknown) {
    super('WALLET_CREATION_FAILED', message, undefined, details);
    this.name = 'WalletCreationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WalletImportError extends WalletError {
  constructor(message: string = 'Failed to import wallet.', details?: unknown) {
    super('WALLET_IMPORT_FAILED', message, undefined, details);
    this.name = 'WalletImportError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WalletLockedError extends WalletError {
  constructor(message: string = 'Wallet is currently locked.', details?: unknown) {
    super('WALLET_LOCKED', message, undefined, details);
    this.name = 'WalletLockedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidMnemonicError extends WalletError {
  constructor(message: string = 'Invalid mnemonic checksum or length.', details?: unknown) {
    super('INVALID_MNEMONIC', message, undefined, details);
    this.name = 'InvalidMnemonicError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidPrivateKeyError extends WalletError {
  constructor(message: string = 'Invalid private key format.', details?: unknown) {
    super('INVALID_PRIVATE_KEY', message, undefined, details);
    this.name = 'InvalidPrivateKeyError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SigningError extends WalletError {
  constructor(message: string = 'Transaction signing error.', details?: unknown) {
    super('SIGNING_FAILED', message, undefined, details);
    this.name = 'SigningError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BackupRequiredError extends WalletError {
  constructor(message: string = 'Wallet backup required before proceeding.', details?: unknown) {
    super('BACKUP_REQUIRED', message, undefined, details);
    this.name = 'BackupRequiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

