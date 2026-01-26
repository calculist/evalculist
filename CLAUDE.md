# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`evalculist` is a TypeScript library that evaluates JavaScript expressions in a sandboxed way without exposing global variables. It transforms variable references into function calls that you control, enabling safe evaluation of user-provided expressions.

**Example transformation:**
```js
foo = bar.baz  →  assignment("foo", dotAccessor(variable("bar"), "baz"))
```

## Commands

```bash
npm install         # Install dependencies
npm run build       # Build TypeScript to dist/ (ESM, CJS, IIFE)
npm test            # Run tests with vitest
npm run test:watch  # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run typecheck   # TypeScript type checking
```

## Architecture

```
src/
├── index.ts          # Main API entry point
├── types.ts          # TypeScript interfaces (Token, Handlers, etc.)
├── tokenizer.ts      # Expression tokenization
├── compiler.ts       # Token-to-code compilation
├── executor.ts       # Code execution via new Function()
└── handlers/
    ├── default.ts    # Default handlers (permissive)
    └── safe.ts       # Security-hardened handlers
```

### Core Pipeline

1. **Tokenizer** (`tokenizer.ts`): Splits input into tokens with depth tracking
   - Token format: `[type, value, parenDepth, bracketDepth]`
   - Handles strings, operators, identifiers, nested structures

2. **Compiler** (`compiler.ts`): Transforms tokens into executable code
   - Variables → `variable("name")`
   - Dot access → `dotAccessor(obj, "key")`
   - Bracket access → `bracketAccessor(obj, key)`
   - Assignments → `assignment("name", value)`

3. **Executor** (`executor.ts`): Creates callable function via `new Function()`

### Main API

```typescript
// Direct evaluation
evalculist(code, handlers)

// Factory methods
evalculist.new(handlers)        // Reusable evaluator
evalculist.newFromContext(ctx)  // Simple context-based evaluator

// Debug mode - returns compiled code string
evalculist(code, true)
```

### Security Features (`handlers/safe.ts`)

```typescript
import { createSafeHandlers } from 'evalculist/safe';

const handlers = createSafeHandlers(context, {
  allowedProperties: new Set(['safe', 'props']),
  blockedProperties: BLOCKED_PROPERTIES,  // __proto__, constructor, etc.
});
```

## Build Outputs

- `dist/index.js` - ESM module
- `dist/index.cjs` - CommonJS module
- `dist/index.global.js` - IIFE for browsers (global `evalculist`)
- `dist/index.d.ts` - TypeScript declarations

## Known Limitations

- Object literals require quoted keys (`{"a":1}` works, `{a:1}` does not)
- JavaScript keywords (`if`, `for`, `var`, etc.) are not supported
- Method calls like `arr.map(fn)` lose `this` binding - use explicit functions instead
