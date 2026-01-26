import {
  CompiledExecutor,
  VariableHandler,
  AccessorHandler,
  AssignmentHandler,
} from './types.js';

// Function parameter names for the compiled executor
const VAR_FUNCTION_NAME = 'variable';
const SQUARE_ACC_FUNCTION_NAME = 'bracketAccessor';
const DOT_ACC_FUNCTION_NAME = 'dotAccessor';
const ASSIGN_FUNCTION_NAME = 'assignment';

/**
 * Create an executable function from compiled code lines.
 *
 * @param compiledLines - Array of compiled JavaScript code strings
 * @returns Executor function that takes handler functions and returns the result
 */
export function createExecutor(compiledLines: string[]): CompiledExecutor {
  // Add return statement to the last line
  const lines = [...compiledLines];
  if (lines.length > 0) {
    lines[lines.length - 1] = 'return ' + lines[lines.length - 1];
  }

  const code = "'use strict';" + lines.join(';');

  // Create function with handler parameters
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    VAR_FUNCTION_NAME,
    SQUARE_ACC_FUNCTION_NAME,
    DOT_ACC_FUNCTION_NAME,
    ASSIGN_FUNCTION_NAME,
    code,
  ) as CompiledExecutor;

  return fn;
}

/**
 * Execute compiled code with the given handlers.
 *
 * @param executor - The compiled executor function
 * @param variable - Handler for variable resolution
 * @param bracketAccessor - Handler for bracket property access
 * @param dotAccessor - Handler for dot property access
 * @param assignment - Handler for variable assignment
 * @returns The result of evaluating the expression
 */
export function execute(
  executor: CompiledExecutor,
  variable: VariableHandler,
  bracketAccessor: AccessorHandler,
  dotAccessor: AccessorHandler,
  assignment: AssignmentHandler,
): unknown {
  return executor(variable, bracketAccessor, dotAccessor, assignment);
}

/**
 * Default no-op assignment handler
 */
export const defaultAssignment: AssignmentHandler = () => undefined;
