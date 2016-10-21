evalculist.js
=============

`evalculist` provides a way to evaluate arbitrary javascript expressions in a controlled way, without exposing global variables. It accomplishes this by parsing the expressions such that variables become strings that are passed to `variable` and `accessor` functions.
```js
myObject.attribute
```
becomes
```js
accessor(variable("myObject"), "attribute")
```

Usage
-----

Using `evalculist.new`

```js
const localVars = {
  a: { b: 1 },
  c: 2
};
const evaluate = evalculist.new({
  variable: (name) => localVars[name] || Math[name],
  accessor: (object, key) => object[key]
});
const result = evaluate('pow(a.b + 1, c)');
// result === 4
```

Using `evalculist.newFromContext`

```js
const context = {
  a: { b: 1 },
  c: 2,
  pow: Math.pow
};
const evaluate = evalculist.newFromContext(context);
const result = evaluate('pow(a.b + 1, c)');
// result === 4
```

Known Bugs
----------

- Assignment operations do not work. This is partially by design, but it would be nice to have the option to define an `assignment` function.
- Object literals do not work if the keys are not enclosed in quotes (e.g. `{a:1}` does not work, but `{"a":1}` does).
- Keywords do not work (e.g. `if`,`for`,`var`, etc.).

---

License MIT
