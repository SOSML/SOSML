const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const State = require("../src/state.ts");
const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

function parse(str: string): Decl.Declaration {
    return Parser.parse(Lexer.lex(str), State.getInitialState());
}

it("exp", () => {
    //TODO
});

it("pat", () => {
    //TODO
});

it("patrow", () => {
    //TODO
});

it("ty", () => {
    //TODO
});

it("fvalbind", () => {
    //TODO
});

it("dec", () => {
    let pattern: Expr.Expression = new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken("it",-1));
    let pattern2: Expr.Expression = new Expr.ValueIdentifier(8, new Lexer.AlphanumericIdentifierToken("x",8));
    expect(parse("fun f x = x ; val x = 42;")).toEqualWithType(new Decl.SequentialDeclaration(0, [
        new Decl.ValueDeclaration(0,[], [
            new Decl.ValueBinding(0, false, pattern, new Expr.Constant(0, new Lexer.NumericToken("10", 0, 10)))
        ]),
        new Decl.ValueDeclaration(4,[], [
            new Decl.ValueBinding(8, false, pattern2, new Expr.Constant(12, new Lexer.NumericToken("42", 12, 42)))
        ])
    ]))
    //TODO
});

it("strbind", () => {
    //TODO
});

it("strexp", () => {
    //TODO
});

it("funbind", () => {
    //TODO
});

it("program", () => {
    //val it = 10;
    let pattern: Expr.Expression = new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken("it",-1));
    let pattern2: Expr.Expression = new Expr.ValueIdentifier(8, new Lexer.AlphanumericIdentifierToken("x",8));
    expect(parse("10; val x = 42;")).toEqualWithType(new Decl.SequentialDeclaration(0, [
        new Decl.ValueDeclaration(0,[], [
            new Decl.ValueBinding(0, false, pattern, new Expr.Constant(0, new Lexer.NumericToken("10", 0, 10)))
        ]),
        new Decl.ValueDeclaration(4,[], [
            new Decl.ValueBinding(8, false, pattern2, new Expr.Constant(12, new Lexer.NumericToken("42", 12, 42)))
        ])
    ]))

    //TODO
});
