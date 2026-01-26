/**
 * Tests for the AST parser
 */
import { describe, it, expect } from 'vitest';
import { parse, lex } from '../src/parser.js';
import type { ASTNode } from '../src/types.js';

describe('lex', () => {
  describe('basic tokenization', () => {
    it('should tokenize numbers', () => {
      const tokens = lex('42');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '42' });
    });

    it('should tokenize floats', () => {
      const tokens = lex('3.14');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '3.14' });
    });

    it('should tokenize hex numbers', () => {
      const tokens = lex('0xff');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '0xff' });
    });

    it('should tokenize scientific notation', () => {
      const tokens = lex('1e10');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '1e10' });
    });

    it('should tokenize strings', () => {
      const tokens = lex('"hello"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello' });
    });

    it('should tokenize single-quoted strings', () => {
      const tokens = lex("'world'");
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'world' });
    });

    it('should handle escaped quotes in strings', () => {
      const tokens = lex('"say \\"hi\\""');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'say "hi"' });
    });

    it('should tokenize identifiers', () => {
      const tokens = lex('foo');
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'foo' });
    });

    it('should tokenize true as boolean', () => {
      const tokens = lex('true');
      expect(tokens[0]).toMatchObject({ type: 'BOOLEAN', value: 'true' });
    });

    it('should tokenize false as boolean', () => {
      const tokens = lex('false');
      expect(tokens[0]).toMatchObject({ type: 'BOOLEAN', value: 'false' });
    });

    it('should tokenize null', () => {
      const tokens = lex('null');
      expect(tokens[0]).toMatchObject({ type: 'NULL', value: 'null' });
    });
  });

  describe('operators', () => {
    it('should tokenize single-character operators', () => {
      const tokens = lex('+ - * / %');
      expect(tokens.filter(t => t.type === 'OPERATOR').map(t => t.value))
        .toEqual(['+', '-', '*', '/', '%']);
    });

    it('should tokenize comparison operators', () => {
      const tokens = lex('== === != !== < > <= >=');
      expect(tokens.filter(t => t.type === 'OPERATOR').map(t => t.value))
        .toEqual(['==', '===', '!=', '!==', '<', '>', '<=', '>=']);
    });

    it('should tokenize logical operators', () => {
      const tokens = lex('&& || !');
      expect(tokens.filter(t => t.type === 'OPERATOR').map(t => t.value))
        .toEqual(['&&', '||', '!']);
    });
  });

  describe('punctuation', () => {
    it('should tokenize parentheses', () => {
      const tokens = lex('()');
      expect(tokens[0].type).toBe('LPAREN');
      expect(tokens[1].type).toBe('RPAREN');
    });

    it('should tokenize brackets', () => {
      const tokens = lex('[]');
      expect(tokens[0].type).toBe('LBRACKET');
      expect(tokens[1].type).toBe('RBRACKET');
    });

    it('should tokenize braces', () => {
      const tokens = lex('{}');
      expect(tokens[0].type).toBe('LBRACE');
      expect(tokens[1].type).toBe('RBRACE');
    });

    it('should tokenize dot', () => {
      const tokens = lex('.');
      expect(tokens[0].type).toBe('DOT');
    });

    it('should tokenize comma', () => {
      const tokens = lex(',');
      expect(tokens[0].type).toBe('COMMA');
    });

    it('should tokenize colon', () => {
      const tokens = lex(':');
      expect(tokens[0].type).toBe('COLON');
    });

    it('should tokenize semicolon', () => {
      const tokens = lex(';');
      expect(tokens[0].type).toBe('SEMICOLON');
    });

    it('should tokenize question mark', () => {
      const tokens = lex('?');
      expect(tokens[0].type).toBe('QUESTION');
    });
  });

  describe('position tracking', () => {
    it('should track token positions', () => {
      const tokens = lex('a + b');
      expect(tokens[0]).toMatchObject({ start: 0, end: 1 }); // 'a'
      expect(tokens[1]).toMatchObject({ start: 2, end: 3 }); // '+'
      expect(tokens[2]).toMatchObject({ start: 4, end: 5 }); // 'b'
    });
  });
});

