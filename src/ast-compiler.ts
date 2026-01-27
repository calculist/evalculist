/**
 * AST Compiler - Compiles AST nodes to executable JavaScript code strings
 *
 * This module transforms the AST produced by parser.ts into JavaScript code
 * that calls handler functions (variable, dotAccessor, bracketAccessor, assignment).
 */

import type {
  ASTNode,
  VariableNode,
  LiteralNode,
  DotAccessNode,
  BracketAccessNode,
  CallNode,
  AssignmentNode,
  BinaryOpNode,
  UnaryOpNode,
  ArrayNode,
  ObjectNode,
  ConditionalNode,
  SequenceNode,
} from './types.js';

// Handler function names - must match executor.ts
const VAR_FUNCTION_NAME = 'variable';
const DOT_ACC_FUNCTION_NAME = 'dotAccessor';
const SQUARE_ACC_FUNCTION_NAME = 'bracketAccessor';
const ASSIGN_FUNCTION_NAME = 'assignment';

// Operator precedence for parenthesization
const PRECEDENCE: Record<string, number> = {
  '=': 1,
  '||': 2,
  '&&': 3,
  '==': 4, '!=': 4, '===': 4, '!==': 4,
  '<': 5, '>': 5, '<=': 5, '>=': 5,
  '+': 6, '-': 6,
  '*': 7, '/': 7, '%': 7,
};

/**
 * Compile a Variable node
 * Example: `foo` → `variable("foo")`
 */
function compileVariable(node: VariableNode): string {
  return `${VAR_FUNCTION_NAME}("${node.name}")`;
}

/**
 * Compile a Literal node
 * Example: `42` → `42`, `"hello"` → `"hello"`, `true` → `true`
 */
function compileLiteral(node: LiteralNode): string {
  if (typeof node.value === 'string') {
    // Escape backslashes and quotes in string literals
    const escaped = node.value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  // For numbers, booleans, null - use raw value
  return node.raw;
}

/**
 * Compile a DotAccess node
 * Example: `obj.prop` → `dotAccessor(variable("obj"), "prop")`
 */
function compileDotAccess(node: DotAccessNode): string {
  const obj = compileAST(node.object);
  return `${DOT_ACC_FUNCTION_NAME}(${obj}, "${node.property}")`;
}

/**
 * Compile a BracketAccess node
 * Example: `arr[0]` → `bracketAccessor(variable("arr"), 0)`
 */
function compileBracketAccess(node: BracketAccessNode): string {
  const obj = compileAST(node.object);
  const key = compileAST(node.key);
  return `${SQUARE_ACC_FUNCTION_NAME}(${obj}, ${key})`;
}

/**
 * Compile a Call node
 * Example: `fn(a, b)` → `variable("fn")(variable("a"), variable("b"))`
 */
function compileCall(node: CallNode): string {
  const callee = compileAST(node.callee);
  const args = node.arguments.map((arg) => compileAST(arg)).join(', ');
  return `${callee}(${args})`;
}

/**
 * Compile an Assignment node
 * Example: `x = 5` → `assignment("x", 5)`
 */
function compileAssignment(node: AssignmentNode): string {
  const value = compileAST(node.value);
  return `${ASSIGN_FUNCTION_NAME}("${node.name}", ${value})`;
}

/**
 * Compile a child node that may need parentheses based on operator precedence.
 * Adds parentheses if the child is a BinaryOp with lower precedence than the parent.
 */
function compileChildWithPrecedence(child: ASTNode, parentPrecedence: number): string {
  if (child.type === 'BinaryOp') {
    const childPrecedence = PRECEDENCE[child.operator] || 0;
    if (childPrecedence < parentPrecedence) {
      return `(${compileAST(child)})`;
    }
  }
  return compileAST(child);
}

/**
 * Compile a BinaryOp node
 * Example: `a + b` → `variable("a") + variable("b")`
 *
 * Adds parentheses around child BinaryOps with lower precedence to preserve
 * the correct evaluation order.
 */
function compileBinaryOp(node: BinaryOpNode): string {
  const precedence = PRECEDENCE[node.operator] || 0;
  const left = compileChildWithPrecedence(node.left, precedence);
  const right = compileChildWithPrecedence(node.right, precedence);
  return `${left} ${node.operator} ${right}`;
}

/**
 * Compile a UnaryOp node
 * Example: `!x` → `!variable("x")`, `-n` → `-variable("n")`
 */
function compileUnaryOp(node: UnaryOpNode): string {
  const operand = compileAST(node.operand);
  return `${node.operator}${operand}`;
}

/**
 * Compile an Array node
 * Example: `[1, 2, 3]` → `[1, 2, 3]`
 */
function compileArray(node: ArrayNode): string {
  const elements = node.elements.map((el) => compileAST(el)).join(', ');
  return `[${elements}]`;
}

/**
 * Compile an Object node
 * Example: `{"a": 1}` → `{"a": 1}`
 */
function compileObject(node: ObjectNode): string {
  const props = node.properties
    .map((prop) => {
      const key = JSON.stringify(prop.key);
      const value = compileAST(prop.value);
      return `${key}: ${value}`;
    })
    .join(', ');
  return `{${props}}`;
}

/**
 * Compile a Conditional node
 * Example: `a ? b : c` → `(variable("a") ? variable("b") : variable("c"))`
 */
function compileConditional(node: ConditionalNode): string {
  const test = compileAST(node.test);
  const consequent = compileAST(node.consequent);
  const alternate = compileAST(node.alternate);
  return `(${test} ? ${consequent} : ${alternate})`;
}

/**
 * Compile a Sequence node (used when sequence appears in another expression)
 * Example: `a; b; c` → `variable("a"); variable("b"); variable("c")`
 */
function compileSequence(node: SequenceNode): string {
  return node.expressions.map((expr) => compileAST(expr)).join('; ');
}

/**
 * Compile an AST node into executable JavaScript code string
 *
 * @param node - The AST node to compile
 * @returns JavaScript code string that calls handler functions
 */
export function compileAST(node: ASTNode): string {
  switch (node.type) {
    case 'Variable':
      return compileVariable(node);
    case 'Literal':
      return compileLiteral(node);
    case 'DotAccess':
      return compileDotAccess(node);
    case 'BracketAccess':
      return compileBracketAccess(node);
    case 'Call':
      return compileCall(node);
    case 'Assignment':
      return compileAssignment(node);
    case 'BinaryOp':
      return compileBinaryOp(node);
    case 'UnaryOp':
      return compileUnaryOp(node);
    case 'Array':
      return compileArray(node);
    case 'Object':
      return compileObject(node);
    case 'Conditional':
      return compileConditional(node);
    case 'Sequence':
      return compileSequence(node);
    default:
      // TypeScript exhaustive check
      const _exhaustive: never = node;
      throw new Error(`Unknown AST node type: ${(_exhaustive as ASTNode).type}`);
  }
}

/**
 * Compile AST to array of lines (for executor compatibility)
 *
 * For Sequence nodes, returns each expression as a separate line.
 * For empty input (null literal with empty raw), returns empty array.
 * For all other nodes, returns single-element array.
 *
 * @param node - The AST node to compile
 * @returns Array of compiled JavaScript code strings
 */
export function compileASTToLines(node: ASTNode): string[] {
  // Sequence → multiple lines
  if (node.type === 'Sequence') {
    return node.expressions.map((expr) => compileAST(expr));
  }

  // Empty input produces null literal with empty raw string
  if (node.type === 'Literal' && node.raw === '') {
    return [];
  }

  // Single expression → single line
  return [compileAST(node)];
}
