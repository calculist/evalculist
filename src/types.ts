/**
 * Token type constants used during parsing
 */
export const TokenType = {
  EXPRESSION: 'x',
  VARIABLE: 'v',
  OPEN_PAREN: '(',
  CLOSE_PAREN: ')',
  OPEN_SQUARE: '[',
  CLOSE_SQUARE: ']',
  DOT: '.',
  EQUALS: '=',
  SEMICOLON: ';',
} as const;

export type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType];

/**
 * Token structure: [type, value, parenDepth, bracketDepth]
 */
export type Token = readonly [
  type: TokenTypeValue,
  value: string,
  parenDepth: number,
  squareBracketDepth: number,
];

/**
 * Handler function for resolving variable names
 */
export type VariableHandler = (name: string) => unknown;

/**
 * Handler function for property access (dot or bracket notation)
 */
export type AccessorHandler = (object: unknown, key: string | number) => unknown;

/**
 * Handler function for variable assignment
 */
export type AssignmentHandler = (name: string, value: unknown) => unknown;

/**
 * Configuration object for handler functions
 */
export interface Handlers {
  /** Resolves variable names to values */
  variable: VariableHandler;
  /** Generic accessor for both dot and bracket notation (fallback) */
  accessor?: AccessorHandler;
  /** Accessor for dot notation (obj.key) */
  dotAccessor?: AccessorHandler;
  /** Accessor for bracket notation (obj[key]) */
  bracketAccessor?: AccessorHandler;
  /** Handles variable assignment */
  assignment?: AssignmentHandler;
}

/**
 * Function returned by evalculist.new() for evaluating expressions
 */
export type Evaluator = (code: string) => unknown;

/**
 * Security configuration options for safe handlers
 */
export interface SecurityOptions {
  /** Properties explicitly allowed (if set, only these are allowed) */
  allowedProperties?: Set<string>;
  /** Properties explicitly blocked */
  blockedProperties?: Set<string>;
  /** Maximum nesting depth for property access */
  maxDepth?: number;
  /** Maximum number of tokens allowed in an expression */
  maxTokens?: number;
  /** Allow access to __proto__ and related properties */
  allowPrototypeAccess?: boolean;
  /** Allow access to constructor property */
  allowConstructorAccess?: boolean;
}

/**
 * Result of input validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Safe handlers with security violation tracking
 */
export interface SafeHandlers extends Handlers {
  /** List of security violations encountered */
  readonly securityViolations: string[];
  /** Clear the violations list */
  clearViolations(): void;
}

/**
 * Internal function type for compiled expression executors
 */
export type CompiledExecutor = (
  variable: VariableHandler,
  bracketAccessor: AccessorHandler,
  dotAccessor: AccessorHandler,
  assignment: AssignmentHandler,
) => unknown;
