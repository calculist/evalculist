import { Token, TokenType, TokenTypeValue } from './types.js';

// Placeholders for escaped quotes during parsing
const ESCAPED_DOUBLE_QUOTES_PLACEHOLDER =
  '______adsfasdfrtrssgoivdfoijwpdfoijdfg_______';
const ESCAPED_SINGLE_QUOTES_PLACEHOLDER =
  '______oiwjefoijfviojdfhweoiufhoihsdfoi_______';

const ESCAPED_DOUBLE_QUOTES_PATTERN = new RegExp(
  ESCAPED_DOUBLE_QUOTES_PLACEHOLDER,
  'g',
);
const ESCAPED_SINGLE_QUOTES_PATTERN = new RegExp(
  ESCAPED_SINGLE_QUOTES_PLACEHOLDER,
  'g',
);

/**
 * Check if the first character of a string is a digit
 */
function isDigit(s: string): boolean {
  return /\d/.test(s);
}

/**
 * Check if a chunk is a string literal (starts/ends with quotes)
 */
function isStringLiteral(chunk: string): boolean {
  return (
    chunk[0] === '"' ||
    chunk[0] === "'" ||
    chunk[chunk.length - 1] === '"' ||
    chunk[chunk.length - 1] === "'"
  );
}

/**
 * Tokenize a code string into an array of token lines.
 * Each line is separated by semicolons at depth 0.
 *
 * @param code - The expression to tokenize
 * @returns Array of token arrays (one per statement)
 */
export function tokenize(code: string): Token[][] {
  let tokens: Token[] = [];
  const lines: Token[][] = [tokens];
  let parenDepth = 0;
  let sqrBrktDepth = 0;

  // Replace escaped quotes with placeholders
  const processed = code
    .replace(/\\"/g, ESCAPED_DOUBLE_QUOTES_PLACEHOLDER)
    .replace(/\\'/g, ESCAPED_SINGLE_QUOTES_PLACEHOLDER);

  // Split on double-quoted strings first
  processed.split(/(".*?")/g).forEach((dqChunk) => {
    // Then split on single-quoted strings
    dqChunk.split(/('.*?')/g).forEach((sqChunk) => {
      const isStr = isStringLiteral(sqChunk);

      if (isStr) {
        // String literal - add as expression token
        if (
          tokens.length &&
          tokens[tokens.length - 1][0] === TokenType.EXPRESSION
        ) {
          // Merge with previous expression token
          const prev = tokens[tokens.length - 1];
          tokens[tokens.length - 1] = [
            TokenType.EXPRESSION,
            prev[1] + sqChunk,
            prev[2],
            prev[3],
          ];
        } else {
          tokens.push([TokenType.EXPRESSION, sqChunk, parenDepth, sqrBrktDepth]);
        }
      } else {
        // Non-string content - tokenize operators and identifiers
        const tokenPattern =
          /(\(|\)|\[|\]|\.|\={2,3}|\!\={1,2}|\=\>|\=|\;|(?:[a-zA-Z\d_\$]+))/g;

        sqChunk.split(tokenPattern).forEach((token) => {
          if (!token) return;

          if (/[a-zA-Z\d_\$]+/.test(token)) {
            // Identifier or number
            if (isDigit(token[0])) {
              // Starts with digit - it's a number, treat as expression
              if (
                tokens.length &&
                tokens[tokens.length - 1][0] === TokenType.EXPRESSION
              ) {
                const prev = tokens[tokens.length - 1];
                tokens[tokens.length - 1] = [
                  TokenType.EXPRESSION,
                  prev[1] + token,
                  prev[2],
                  prev[3],
                ];
              } else {
                tokens.push([
                  TokenType.EXPRESSION,
                  token,
                  parenDepth,
                  sqrBrktDepth,
                ]);
              }
            } else if (token === 'true' || token === 'false' || token === 'null') {
              // JSON literal - keep as expression, not variable
              tokens.push([TokenType.EXPRESSION, token, parenDepth, sqrBrktDepth]);
            } else {
              // Variable name
              tokens.push([TokenType.VARIABLE, token, parenDepth, sqrBrktDepth]);
            }
          } else if (token === TokenType.OPEN_PAREN) {
            tokens.push([TokenType.OPEN_PAREN, token, parenDepth, sqrBrktDepth]);
            parenDepth++;
          } else if (token === TokenType.CLOSE_PAREN) {
            parenDepth--;
            tokens.push([
              TokenType.CLOSE_PAREN,
              token,
              parenDepth,
              sqrBrktDepth,
            ]);
          } else if (token === TokenType.OPEN_SQUARE) {
            tokens.push([
              TokenType.OPEN_SQUARE,
              token,
              parenDepth,
              sqrBrktDepth,
            ]);
            sqrBrktDepth++;
          } else if (token === TokenType.CLOSE_SQUARE) {
            sqrBrktDepth--;
            tokens.push([
              TokenType.CLOSE_SQUARE,
              token,
              parenDepth,
              sqrBrktDepth,
            ]);
          } else if (token === TokenType.DOT) {
            tokens.push([TokenType.DOT, token, parenDepth, sqrBrktDepth]);
          } else if (token === TokenType.EQUALS) {
            tokens.push([TokenType.EQUALS, token, parenDepth, sqrBrktDepth]);
          } else if (
            token === TokenType.SEMICOLON &&
            parenDepth === 0 &&
            sqrBrktDepth === 0
          ) {
            // Semicolon at top level - start new statement
            tokens = [];
            lines.push(tokens);
          } else {
            // Other tokens (operators, whitespace, etc.)
            if (
              tokens.length &&
              tokens[tokens.length - 1][0] === TokenType.EXPRESSION
            ) {
              const prev = tokens[tokens.length - 1];
              tokens[tokens.length - 1] = [
                TokenType.EXPRESSION,
                prev[1] + token,
                prev[2],
                prev[3],
              ];
            } else {
              tokens.push([
                TokenType.EXPRESSION as TokenTypeValue,
                token,
                parenDepth,
                sqrBrktDepth,
              ]);
            }
          }
        });
      }
    });
  });

  return lines;
}

/**
 * Restore escaped quotes in a compiled string
 */
export function restoreEscapedQuotes(compiled: string): string {
  return compiled
    .replace(ESCAPED_DOUBLE_QUOTES_PATTERN, '\\"')
    .replace(ESCAPED_SINGLE_QUOTES_PATTERN, "\\'");
}
