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
  * [x] structure declarations (`structure S = struct end;`)
  * [x] signature declarations (`signature S = sig end;`)
  * [x] functor declarations (`functor F = struct end;`)
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
  * [x] structures
  * [x] signatures 
  * [x] functors
* Supported standard library constructs (Note that all available libraries are loaded per default, currently SOSML has not implemented any user-space loading of modules.)
  * Math library
  * Char library `ord`, `chr`, `Char.isLower`, `Char.isUpper`, `Char.isDigit`, `Char.isAlpha`
  * Int library `Int.minInt`, `Int.maxInt`, and `Int.compare`
  * Real library `Real.compare`, `Real.fromInt`, `Real.round`, `Real.floor`, and `Real.ceil`
  * Option library
  * List and Listsort libraries
  * Vector library `fromList`, `tabulate`, `length`, `sub`, `update`, `app`, `map`, `foldl`, `foldr`
  * Array library `fromList`, `tabulate`, `length`, `sub`, `update`, `vector`, `foldl`, `foldr`
  * String library

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

## Contributing

We welcome you to open an Issue for any error you may find, and we will try to fix it ASAP. 
Further, if you want additional parts of the Standard Library or other features in general implemented, 
feel free to open a new Issue. 

If you want to contribute via writing code, you may check the Issues page for any unresolved problems 
or unimplemented features and then submit a pull request after solving that problem or implementing that feature.
