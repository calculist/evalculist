import { Token, TokenType } from './types.js';

// Function names used in compiled output
const VAR_FUNCTION_NAME = 'variable';
const DOT_ACC_FUNCTION_NAME = 'dotAccessor';
const SQUARE_ACC_FUNCTION_NAME = 'bracketAccessor';
const ASSIGN_FUNCTION_NAME = 'assignment';

// Token array indices
const TOKEN_TYPE_INDEX = 0;
const TOKEN_STRING_INDEX = 1;
const PAREN_DEPTH_INDEX = 2;
const SQUARE_DEPTH_INDEX = 3;

/**
 * Compile a token array into executable JavaScript code.
 *
 * @param tokens - Array of tokens to compile
 * @param startIndex - Starting index in the token array
 * @returns Compiled JavaScript code string
 */
export function compile(tokens: readonly Token[], startIndex: number = 0): string {
  const expressions: string[] = [];
  let i = startIndex;
  let t = tokens[i];

  if (!t) return '';

  const pd = t[PAREN_DEPTH_INDEX];
  const sqd = t[SQUARE_DEPTH_INDEX];

  while (
    t &&
    t[PAREN_DEPTH_INDEX] >= pd &&
    t[SQUARE_DEPTH_INDEX] >= sqd
  ) {
    if (t[TOKEN_TYPE_INDEX] === TokenType.DOT) {
      // Dot accessor: obj.key
      const nextT = tokens[++i];
      if (nextT && nextT[TOKEN_TYPE_INDEX] === TokenType.VARIABLE) {
        expressions[expressions.length - 1] =
          DOT_ACC_FUNCTION_NAME +
          '(' +
          expressions[expressions.length - 1] +
          ', "' +
          nextT[TOKEN_STRING_INDEX] +
          '")';
      } else if (nextT) {
        expressions[expressions.length - 1] +=
          '.' + nextT[TOKEN_STRING_INDEX];
      }
    } else if (t[TOKEN_TYPE_INDEX] === TokenType.OPEN_SQUARE) {
      // Square bracket accessor or array literal
      const prevT = tokens[i - 1];
      let nextT = tokens[++i];
      let nextExp = '';

      if (nextT && nextT[SQUARE_DEPTH_INDEX] > sqd) {
        nextExp = compile(tokens, i);
        while (nextT && nextT[SQUARE_DEPTH_INDEX] > sqd) {
          nextT = tokens[++i];
        }
      }

      const isAcc =
        prevT &&
        nextT &&
        (prevT[TOKEN_TYPE_INDEX] === TokenType.VARIABLE ||
          prevT[TOKEN_TYPE_INDEX] === TokenType.CLOSE_PAREN ||
          prevT[TOKEN_TYPE_INDEX] === TokenType.CLOSE_SQUARE) &&
        nextT[TOKEN_TYPE_INDEX] === TokenType.CLOSE_SQUARE;

      let exp: string;
      if (isAcc) {
        exp =
          SQUARE_ACC_FUNCTION_NAME +
          '(' +
          expressions[expressions.length - 1] +
          ', ' +
          nextExp +
          ')';
      } else {
        exp = '[' + nextExp + (nextT ? nextT[TOKEN_STRING_INDEX] : '');
      }

      if (expressions.length) {
        if (prevT && prevT[TOKEN_TYPE_INDEX] === TokenType.EXPRESSION) {
          expressions[expressions.length - 1] += exp;
        } else {
          expressions[expressions.length - 1] = exp;
        }
      } else {
        expressions.push(exp);
      }
    } else if (t[TOKEN_TYPE_INDEX] === TokenType.OPEN_PAREN) {
      // Parentheses (function call or grouping)
      let nextT = tokens[++i];
      let nextExp = '';

      if (nextT && nextT[PAREN_DEPTH_INDEX] > pd) {
        nextExp = compile(tokens, i);
        while (nextT && nextT[PAREN_DEPTH_INDEX] > pd) {
          nextT = tokens[++i];
        }
      }

      const exp = '(' + nextExp + (nextT ? nextT[TOKEN_STRING_INDEX] : '');

      if (expressions.length) {
        expressions[expressions.length - 1] += exp;
      } else {
        expressions.push(exp);
      }
    } else if (t[TOKEN_TYPE_INDEX] === TokenType.VARIABLE) {
      // Variable reference or assignment
      const varName = t[TOKEN_STRING_INDEX];
      let nextT = tokens[i + 1];

      // Skip whitespace
      while (nextT && /^\s+$/.test(nextT[TOKEN_STRING_INDEX])) {
        nextT = tokens[++i + 1];
      }

      if (nextT && nextT[TOKEN_TYPE_INDEX] === TokenType.EQUALS) {
        // Assignment: var = value
        nextT = tokens[++i];
        let nextExp = '';

        if (nextT && nextT[PAREN_DEPTH_INDEX] >= pd) {
          nextExp = compile(tokens, ++i);
          while (nextT && nextT[PAREN_DEPTH_INDEX] >= pd) {
            nextT = tokens[++i];
          }
        }

        const exp = ASSIGN_FUNCTION_NAME + '("' + varName + '",' + nextExp + ')';

        if (expressions.length) {
          expressions[expressions.length - 1] += exp;
        } else {
          expressions.push(exp);
        }
      } else {
        // Variable reference
        expressions.push(VAR_FUNCTION_NAME + '("' + varName + '")');
      }
    } else {
      // Other tokens (operators, literals, etc.)
      expressions.push(t[TOKEN_STRING_INDEX]);
    }

    ++i;
    t = tokens[i];
  }

  return expressions.join('');
}

/**
 * Compile multiple token lines into an array of compiled strings
 *
 * @param lines - Array of token arrays (one per statement)
 * @returns Array of compiled code strings
 */
export function compileLines(lines: readonly Token[][]): string[] {
  return lines.reduce<string[]>((result, tokens) => {
    if (tokens.length) {
      result.push(compile(tokens, 0));
    }
    return result;
  }, []);
}
