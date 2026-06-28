import { logger } from '../../utils/logger';

class SecurityPipelineManager {
  private sensitiveKeys = new Set(['password', 'privateKey', 'secret', 'seed', 'mnemonic', 'accessToken', 'refreshToken', 'token']);

  // 1. Input Sanitization: Strips potential XSS script tags and basic injection signatures
  public sanitizeInput(input: string): string {
    if (!input) return input;
    // Strip HTML script tags
    let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip SQL injection comment characters
    clean = clean.replace(/(--|#|\/\*|\*\/)/g, '');
    return clean;
  }

  // 2. Output Sanitization
  public sanitizeOutput(output: string): string {
    return this.sanitizeInput(output);
  }

  // 3. Sensitive Data Masking: Mask credentials in request logs recursively
  public maskSensitiveData(data: unknown): unknown {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    const masked: Record<string, unknown> = {};
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (this.sensitiveKeys.has(key)) {
        masked[key] = '********';
      } else if (typeof value === 'object') {
        masked[key] = this.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    });

    return masked;
  }

  // 4. Security Event Logger
  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', metadata?: Record<string, unknown>): void {
    const maskedMeta = metadata ? this.maskSensitiveData(metadata) : {};
    logger.warn(`[SECURITY EVENT] [Severity: ${severity.toUpperCase()}] Event: ${event} | Details: ${JSON.stringify(maskedMeta)}`);
    // In actual production, this aggregates and forwards to security SIEM tools (e.g. Datadog SIEM, Splunk)
  }

  // 5. Payload Validation checks (schema structure matching ready)
  public validatePayload(payload: unknown, requiredFields: string[]): { isValid: boolean; missingFields: string[] } {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, missingFields: requiredFields };
    }

    const obj = payload as Record<string, unknown>;
    const missingFields = requiredFields.filter(field => obj[field] === undefined || obj[field] === null || obj[field] === '');
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  // 6. Response Validation check
  public validateResponse<T>(response: T, validator: (res: T) => boolean): boolean {
    try {
      const isValid = validator(response);
      if (!isValid) {
        this.logSecurityEvent('API response failed validation schema check', 'high');
      }
      return isValid;
    } catch (e) {
      this.logSecurityEvent('Exception during API response schema validation', 'high', { error: String(e) });
      return false;
    }
  }
}

export const securityPipelineManager = new SecurityPipelineManager();
export default securityPipelineManager;
