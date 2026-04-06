# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-03-31

### Added

- **Exponentiation operator** - Support for `**` operator (e.g., `2 ** 3`)

### Fixed

- **Ternary operator precedence** - Ternary expressions now parse with correct precedence

## [1.0.2] - 2026-03-31

### Added

- **`prepare` script** - Added npm prepare script for git-based installs

## [1.0.1] - 2026-03-30

### Changed

- **Dev dependency updates** - Updated rollup, picomatch, and other dev dependencies to fix security vulnerabilities

## [1.0.0] - 2026-03-30

### Added

- **AST Output Mode** - New `evalculist.parse(code)` function returns an Abstract Syntax Tree
  - Proper operator precedence handling via Pratt parser
  - All AST node types exported for TypeScript users
  - 75 new parser tests
- **JSON literal support** - `true`, `false`, and `null` now work correctly as literals
  - Previously these were incorrectly treated as variable names
- **AST Compiler** - New `compileAST()` and `compileASTToLines()` functions
  - Unified parsing pipeline: parse → AST → compile → execute
  - Eliminates code duplication between tokenizer/compiler and parser
- **CI/CD** - GitHub Actions workflows for CI and releases
- **Demo app** - Reactive formulas demo application

### Changed

- **Evaluation pipeline** - Now uses AST-based compilation internally
  - `parse(code)` → `compileASTToLines(ast)` → `createExecutor(lines)`
  - More consistent behavior and proper operator precedence

### Removed

- **tokenizer.ts** - Replaced by `parse()` from parser.ts
- **compiler.ts** - Replaced by `compileAST()` and `compileASTToLines()` from ast-compiler.ts

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
