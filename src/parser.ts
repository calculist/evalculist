import {
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
} from './types.js';

// ============================================================================
// Lexer - produces proper tokens for parsing
// ============================================================================

export type LexerTokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | 'BOOLEAN'
  | 'NULL'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LBRACE'
  | 'RBRACE'
  | 'DOT'
  | 'COMMA'
  | 'COLON'
  | 'SEMICOLON'
  | 'QUESTION'
  | 'EOF';

export interface LexerToken {
  type: LexerTokenType;
  value: string;
  start: number;
  end: number;
}

const OPERATORS = new Set([
  '+', '-', '*', '/', '%',
  '===', '!==', '==', '!=',
  '<=', '>=', '<', '>',
  '&&', '||', '!',
  '=', '=>',
]);

const OPERATOR_CHARS = new Set(['+', '-', '*', '/', '%', '=', '!', '<', '>', '&', '|']);

/**
 * Tokenize input string into an array of tokens
 */
export function lex(input: string): LexerToken[] {
  const tokens: LexerToken[] = [];
  let pos = 0;

  while (pos < input.length) {
    const char = input[pos];

    // Skip whitespace
    if (/\s/.test(char)) {
      pos++;
      continue;
    }

    // String literals
    if (char === '"' || char === "'") {
      const quote = char;
      const start = pos;
      pos++; // skip opening quote
      let value = '';
      while (pos < input.length && input[pos] !== quote) {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          // Handle escape sequences
          const next = input[pos + 1];
          if (next === quote) {
            value += quote;
            pos += 2;
          } else if (next === 'n') {
            value += '\n';
            pos += 2;
          } else if (next === 't') {
            value += '\t';
            pos += 2;
          } else if (next === '\\') {
            value += '\\';
            pos += 2;
          } else {
            value += input[pos];
            pos++;
          }
        } else {
          value += input[pos];
          pos++;
        }
      }
      pos++; // skip closing quote
      tokens.push({ type: 'STRING', value, start, end: pos });
      continue;
    }

    // Numbers (including hex, float, scientific)
    if (/\d/.test(char) || (char === '.' && /\d/.test(input[pos + 1] || ''))) {
      const start = pos;
      // Hex
      if (char === '0' && (input[pos + 1] === 'x' || input[pos + 1] === 'X')) {
        pos += 2;
        while (pos < input.length && /[0-9a-fA-F]/.test(input[pos])) pos++;
      } else {
        // Decimal (with optional decimal point and exponent)
        while (pos < input.length && /\d/.test(input[pos])) pos++;
        if (input[pos] === '.' && /\d/.test(input[pos + 1] || '')) {
          pos++;
          while (pos < input.length && /\d/.test(input[pos])) pos++;
        }
        if ((input[pos] === 'e' || input[pos] === 'E')) {
          const next = input[pos + 1];
          if (next === '+' || next === '-' || /\d/.test(next)) {
            pos++;
            if (input[pos] === '+' || input[pos] === '-') pos++;
            while (pos < input.length && /\d/.test(input[pos])) pos++;
          }
        }
      }
      tokens.push({ type: 'NUMBER', value: input.slice(start, pos), start, end: pos });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      const start = pos;
      while (pos < input.length && /[a-zA-Z0-9_$]/.test(input[pos])) pos++;
      const value = input.slice(start, pos);
      if (value === 'true' || value === 'false') {
        tokens.push({ type: 'BOOLEAN', value, start, end: pos });
      } else if (value === 'null') {
        tokens.push({ type: 'NULL', value, start, end: pos });
      } else {
        tokens.push({ type: 'IDENTIFIER', value, start, end: pos });
      }
      continue;
    }

    // Multi-character operators
    if (OPERATOR_CHARS.has(char)) {
      const start = pos;
      // Try to match longest operator first
      let op = char;
      while (pos + 1 < input.length && OPERATORS.has(op + input[pos + 1])) {
        pos++;
        op += input[pos];
      }
      pos++;
      tokens.push({ type: 'OPERATOR', value: op, start, end: pos });
      continue;
    }

    // Single-character tokens
    const start = pos;
    pos++;
    switch (char) {
      case '(':
        tokens.push({ type: 'LPAREN', value: char, start, end: pos });
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: char, start, end: pos });
        break;
      case '[':
        tokens.push({ type: 'LBRACKET', value: char, start, end: pos });
        break;
      case ']':
        tokens.push({ type: 'RBRACKET', value: char, start, end: pos });
        break;
      case '{':
        tokens.push({ type: 'LBRACE', value: char, start, end: pos });
        break;
      case '}':
        tokens.push({ type: 'RBRACE', value: char, start, end: pos });
        break;
      case '.':
        tokens.push({ type: 'DOT', value: char, start, end: pos });
        break;
      case ',':
        tokens.push({ type: 'COMMA', value: char, start, end: pos });
        break;
      case ':':
        tokens.push({ type: 'COLON', value: char, start, end: pos });
        break;
      case ';':
        tokens.push({ type: 'SEMICOLON', value: char, start, end: pos });
        break;
      case '?':
        tokens.push({ type: 'QUESTION', value: char, start, end: pos });
        break;
      default:
        throw new Error(`Unexpected character '${char}' at position ${start}`);
    }
  }

  tokens.push({ type: 'EOF', value: '', start: pos, end: pos });
  return tokens;
}

