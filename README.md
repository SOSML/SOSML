# SOSML - Online SML

SOSML is an online interpreter for the functional programming language Standard ML, written in TypeScript.
It is to be used as a learning tool in a freshman class at Saarland University; you can try it out at https://sosml.github.io.

## Features
Correctly lexing, parsing, elaborating and interpreting any SML core language program, i.e. a program that may contain the following constructs:

* Supported declarations (_partially supported declarations in italics_)
  * [x] value declarations (`val x = 42;`)
  * [x] function declarations (`fun f 0 = 42 | f x = f (x-1);`)
  * [x] type alias declarations (`type t = 'a -> (int * int)`)
  * [x] datatype declarations (`datatype tree = T of tree list;`)
    * `withtype` will not be supported.
  * [x] abstract datatype declarations (`abstype tree = T of tree list with val empty = T [];`)
        Note that `abstype` is implemented as a derived form as proposed by Successor ML.
    * `withtype` will not be supported.
  * [x] exception declarations (`exception E of int;`)
  * [x] local declarations (`local val x = 42; in val y = x + 2; end;`)
  * [x] declaring operators as infix, nonfix, left, and right associative via `infix`, `infixr`, and `nonfix`
  * [x] `open` declarations
  * [x] _structure declarations_ (`structure S = struct end;`)
  * [x] _signature declarations_ (`signature S = sig end;`)
  * [x] _functor declarations_ (`functor F = struct end;`)
* Supported expressions (This list is non-exhaustive)
  * [x] tuple (`(1, 2, 3)`), records (`{a = 1, b = 2}`), and lists (`[1, 2, 3]`)
  * [x] application expressions (`f x`)
  * [x] infix expressions (`3 + 4 - 5 * 6`)
  * [x] `andalso` and `orelse` expressions
  * [x] `raise` and `handle` expressions
  * [x] conditionals (`if true then 2 else 3`)
  * [x] case analyses (`case x of 0 => 0 | _ => 1`)
  * [x] abstractions (`fn 0 => 0 | _ => 1`)
  * [x] `while` loops
  * [x] `print`
  * [x] `ref`, `!`, and `:=`
  * [x] _something_ structure related
  * [x] _something_ signature related
  * [ ] _anything_ functor related
* Supported standard library constructs
  * Math library `Math.sqrt`, `Math.sin`, `Math.cos`, `Math.asin`, `Math.acos`, `Math.exp`, `Math.pow`,
    `Math.ln`, `Math.log10`, `Math.pi`, and `Math.e`
  * Char library `ord`, `chr`, `Char.isLower`, `Char.isUpper`, `Char.isDigit`, `Char.isAlpha`
  * Int library `Int.minInt`, `Int.maxInt`, and `Int.compare`
  * Real library `Real.compare`, `Real.fromInt`, `Real.round`, `Real.floor`, and `Real.ceil`
  * `order`, `option`
  * List library `hd`, `tl`, `null`, `map`, `@`, `length`, `rev`, `List.concat`, `foldl`, `foldr`
    `List.tabulate`, `List.exists`, `List.all`, `List.filter`, `List.collate`, `List.nth`

## Building and installation
The dependencies of this package must be installed to test or build.
```bash
npm install
```

To build the interpreter and pack it into one file using [Webpack](https://webpack.js.org/) run:
```bash
npm run build
```
This will create a file in the directory `build` called `interpreter.js`.

To also minify the result run:
```bash
npm run dist
```
This will create a file in the directory `build` called `interpreter.min.js`.

## Test

To run the tests use:
```bash
npm test
```
This runs all tests located in the `test` directory.

## Writing your own tests

To write your own tests, create a new file in the `test` directory. You can write multiple tests into the same file. The testing framework used is
[Jest](https://facebook.github.io/jest/).

Example test:
```javascript
it("adds up 1 and 2 to 3", () => {
    const sum = require("../src/sum");

    expect(sum(1,2)).toBe(3);
});
```
Consult the Jest documentation for details on how to write tests.
