const expect = require('chai').expect;
const evalculist = require('./evalculist');

describe('basic functionality', () => {

  it('should be a function', () => {
    expect(evalculist).to.be.a('function');
  });

  it('should parse variables correctly', () => {
    const input = 'abc + 1e2 * e3';
    const output = evalculist(input, true);
    const expectedOutput = '_var("abc") + 1e2 * _var("e3")';
    expect(output).to.eq(expectedOutput);
  });

  it('should parse accessors correctly', () => {
    const input = 'abc()[def].ghi + abc.def(["ghi"])[jkl] + 1.2';
    const output = evalculist(input, true);
    const expectedOutput = '_dot_acc(_brk_acc(_var("abc")(), _var("def")), "ghi") + _brk_acc(_dot_acc(_var("abc"), "def")(["ghi"]), _var("jkl")) + 1.2';
    expect(output).to.eq(expectedOutput);
  });

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

  it('should parse strings correctly', () => {
    const input = '"abc \\"def\\" \'ghi" + "\\"jkl" + \'mno\'';
    const output = evalculist(input, {});
    expect(output).to.eq(eval(input));
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
