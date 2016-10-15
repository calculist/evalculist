evalculist.js
=============

`evalculist` provides a way to evaluate arbitrary javascript expressions in a controlled way, without exposing global variables. It accomplishes this by parsing the expressions such that variables become strings that are passed to a function.
```js
myObject.attribute
```
becomes
```js
accessor(variable("myObject"), "attribute")
```

Usage
-----

```js
const localVars = {
  a: { b: 1 },
  c: 2
};

const expression = "pow(a.b + 1, c)";

const result = evalculist(expression, {
  // variable("pow")(accessor(variable("a"), "b") + 1, variable("c"))
  variable: (name) => localVars[name] || Math[name],
  accessor: (object, key) => object[key]
});
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
