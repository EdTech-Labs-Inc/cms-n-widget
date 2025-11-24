/**
 * Logging helper functions
 */

import { logger } from './logger';
import type { LogMeta } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Create a logger with correlation ID
 */
export function createCorrelatedLogger(correlationId?: string) {
  const id = correlationId || generateCorrelationId();
  return logger.child({ correlationId: id });
}

/**
 * Log request start
 */
export function logRequestStart(
  method: string,
  url: string,
  meta?: LogMeta
): void {
  logger.http('Request started', {
    method,
    url,
    ...meta,
  });
}

/**
 * Log request end
 */
export function logRequestEnd(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  meta?: LogMeta
): void {
  logger.http('Request completed', {
    method,
    url,
    statusCode,
    durationMs: duration,
    ...meta,
  });
}

/**
 * Log job start
 */
export function logJobStart(
  jobId: string,
  jobName: string,
  meta?: LogMeta
): void {
  logger.info('Job started', {
    jobId,
    jobName,
    ...meta,
  });
}

/**
 * Log job completion
 */
export function logJobComplete(
  jobId: string,
  jobName: string,
  duration?: number,
  meta?: LogMeta
): void {
  logger.info('Job completed', {
    jobId,
    jobName,
    durationMs: duration,
    ...meta,
  });
}

/**
 * Log job failure
 */
export function logJobFailure(
  jobId: string,
  jobName: string,
  error: Error | string,
  meta?: LogMeta
): void {
  logger.error('Job failed', {
    jobId,
    jobName,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  });
}

/**
 * Log external service call
 */
export function logServiceCall(
  service: string,
  operation: string,
  meta?: LogMeta
): void {
  logger.debug(`Calling ${service}: ${operation}`, {
    service,
    operation,
    ...meta,
  });
}

/**
 * Log external service response
 */
export function logServiceResponse(
  service: string,
  operation: string,
  success: boolean,
  duration?: number,
  meta?: LogMeta
): void {
  const level = success ? 'debug' : 'warn';
  const message = `${service} ${operation}: ${success ? 'success' : 'failed'}`;

  logger[level](message, {
    service,
    operation,
    success,
    durationMs: duration,
    ...meta,
  });
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  query: string,
  duration?: number,
  meta?: LogMeta
): void {
  logger.debug('Database query', {
    query,
    durationMs: duration,
    ...meta,
  });
}

/**
 * Log media processing start
 */
export function logMediaProcessingStart(
  type: string,
  id: string,
  meta?: LogMeta
): void {
  logger.info(`${type} processing started`, {
    mediaType: type,
    mediaId: id,
    ...meta,
  });
}

/**
 * Log media processing complete
 */
export function logMediaProcessingComplete(
  type: string,
  id: string,
  duration?: number,
  meta?: LogMeta
): void {
  logger.info(`${type} processing completed`, {
    mediaType: type,
    mediaId: id,
    durationMs: duration,
    ...meta,
  });
}

/**
 * Log media processing error
 */
export function logMediaProcessingError(
  type: string,
  id: string,
  error: Error | string,
  meta?: LogMeta
): void {
  logger.error(`${type} processing failed`, {
    mediaType: type,
    mediaId: id,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  });
}

/**
 * Performance timer helper
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  /**
   * End timer and log duration
   */
  end(meta?: LogMeta): number {
    const duration = Date.now() - this.startTime;
    logger.debug(`${this.label} completed`, {
      durationMs: duration,
      ...meta,
    });
    return duration;
  }

  /**
   * Get current duration without logging
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Create a performance timer
 */
export function startTimer(label: string): PerformanceTimer {
  return new PerformanceTimer(label);
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'secret',
    'privateKey',
    'private_key',
    'authorization',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Safe stringify with circular reference handling
 */
export function safeStringify(obj: any): string {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}
