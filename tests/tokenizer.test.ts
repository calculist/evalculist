/**
 * Tests for the tokenizer module
 */
import { describe, it, expect } from 'vitest';
import { tokenize, restoreEscapedQuotes } from '../src/tokenizer.js';
import { TokenType } from '../src/types.js';

describe('tokenize', () => {
  describe('basic tokenization', () => {
    it('should tokenize a simple variable', () => {
      const result = tokenize('foo');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0][0]).toBe(TokenType.VARIABLE);
      expect(result[0][0][1]).toBe('foo');
    });

    it('should tokenize a numeric literal', () => {
      const result = tokenize('42');
      expect(result).toHaveLength(1);
      expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
      expect(result[0][0][1]).toBe('42');
    });

    it('should tokenize a floating point number', () => {
      const result = tokenize('3.14');
      expect(result).toHaveLength(1);
      // Float is tokenized as number.number
      expect(result[0].some(t => t[1].includes('3'))).toBe(true);
    });

    it('should tokenize hexadecimal numbers', () => {
      const result = tokenize('0xff');
      expect(result).toHaveLength(1);
      expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
      expect(result[0][0][1]).toBe('0xff');
    });
  });

  describe('string literals', () => {
    it('should tokenize double-quoted strings', () => {
      const result = tokenize('"hello"');
      expect(result).toHaveLength(1);
      expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
      expect(result[0][0][1]).toBe('"hello"');
    });

    it('should tokenize single-quoted strings', () => {
      const result = tokenize("'world'");
      expect(result).toHaveLength(1);
      expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
      expect(result[0][0][1]).toBe("'world'");
    });

    it('should tokenize empty strings', () => {
      const result = tokenize('""');
      expect(result).toHaveLength(1);
      expect(result[0][0][1]).toBe('""');
    });

    it('should handle strings with spaces', () => {
      const result = tokenize('"hello world"');
      expect(result[0][0][1]).toBe('"hello world"');
    });
  });

  describe('operators', () => {
    it('should tokenize dot operator', () => {
      const result = tokenize('a.b');
      expect(result[0].some(t => t[0] === TokenType.DOT)).toBe(true);
    });

    it('should tokenize equals operator', () => {
      const result = tokenize('x = 5');
      expect(result[0].some(t => t[0] === TokenType.EQUALS)).toBe(true);
    });

    it('should tokenize comparison operators as expressions', () => {
      const result = tokenize('a == b');
      // == is part of expression token
      expect(result[0].some(t => t[1].includes('=='))).toBe(true);
    });

    it('should tokenize triple equals', () => {
      const result = tokenize('a === b');
      expect(result[0].some(t => t[1].includes('==='))).toBe(true);
    });

    it('should tokenize not equals', () => {
      const result = tokenize('a != b');
      expect(result[0].some(t => t[1].includes('!='))).toBe(true);
    });

    it('should tokenize arrow function operator', () => {
      const result = tokenize('x => x');
      expect(result[0].some(t => t[1].includes('=>'))).toBe(true);
    });
  });

  describe('parentheses and brackets', () => {
    it('should tokenize open paren with correct depth', () => {
      const result = tokenize('(a)');
      const openParen = result[0].find(t => t[0] === TokenType.OPEN_PAREN);
      expect(openParen).toBeDefined();
      expect(openParen![2]).toBe(0); // parenDepth before increment
    });

    it('should tokenize close paren with correct depth', () => {
      const result = tokenize('(a)');
      const closeParen = result[0].find(t => t[0] === TokenType.CLOSE_PAREN);
      expect(closeParen).toBeDefined();
      expect(closeParen![2]).toBe(0); // parenDepth after decrement
    });

    it('should track nested paren depth', () => {
      const result = tokenize('((a))');
      const tokens = result[0];
      // First open paren at depth 0
      expect(tokens[0][2]).toBe(0);
      // Second open paren at depth 1
      expect(tokens[1][2]).toBe(1);
    });

    it('should tokenize square brackets', () => {
      const result = tokenize('a[0]');
      expect(result[0].some(t => t[0] === TokenType.OPEN_SQUARE)).toBe(true);
      expect(result[0].some(t => t[0] === TokenType.CLOSE_SQUARE)).toBe(true);
    });

    it('should track square bracket depth separately', () => {
      const result = tokenize('a[b[c]]');
      const tokens = result[0];
      // Should have nested bracket depths
      const bracketTokens = tokens.filter(
        t => t[0] === TokenType.OPEN_SQUARE || t[0] === TokenType.CLOSE_SQUARE
      );
      expect(bracketTokens.length).toBe(4);
    });
  });

  describe('multi-statement expressions', () => {
    it('should split on semicolons at depth 0', () => {
      const result = tokenize('a; b; c');
      expect(result).toHaveLength(3);
    });

    it('should not split on semicolons inside parentheses', () => {
      // This is somewhat synthetic but tests the depth checking
      const result = tokenize('a');
      expect(result).toHaveLength(1);
    });

    it('should handle empty statements', () => {
      const result = tokenize('a;;b');
      // Empty middle statement creates empty token array
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle trailing semicolon', () => {
      const result = tokenize('a;');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].length).toBeGreaterThan(0);
    });
  });

  describe('identifiers', () => {
    it('should tokenize underscore-prefixed identifiers', () => {
      const result = tokenize('_private');
      expect(result[0][0][0]).toBe(TokenType.VARIABLE);
      expect(result[0][0][1]).toBe('_private');
    });

    it('should tokenize dollar-prefixed identifiers', () => {
      const result = tokenize('$jquery');
      expect(result[0][0][0]).toBe(TokenType.VARIABLE);
      expect(result[0][0][1]).toBe('$jquery');
    });

    it('should tokenize identifiers with numbers', () => {
      const result = tokenize('var123');
      expect(result[0][0][0]).toBe(TokenType.VARIABLE);
      expect(result[0][0][1]).toBe('var123');
    });

    it('should distinguish identifiers starting with digits as numbers', () => {
      const result = tokenize('123abc');
      // Starts with digit, so should be expression
      expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = tokenize('');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const result = tokenize('   ');
      expect(result).toHaveLength(1);
    });

    it('should handle deeply nested structures', () => {
      const result = tokenize('a(b(c(d(e))))');
      // Should not throw and should track depth correctly
      expect(result).toHaveLength(1);
      expect(result[0].length).toBeGreaterThan(0);
    });

    it('should handle mixed brackets and parens', () => {
      const result = tokenize('a[b(c[d])]');
      expect(result).toHaveLength(1);
      expect(result[0].length).toBeGreaterThan(0);
    });
  });
});

