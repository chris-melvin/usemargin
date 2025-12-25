/**
 * Error codes for server actions
 */
export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  CONFLICT: "CONFLICT",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Result type for server actions - discriminated union for type-safe error handling
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

/**
 * Helper to create a success result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function error<T>(message: string, code: ErrorCode): ActionResult<T> {
  return { success: false, error: message, code };
}

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T>(
  result: ActionResult<T>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if result is an error
 */
export function isError<T>(
  result: ActionResult<T>
): result is { success: false; error: string; code: ErrorCode } {
  return result.success === false;
}

/**
 * Unwrap a successful result or throw
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(result.error);
}

/**
 * Map over a successful result
 */
export function map<T, U>(
  result: ActionResult<T>,
  fn: (data: T) => U
): ActionResult<U> {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  return result;
}
