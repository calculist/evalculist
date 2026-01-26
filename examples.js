/**
 * Live examples demonstrating evalculist capabilities
 * Run with: node examples.js
 */

import evalculist from './dist/index.js';

console.log('=== evalculist Examples ===\n');

// ─────────────────────────────────────────────────────────────
// 1. Basic Variable Resolution
// ─────────────────────────────────────────────────────────────
console.log('1. Basic Variable Resolution');
console.log('─'.repeat(40));

const vars1 = { x: 10, y: 5 };
const result1 = evalculist('x + y * 2', {
  variable: (name) => vars1[name]
});
console.log(`Expression: x + y * 2`);
console.log(`Context: { x: 10, y: 5 }`);
console.log(`Result: ${result1}`);  // 20
console.log();

// ─────────────────────────────────────────────────────────────
// 2. Dot Property Access
// ─────────────────────────────────────────────────────────────
console.log('2. Dot Property Access');
console.log('─'.repeat(40));

const vars2 = {
  user: { name: 'Alice', age: 30 },
  config: { multiplier: 2 }
};
const result2 = evalculist('user.age * config.multiplier', {
  variable: (name) => vars2[name],
  accessor: (obj, key) => obj[key]
});
console.log(`Expression: user.age * config.multiplier`);
console.log(`Context: { user: { name: 'Alice', age: 30 }, config: { multiplier: 2 } }`);
console.log(`Result: ${result2}`);  // 60
console.log();

// ─────────────────────────────────────────────────────────────
// 3. Bracket Property Access
// ─────────────────────────────────────────────────────────────
console.log('3. Bracket Property Access');
console.log('─'.repeat(40));

const vars3 = {
  data: { 'special-key': 42 },
  key: 'special-key'
};
const result3 = evalculist('data[key]', {
  variable: (name) => vars3[name],
  accessor: (obj, key) => obj[key]
});
console.log(`Expression: data[key]`);
console.log(`Context: { data: { 'special-key': 42 }, key: 'special-key' }`);
console.log(`Result: ${result3}`);  // 42
console.log();

// ─────────────────────────────────────────────────────────────
// 4. Variable Assignment
// ─────────────────────────────────────────────────────────────
console.log('4. Variable Assignment');
console.log('─'.repeat(40));

const vars4 = { a: 5 };
const result4 = evalculist('b = a * 10', {
  variable: (name) => vars4[name],
  assignment: (name, val) => (vars4[name] = val)
});
console.log(`Expression: b = a * 10`);
console.log(`Before: { a: 5 }`);
console.log(`Result: ${result4}`);  // 50
console.log(`After: { a: ${vars4.a}, b: ${vars4.b} }`);
console.log();

// ─────────────────────────────────────────────────────────────
// 5. Using evalculist.newFromContext (Simplest API)
// ─────────────────────────────────────────────────────────────
console.log('5. Using evalculist.newFromContext (Simplest API)');
console.log('─'.repeat(40));

const context = {
  price: 100,
  quantity: 3,
  discount: 0.1,
  round: Math.round
};
const evaluate = evalculist.newFromContext(context);

console.log(`Context: { price: 100, quantity: 3, discount: 0.1, round: Math.round }`);
console.log(`Expression: round(price * quantity * (1 - discount))`);
console.log(`Result: ${evaluate('round(price * quantity * (1 - discount))')}`);  // 270
console.log();

// ─────────────────────────────────────────────────────────────
// 6. Using evalculist.new with Custom Handlers
// ─────────────────────────────────────────────────────────────
console.log('6. Using evalculist.new with Custom Handlers');
console.log('─'.repeat(40));

const safeVars = { allowed: 'yes', secret: 'hidden' };
const safeEval = evalculist.new({
  variable: (name) => {
    if (name === 'secret') return '[REDACTED]';
    return safeVars[name];
  },
  accessor: (obj, key) => obj[key]
});

console.log(`Expression: allowed`);
console.log(`Result: ${safeEval('allowed')}`);  // yes
console.log(`Expression: secret`);
console.log(`Result: ${safeEval('secret')}`);  // [REDACTED]
console.log();

// ─────────────────────────────────────────────────────────────
// 7. Multi-Statement Evaluation
// ─────────────────────────────────────────────────────────────
console.log('7. Multi-Statement Evaluation');
console.log('─'.repeat(40));

const vars7 = {};
const result7 = evalculist('x = 5; y = x + 3; z = x * y', {
  variable: (name) => vars7[name],
  assignment: (name, val) => (vars7[name] = val)
});
console.log(`Expression: x = 5; y = x + 3; z = x * y`);
console.log(`Result (last statement): ${result7}`);  // 40
console.log(`Final state: { x: ${vars7.x}, y: ${vars7.y}, z: ${vars7.z} }`);
console.log();

// ─────────────────────────────────────────────────────────────
// 8. Function Calls in Expressions
// ─────────────────────────────────────────────────────────────
console.log('8. Function Calls in Expressions');
console.log('─'.repeat(40));

const mathContext = {
  sin: Math.sin,
  cos: Math.cos,
  PI: Math.PI,
  pow: Math.pow
};
const mathEval = evalculist.newFromContext(mathContext);

console.log(`Expression: pow(sin(PI / 2), 2) + pow(cos(PI / 2), 2)`);
console.log(`Result: ${mathEval('pow(sin(PI / 2), 2) + pow(cos(PI / 2), 2)')}`);  // 1
console.log();

// ─────────────────────────────────────────────────────────────
// 9. Chained Property Access
// ─────────────────────────────────────────────────────────────
console.log('9. Chained Property Access');
console.log('─'.repeat(40));

const deepContext = {
  company: {
    departments: {
      engineering: {
        headcount: 50
      }
    }
  }
};
const deepEval = evalculist.newFromContext(deepContext);

console.log(`Expression: company.departments.engineering.headcount`);
console.log(`Result: ${deepEval('company.departments.engineering.headcount')}`);  // 50
console.log();

// ─────────────────────────────────────────────────────────────
// 10. Seeing the Compiled Output
// ─────────────────────────────────────────────────────────────
console.log('10. Seeing the Compiled Output (pass true as 2nd arg)');
console.log('─'.repeat(40));

const compiled = evalculist('user.name = "Bob"', true);
console.log(`Expression: user.name = "Bob"`);
console.log(`Compiled:   ${compiled}`);
console.log();

console.log('=== End of Examples ===');
