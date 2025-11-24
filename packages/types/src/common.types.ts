/**
 * Common utility types used across the application
 */

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Make all properties nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Make all properties optional
 */
export type Optional<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// ============================================
// RESULT/ERROR TYPES
// ============================================

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================
// FILTER TYPES
// ============================================

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

// ============================================
// TIMESTAMP TYPES
// ============================================

export interface Timestamps {
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SoftDeleteTimestamps extends Timestamps {
  deletedAt?: string | Date | null;
}

// ============================================
// ID TYPES
// ============================================

export type UUID = string;
export type EntityId = string | number;

// ============================================
// LOADING/ERROR STATE TYPES
// ============================================

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface DataState<T> extends LoadingState {
  data?: T | null;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// ============================================
// FORM TYPES
// ============================================

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================
// CALLBACK TYPES
// ============================================

export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;
export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>;

// ============================================
// CONSTRUCTOR TYPES
// ============================================

export type Constructor<T = {}> = new (...args: any[]) => T;
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;

// ============================================
// JSON TYPES
// ============================================

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// ============================================
// TYPE GUARDS
// ============================================

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T = any>(value: any): value is T[] {
  return Array.isArray(value);
}

export function isPromise<T = any>(value: any): value is Promise<T> {
  return value instanceof Promise || (isObject(value) && typeof value.then === 'function');
}
