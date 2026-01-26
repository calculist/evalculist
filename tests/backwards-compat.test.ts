/**
 * Backwards compatibility tests - ported from original test.js
 * These tests ensure the new TypeScript version maintains the same behavior.
 */
import { describe, it, expect } from 'vitest';
import evalculist from '../src/index.js';

const VAR_FUNCTION_NAME = 'variable';
const DOT_ACC_FUNCTION_NAME = 'dotAccessor';
const SQUARE_ACC_FUNCTION_NAME = 'bracketAccessor';
const ASSIGN_FUNCTION_NAME = 'assignment';

describe('basic functionality', () => {
  it('should be a function', () => {
    expect(typeof evalculist).toBe('function');
  });

  it('should parse variables correctly', () => {
    const input = 'abc + 1e2 * e3';
    const output = evalculist(input, true);
    const expectedOutput =
      VAR_FUNCTION_NAME + '("abc") + 1e2 * ' + VAR_FUNCTION_NAME + '("e3")';
    expect(output).toBe(expectedOutput);
  });

  it('should parse accessors correctly', () => {
    const input = 'abc()[def].ghi + abc.def(["ghi"])[jkl] + 1.2';
    const output = evalculist(input, true);
    const expectedOutput =
      DOT_ACC_FUNCTION_NAME +
      '(' +
      SQUARE_ACC_FUNCTION_NAME +
      '(' +
      VAR_FUNCTION_NAME +
      '("abc")(), ' +
      VAR_FUNCTION_NAME +
      '("def")), "ghi") + ' +
      SQUARE_ACC_FUNCTION_NAME +
      '(' +
      DOT_ACC_FUNCTION_NAME +
      '(' +
      VAR_FUNCTION_NAME +
      '("abc"), "def")(["ghi"]), ' +
      VAR_FUNCTION_NAME +
      '("jkl")) + 1.2';
    expect(output).toBe(expectedOutput);
  });

  it('should parse assignments correctly', () => {
    const input = 'a = 1; b == 2; c === 3; d != 4; e !== 5;';
    const output = evalculist(input, true);
    const expectedOutput =
      `${ASSIGN_FUNCTION_NAME}("a", 1);` +
      'bcde'
        .split('')
        .map((c, i) => {
          const s = ['==', '===', '!=', '!=='][i];
          return ` ${VAR_FUNCTION_NAME}("${c}") ${s} ${i + 2}`;
        })
        .join(';');
    expect(output).toBe(expectedOutput);
  });

  it('should use the provided "variable" function', () => {
    const values: Record<string, number> = { abc: 3, def: 2.8, ghi: 5.1 };
    const input = 'abc + def * ghi';
    const output = evalculist(input, {
      variable: (v) => values[v],
    });
    const expectedOutput = values['abc'] + values['def'] * values['ghi'];
    expect(output).toBe(expectedOutput);
  });

  it('should use the provided "accessor" function', () => {
    const values = { abc: { def: 2.8 }, ghi: { jkl: 5.1 } };
    const input = 'abc["def"] * ghi.jkl';
    const output = evalculist(input, {
      variable: (v) => values[v as keyof typeof values],
      accessor: (obj, v) => (obj as Record<string, number>)[v as string],
    });
    const expectedOutput = values['abc']['def'] * values['ghi']['jkl'];
    expect(output).toBe(expectedOutput);
  });

  it('should use the provided "assignment" function', () => {
    const values: Record<string, number> = {};
    const input = 'abc = 123';
    const output = evalculist(input, {
      variable: () => undefined,
      assignment: (name, val) => (values[name] = val as number),
    });
    const expectedOutput = 123;
    expect(output).toBe(expectedOutput);
    expect(values.abc).toBe(expectedOutput);
  });

  it('should parse strings correctly', () => {
    let input = '"abc \\"def\\" \'ghi" + "\\"jkl" + \'mno\'';
    let output = evalculist(input, { variable: () => undefined });
    // eslint-disable-next-line no-eval
    expect(output).toBe(eval(input));

    input = '\'abc + "def", ghi\'';
    output = evalculist(input, { variable: () => undefined });
    // eslint-disable-next-line no-eval
    expect(output).toBe(eval(input));

    expect(evalculist('1 + [2]', true)).toBe('1 + [2]');
  });

  it('should evaluate semicolons correctly', () => {
    const values: Record<string, number> = {};
    const input = 'a = 1;; b = a + 1;';
    const output = evalculist(input, {
      variable: (name) => values[name],
      assignment: (name, val) => (values[name] = val as number),
    });
    expect(output).toBe(2);
    expect(values.a).toBe(1);
    expect(values.b).toBe(2);
  });
});

describe('evalculist.new', () => {
  it('should create a new function', () => {
    const evaluate = evalculist.new();
    expect(typeof evaluate).toBe('function');
  });

  it('should use the provided handlers', () => {
    const values = { abc: { def: 123 } };
    const evaluate = evalculist.new({
      variable: (name) => values[name as keyof typeof values],
      accessor: (object, key) =>
        (object as Record<string, number>)[key as string] + 1,
    });
    const input = 'abc["def"]';
    const output = evaluate(input);
    const expectedOutput = values.abc.def + 1;
    expect(output).toBe(expectedOutput);
  });
});

describe('evalculist.newFromContext', () => {
  it('should create a new function', () => {
    const evaluate = evalculist.newFromContext({});
    expect(typeof evaluate).toBe('function');
  });

  it('should use the provided context', () => {
    const values = { abc: { def: 123 } };
    const evaluate = evalculist.newFromContext(values);
    const input = 'abc.def + 1';
    const output = evaluate(input);
    const expectedOutput = values.abc.def + 1;
    expect(output).toBe(expectedOutput);
  });
});

describe('API compatibility', () => {
  it('should have context property', () => {
    expect(evalculist.context).toBeDefined();
    expect(typeof evalculist.context).toBe('object');
  });

  it('should have variable function', () => {
    expect(typeof evalculist.variable).toBe('function');
  });

  it('should have accessor function', () => {
    expect(typeof evalculist.accessor).toBe('function');
  });

  it('should have assignment function', () => {
    expect(typeof evalculist.assignment).toBe('function');
  });

  it('should return curried function when called without handlers', () => {
    const fn = evalculist('x + 1');
    expect(typeof fn).toBe('function');

    const result = fn({
      variable: (name) => (name === 'x' ? 5 : undefined),
    });
    expect(result).toBe(6);
  });
});
