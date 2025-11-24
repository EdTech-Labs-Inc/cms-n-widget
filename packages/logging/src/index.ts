/**
 * @repo/logging
 * Structured logging for the CMS platform
 *
 * This package provides Winston-based structured logging with:
 * - Multiple log levels (error, warn, info, debug, etc.)
 * - Correlation IDs for request tracking
 * - Structured metadata
 * - Environment-based formatting
 * - Helper functions for common logging patterns
 *
 * Replaces all console.log statements with proper structured logging.
 */

// ============================================
// LOGGER
// ============================================
export { logger, createLogger, Logger, winston } from './logger';

// ============================================
// TYPES
// ============================================
export type { LogLevel, LogMeta, Logger as ILogger, LoggerOptions } from './types';

// ============================================
// HELPERS
// ============================================
export {
  generateCorrelationId,
  createCorrelatedLogger,
  logRequestStart,
  logRequestEnd,
  logJobStart,
  logJobComplete,
  logJobFailure,
  logServiceCall,
  logServiceResponse,
  logDatabaseQuery,
  logMediaProcessingStart,
  logMediaProcessingComplete,
  logMediaProcessingError,
  PerformanceTimer,
  startTimer,
  sanitizeLogData,
  safeStringify,
} from './helpers';
