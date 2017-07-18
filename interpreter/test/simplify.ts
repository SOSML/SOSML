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

function expression_tester(expression: Expr.Expression) {
    return new Decl.SequentialDeclaration(
        0,
        [
            new Decl.ValueDeclaration(
                0,
                [],
                [
                    new Decl.ValueBinding(
                        4,
                        false,
                        new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken("x", 4)),
                        expression
                    )
                ]
            )
        ]
    )
}

it("exp - tuple to record", () => {
    expect(parse("val x = ();").simplify()).toEqualWithType(
        expression_tester(new Expr.Record(8, true, []));
    );

    let record: Expr.Record = new Expr.Record(8, true, [
        ["1", new Expr.Constant(9, new Lexer.NumericToken("11", 9, 11))],
        ["2", new Expr.Constant(13, new Lexer.NumericToken("12", 13, 12))]
    ]);
    expect(parse("val x = (11, 12);").simplify()).toEqualWithType(
        expression_tester(record);
    );

    let record1: Expr.Record = new Expr.Record(8, true, [
        ["1", new Expr.Constant(9, new Lexer.NumericToken("11", 9, 11))],
        ["2", new Expr.Constant(13, new Lexer.NumericToken("12", 13, 12))],
        ["3", new Expr.ValueIdentifier(17, new Lexer.AlphanumericIdentifierToken("a", 17))],
        ["4", new Expr.Constant(20, new Lexer.NumericToken("14", 20, 14))],
    ]);
    expect(parse("val x = (11, 12, a, 14);").simplify()).toEqualWithType(
        expression_tester(record1);
    );

    expect(parse("val x = (11);").simplify()).toEqualWithType(
        expression_tester(new Expr.Constant(9, new Lexer.NumericToken("11", 9, 11)))
    )
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
        expression_tester(lambda)
    );

    let lambda1: Expr.Lambda = new Expr.Lambda(
        8,
        new Expr.Match(
            -1,
            [[
                new Expr.Record(
                    -1,
                    false,
                    [["y", new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken("__rs",-1))]]
                ),
                new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken("__rs", -1))
            ]]
        )
    );
    expect(parse("val x = # y;").simplify()).toEqualWithType(
        expression_tester(lambda1)
    );

    let case_stuff: Expr.Expression = new Expr.FunctionApplication(
        8,
        new Expr.Lambda(
            8,
            new Expr.Match(
                19,
                [[new Expr.Wildcard(19), new Expr.Constant(24, new Lexer.NumericToken("1", 24, 1))]]
            )
        ),
        new Expr.Constant(13, new Lexer.NumericToken("42", 13, 42))
    );
    expect(parse("val x = case 42 of _ => 1;").simplify()).toEqualWithType(
        expression_tester(case_stuff)
    );

    let if_then_else: Expr.Expression = new Expr.FunctionApplication(
        8,
        new Expr.Lambda(8, new Expr.Match(8, [
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("true", 0)), new Expr.ValueIdentifier(21, new Lexer.AlphanumericIdentifierToken("blah", 21))],
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("false", 0)), new Expr.ValueIdentifier(31, new Lexer.AlphanumericIdentifierToken("blub", 31))]
        ])),
        new Expr.ValueIdentifier(11, new Lexer.AlphanumericIdentifierToken("fish", 11))
    )
    expect(parse("val x = if fish then blah else blub;").simplify()).toEqualWithType(
        expression_tester(if_then_else)
    )

    let orelse: Expr.Expression = new Expr.FunctionApplication(
        8,
        new Expr.Lambda(8, new Expr.Match(8, [
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("true", 0)), new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("true", 0))],
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("false", 0)), new Expr.ValueIdentifier(20, new Lexer.AlphanumericIdentifierToken("blub", 20))]
        ])),
        new Expr.ValueIdentifier(8, new Lexer.AlphanumericIdentifierToken("fish", 8))
    )
    expect(parse("val x = fish orelse blub;").simplify()).toEqualWithType(
        expression_tester(orelse)
    )

    let andalso: Expr.Expression = new Expr.FunctionApplication(
        8,
        new Expr.Lambda(8, new Expr.Match(8, [
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("true", 0)), new Expr.ValueIdentifier(21, new Lexer.AlphanumericIdentifierToken("blah", 21))],
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("false", 0)), new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("false", 0))]
        ])),
        new Expr.ValueIdentifier(8, new Lexer.AlphanumericIdentifierToken("fish", 8))
    )
    expect(parse("val x = fish andalso blah;").simplify()).toEqualWithType(
        expression_tester(andalso)
    )

    let br_semicolon: Expr.Expression = new Expr.FunctionApplication(
        8,
        new Expr.Lambda(8, new Expr.Match(8, [
            [new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("true", 0)), new Expr.ValueIdentifier(21, new Lexer.AlphanumericIdentifierToken("blah", 21))]
        ])),
        new Expr.ValueIdentifier(8, new Lexer.AlphanumericIdentifierToken("fish", 8))
    )
    expect(parse("val x = (1;2);").simplify()).toEqualWithType(
        parse("val x = case 1 of (_) => 2;").simplify()
    )
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
