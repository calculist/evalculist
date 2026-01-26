/**
 * Integration tests for evalculist
 */
import { describe, it, expect } from 'vitest';
import evalculist from '../src/index.js';

describe('complex expressions', () => {
  it('should handle nested function calls', () => {
    const context = {
      add: (a: number, b: number) => a + b,
      mul: (a: number, b: number) => a * b,
      x: 2,
      y: 3,
      z: 4,
    };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('add(mul(x, y), z)');
    expect(result).toBe(10); // (2 * 3) + 4 = 10
  });

  it('should handle chained property access', () => {
    const context = {
      data: {
        users: {
          admin: {
            permissions: {
              level: 'superuser',
            },
          },
        },
      },
    };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('data.users.admin.permissions.level');
    expect(result).toBe('superuser');
  });

  it('should handle mixed dot and bracket access', () => {
    const context = {
      users: {
        'user-1': { name: 'Alice' },
        'user-2': { name: 'Bob' },
      },
      currentId: 'user-1',
    };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('users[currentId].name');
    expect(result).toBe('Alice');
  });

  it('should handle array operations', () => {
    const context = {
      numbers: [10, 20, 30, 40, 50],
      index: 2,
    };
    const evaluate = evalculist.newFromContext(context);

    expect(evaluate('numbers[0]')).toBe(10);
    expect(evaluate('numbers[index]')).toBe(30);
    expect(evaluate('numbers.length')).toBe(5);
  });

  it('should handle method calls via explicit functions', () => {
    const context = {
      arr: [1, 2, 3, 4, 5],
      double: (x: number) => x * 2,
      map: (arr: number[], fn: (x: number) => number) => arr.map(fn),
    };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('map(arr, double)');
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it('should handle property access on strings', () => {
    const context = {
      greeting: 'Hello, World!',
      upper: (s: string) => s.toUpperCase(),
    };
    const evaluate = evalculist.newFromContext(context);

    expect(evaluate('greeting.length')).toBe(13);
    expect(evaluate('upper(greeting)')).toBe('HELLO, WORLD!');
  });
});

describe('multi-statement expressions', () => {
  it('should execute multiple statements and return last value', () => {
    const context: Record<string, number> = {};
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('x = 10; y = 20; x + y');
    expect(result).toBe(30);
    expect(context.x).toBe(10);
    expect(context.y).toBe(20);
  });

  it('should handle dependent statements', () => {
    const context: Record<string, number> = {};
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('a = 5; b = a * 2; c = b + a; c');
    expect(result).toBe(15); // 5 + (5 * 2) = 15
  });

  it('should handle empty statements (double semicolons)', () => {
    const context: Record<string, number> = {};
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('x = 1;; y = 2;; x + y');
    expect(result).toBe(3);
  });
});

describe('operator precedence', () => {
  it('should respect multiplication over addition', () => {
    const context = { a: 2, b: 3, c: 4 };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('a + b * c');
    expect(result).toBe(14); // 2 + (3 * 4) = 14
  });

  it('should respect parentheses', () => {
    const context = { a: 2, b: 3, c: 4 };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('(a + b) * c');
    expect(result).toBe(20); // (2 + 3) * 4 = 20
  });

  it('should handle comparison operators', () => {
    const context = { x: 5, y: 10 };
    const evaluate = evalculist.newFromContext(context);

    expect(evaluate('x == 5')).toBe(true);
    expect(evaluate('x === 5')).toBe(true);
    expect(evaluate('x != y')).toBe(true);
    expect(evaluate('x !== y')).toBe(true);
    expect(evaluate('x < y')).toBe(true);
    expect(evaluate('x > y')).toBe(false);
  });

  it('should handle logical operators', () => {
    const context = { a: true, b: false };
    const evaluate = evalculist.newFromContext(context);

    expect(evaluate('a && b')).toBe(false);
    expect(evaluate('a || b')).toBe(true);
    expect(evaluate('!b')).toBe(true);
  });
});

describe('edge cases', () => {
  it('should handle empty expressions gracefully', () => {
    const evaluate = evalculist.newFromContext({});
    const result = evaluate('');
    expect(result).toBeUndefined();
  });

  it('should handle whitespace-only expressions', () => {
    const evaluate = evalculist.newFromContext({});
    const result = evaluate('   ');
    expect(result).toBeUndefined();
  });

  it('should handle numeric literals', () => {
    const evaluate = evalculist.newFromContext({});

    expect(evaluate('42')).toBe(42);
    expect(evaluate('3.14')).toBe(3.14);
    expect(evaluate('1e10')).toBe(1e10);
    expect(evaluate('0xff')).toBe(255);
  });

  it('should handle string literals', () => {
    const evaluate = evalculist.newFromContext({});

    expect(evaluate('"hello"')).toBe('hello');
    expect(evaluate("'world'")).toBe('world');
    expect(evaluate('"with \\"quotes\\""')).toBe('with "quotes"');
  });

  it('should handle null and undefined in context', () => {
    const context = { n: null, u: undefined };
    const evaluate = evalculist.newFromContext(context);

    expect(evaluate('n')).toBeNull();
    expect(evaluate('u')).toBeUndefined();
  });

  it('should handle array literals in expressions', () => {
    const context = { x: 1 };
    const evaluate = evalculist.newFromContext(context);

    const result = evaluate('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('real-world scenarios', () => {
  it('should work as a spreadsheet formula evaluator', () => {
    const cells: Record<string, number> = {
      A1: 100,
      A2: 200,
      A3: 300,
      B1: 0.1,
    };
    const functions = {
      SUM: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      AVG: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
    };
    const context = { ...cells, ...functions };
    const evaluate = evalculist.newFromContext(context);

    expect(evaluate('SUM(A1, A2, A3)')).toBe(600);
    expect(evaluate('AVG(A1, A2, A3)')).toBe(200);
    expect(evaluate('A1 * B1')).toBe(10);
    expect(evaluate('SUM(A1, A2) * B1')).toBe(30);
  });

  it('should work as a template expression evaluator', () => {
    const data = {
      user: { name: 'Alice', role: 'admin' },
      isAdmin: (user: { role: string }) => user.role === 'admin',
      greeting: 'Welcome',
    };
    const evaluate = evalculist.newFromContext(data);

    expect(evaluate('user.name')).toBe('Alice');
    expect(evaluate('isAdmin(user)')).toBe(true);
    expect(evaluate('greeting + ", " + user.name')).toBe('Welcome, Alice');
  });

  it('should work as a rule engine expression evaluator', () => {
    const order = {
      total: 150,
      itemCount: 5,
      customerType: 'premium',
      applyDiscount: (total: number, percent: number) =>
        total * (1 - percent / 100),
    };
    const evaluate = evalculist.newFromContext(order);

    // Rule: Premium customers with orders over $100 get 10% off
    expect(evaluate('customerType === "premium" && total > 100')).toBe(true);
    expect(evaluate('applyDiscount(total, 10)')).toBe(135);
  });
});
