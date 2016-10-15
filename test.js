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
    const input = 'abc[def] + abc.def.ghi';
    // TODO abc()[def], abc[def].ghi, and so on
    const output = evalculist(input, true);
    const expectedOutput = '_brk_acc(_var("abc"), _var("def")) + _dot_acc(_dot_acc(_var("abc"), "def"), "ghi")';
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