describe('parse', () => {
  describe('literals', () => {
    it('should parse number literals', () => {
      const ast = parse('42');
      expect(ast).toEqual({ type: 'Literal', value: 42, raw: '42' });
    });

    it('should parse float literals', () => {
      const ast = parse('3.14');
      expect(ast).toEqual({ type: 'Literal', value: 3.14, raw: '3.14' });
    });

    it('should parse hex literals', () => {
      const ast = parse('0xff');
      expect(ast).toEqual({ type: 'Literal', value: 255, raw: '0xff' });
    });

    it('should parse string literals', () => {
      const ast = parse('"hello"');
      expect(ast).toEqual({ type: 'Literal', value: 'hello', raw: '"hello"' });
    });

    it('should parse boolean true', () => {
      const ast = parse('true');
      expect(ast).toEqual({ type: 'Literal', value: true, raw: 'true' });
    });

    it('should parse boolean false', () => {
      const ast = parse('false');
      expect(ast).toEqual({ type: 'Literal', value: false, raw: 'false' });
    });

    it('should parse null', () => {
      const ast = parse('null');
      expect(ast).toEqual({ type: 'Literal', value: null, raw: 'null' });
    });
  });

  describe('variables', () => {
    it('should parse variable references', () => {
      const ast = parse('foo');
      expect(ast).toEqual({ type: 'Variable', name: 'foo' });
    });

    it('should parse underscore-prefixed variables', () => {
      const ast = parse('_private');
      expect(ast).toEqual({ type: 'Variable', name: '_private' });
    });

    it('should parse dollar-prefixed variables', () => {
      const ast = parse('$jquery');
      expect(ast).toEqual({ type: 'Variable', name: '$jquery' });
    });
  });

  describe('binary operations', () => {
    it('should parse addition', () => {
      const ast = parse('a + b');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).operator).toBe('+');
    });

    it('should parse multiplication', () => {
      const ast = parse('a * b');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).operator).toBe('*');
    });

    it('should respect operator precedence (multiplication before addition)', () => {
      const ast = parse('a + b * c') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('+');
      expect(ast.left.name).toBe('a');
      expect(ast.right.type).toBe('BinaryOp');
      expect(ast.right.operator).toBe('*');
    });

    it('should respect operator precedence (addition after multiplication)', () => {
      const ast = parse('a * b + c') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('+');
      expect(ast.left.type).toBe('BinaryOp');
      expect(ast.left.operator).toBe('*');
      expect(ast.right.name).toBe('c');
    });

    it('should parse comparison operators', () => {
      const ast = parse('a == b') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('==');
    });

    it('should parse strict equality', () => {
      const ast = parse('a === b') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('===');
    });

    it('should parse logical AND', () => {
      const ast = parse('a && b') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('&&');
    });

    it('should parse logical OR', () => {
      const ast = parse('a || b') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('||');
    });

    it('should handle logical operator precedence (AND before OR)', () => {
      const ast = parse('a || b && c') as any;
      expect(ast.operator).toBe('||');
      expect(ast.right.operator).toBe('&&');
    });
  });

  describe('unary operations', () => {
    it('should parse logical NOT', () => {
      const ast = parse('!x') as any;
      expect(ast.type).toBe('UnaryOp');
      expect(ast.operator).toBe('!');
      expect(ast.operand.name).toBe('x');
    });

    it('should parse unary minus', () => {
      const ast = parse('-x') as any;
      expect(ast.type).toBe('UnaryOp');
      expect(ast.operator).toBe('-');
    });

    it('should parse unary plus', () => {
      const ast = parse('+x') as any;
      expect(ast.type).toBe('UnaryOp');
      expect(ast.operator).toBe('+');
    });

    it('should parse chained unary operators', () => {
      const ast = parse('!!x') as any;
      expect(ast.type).toBe('UnaryOp');
      expect(ast.operand.type).toBe('UnaryOp');
    });
  });

  describe('property access', () => {
    it('should parse dot access', () => {
      const ast = parse('obj.prop') as any;
      expect(ast.type).toBe('DotAccess');
      expect(ast.object.name).toBe('obj');
      expect(ast.property).toBe('prop');
    });

    it('should parse chained dot access', () => {
      const ast = parse('a.b.c') as any;
      expect(ast.type).toBe('DotAccess');
      expect(ast.property).toBe('c');
      expect(ast.object.type).toBe('DotAccess');
      expect(ast.object.property).toBe('b');
    });

    it('should parse bracket access with number', () => {
      const ast = parse('arr[0]') as any;
      expect(ast.type).toBe('BracketAccess');
      expect(ast.object.name).toBe('arr');
      expect(ast.key.value).toBe(0);
    });

    it('should parse bracket access with string', () => {
      const ast = parse('obj["key"]') as any;
      expect(ast.type).toBe('BracketAccess');
      expect(ast.key.value).toBe('key');
    });

    it('should parse bracket access with variable', () => {
      const ast = parse('obj[key]') as any;
      expect(ast.type).toBe('BracketAccess');
      expect(ast.key.type).toBe('Variable');
      expect(ast.key.name).toBe('key');
    });

    it('should parse mixed access', () => {
      const ast = parse('obj.arr[0].name') as any;
      expect(ast.type).toBe('DotAccess');
      expect(ast.property).toBe('name');
    });
  });

  describe('function calls', () => {
    it('should parse function call with no arguments', () => {
      const ast = parse('fn()') as any;
      expect(ast.type).toBe('Call');
      expect(ast.callee.name).toBe('fn');
      expect(ast.arguments).toHaveLength(0);
    });

    it('should parse function call with one argument', () => {
      const ast = parse('fn(x)') as any;
      expect(ast.type).toBe('Call');
      expect(ast.arguments).toHaveLength(1);
      expect(ast.arguments[0].name).toBe('x');
    });

    it('should parse function call with multiple arguments', () => {
      const ast = parse('fn(a, b, c)') as any;
      expect(ast.type).toBe('Call');
      expect(ast.arguments).toHaveLength(3);
    });

    it('should parse method calls', () => {
      const ast = parse('obj.method(x)') as any;
      expect(ast.type).toBe('Call');
      expect(ast.callee.type).toBe('DotAccess');
    });

    it('should parse nested function calls', () => {
      const ast = parse('outer(inner(x))') as any;
      expect(ast.type).toBe('Call');
      expect(ast.arguments[0].type).toBe('Call');
    });
  });

  describe('assignment', () => {
    it('should parse simple assignment', () => {
      const ast = parse('x = 5') as any;
      expect(ast.type).toBe('Assignment');
      expect(ast.name).toBe('x');
      expect(ast.value.value).toBe(5);
    });

    it('should parse assignment with expression', () => {
      const ast = parse('x = a + b') as any;
      expect(ast.type).toBe('Assignment');
      expect(ast.value.type).toBe('BinaryOp');
    });
  });

  describe('array literals', () => {
    it('should parse empty array', () => {
      const ast = parse('[]') as any;
      expect(ast.type).toBe('Array');
      expect(ast.elements).toHaveLength(0);
    });

    it('should parse array with elements', () => {
      const ast = parse('[1, 2, 3]') as any;
      expect(ast.type).toBe('Array');
      expect(ast.elements).toHaveLength(3);
      expect(ast.elements[0].value).toBe(1);
    });

    it('should parse nested arrays', () => {
      const ast = parse('[[1, 2], [3, 4]]') as any;
      expect(ast.type).toBe('Array');
      expect(ast.elements[0].type).toBe('Array');
    });

    it('should parse array with trailing comma', () => {
      const ast = parse('[1, 2,]') as any;
      expect(ast.type).toBe('Array');
      expect(ast.elements).toHaveLength(2);
    });
  });

  describe('object literals', () => {
    it('should parse empty object', () => {
      const ast = parse('{}') as any;
      expect(ast.type).toBe('Object');
      expect(ast.properties).toHaveLength(0);
    });

    it('should parse object with properties', () => {
      const ast = parse('{"a": 1, "b": 2}') as any;
      expect(ast.type).toBe('Object');
      expect(ast.properties).toHaveLength(2);
      expect(ast.properties[0].key).toBe('a');
      expect(ast.properties[0].value.value).toBe(1);
    });

    it('should parse nested objects', () => {
      const ast = parse('{"nested": {"x": 1}}') as any;
      expect(ast.type).toBe('Object');
      expect(ast.properties[0].value.type).toBe('Object');
    });
  });

  describe('conditional (ternary) operator', () => {
    it('should parse ternary operator', () => {
      const ast = parse('a ? b : c') as any;
      expect(ast.type).toBe('Conditional');
      expect(ast.test.name).toBe('a');
      expect(ast.consequent.name).toBe('b');
      expect(ast.alternate.name).toBe('c');
    });

    it('should parse nested ternary', () => {
      const ast = parse('a ? b ? c : d : e') as any;
      expect(ast.type).toBe('Conditional');
      expect(ast.consequent.type).toBe('Conditional');
    });
  });

  describe('parentheses', () => {
    it('should parse parenthesized expression', () => {
      const ast = parse('(a)') as any;
      expect(ast.type).toBe('Variable');
      expect(ast.name).toBe('a');
    });

    it('should override precedence with parentheses', () => {
      const ast = parse('(a + b) * c') as any;
      expect(ast.type).toBe('BinaryOp');
      expect(ast.operator).toBe('*');
      expect(ast.left.type).toBe('BinaryOp');
      expect(ast.left.operator).toBe('+');
    });
  });

  describe('sequences', () => {
    it('should parse multiple statements', () => {
      const ast = parse('a; b; c') as any;
      expect(ast.type).toBe('Sequence');
      expect(ast.expressions).toHaveLength(3);
    });

    it('should parse single statement without sequence wrapper', () => {
      const ast = parse('a');
      expect(ast.type).toBe('Variable');
    });
  });

  describe('edge cases', () => {
    it('should parse empty input as null literal', () => {
      const ast = parse('');
      expect(ast).toEqual({ type: 'Literal', value: null, raw: '' });
    });

    it('should parse whitespace-only as null literal', () => {
      const ast = parse('   ');
      expect(ast).toEqual({ type: 'Literal', value: null, raw: '' });
    });

    it('should handle complex expressions', () => {
      const ast = parse('obj.method(a + b, c * d)') as any;
      expect(ast.type).toBe('Call');
      expect(ast.arguments).toHaveLength(2);
      expect(ast.arguments[0].type).toBe('BinaryOp');
    });
  });
});
