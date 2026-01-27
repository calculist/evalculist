/**
 * Tests for ast-compiler.ts - AST to JavaScript code compilation
 */
import { describe, it, expect } from 'vitest';
import { compileAST, compileASTToLines } from '../src/ast-compiler.js';
import { parse } from '../src/parser.js';
import type {
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
} from '../src/types.js';

describe('compileAST', () => {
  describe('Variable nodes', () => {
    it('should compile variable to variable() call', () => {
      const node: VariableNode = { type: 'Variable', name: 'foo' };
      expect(compileAST(node)).toBe('variable("foo")');
    });

    it('should handle variable names with special characters', () => {
      const node: VariableNode = { type: 'Variable', name: '$foo_bar' };
      expect(compileAST(node)).toBe('variable("$foo_bar")');
    });
  });

  describe('Literal nodes', () => {
    it('should compile number literals', () => {
      const node: LiteralNode = { type: 'Literal', value: 42, raw: '42' };
      expect(compileAST(node)).toBe('42');
    });

    it('should compile float literals', () => {
      const node: LiteralNode = { type: 'Literal', value: 3.14, raw: '3.14' };
      expect(compileAST(node)).toBe('3.14');
    });

    it('should compile scientific notation', () => {
      const node: LiteralNode = { type: 'Literal', value: 100, raw: '1e2' };
      expect(compileAST(node)).toBe('1e2');
    });

    it('should compile string literals', () => {
      const node: LiteralNode = { type: 'Literal', value: 'hello', raw: '"hello"' };
      expect(compileAST(node)).toBe('"hello"');
    });

    it('should escape quotes in string literals', () => {
      const node: LiteralNode = { type: 'Literal', value: 'say "hi"', raw: '"say \\"hi\\""' };
      expect(compileAST(node)).toBe('"say \\"hi\\""');
    });

    it('should compile boolean true', () => {
      const node: LiteralNode = { type: 'Literal', value: true, raw: 'true' };
      expect(compileAST(node)).toBe('true');
    });

    it('should compile boolean false', () => {
      const node: LiteralNode = { type: 'Literal', value: false, raw: 'false' };
      expect(compileAST(node)).toBe('false');
    });

    it('should compile null', () => {
      const node: LiteralNode = { type: 'Literal', value: null, raw: 'null' };
      expect(compileAST(node)).toBe('null');
    });
  });

  describe('DotAccess nodes', () => {
    it('should compile simple dot access', () => {
      const node: DotAccessNode = {
        type: 'DotAccess',
        object: { type: 'Variable', name: 'obj' },
        property: 'prop',
      };
      expect(compileAST(node)).toBe('dotAccessor(variable("obj"), "prop")');
    });

    it('should compile chained dot access', () => {
      const node: DotAccessNode = {
        type: 'DotAccess',
        object: {
          type: 'DotAccess',
          object: { type: 'Variable', name: 'a' },
          property: 'b',
        },
        property: 'c',
      };
      expect(compileAST(node)).toBe('dotAccessor(dotAccessor(variable("a"), "b"), "c")');
    });
  });

  describe('BracketAccess nodes', () => {
    it('should compile simple bracket access with number', () => {
      const node: BracketAccessNode = {
        type: 'BracketAccess',
        object: { type: 'Variable', name: 'arr' },
        key: { type: 'Literal', value: 0, raw: '0' },
      };
      expect(compileAST(node)).toBe('bracketAccessor(variable("arr"), 0)');
    });

    it('should compile bracket access with string key', () => {
      const node: BracketAccessNode = {
        type: 'BracketAccess',
        object: { type: 'Variable', name: 'obj' },
        key: { type: 'Literal', value: 'key', raw: '"key"' },
      };
      expect(compileAST(node)).toBe('bracketAccessor(variable("obj"), "key")');
    });

    it('should compile bracket access with variable key', () => {
      const node: BracketAccessNode = {
        type: 'BracketAccess',
        object: { type: 'Variable', name: 'obj' },
        key: { type: 'Variable', name: 'key' },
      };
      expect(compileAST(node)).toBe('bracketAccessor(variable("obj"), variable("key"))');
    });
  });

  describe('Call nodes', () => {
    it('should compile function call with no arguments', () => {
      const node: CallNode = {
        type: 'Call',
        callee: { type: 'Variable', name: 'fn' },
        arguments: [],
      };
      expect(compileAST(node)).toBe('variable("fn")()');
    });

    it('should compile function call with one argument', () => {
      const node: CallNode = {
        type: 'Call',
        callee: { type: 'Variable', name: 'fn' },
        arguments: [{ type: 'Literal', value: 42, raw: '42' }],
      };
      expect(compileAST(node)).toBe('variable("fn")(42)');
    });

    it('should compile function call with multiple arguments', () => {
      const node: CallNode = {
        type: 'Call',
        callee: { type: 'Variable', name: 'fn' },
        arguments: [
          { type: 'Variable', name: 'a' },
          { type: 'Variable', name: 'b' },
        ],
      };
      expect(compileAST(node)).toBe('variable("fn")(variable("a"), variable("b"))');
    });

    it('should compile method call', () => {
      const node: CallNode = {
        type: 'Call',
        callee: {
          type: 'DotAccess',
          object: { type: 'Variable', name: 'obj' },
          property: 'method',
        },
        arguments: [],
      };
      expect(compileAST(node)).toBe('dotAccessor(variable("obj"), "method")()');
    });
  });

  describe('Assignment nodes', () => {
    it('should compile simple assignment', () => {
      const node: AssignmentNode = {
        type: 'Assignment',
        name: 'x',
        value: { type: 'Literal', value: 5, raw: '5' },
      };
      expect(compileAST(node)).toBe('assignment("x", 5)');
    });

    it('should compile assignment with expression', () => {
      const node: AssignmentNode = {
        type: 'Assignment',
        name: 'x',
        value: {
          type: 'BinaryOp',
          operator: '+',
          left: { type: 'Variable', name: 'a' },
          right: { type: 'Variable', name: 'b' },
        },
      };
      expect(compileAST(node)).toBe('assignment("x", variable("a") + variable("b"))');
    });
  });

  describe('BinaryOp nodes', () => {
    it('should compile addition without parentheses', () => {
      const node: BinaryOpNode = {
        type: 'BinaryOp',
        operator: '+',
        left: { type: 'Variable', name: 'a' },
        right: { type: 'Variable', name: 'b' },
      };
      // NO parentheses to match old compiler format
      expect(compileAST(node)).toBe('variable("a") + variable("b")');
    });

    it('should compile multiplication', () => {
      const node: BinaryOpNode = {
        type: 'BinaryOp',
        operator: '*',
        left: { type: 'Variable', name: 'a' },
        right: { type: 'Literal', value: 2, raw: '2' },
      };
      expect(compileAST(node)).toBe('variable("a") * 2');
    });

    it('should compile comparison operators', () => {
      const eqNode: BinaryOpNode = {
        type: 'BinaryOp',
        operator: '===',
        left: { type: 'Variable', name: 'a' },
        right: { type: 'Variable', name: 'b' },
      };
      expect(compileAST(eqNode)).toBe('variable("a") === variable("b")');
    });

    it('should compile logical operators', () => {
      const andNode: BinaryOpNode = {
        type: 'BinaryOp',
        operator: '&&',
        left: { type: 'Variable', name: 'a' },
        right: { type: 'Variable', name: 'b' },
      };
      expect(compileAST(andNode)).toBe('variable("a") && variable("b")');
    });
  });

  describe('UnaryOp nodes', () => {
    it('should compile negation', () => {
      const node: UnaryOpNode = {
        type: 'UnaryOp',
        operator: '!',
        operand: { type: 'Variable', name: 'x' },
      };
      expect(compileAST(node)).toBe('!variable("x")');
    });

    it('should compile unary minus', () => {
      const node: UnaryOpNode = {
        type: 'UnaryOp',
        operator: '-',
        operand: { type: 'Variable', name: 'n' },
      };
      expect(compileAST(node)).toBe('-variable("n")');
    });

    it('should compile unary plus', () => {
      const node: UnaryOpNode = {
        type: 'UnaryOp',
        operator: '+',
        operand: { type: 'Literal', value: 5, raw: '5' },
      };
      expect(compileAST(node)).toBe('+5');
    });
  });

  describe('Array nodes', () => {
    it('should compile empty array', () => {
      const node: ArrayNode = { type: 'Array', elements: [] };
      expect(compileAST(node)).toBe('[]');
    });

    it('should compile array with elements', () => {
      const node: ArrayNode = {
        type: 'Array',
        elements: [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' },
          { type: 'Literal', value: 3, raw: '3' },
        ],
      };
      expect(compileAST(node)).toBe('[1, 2, 3]');
    });

    it('should compile array with mixed types', () => {
      const node: ArrayNode = {
        type: 'Array',
        elements: [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Variable', name: 'x' },
        ],
      };
      expect(compileAST(node)).toBe('[1, variable("x")]');
    });
  });

  describe('Object nodes', () => {
    it('should compile empty object', () => {
      const node: ObjectNode = { type: 'Object', properties: [] };
      expect(compileAST(node)).toBe('{}');
    });

    it('should compile object with properties', () => {
      const node: ObjectNode = {
        type: 'Object',
        properties: [
          { key: 'a', value: { type: 'Literal', value: 1, raw: '1' } },
          { key: 'b', value: { type: 'Literal', value: 2, raw: '2' } },
        ],
      };
      expect(compileAST(node)).toBe('{"a": 1, "b": 2}');
    });
  });

  describe('Conditional nodes', () => {
    it('should compile ternary operator', () => {
      const node: ConditionalNode = {
        type: 'Conditional',
        test: { type: 'Variable', name: 'cond' },
        consequent: { type: 'Variable', name: 'a' },
        alternate: { type: 'Variable', name: 'b' },
      };
      expect(compileAST(node)).toBe('(variable("cond") ? variable("a") : variable("b"))');
    });
  });

  describe('Sequence nodes', () => {
    it('should compile sequence with semicolons', () => {
      const node: SequenceNode = {
        type: 'Sequence',
        expressions: [
          { type: 'Variable', name: 'a' },
          { type: 'Variable', name: 'b' },
        ],
      };
      expect(compileAST(node)).toBe('variable("a"); variable("b")');
    });
  });
});

