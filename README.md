# SOSML - Online SML

SOSML is an online interpreter for the functional programming language Standard ML, written in TypeScript.
It is to be used as a learning tool in a freshman class at Saarland University; you can try it out at https://sosml.github.io.

## Features
Correctly lexing, parsing and interpreting any functional SML core language program, i.e. a program that may contain the following constructs:

* Supported declarations
  * [x] value declarations (`val x = 42;`)
  * [x] function declarations (`fun f 0 = 42 | f x = f (x-1);`)
  * [x] type alias declarations (`type t = 'a -> (int * int)`)
  * [x] datatype declarations (`datatype tree = T of tree list;`)
    * `withtype` will not be supported.
  * [ ] abstract datatype declarations (`abstype tree = T of tree list with val empty = T [];`)
    * `withtype` will not be supported.
  * [x] exception declarations (`exception E of int;`)
  * [x] local declarations (`local val x = 42; in val y = x + 2; end;`)
  * [x] declaring operators as infix, nonfix, left, and right associative via `infix`, `infixr`, and `nonfix`
  * [ ] `open` declarations
  * [ ] structure declarations (`structure S = struct end;`)
  * [ ] signature declarations (`signature S = sig end;`)
  * [ ] functor declarations (`functor F = struct end;`)
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
  * [ ] `ref` and `:=`
  * [ ] anything structure related
  * [ ] anything signature related
  * [ ] anything functor related
* Supported standard library constructs
  * Math library `Math.sqrt`, `Math.sin`, `Math.cos`, `Math.asin`, `Math.acos`, `Math.exp`, `Math.pow`,
    `Math.ln`, `Math.log10`, `Math.pi`, and `Math.e`
  * Char library `ord`, `chr`, `Char.isLower`, `Char.isUpper`, `Char.isDigit`, `Char.isAlpha`
  * Int library `Int.minInt`, `Int.maxInt`, and `Int.compare`
  * Real library `Real.compare`, `Real.fromInt`, `Real.round`, `Real.floor`, and `Real.ceil`
  * `order`, `option`
  * List library `hd`, `tl`, `null`, `map`, `@`, `length`, `rev`, `List.concat`, `foldl`, `foldr`
    `List.tabulate`, `List.exists`, `List.all`, `List.filter`, `List.collate`, `List.nth`

Currently, the interpreter does not have any form of elaboration, i.e. type checking and type interference.
This, and the remaining constructs from the SML module language, will be implemented till October 2017.

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
