const expect = require('chai').expect;
const evalculist = require('./evalculist');

const VAR_FUNCTION_NAME = 'variable';
const DOT_ACC_FUNCTION_NAME = 'dotAccessor';
const SQUARE_ACC_FUNCTION_NAME = 'bracketAccessor';
const ASSIGN_FUNCTION_NAME = 'assignment';

describe('basic functionality', () => {

  it('should be a function', () => {
    expect(evalculist).to.be.a('function');
  });

  it('should parse variables correctly', () => {
    const input = 'abc + 1e2 * e3';
    const output = evalculist(input, true);
    const expectedOutput = VAR_FUNCTION_NAME + '("abc") + 1e2 * ' + VAR_FUNCTION_NAME + '("e3")';
    expect(output).to.eq(expectedOutput);
  });

  it('should parse accessors correctly', () => {
    const input = 'abc()[def].ghi + abc.def(["ghi"])[jkl] + 1.2';
    const output = evalculist(input, true);
    const expectedOutput = DOT_ACC_FUNCTION_NAME +
      '(' + SQUARE_ACC_FUNCTION_NAME +
      '(' + VAR_FUNCTION_NAME + '("abc")(), ' +
      VAR_FUNCTION_NAME + '("def")), "ghi") + ' +
      SQUARE_ACC_FUNCTION_NAME +
      '('+ DOT_ACC_FUNCTION_NAME + '(' +
      VAR_FUNCTION_NAME + '("abc"), "def")(["ghi"]), ' +
      VAR_FUNCTION_NAME + '("jkl")) + 1.2';
    expect(output).to.eq(expectedOutput);
  });

  it('should parse assignments correctly', () => {
    const input = 'a = 1; b == 2; c === 3; d != 4; e !== 5;';
    const output = evalculist(input, true);
    const expectedOutput = `${ASSIGN_FUNCTION_NAME}("a", 1);` + ('bcde').split('').map((c, i) => {
      const s = ['==','===','!=','!=='][i]
      return ` ${VAR_FUNCTION_NAME}("${c}") ${s} ${i + 2}`;
    }).join(';')
    expect(output).to.eq(expectedOutput);
  })

  it('should use the provided "variable" function', () => {
    const values = { abc: 3, def: 2.8, ghi: 5.1 };
    const input = 'abc + def * ghi';
    const output = evalculist(input, {
      variable: (v) => values[v]
    });
    const expectedOutput = values['abc'] + values['def'] * values['ghi'];
    expect(output).to.eq(expectedOutput);
  });

  it('should use the provided "accessor" function', () => {
    const values = { abc: { def: 2.8 }, ghi: { jkl: 5.1 } };
    const input = 'abc["def"] * ghi.jkl';
    const output = evalculist(input, {
      variable: (v) => values[v],
      accessor: (obj, v) => obj[v]
    });
    const expectedOutput = values['abc']['def'] * values['ghi']['jkl'];
    expect(output).to.eq(expectedOutput);
  });

  it('should use the provided "assignment" function', () => {
    const values = {};
    const input = 'abc = 123';
    const output = evalculist(input, {
      assignment: (name, val) => (values[name] = val)
    });
    const expectedOutput = 123;
    expect(output).to.eq(expectedOutput);
    expect(values.abc).to.eq(expectedOutput);
  });

  it('should parse strings correctly', () => {
    let input = '"abc \\"def\\" \'ghi" + "\\"jkl" + \'mno\'';
    let output = evalculist(input, {});
    expect(output).to.eq(eval(input));
    input = '\'abc + "def", ghi\'';
    output = evalculist(input, {});
    expect(output).to.eq(eval(input));
  });

  it('should evaluate semicolons correctly', () => {
    const values = {};
    const input = 'a = 1;; b = a + 1;';
    const output = evalculist(input, {
      variable: (name) => values[name],
      assignment: (name, val) => (values[name] = val)
    });
    expect(output).to.eq(2)
    expect(values.a).to.eq(1)
    expect(values.b).to.eq(2)
  });

});

describe('evalculist.new', () => {

  it('should create a new function', () => {
    const evaluate = evalculist.new();
    expect(evaluate).to.be.a('function');
  });

  it('should use the provided handlers', () => {
    const values = { abc: { def: 123 } };
    const evaluate = evalculist.new({
      variable: (name) => values[name],
      accessor: (object, key) => object[key] + 1
    });
    const input = 'abc["def"]';
    const output = evaluate(input);
    const expectedOutput = values.abc.def + 1
    expect(output).to.eq(expectedOutput);
  });

});

describe('evalculist.newFromContext', () => {

  it('should create a new function', () => {
    const evaluate = evalculist.newFromContext();
    expect(evaluate).to.be.a('function');
  });

  it('should use the provided context', () => {
    const values = { abc: { def: 123 } };
    const evaluate = evalculist.newFromContext(values);
    const input = 'abc.def + 1';
    const output = evaluate(input);
    const expectedOutput = values.abc.def + 1
    expect(output).to.eq(expectedOutput);
  });

});