// ============================================================================
// Parser - Pratt parser for expressions with operator precedence
// ============================================================================

// Operator precedence (higher = binds tighter)
const PRECEDENCE: Record<string, number> = {
  '=': 1,
  '||': 2,
  '&&': 3,
  '==': 4, '!=': 4, '===': 4, '!==': 4,
  '<': 5, '>': 5, '<=': 5, '>=': 5,
  '+': 6, '-': 6,
  '*': 7, '/': 7, '%': 7,
};

const RIGHT_ASSOCIATIVE = new Set(['=']);

export class Parser {
  private tokens: LexerToken[];
  private pos: number = 0;

  constructor(tokens: LexerToken[]) {
    this.tokens = tokens;
  }

  private current(): LexerToken {
    return this.tokens[this.pos];
  }

  private advance(): LexerToken {
    const token = this.current();
    this.pos++;
    return token;
  }

  private expect(type: LexerTokenType): LexerToken {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at position ${token.start}`);
    }
    return this.advance();
  }

  private match(type: LexerTokenType): boolean {
    return this.current().type === type;
  }

  /**
   * Parse the entire input into an AST
   */
  parse(): ASTNode {
    const expressions: ASTNode[] = [];

    // Skip leading semicolons
    while (this.match('SEMICOLON')) {
      this.advance();
    }

    while (!this.match('EOF')) {
      expressions.push(this.parseExpression(0));

      // Handle semicolons between statements (including multiple consecutive semicolons)
      while (this.match('SEMICOLON')) {
        this.advance();
      }
    }

    if (expressions.length === 0) {
      return { type: 'Literal', value: null, raw: '' };
    }

    if (expressions.length === 1) {
      return expressions[0];
    }

    return { type: 'Sequence', expressions };
  }

  /**
   * Parse expression with given minimum precedence (Pratt parser)
   */
  private parseExpression(minPrecedence: number): ASTNode {
    let left = this.parseUnary();

    while (true) {
      const token = this.current();

      // Handle ternary operator
      if (token.type === 'QUESTION') {
        this.advance();
        const consequent = this.parseExpression(0);
        this.expect('COLON');
        const alternate = this.parseExpression(0);
        left = {
          type: 'Conditional',
          test: left,
          consequent,
          alternate,
        } as ConditionalNode;
        continue;
      }

      // Handle binary operators
      if (token.type !== 'OPERATOR') break;

      const precedence = PRECEDENCE[token.value];
      if (precedence === undefined || precedence < minPrecedence) break;

      // Handle assignment specially
      if (token.value === '=' && left.type === 'Variable') {
        this.advance();
        const value = this.parseExpression(precedence);
        left = {
          type: 'Assignment',
          name: left.name,
          value,
        } as AssignmentNode;
        continue;
      }

      // Skip arrow function operator (not supported)
      if (token.value === '=>') break;

      this.advance();

      // Right associative operators use same precedence, left associative use precedence + 1
      const nextPrecedence = RIGHT_ASSOCIATIVE.has(token.value) ? precedence : precedence + 1;
      const right = this.parseExpression(nextPrecedence);

      left = {
        type: 'BinaryOp',
        operator: token.value,
        left,
        right,
      } as BinaryOpNode;
    }

    return left;
  }

  /**
   * Parse unary expressions (!, -, +)
   */
  private parseUnary(): ASTNode {
    const token = this.current();

    if (token.type === 'OPERATOR' && (token.value === '!' || token.value === '-' || token.value === '+')) {
      this.advance();
      const operand = this.parseUnary();
      return {
        type: 'UnaryOp',
        operator: token.value,
        operand,
      } as UnaryOpNode;
    }

    return this.parsePostfix();
  }

  /**
   * Parse postfix expressions (function calls, property access)
   */
  private parsePostfix(): ASTNode {
    let node = this.parsePrimary();

    while (true) {
      if (this.match('DOT')) {
        this.advance();
        const propToken = this.expect('IDENTIFIER');
        node = {
          type: 'DotAccess',
          object: node,
          property: propToken.value,
        } as DotAccessNode;
      } else if (this.match('LBRACKET')) {
        this.advance();
        const key = this.parseExpression(0);
        this.expect('RBRACKET');
        node = {
          type: 'BracketAccess',
          object: node,
          key,
        } as BracketAccessNode;
      } else if (this.match('LPAREN')) {
        this.advance();
        const args: ASTNode[] = [];

        if (!this.match('RPAREN')) {
          args.push(this.parseExpression(0));
          while (this.match('COMMA')) {
            this.advance();
            args.push(this.parseExpression(0));
          }
        }

        this.expect('RPAREN');
        node = {
          type: 'Call',
          callee: node,
          arguments: args,
        } as CallNode;
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Parse primary expressions (literals, identifiers, parenthesized, arrays, objects)
   */
  private parsePrimary(): ASTNode {
    const token = this.current();

    switch (token.type) {
      case 'NUMBER': {
        this.advance();
        const value = token.value.startsWith('0x') || token.value.startsWith('0X')
          ? parseInt(token.value, 16)
          : parseFloat(token.value);
        return { type: 'Literal', value, raw: token.value } as LiteralNode;
      }

      case 'STRING': {
        this.advance();
        return { type: 'Literal', value: token.value, raw: `"${token.value}"` } as LiteralNode;
      }

      case 'BOOLEAN': {
        this.advance();
        return { type: 'Literal', value: token.value === 'true', raw: token.value } as LiteralNode;
      }

      case 'NULL': {
        this.advance();
        return { type: 'Literal', value: null, raw: 'null' } as LiteralNode;
      }

      case 'IDENTIFIER': {
        this.advance();
        return { type: 'Variable', name: token.value } as VariableNode;
      }

      case 'LPAREN': {
        this.advance();
        const expr = this.parseExpression(0);
        this.expect('RPAREN');
        return expr;
      }

      case 'LBRACKET': {
        return this.parseArrayLiteral();
      }

      case 'LBRACE': {
        return this.parseObjectLiteral();
      }

      case 'EOF': {
        return { type: 'Literal', value: null, raw: '' } as LiteralNode;
      }

      default:
        throw new Error(`Unexpected token ${token.type} '${token.value}' at position ${token.start}`);
    }
  }

  /**
   * Parse array literal: [a, b, c]
   */
  private parseArrayLiteral(): ArrayNode {
    this.expect('LBRACKET');
    const elements: ASTNode[] = [];

    if (!this.match('RBRACKET')) {
      elements.push(this.parseExpression(0));
      while (this.match('COMMA')) {
        this.advance();
        if (this.match('RBRACKET')) break; // trailing comma
        elements.push(this.parseExpression(0));
      }
    }

    this.expect('RBRACKET');
    return { type: 'Array', elements };
  }

  /**
   * Parse object literal: {"a": 1, "b": 2}
   */
  private parseObjectLiteral(): ObjectNode {
    this.expect('LBRACE');
    const properties: { key: string; value: ASTNode }[] = [];

    if (!this.match('RBRACE')) {
      // Key must be a string
      const keyToken = this.expect('STRING');
      this.expect('COLON');
      const value = this.parseExpression(0);
      properties.push({ key: keyToken.value, value });

      while (this.match('COMMA')) {
        this.advance();
        if (this.match('RBRACE')) break; // trailing comma
        const keyToken = this.expect('STRING');
        this.expect('COLON');
        const value = this.parseExpression(0);
        properties.push({ key: keyToken.value, value });
      }
    }

    this.expect('RBRACE');
    return { type: 'Object', properties };
  }
}

/**
 * Parse an expression string into an AST
 */
export function parse(input: string): ASTNode {
  const tokens = lex(input);
  const parser = new Parser(tokens);
  return parser.parse();
}
