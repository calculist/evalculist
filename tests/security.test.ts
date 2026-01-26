/**
 * Security tests for safe handlers
 */
import { describe, it, expect, beforeEach } from 'vitest';
import evalculist, {
  createSafeHandlers,
  validateInput,
  BLOCKED_PROPERTIES,
  BLOCKED_GLOBALS,
} from '../src/index.js';

describe('createSafeHandlers', () => {
  describe('prototype pollution prevention', () => {
    it('should block __proto__ access via dot notation', () => {
      const context = { obj: { value: 42 } };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('obj.__proto__');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
      expect(handlers.securityViolations[0]).toContain('__proto__');
    });

    it('should block __proto__ access via bracket notation', () => {
      const context = { obj: { value: 42 } };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('obj["__proto__"]');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
    });

    it('should block prototype property access', () => {
      const context = { obj: {} };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('obj.prototype');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
    });
  });

  describe('constructor access prevention', () => {
    it('should block constructor property access', () => {
      const context = { str: 'hello' };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('str.constructor');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.some(v => v.includes('constructor') || v.includes('Constructor'))).toBe(true);
    });

    it('should block constructor chain access', () => {
      const context = { arr: [1, 2, 3] };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('arr["constructor"]');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
    });
  });

  describe('dangerous global prevention', () => {
    it('should block eval access', () => {
      const context = {};
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('eval');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations).toContain(
        'Dangerous global access blocked: eval',
      );
    });

    it('should block Function constructor access', () => {
      const context = {};
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('Function');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations).toContain(
        'Dangerous global access blocked: Function',
      );
    });

    it('should block globalThis access', () => {
      const context = {};
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('globalThis');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
    });

    it('should block window access', () => {
      const context = {};
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('window');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
    });

    it('should block require access', () => {
      const context = {};
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('require');

      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
    });
  });

  describe('assignment protection', () => {
    it('should block assignment to __proto__', () => {
      const context: Record<string, unknown> = { safe: true };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('__proto__ = "malicious"');

      // Assignment should return undefined (blocked)
      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
      expect(handlers.securityViolations.some(v => v.includes('__proto__'))).toBe(true);
    });

    it('should block assignment to constructor', () => {
      const context: Record<string, unknown> = { safe: true };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      const result = evaluate('constructor = "malicious"');

      // Assignment should return undefined (blocked)
      expect(result).toBeUndefined();
      expect(handlers.securityViolations.length).toBeGreaterThan(0);
      expect(handlers.securityViolations.some(v => v.includes('constructor'))).toBe(true);
    });
  });

  describe('violation tracking', () => {
    it('should track multiple violations', () => {
      const context = { obj: {} };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      evaluate('obj.__proto__');
      evaluate('obj.constructor');
      evaluate('eval');

      expect(handlers.securityViolations.length).toBe(3);
    });

    it('should clear violations when requested', () => {
      const context = { obj: {} };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      evaluate('obj.__proto__');
      expect(handlers.securityViolations.length).toBe(1);

      handlers.clearViolations();
      expect(handlers.securityViolations.length).toBe(0);
    });
  });

  describe('allowed properties whitelist', () => {
    it('should allow whitelisted properties', () => {
      const context = { obj: { safe: 42, unsafe: 'secret' } };
      const handlers = createSafeHandlers(context, {
        allowedProperties: new Set(['safe', 'obj']),
      });
      const evaluate = evalculist.new(handlers);

      const result = evaluate('obj.safe');
      expect(result).toBe(42);
    });

    it('should block non-whitelisted properties', () => {
      const context = { obj: { safe: 42, unsafe: 'secret' } };
      const handlers = createSafeHandlers(context, {
        allowedProperties: new Set(['safe', 'obj']),
      });
      const evaluate = evalculist.new(handlers);

      const result = evaluate('obj.unsafe');
      expect(result).toBeUndefined();
      expect(handlers.securityViolations).toContain(
        'Property not whitelisted: unsafe',
      );
    });
  });

  describe('safe operations', () => {
    it('should allow normal property access', () => {
      const context = { user: { name: 'Alice', age: 30 } };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      expect(evaluate('user.name')).toBe('Alice');
      expect(evaluate('user.age')).toBe(30);
      expect(handlers.securityViolations.length).toBe(0);
    });

    it('should allow array access', () => {
      const context = { arr: [1, 2, 3] };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      expect(evaluate('arr[0]')).toBe(1);
      expect(evaluate('arr[1]')).toBe(2);
      expect(handlers.securityViolations.length).toBe(0);
    });

    it('should allow safe method calls', () => {
      const context = { str: 'hello' };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      // Note: This accesses the 'length' property, which should be safe
      expect(evaluate('str.length')).toBe(5);
      expect(handlers.securityViolations.length).toBe(0);
    });

    it('should allow assignment to safe names', () => {
      const context: Record<string, unknown> = { x: 1 };
      const handlers = createSafeHandlers(context);
      const evaluate = evalculist.new(handlers);

      evaluate('y = 42');
      expect(context.y).toBe(42);
      expect(handlers.securityViolations.length).toBe(0);
    });
  });
});

describe('validateInput', () => {
  it('should accept valid input', () => {
    const result = validateInput('x + y * 2');
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should reject input exceeding max length', () => {
    const longInput = 'x'.repeat(20000);
    const result = validateInput(longInput, { maxLength: 10000 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('maximum length');
  });

  it('should detect eval() calls', () => {
    const result = validateInput('eval("malicious")');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('eval()');
  });

  it('should detect Function constructor', () => {
    const result = validateInput('Function("return this")');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Function()');
  });

  it('should detect __proto__ access', () => {
    const result = validateInput('obj.__proto__.polluted = true');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('__proto__');
  });

  it('should detect dynamic import', () => {
    const result = validateInput('import("malicious")');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('import');
  });
});

describe('BLOCKED constants', () => {
  it('should have blocked properties defined', () => {
    expect(BLOCKED_PROPERTIES).toContain('__proto__');
    expect(BLOCKED_PROPERTIES).toContain('prototype');
    expect(BLOCKED_PROPERTIES).toContain('constructor');
  });

  it('should have blocked globals defined', () => {
    expect(BLOCKED_GLOBALS).toContain('eval');
    expect(BLOCKED_GLOBALS).toContain('Function');
    expect(BLOCKED_GLOBALS).toContain('globalThis');
    expect(BLOCKED_GLOBALS).toContain('require');
  });
});
