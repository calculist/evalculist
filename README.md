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

- `accessor` parsing currently does not work past one degree of depth for square brackets. For example,
```js
a['b']['c']
```
currently yields
```js
accessor(variable("a"), 'b')['c']
```
which is wrong. It should yield
```js
accessor(accessor(variable("a"), 'b'), 'c')
```

- `accessor` parsing currently does not work for non-variable objects like function return values. For example,
```js
a().b
```
currently yields
```js
variable("a")().variable("b")
```
which is wrong. It should yield
```js
accessor(variable("a")(), "b")
```

- Assignment operations do not work. This is partially by design, but it would be nice to have the option to define an `assignment` function.

---

License MIT
