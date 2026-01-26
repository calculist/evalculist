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

// ============================================================================
// AST Node Types
// ============================================================================

/**
 * Variable reference node
 * Example: `foo` → { type: 'Variable', name: 'foo' }
 */
export interface VariableNode {
  type: 'Variable';
  name: string;
}

/**
 * Literal value node (numbers, strings, booleans, null)
 * Example: `42` → { type: 'Literal', value: 42 }
 */
export interface LiteralNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

/**
 * Dot property access node
 * Example: `obj.prop` → { type: 'DotAccess', object: {...}, property: 'prop' }
 */
export interface DotAccessNode {
  type: 'DotAccess';
  object: ASTNode;
  property: string;
}

/**
 * Bracket property access node
 * Example: `arr[0]` → { type: 'BracketAccess', object: {...}, key: {...} }
 */
export interface BracketAccessNode {
  type: 'BracketAccess';
  object: ASTNode;
  key: ASTNode;
}

/**
 * Function call node
 * Example: `fn(a, b)` → { type: 'Call', callee: {...}, arguments: [...] }
 */
export interface CallNode {
  type: 'Call';
  callee: ASTNode;
  arguments: ASTNode[];
}

/**
 * Assignment node
 * Example: `x = 5` → { type: 'Assignment', name: 'x', value: {...} }
 */
export interface AssignmentNode {
  type: 'Assignment';
  name: string;
  value: ASTNode;
}

/**
 * Binary operation node
 * Example: `a + b` → { type: 'BinaryOp', operator: '+', left: {...}, right: {...} }
 */
export interface BinaryOpNode {
  type: 'BinaryOp';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

/**
 * Unary operation node
 * Example: `!x` → { type: 'UnaryOp', operator: '!', operand: {...} }
 */
export interface UnaryOpNode {
  type: 'UnaryOp';
  operator: string;
  operand: ASTNode;
}

/**
 * Array literal node
 * Example: `[1, 2, 3]` → { type: 'Array', elements: [...] }
 */
export interface ArrayNode {
  type: 'Array';
  elements: ASTNode[];
}

/**
 * Object literal node
 * Example: `{"a": 1}` → { type: 'Object', properties: [...] }
 */
export interface ObjectNode {
  type: 'Object';
  properties: { key: string; value: ASTNode }[];
}

/**
 * Sequence of expressions (multiple statements)
 * Example: `a; b; c` → { type: 'Sequence', expressions: [...] }
 */
export interface SequenceNode {
  type: 'Sequence';
  expressions: ASTNode[];
}

/**
 * Ternary/conditional expression
 * Example: `a ? b : c` → { type: 'Conditional', test: {...}, consequent: {...}, alternate: {...} }
 */
export interface ConditionalNode {
  type: 'Conditional';
  test: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

/**
 * Union of all AST node types
 */
export type ASTNode =
  | VariableNode
  | LiteralNode
  | DotAccessNode
  | BracketAccessNode
  | CallNode
  | AssignmentNode
  | BinaryOpNode
  | UnaryOpNode
  | ArrayNode
  | ObjectNode
  | SequenceNode
  | ConditionalNode;
