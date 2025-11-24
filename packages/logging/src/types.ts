/**
 * Logging types and interfaces
 */

/**
 * Log levels (Winston standard)
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

/**
 * Log metadata interface
 * Structured data to be logged alongside the message
 */
export interface LogMeta {
  // Correlation ID for tracking requests across services
  correlationId?: string;

  // User/profile information
  userId?: string;
  profileId?: string;
  organizationId?: string;

  // Request information
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;

  // Job/queue information
  jobId?: string;
  jobName?: string;
  queueName?: string;

  // Media processing information
  submissionId?: string;
  articleId?: string;
  videoId?: string;
  audioId?: string;
  quizId?: string;

  // External service information
  service?: string;
  serviceRequestId?: string;

  // Error information
  error?: Error | string;
  stack?: string;
  errorCode?: string;

  // Performance metrics
  duration?: number;
  durationMs?: number;

  // Any additional structured data
  [key: string]: any;
}

/**
 * Logger interface
 */
export interface Logger {
  error(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  http(message: string, meta?: LogMeta): void;
  verbose(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  silly(message: string, meta?: LogMeta): void;
}

/**
 * Logger options
 */
export interface LoggerOptions {
  level?: LogLevel;
  service?: string;
  silent?: boolean;
  prettyPrint?: boolean;
}
