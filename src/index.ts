import { tokenize, restoreEscapedQuotes } from './tokenizer.js';
import { compileLines } from './compiler.js';
import { createExecutor } from './executor.js';
import {
  defaultContext,
  defaultVariable,
  defaultAccessor,
  defaultAssignment,
  createHandlersFromContext,
} from './handlers/default.js';
import type { Handlers, Evaluator } from './types.js';

// Re-export types
export type {
  Token,
  TokenTypeValue,
  Handlers,
  Evaluator,
  VariableHandler,
  AccessorHandler,
  AssignmentHandler,
  SecurityOptions,
  SafeHandlers,
  ValidationResult,
} from './types.js';

export { TokenType } from './types.js';

// Re-export handler utilities
export {
  createSafeHandlers,
  validateInput,
  BLOCKED_PROPERTIES,
  BLOCKED_GLOBALS,
} from './handlers/safe.js';

export { createHandlersFromContext } from './handlers/default.js';

/**
 * Main evalculist function.
 *
 * @param code - The expression to evaluate
 * @param handlersOrDebug - Handlers object, or `true` to return compiled code
 * @returns The result of evaluation, a function to execute later, or the compiled string
 *
 * @example
 * // With handlers - execute immediately
 * const result = evalculist('x + 1', {
 *   variable: (name) => ({ x: 5 })[name]
 * });
 * // result === 6
 *
 * @example
 * // Without handlers - return function for later execution
 * const fn = evalculist('x + 1');
 * const result = fn({ variable: (name) => ({ x: 5 })[name] });
 * // result === 6
 *
 * @example
 * // Debug mode - return compiled code string
 * const compiled = evalculist('x + 1', true);
 * // compiled === 'variable("x") + 1'
 */
function evalculist(code: string, debug: true): string;
function evalculist(code: string, handlers: Handlers): unknown;
function evalculist(code: string): (handlers: Handlers) => unknown;
function evalculist(
  code: string,
  handlersOrDebug?: Handlers | true,
): string | unknown | ((handlers: Handlers) => unknown) {
  // Tokenize the input
  const tokenLines = tokenize(code);

  // Compile tokens to code strings
  let compiledLines = compileLines(tokenLines);

  // Restore escaped quotes
  compiledLines = compiledLines.map(restoreEscapedQuotes);

  // Debug mode - return compiled code string
  if (handlersOrDebug === true) {
    return compiledLines.join(';');
  }

  // Create executor function
  const executor = createExecutor(compiledLines);

  // No handlers provided - return curried function
  if (!handlersOrDebug) {
    return (handlers: Handlers): unknown => {
      const variable = handlers.variable;
      const bracketAccessor = handlers.bracketAccessor || handlers.accessor || defaultAccessor;
      const dotAccessor = handlers.dotAccessor || handlers.accessor || defaultAccessor;
      const assignment = handlers.assignment || defaultAssignment;
      return executor(variable, bracketAccessor, dotAccessor, assignment);
    };
  }

  // Execute with provided handlers
  const handlers = handlersOrDebug;
  const variable = handlers.variable;
  const bracketAccessor = handlers.bracketAccessor || handlers.accessor || defaultAccessor;
  const dotAccessor = handlers.dotAccessor || handlers.accessor || defaultAccessor;
  const assignment = handlers.assignment || defaultAssignment;

  return executor(variable, bracketAccessor, dotAccessor, assignment);
}

/**
 * Default shared context object.
 * Used by the default handlers when no context is provided.
 */
evalculist.context = defaultContext;

/**
 * Default variable handler.
 */
evalculist.variable = defaultVariable;

/**
 * Default accessor handler.
 */
evalculist.accessor = defaultAccessor;

/**
 * Default assignment handler.
 */
evalculist.assignment = defaultAssignment;

/**
 * Create a reusable evaluator function with fixed handlers.
 *
 * @param handlers - Optional handlers to use for all evaluations
 * @returns Evaluator function that takes code and returns the result
 *
 * @example
 * const evaluate = evalculist.new({
 *   variable: (name) => myContext[name],
 *   accessor: (obj, key) => obj[key]
 * });
 * const result = evaluate('foo.bar + 1');
 */
evalculist.new = function (handlers?: Handlers): Evaluator {
  return (code: string): unknown => {
    if (handlers) {
      return evalculist(code, handlers);
    }
    // Use default handlers if none provided
    return evalculist(code, {
      variable: defaultVariable,
      accessor: defaultAccessor,
      assignment: defaultAssignment,
    });
  };
};

/**
 * Create a reusable evaluator from a simple context object.
 *
 * @param context - Object containing variables and functions to expose
 * @returns Evaluator function that uses the context for variable resolution
 *
 * @example
 * const evaluate = evalculist.newFromContext({
 *   x: 10,
 *   y: 20,
 *   add: (a, b) => a + b
 * });
 * const result = evaluate('add(x, y)'); // 30
 */
evalculist.newFromContext = function <T extends Record<string, unknown>>(
  context: T,
): Evaluator {
  const handlers = createHandlersFromContext(context);
  return (code: string): unknown => evalculist(code, handlers);
};

// Default export
export default evalculist;

// Named export for ESM
export { evalculist };
