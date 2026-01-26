# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **AST Output Mode** - New `evalculist.parse(code)` function returns an Abstract Syntax Tree
  - Proper operator precedence handling via Pratt parser
  - All AST node types exported for TypeScript users
  - 75 new parser tests
- **JSON literal support** - `true`, `false`, and `null` now work correctly as literals
  - Previously these were incorrectly treated as variable names

## [1.0.0-alpha.1] - 2026-01-25

### Added

- **TypeScript rewrite** - Complete conversion from ES5 JavaScript to TypeScript
- **Modern build system** - tsup-based builds producing ESM, CommonJS, and IIFE formats
- **Comprehensive test suite** - Tests covering tokenizer, compiler, integration, and security
- **Security-hardened handlers** - `createSafeHandlers()` function that blocks:
  - Prototype pollution (`__proto__`, `prototype`, `constructor`)
  - Dangerous globals (`eval`, `Function`, `globalThis`, etc.)
  - Property accessor attacks (`__defineGetter__`, `__defineSetter__`, etc.)
- **Type declarations** - Full TypeScript type definitions for all APIs
- **Separate accessor handlers** - Optional `dotAccessor` and `bracketAccessor` for different access patterns
- **Security violation tracking** - `handlers.securityViolations` array for monitoring blocked access attempts

### Changed

- **Package structure** - Modular source files in `src/` directory
- **Exports** - Modern package.json exports with `/safe` subpath for security handlers
- **Build output** - Multiple formats in `dist/` (index.js, index.cjs, index.global.js)

### Deprecated

- **evalculist.js** - Replaced by TypeScript source in `src/`
- **test.js** - Replaced by Vitest test suite in `tests/`

## [0.x.x] - Previous Releases

Legacy single-file ES5 implementation. See git history for details.
