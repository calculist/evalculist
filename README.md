# evalculist

A TypeScript library for evaluating JavaScript expressions in a sandboxed way, without exposing global variables.

## How It Works

evalculist transforms variable references into function calls that you control:

```js
foo = bar.baz
```

becomes:

```js
assignment("foo", dotAccessor(variable("bar"), "baz"))
```

This allows you to intercept all variable access, property access, and assignments, enabling safe evaluation of user-provided expressions.

## Installation

```bash
npm install evalculist
```

## Usage

### Basic Usage with `evalculist.newFromContext`

The simplest way to use evalculist:

```js
import evalculist from 'evalculist';

const context = {
  a: { b: 1 },
  c: 2,
  pow: Math.pow
};
const evaluate = evalculist.newFromContext(context);

const result = evaluate('pow(a.b + 1, c)');
// result === 4
```

### Custom Handlers with `evalculist.new`

For more control, provide custom handler functions:

```js
import evalculist from 'evalculist';

const localVars = {
  a: { b: 1 },
  c: 2
};

const evaluate = evalculist.new({
  variable: (name) => localVars[name] || Math[name],
  accessor: (object, key) => object[key],
  assignment: (name, value) => (localVars[name] = value)
});

const result = evaluate('pow(a.b + 1, c)');
// result === 4
```

### Security-Hardened Handlers

For user-provided expressions, use the safe handlers to block prototype pollution and other attacks:

```js
import evalculist from 'evalculist';
import { createSafeHandlers } from 'evalculist/safe';

const context = { price: 100, quantity: 3 };
const handlers = createSafeHandlers(context);
const evaluate = evalculist.new(handlers);

// Safe evaluation - dangerous properties are blocked
evaluate('price * quantity'); // 300
evaluate('__proto__');        // undefined (blocked)
evaluate('constructor');      // undefined (blocked)
```

### Debug Mode

Pass `true` as the second argument to see the compiled output:

```js
const compiled = evalculist('user.name = "Bob"', true);
// compiled === 'assignment("user", dotAccessor(variable("user"), "name") = "Bob")'
```

### AST Output Mode

Parse expressions into an Abstract Syntax Tree for analysis, transformation, or custom evaluation:

```js
import evalculist from 'evalculist';

const ast = evalculist.parse('a + b * c');
// {
//   type: 'BinaryOp',
//   operator: '+',
//   left: { type: 'Variable', name: 'a' },
//   right: {
//     type: 'BinaryOp',
//     operator: '*',
//     left: { type: 'Variable', name: 'b' },
//     right: { type: 'Variable', name: 'c' }
//   }
// }
```

The parser correctly handles operator precedence (`*` binds tighter than `+`).

#### AST Node Types

| Node Type | Description | Example |
|-----------|-------------|---------|
| `Variable` | Variable reference | `foo` |
| `Literal` | Number, string, boolean, null | `42`, `"hi"`, `true` |
| `BinaryOp` | Binary operation | `a + b` |
| `UnaryOp` | Unary operation | `!x`, `-n` |
| `DotAccess` | Dot property access | `obj.prop` |
| `BracketAccess` | Bracket property access | `arr[0]` |
| `Call` | Function call | `fn(x, y)` |
| `Assignment` | Variable assignment | `x = 5` |
| `Array` | Array literal | `[1, 2, 3]` |
| `Object` | Object literal | `{"a": 1}` |
| `Conditional` | Ternary operator | `a ? b : c` |
| `Sequence` | Multiple statements | `a; b; c` |

## API Reference

### `evalculist(code, handlers?)`

Evaluate an expression with optional handlers.

- `code` - The expression string to evaluate
- `handlers` - Optional handlers object or `true` for debug mode

### `evalculist.new(handlers?)`

Create a reusable evaluator with fixed handlers.

### `evalculist.newFromContext(context)`

Create an evaluator from a simple context object.

### `evalculist.parse(code)`

Parse an expression into an AST without evaluating it. Returns an `ASTNode`.

### `createSafeHandlers(context, options?)`

Create security-hardened handlers that block dangerous property access.

Options:
- `allowedProperties` - Set of property names that are always allowed
- `blockedProperties` - Additional properties to block (defaults include `__proto__`, `constructor`, etc.)
- `blockedGlobals` - Additional globals to block (defaults include `eval`, `Function`, etc.)

## Handlers Interface

```typescript
interface Handlers {
  // Called for variable references: foo → variable("foo")
  variable: (name: string) => unknown;

  // Called for property access: obj.key → accessor(obj, "key")
  accessor?: (object: unknown, key: string | number) => unknown;

  // Called for assignments: x = val → assignment("x", val)
  assignment?: (name: string, value: unknown) => unknown;

  // Optional: separate handlers for dot vs bracket access
  dotAccessor?: (object: unknown, key: string | number) => unknown;
  bracketAccessor?: (object: unknown, key: string | number) => unknown;
}
```

## Build Outputs

The package provides multiple build formats:

- `dist/index.js` - ESM module
- `dist/index.cjs` - CommonJS module
- `dist/index.global.js` - IIFE for browsers (global `evalculist`)
- `dist/index.d.ts` - TypeScript declarations

## Known Limitations

- Object literals require quoted keys: `{"a": 1}` works, `{a: 1}` does not
- JavaScript keywords are not supported (`if`, `for`, `var`, etc.)
- Method calls like `arr.map(fn)` lose `this` binding - use explicit wrapper functions instead

## Development

```bash
npm install         # Install dependencies
npm run build       # Build TypeScript to dist/
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run typecheck   # TypeScript type checking
```

## License

MIT
