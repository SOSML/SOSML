# SOSML: The Online Interpreter for Standard ML

[![DOI](https://zenodo.org/badge/96932703.svg)](https://doi.org/10.5281/zenodo.18612451)

SOSML is the online interpreter for the functional programming language Standard ML (SML), written in TypeScript.
SOSML is used in a freshman class at Saarland University; you can check it out at https://sosml.org.

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
  * [x] functor declarations (experimental, `functor F = struct end;`)
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
  * [x] functors (experimental)
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

## Using SOSML as an Interpreter for Standard ML (SML)

If you just want to test SOSML, just head to https://sosml.org/editor and enter your code.
Adding a `;` will then start the evaluation.

If you don't like web browsers, but still want to test SOSML, you can install the experimental CLI via `npm`
```bash
npm install -g @sosml/interpreter@latest
```
This makes the command `sosml` available, which behaves like any other run-of-the-mill interpreter for SML.
Note that due to its experimental state, the CLI currently does not take any options or parameters.

## Using SOSML as a Component in Your Project

### The `node` Way

You may use the interpreter bundled in SOSML or parts of it to build your own fancy SML interpreter:
First, install SOSML via
```bash
npm install --save @sosml/interpreter@latest
```
Now, to get your SML code interpreted by SOSML, import `interpret` and `getFirstState` from the package you just installed
and you are good to go:
```js
import { interpret, getFirstState, State } from '@sosml/interpreter';

// Obtain an initial state for the interpretation
let initialState: State = getFirstState();

// Let's interpret some code
let interpretationResult = interpret('val x = "Hello World!";', initialState);
console.log(interpretationResult.state.toString({stopId: initialState.id + 1})); // Prints "val x = "Hello World!": string;"

// Let's interpret some more code; note how we use the state obtained from the last step
interpretationResult = interpret('fun f y = x | f 10 = "???";', interpretationResult.state);

// Note that the last code produced a warning:
console.log(interpretationResult.warnings); // Something like "Rules after "y" unused in pattern matching."

// Similarly, interpretationResult.evaluationErrored may contain an Error if the interpretation of your code failed
// Lastly, SML exceptions raised by your code that are not handled end up in interpretationResult.error.
```
Check out the `src/cli.ts` file for an example SML interpreter using SOSML.

### The “But I Hate `node.js`” Way

Starting with version `1.5.0`, you can directly run SOSML in a `<script>` tag in HTML:

```HTML
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <script src="https://unpkg.com/@sosml/interpreter@^1.5.0/build/interpreter.min.js"></script>
    </head>
    <body>
        <script>
            let initialState = Interpreter.getFirstState();
            let interpretationResult = Interpreter.interpret('val x = "Hello World!";', initialState);
            console.log(interpretationResult.state.toString({stopId: initialState.id + 1}));
            interpretationResult = Interpreter.interpret('fun f y = x | f 10 = "???";', interpretationResult.state);
            console.log(interpretationResult.warnings);
        </script>
    </body>
</html>
```

## Contributing to SOSML

We welcome you to open an Issue for any error or squid you may find, and we will try to fix it ASAP.
Further, if you want additional parts of the Standard Library or other features in general implemented,
feel free to open a new Issue.

If you want to contribute via writing code, you may check the Issues page for any unresolved problems
or unimplemented features and then submit a pull request after solving that problem or implementing that feature.

### Cloning and Building

To get started on writing code for SOSML, clone the repository and install the dependencies:
```bash
git clone https://github.com/SOSML/SOSML
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

To build the CLI, run
```bash
npm run cli
npm link
```

### Testing Your Changes

SOSML comes with an extensive set of tests which can be run via
```bash
npm test
```
This runs all tests located in the `test` directory.
When contributing new code, please make sure that you add the appropriate tests and that no old tests begin to fail.

