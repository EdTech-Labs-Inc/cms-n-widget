/**
 * Winston Logger Configuration
 *
 * Provides structured logging with support for:
 * - Multiple log levels (error, warn, info, debug, etc.)
 * - Correlation IDs for request tracking
 * - Structured metadata
 * - Environment-based formatting (pretty in dev, JSON in prod)
 * - File and console transports
 */

import winston from 'winston';
import type { LogLevel, LogMeta, LoggerOptions } from './types';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/**
 * Determine log level from environment
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels: LogLevel[] = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

  if (envLevel && validLevels.includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }

  // Default based on environment
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Check if running in development
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Pretty format for development
 */
const devFormat = printf(({ level, message, timestamp, service, correlationId, ...meta }) => {
  let log = `${timestamp} [${level}]`;

  if (service) {
    log += ` [${service}]`;
  }

  if (correlationId) {
    log += ` [${correlationId}]`;
  }

  log += `: ${message}`;

  // Add metadata if present
  const metaKeys = Object.keys(meta);
  if (metaKeys.length > 0) {
    // Remove winston internal fields
    const filteredMeta = { ...meta };
    delete filteredMeta.level;
    delete filteredMeta.message;
    delete filteredMeta.timestamp;

    const filteredKeys = Object.keys(filteredMeta);
    if (filteredKeys.length > 0) {
      log += `\n${JSON.stringify(filteredMeta, null, 2)}`;
    }
  }

  return log;
});

/**
 * Production format (JSON)
 */
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

/**
 * Development format (pretty colored)
 */
const developmentFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  errors({ stack: true }),
  devFormat
);

/**
 * Create Winston logger instance
 */
function createWinstonLogger(options: LoggerOptions = {}): winston.Logger {
  const {
    level = getLogLevel(),
    service = 'cms-platform',
    silent = false,
    prettyPrint = isDevelopment(),
  } = options;

  const logger = winston.createLogger({
    level,
    silent,
    defaultMeta: { service },
    format: prettyPrint ? developmentFormat : prodFormat,
    transports: [
      // Console transport
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  });

  // Add file transports in production
  if (!isDevelopment() && !silent) {
    logger.add(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    logger.add(
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return logger;
}

/**
 * Default logger instance
 */
const defaultLogger = createWinstonLogger();

/**
 * Logger class with convenience methods
 */
export class Logger {
  private logger: winston.Logger;

  constructor(options: LoggerOptions = {}) {
    this.logger = createWinstonLogger(options);
  }

  /**
   * Log error message
   */
  error(message: string, meta?: LogMeta): void {
    this.logger.error(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: LogMeta): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: LogMeta): void {
    this.logger.info(message, meta);
  }

  /**
   * Log HTTP request
   */
  http(message: string, meta?: LogMeta): void {
    this.logger.http(message, meta);
  }

  /**
   * Log verbose message
   */
  verbose(message: string, meta?: LogMeta): void {
    this.logger.verbose(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: LogMeta): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log silly/trace message
   */
  silly(message: string, meta?: LogMeta): void {
    this.logger.silly(message, meta);
  }

  /**
   * Create child logger with additional default metadata
   */
  child(defaultMeta: LogMeta): Logger {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(defaultMeta);
    return childLogger;
  }
}

/**
 * Default logger export
 */
export const logger = new Logger();

/**
 * Create a new logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

/**
 * Export Winston for advanced use cases
 */
export { winston };
