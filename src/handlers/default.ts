import {
  Handlers,
  VariableHandler,
  AccessorHandler,
  AssignmentHandler,
} from '../types.js';

/**
 * Default shared context for the default handlers
 */
export const defaultContext: Record<string, unknown> = {};

/**
 * Default variable handler - looks up values in the default context
 */
export const defaultVariable: VariableHandler = (name: string): unknown => {
  return defaultContext[name];
};

/**
 * Default accessor handler - simple property access
 */
export const defaultAccessor: AccessorHandler = (
  object: unknown,
  key: string | number,
): unknown => {
  if (object == null) return undefined;
  return (object as Record<string | number, unknown>)[key];
};

/**
 * Default assignment handler - assigns to the default context
 */
export const defaultAssignment: AssignmentHandler = (
  name: string,
  value: unknown,
): unknown => {
  defaultContext[name] = value;
  return value;
};

/**
 * Create default handlers object
 */
export function createDefaultHandlers(): Handlers {
  return {
    variable: defaultVariable,
    accessor: defaultAccessor,
    assignment: defaultAssignment,
  };
}

/**
 * Create handlers from a simple context object
 *
 * @param context - Object to use as the variable context
 * @returns Handlers configured to use the context
 */
export function createHandlersFromContext(
  context: Record<string, unknown>,
): Handlers {
  return {
    variable: (name: string): unknown => context[name],
    accessor: (object: unknown, key: string | number): unknown => {
      if (object == null) return undefined;
      return (object as Record<string | number, unknown>)[key];
    },
    assignment: (name: string, value: unknown): unknown => {
      context[name] = value;
      return value;
    },
  };
}
