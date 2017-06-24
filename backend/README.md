# Backend

This folder contains the source code and configuration to build the backend.

## Prerequisites

The dependencies of this package must be installed to test or build.
```bash
npm install
```

## Test

To run the tests use:
```bash
npm test
```
This runs all tests located in the `test` directory.

## Build

To build the backend and pack it into one file using [Webpack](https://webpack.js.org/) run:
```bash
npm run build
```
This will create a file in the directory `build` called `interpreter.js`.

To also minify the result run:
```bash
npm run dist
```
This will create a file in the directory `build` called `interpreter.min.js`.
