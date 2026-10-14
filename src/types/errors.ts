export enum ErrorCategory {
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'FORBIDDEN_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

export interface DomainError extends Error {
  code: string
  statusCode: number
  category: ErrorCategory
  meta?: Record<string, any>
  originalError?: Error
}

export class AppError extends Error implements DomainError {
  public readonly code: string
  public readonly statusCode: number
  public readonly category: ErrorCategory
  public readonly meta?: Record<string, any>
  public readonly originalError?: Error

  constructor(
    message: string,
    code: string,
    statusCode: number,
    category: ErrorCategory,
    meta?: Record<string, any>,
    originalError?: Error,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.category = category
    this.meta = meta
    this.originalError = originalError

    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`
    }

    Error.captureStackTrace(this, this.constructor)
  }

  static notFound = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'not_found', 404, ErrorCategory.NOT_FOUND, meta)

  static validation = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'validation_error', 400, ErrorCategory.VALIDATION, meta)

  static unauthorized = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'unauthorized', 401, ErrorCategory.AUTHENTICATION, meta)

  static forbidden = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'forbidden', 403, ErrorCategory.AUTHORIZATION, meta)

  static conflict = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'conflict', 409, ErrorCategory.CONFLICT, meta)

  static rateLimit = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'rate_limited', 429, ErrorCategory.RATE_LIMIT, meta)

  static timeout = (message: string, meta?: Record<string, any>) =>
    new AppError(message, 'timeout', 408, ErrorCategory.TIMEOUT, meta)

  static database = (message: string, originalError?: Error, meta?: Record<string, any>) =>
    new AppError(message, 'database_error', 500, ErrorCategory.DATABASE, meta, originalError)

  static externalApi = (message: string, originalError?: Error, meta?: Record<string, any>) =>
    new AppError(message, 'external_api_error', 502, ErrorCategory.EXTERNAL_API, meta, originalError)

  static internal = (message: string, originalError?: Error, meta?: Record<string, any>) =>
    new AppError(message, 'internal_error', 500, ErrorCategory.INTERNAL, meta, originalError)
}

/**
 * Error class for errors that should display a user-friendly message.
 * Use this when:
 * - The error is caused by user input
 * - The user can take action to fix the problem
 * - Technical details need translation to plain language
 */
export class UserFacingError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly userMessage: string
  public readonly meta?: Record<string, any>

  constructor(
    message: string,
    userMessage: string,
    code: string = 'validation_error',
    statusCode: number = 400,
    meta?: Record<string, any>,
  ) {
    super(message)
    this.name = 'UserFacingError'
    this.code = code
    this.statusCode = statusCode
    this.userMessage = userMessage
    this.meta = meta
    Error.captureStackTrace(this, this.constructor)
  }

  static validation = (message: string, userMessage: string, meta?: Record<string, any>) =>
    new UserFacingError(message, userMessage, 'validation_error', 400, meta)

  static badRequest = (message: string, userMessage: string, meta?: Record<string, any>) =>
    new UserFacingError(message, userMessage, 'bad_request', 400, meta)

  static conflict = (message: string, userMessage: string, meta?: Record<string, any>) =>
    new UserFacingError(message, userMessage, 'conflict', 409, meta)
}
