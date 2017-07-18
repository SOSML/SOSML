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

function get42(pos: Errors.Position): Expr.Expresion {
    return new Expr.Constant(pos, new Lexer.NumericToken('42', pos, 42));
}

function pattern_tester(pattern: Expr.Pattern, pos42: Errors.Position): Decl.Declaration {
    return new Decl.SequentialDeclaration(0, [
        new Decl.ValueDeclaration(0, [], [
            new Decl.ValueBinding(4, false, pattern, get42(pos42))
        ])
    ]);
}

it("exp - tuple to record", () => {
    expect(parse("val x = ();").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0,[
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(
                    4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken("x", 4)),
                    new Expr.Record(8, true, [])
                )
            ])
        ])
    );

    let record: Expr.Record = new Expr.Record(8, true, [
        ["1", new Expr.Constant(9, new Lexer.NumericToken("11", 9, 11))],
        ["2", new Expr.Constant(13, new Lexer.NumericToken("12", 13, 12))]
    ]);
    expect(parse("val x = (11, 12);").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0,[
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(
                    4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken("x", 4)),
                    record;
                )
            ])
        ])
    );

    let record: Expr.Record = new Expr.Record(8, true, [
        ["1", new Expr.Constant(9, new Lexer.NumericToken("11", 9, 11))],
        ["2", new Expr.Constant(13, new Lexer.NumericToken("12", 13, 12))],
        ["3", new Expr.ValueIdentifier(17, new Lexer.AlphanumericIdentifierToken("a", 17))],
        ["4", new Expr.Constant(20, new Lexer.NumericToken("14", 20, 14))],
    ]);
    expect(parse("val x = (11, 12, a, 14);").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0,[
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(
                    4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken("x", 4)),
                    record;
                )
            ])
        ])
    );
});

it("exp", () => {
    let lambda: Expr.Lambda = new Expr.Lambda(
        8,
        new Expr.Match(
            11,
            [[
                new Expr.Record(
                    12,
                    false,
                    [["y", new Expr.ValueIdentifier(16, new Lexer.AlphanumericIdentifierToken("__rs",16))]]
                ),
                new Expr.ValueIdentifier(30, new Lexer.AlphanumericIdentifierToken("__rs", 30))
            ]]
        )
    );
    let try_this: string = "val x = fn {y = __rs, ...} => __rs;";
    expect(parse(try_this).simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0,[
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(
                    4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken("x", 4)),
                    lambda
                )
            ])
        ])
    );

    let lambda1: Expr.Lambda = new Expr.Lambda(
        8,
        new Expr.Match(
            -1,
            [[
                new Expr.Record(
                    -1,
                    false,
                    [["y", new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken("__rs",-1))]]
                ),
                new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken("__rs", -1))
            ]]
        )
    );
    expect(parse("val x = # y;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0,[
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(
                    4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken("x", 4)),
                    lambda1
                )
            ])
        ])
    );
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

    //TODO
});
