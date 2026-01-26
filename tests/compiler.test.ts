/**
 * Tests for the compiler module
 */
import { describe, it, expect } from 'vitest';
import { compile, compileLines } from '../src/compiler.js';
import { tokenize } from '../src/tokenizer.js';

describe('compile', () => {
  describe('variable compilation', () => {
    it('should compile a simple variable to variable() call', () => {
      const tokens = tokenize('foo')[0];
      const result = compile(tokens);
      expect(result).toBe('variable("foo")');
    });

    it('should compile multiple variables', () => {
      const tokens = tokenize('a + b')[0];
      const result = compile(tokens);
      expect(result).toContain('variable("a")');
      expect(result).toContain('variable("b")');
    });
  });

  describe('dot accessor compilation', () => {
    it('should compile dot access to dotAccessor() call', () => {
      const tokens = tokenize('obj.prop')[0];
      const result = compile(tokens);
      expect(result).toBe('dotAccessor(variable("obj"), "prop")');
    });

    it('should compile chained dot access', () => {
      const tokens = tokenize('a.b.c')[0];
      const result = compile(tokens);
      expect(result).toBe('dotAccessor(dotAccessor(variable("a"), "b"), "c")');
    });

    it('should compile deeply chained dot access', () => {
      const tokens = tokenize('a.b.c.d.e')[0];
      const result = compile(tokens);
      expect(result).toContain('dotAccessor(dotAccessor(dotAccessor(dotAccessor(variable("a")');
    });
  });

  describe('bracket accessor compilation', () => {
    it('should compile bracket access to bracketAccessor() call', () => {
      const tokens = tokenize('arr[0]')[0];
      const result = compile(tokens);
      expect(result).toBe('bracketAccessor(variable("arr"), 0)');
    });

    it('should compile bracket access with variable key', () => {
      const tokens = tokenize('obj[key]')[0];
      const result = compile(tokens);
      expect(result).toBe('bracketAccessor(variable("obj"), variable("key"))');
    });

    it('should compile bracket access with string key', () => {
      const tokens = tokenize('obj["key"]')[0];
      const result = compile(tokens);
      expect(result).toBe('bracketAccessor(variable("obj"), "key")');
    });

    it('should compile chained bracket access', () => {
      const tokens = tokenize('a[0][1]')[0];
      const result = compile(tokens);
      expect(result).toContain('bracketAccessor(bracketAccessor(');
    });
  });

  describe('mixed accessor compilation', () => {
    it('should compile mixed dot and bracket access', () => {
      const tokens = tokenize('obj.arr[0]')[0];
      const result = compile(tokens);
      expect(result).toBe('bracketAccessor(dotAccessor(variable("obj"), "arr"), 0)');
    });

    it('should compile bracket then dot access', () => {
      const tokens = tokenize('arr[0].prop')[0];
      const result = compile(tokens);
      expect(result).toBe('dotAccessor(bracketAccessor(variable("arr"), 0), "prop")');
    });

    it('should handle complex mixed access', () => {
      const tokens = tokenize('a.b[c].d[e]')[0];
      const result = compile(tokens);
      expect(result).toContain('variable("a")');
      expect(result).toContain('"b"');
      expect(result).toContain('variable("c")');
      expect(result).toContain('"d"');
      expect(result).toContain('variable("e")');
    });
  });

  describe('assignment compilation', () => {
    it('should compile simple assignment', () => {
      const tokens = tokenize('x = 5')[0];
      const result = compile(tokens);
      expect(result).toBe('assignment("x", 5)');
    });

    it('should compile assignment with variable RHS', () => {
      const tokens = tokenize('x = y')[0];
      const result = compile(tokens);
      expect(result).toBe('assignment("x", variable("y"))');
    });

    it('should compile assignment with expression RHS', () => {
      const tokens = tokenize('x = a + b')[0];
      const result = compile(tokens);
      expect(result).toContain('assignment("x",');
      expect(result).toContain('variable("a")');
      expect(result).toContain('variable("b")');
    });

    it('should compile assignment with accessor RHS', () => {
      const tokens = tokenize('x = obj.prop')[0];
      const result = compile(tokens);
      expect(result).toContain('assignment("x",');
      expect(result).toContain('dotAccessor(variable("obj"), "prop")');
    });
  });

  describe('function call compilation', () => {
    it('should compile function call with no args', () => {
      const tokens = tokenize('fn()')[0];
      const result = compile(tokens);
      expect(result).toBe('variable("fn")()');
    });

    it('should compile function call with one arg', () => {
      const tokens = tokenize('fn(x)')[0];
      const result = compile(tokens);
      expect(result).toBe('variable("fn")(variable("x"))');
    });

    it('should compile function call with multiple args', () => {
      const tokens = tokenize('fn(a, b, c)')[0];
      const result = compile(tokens);
      expect(result).toContain('variable("fn")');
      expect(result).toContain('variable("a")');
      expect(result).toContain('variable("b")');
      expect(result).toContain('variable("c")');
    });

    it('should compile nested function calls', () => {
      const tokens = tokenize('outer(inner(x))')[0];
      const result = compile(tokens);
      expect(result).toContain('variable("outer")');
      expect(result).toContain('variable("inner")');
      expect(result).toContain('variable("x")');
    });

    it('should compile method-style calls', () => {
      const tokens = tokenize('obj.method(arg)')[0];
      const result = compile(tokens);
      expect(result).toContain('dotAccessor(variable("obj"), "method")');
      expect(result).toContain('variable("arg")');
    });
  });

  describe('array literal compilation', () => {
    it('should compile empty array literal', () => {
      const tokens = tokenize('[]')[0];
      const result = compile(tokens);
      expect(result).toBe('[]');
    });

    it('should compile array literal with elements', () => {
      const tokens = tokenize('[1, 2, 3]')[0];
      const result = compile(tokens);
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should compile array literal with variables', () => {
      const tokens = tokenize('[a, b]')[0];
      const result = compile(tokens);
      expect(result).toContain('variable("a")');
      expect(result).toContain('variable("b")');
    });
  });

  describe('expression compilation', () => {
    it('should preserve numeric literals', () => {
      const tokens = tokenize('42')[0];
      const result = compile(tokens);
      expect(result).toBe('42');
    });

    it('should preserve string literals', () => {
      const tokens = tokenize('"hello"')[0];
      const result = compile(tokens);
      expect(result).toBe('"hello"');
    });

    it('should preserve operators', () => {
      const tokens = tokenize('a + b')[0];
      const result = compile(tokens);
      expect(result).toContain('+');
    });

    it('should handle comparison operators', () => {
      const tokens = tokenize('a == b')[0];
      const result = compile(tokens);
      expect(result).toContain('==');
    });

    it('should handle logical operators', () => {
      const tokens = tokenize('a && b')[0];
      const result = compile(tokens);
      expect(result).toContain('&&');
    });
  });

  describe('edge cases', () => {
    it('should handle empty token array', () => {
      const result = compile([]);
      expect(result).toBe('');
    });

    it('should handle parenthesized expressions', () => {
      const tokens = tokenize('(a + b) * c')[0];
      const result = compile(tokens);
      expect(result).toContain('(');
      expect(result).toContain(')');
    });
  });
});

describe('compileLines', () => {
  it('should compile multiple statements', () => {
    const lines = tokenize('x = 1; y = 2');
    const result = compileLines(lines);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('assignment("x"');
    expect(result[1]).toContain('assignment("y"');
  });

  it('should filter out empty token arrays', () => {
    const lines = tokenize('a;; b');
    const result = compileLines(lines);
    // Empty statements should be filtered
    expect(result.every(r => r.length > 0)).toBe(true);
  });

  it('should handle single statement', () => {
    const lines = tokenize('x + y');
    const result = compileLines(lines);
    expect(result).toHaveLength(1);
  });

  it('should handle empty input', () => {
    const lines = tokenize('');
    const result = compileLines(lines);
    expect(result).toHaveLength(0);
  });
});
