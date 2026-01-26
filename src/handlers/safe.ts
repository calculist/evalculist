import {
  SafeHandlers,
  SecurityOptions,
  AccessorHandler,
  ValidationResult,
} from '../types.js';

/**
 * Properties that are blocked by default for security
 */
export const BLOCKED_PROPERTIES = new Set([
  '__proto__',
  'prototype',
  'constructor',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
]);

/**
 * Global names that are blocked by default for security
 */
export const BLOCKED_GLOBALS = new Set([
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'clearTimeout',
  'clearInterval',
  'clearImmediate',
  'global',
  'globalThis',
  'window',
  'self',
  'document',
  'process',
  'require',
  'import',
  'module',
  'exports',
  '__dirname',
  '__filename',
]);

/**
 * Create security-hardened handlers with violation tracking.
 *
 * @param context - Object to use as the variable context
 * @param options - Security configuration options
 * @returns SafeHandlers with security features enabled
 */
export function createSafeHandlers(
  context: Record<string, unknown>,
  options: SecurityOptions = {},
): SafeHandlers {
  const violations: string[] = [];

  const {
    allowedProperties,
    blockedProperties = BLOCKED_PROPERTIES,
    allowPrototypeAccess = false,
    allowConstructorAccess = false,
  } = options;

  /**
   * Check if a property access is allowed
   */
  function isPropertyAllowed(key: string): boolean {
    // Check explicit blocklist
    if (blockedProperties.has(key)) {
      violations.push(`Blocked property access: ${key}`);
      return false;
    }

    // Check prototype-related access
    if (!allowPrototypeAccess && (key === '__proto__' || key.toLowerCase().includes('proto'))) {
      violations.push(`Prototype access blocked: ${key}`);
      return false;
    }

    // Check constructor access
    if (!allowConstructorAccess && key === 'constructor') {
      violations.push(`Constructor access blocked`);
      return false;
    }

    // If whitelist exists, check it
    if (allowedProperties && !allowedProperties.has(key)) {
      violations.push(`Property not whitelisted: ${key}`);
      return false;
    }

    return true;
  }

  /**
   * Safe accessor that validates property access
   */
  const safeAccessor: AccessorHandler = (
    obj: unknown,
    key: string | number,
  ): unknown => {
    const keyStr = String(key);

    if (!isPropertyAllowed(keyStr)) {
      return undefined;
    }

    if (obj == null) {
      return undefined;
    }

    const value = (obj as Record<string | number, unknown>)[key];

    // Prevent returning dangerous function constructors
    if (typeof value === 'function') {
      const fnName = (value as { name?: string }).name || '';
      if (BLOCKED_GLOBALS.has(fnName) || fnName === 'Function') {
        violations.push(`Dangerous function access blocked: ${fnName || keyStr}`);
        return undefined;
      }
    }

    return value;
  };

  return {
    variable: (name: string): unknown => {
      if (BLOCKED_GLOBALS.has(name)) {
        violations.push(`Dangerous global access blocked: ${name}`);
        return undefined;
      }

      // Check if variable name is in whitelist (if provided)
      if (allowedProperties && !allowedProperties.has(name) && !(name in context)) {
        violations.push(`Variable not whitelisted: ${name}`);
        return undefined;
      }

      return context[name];
    },

    accessor: safeAccessor,
    dotAccessor: safeAccessor,
    bracketAccessor: safeAccessor,

    assignment: (name: string, value: unknown): unknown => {
      if (BLOCKED_GLOBALS.has(name)) {
        violations.push(`Assignment to dangerous name blocked: ${name}`);
        return undefined;
      }

      // Check for prototype pollution via assignment
      if (name === '__proto__' || name === 'prototype' || name === 'constructor') {
        violations.push(`Assignment to dangerous property blocked: ${name}`);
        return undefined;
      }

      context[name] = value;
      return value;
    },

    get securityViolations(): string[] {
      return [...violations];
    },

    clearViolations(): void {
      violations.length = 0;
    },
  };
}

/**
 * Validate input code for potential security issues.
 *
 * @param code - The expression to validate
 * @param options - Validation options
 * @returns ValidationResult with any errors found
 */
export function validateInput(
  code: string,
  options: { maxLength?: number } = {},
): ValidationResult {
  const errors: string[] = [];
  const { maxLength = 10000 } = options;

  if (code.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength}`);
  }

  // Check for obvious dangerous patterns
  const dangerousPatterns: [RegExp, string][] = [
    [/\beval\s*\(/i, 'eval() call detected'],
    [/\bFunction\s*\(/i, 'Function() constructor detected'],
    [/\bimport\s*\(/i, 'Dynamic import detected'],
    [/\brequire\s*\(/i, 'require() call detected'],
    [/__proto__/i, '__proto__ access detected'],
  ];

  for (const [pattern, message] of dangerousPatterns) {
    if (pattern.test(code)) {
      errors.push(message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