describe('compileASTToLines', () => {
  it('should return single line for simple expression', () => {
    const ast = parse('x + 1');
    const lines = compileASTToLines(ast);
    expect(lines).toHaveLength(1);
  });

  it('should return multiple lines for sequence', () => {
    const ast = parse('a; b; c');
    const lines = compileASTToLines(ast);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('variable("a")');
    expect(lines[1]).toBe('variable("b")');
    expect(lines[2]).toBe('variable("c")');
  });

  it('should return empty array for empty input', () => {
    const ast = parse('');
    const lines = compileASTToLines(ast);
    expect(lines).toHaveLength(0);
  });

  it('should handle trailing semicolons', () => {
    const ast = parse('a;');
    const lines = compileASTToLines(ast);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('variable("a")');
  });
});

describe('Integration with parser', () => {
  it('should compile parsed variable', () => {
    const ast = parse('foo');
    expect(compileAST(ast)).toBe('variable("foo")');
  });

  it('should compile parsed binary operation', () => {
    const ast = parse('a + b');
    expect(compileAST(ast)).toBe('variable("a") + variable("b")');
  });

  it('should compile parsed dot access', () => {
    const ast = parse('obj.prop');
    expect(compileAST(ast)).toBe('dotAccessor(variable("obj"), "prop")');
  });

  it('should compile parsed bracket access', () => {
    const ast = parse('arr[0]');
    expect(compileAST(ast)).toBe('bracketAccessor(variable("arr"), 0)');
  });

  it('should compile parsed function call', () => {
    const ast = parse('fn(x, y)');
    expect(compileAST(ast)).toBe('variable("fn")(variable("x"), variable("y"))');
  });

  it('should compile parsed assignment', () => {
    const ast = parse('x = 5');
    expect(compileAST(ast)).toBe('assignment("x", 5)');
  });

  it('should compile complex expression', () => {
    const ast = parse('obj.method(arr[0] + 1)');
    expect(compileAST(ast)).toBe(
      'dotAccessor(variable("obj"), "method")(bracketAccessor(variable("arr"), 0) + 1)'
    );
  });
});