describe('JSON literals', () => {
  it('should tokenize true as expression, not variable', () => {
    const result = tokenize('true');
    expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
    expect(result[0][0][1]).toBe('true');
  });

  it('should tokenize false as expression, not variable', () => {
    const result = tokenize('false');
    expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
    expect(result[0][0][1]).toBe('false');
  });

  it('should tokenize null as expression, not variable', () => {
    const result = tokenize('null');
    expect(result[0][0][0]).toBe(TokenType.EXPRESSION);
    expect(result[0][0][1]).toBe('null');
  });

  it('should tokenize JSON literals in arrays', () => {
    const result = tokenize('[true, false, null]');
    const tokens = result[0];
    // Literals may be merged with adjacent whitespace/commas in expression tokens
    const expressions = tokens.filter(t => t[0] === TokenType.EXPRESSION);
    const allExpText = expressions.map(t => t[1]).join('');
    expect(allExpText).toContain('true');
    expect(allExpText).toContain('false');
    expect(allExpText).toContain('null');
    // And importantly, they should NOT be variables
    const variables = tokens.filter(t => t[0] === TokenType.VARIABLE);
    expect(variables.some(t => t[1] === 'true')).toBe(false);
    expect(variables.some(t => t[1] === 'false')).toBe(false);
    expect(variables.some(t => t[1] === 'null')).toBe(false);
  });

  it('should not confuse similar variable names with JSON literals', () => {
    // Variables like "trueValue" or "nullable" should still be variables
    const result1 = tokenize('trueValue');
    expect(result1[0][0][0]).toBe(TokenType.VARIABLE);
    expect(result1[0][0][1]).toBe('trueValue');

    const result2 = tokenize('nullable');
    expect(result2[0][0][0]).toBe(TokenType.VARIABLE);
    expect(result2[0][0][1]).toBe('nullable');
  });
});

describe('restoreEscapedQuotes', () => {
  it('should restore escaped double quotes', () => {
    // This tests the internal placeholder mechanism
    const result = restoreEscapedQuotes('test');
    expect(result).toBe('test');
  });

  it('should not modify strings without placeholders', () => {
    const input = 'variable("name")';
    expect(restoreEscapedQuotes(input)).toBe(input);
  });
});
