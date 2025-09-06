import { GraphQLError } from "graphql";

export const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_USER_INPUT: 'BAD_USER_INPUT',
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export function notFoundError(resource: string, id: string) {
  return new GraphQLError(`${resource} with ID ${id} not found`, {
    extensions: { code: ERROR_CODES.NOT_FOUND }
  });
}

export function validationError(field: string, message: string) {
  return new GraphQLError(`${field}: ${message}`, {
    extensions: { code: ERROR_CODES.VALIDATION_ERROR, field }
  });
}

export function forbiddenError(action: string) {
  return new GraphQLError(`You don't have permission to ${action}`, {
    extensions: { code: ERROR_CODES.FORBIDDEN }
  });
}

export function conflictError(resource: string, message?: string) {
  return new GraphQLError(message || `${resource} already exists`, {
    extensions: { code: ERROR_CODES.CONFLICT }
  });
}