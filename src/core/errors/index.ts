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
