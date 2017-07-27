const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const State = require("../src/state.ts");
const InitialState = require("../src/initialState.ts");
const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

function parse(str: string): Decl.Declaration {
    return Parser.parse(Lexer.lex(str), InitialState.getInitialState());
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
                ], 2
            )
        ], 1
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
                    [["y", new Expr.ValueIdentifier(16, new Lexer.AlphanumericIdentifierToken("fish",16))]]
                ),
                new Expr.ValueIdentifier(30, new Lexer.AlphanumericIdentifierToken("fish", 30))
            ]]
        )
    );
    let try_this: string = "val x = fn {y = fish, ...} => fish;";
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
        -1,
        new Expr.Lambda(-1, new Expr.Match(-1, [
            [new Expr.Wildcard(0), new Expr.Constant(11, new Lexer.NumericToken("2", 11, 2))]
        ])),
        new Expr.Constant(9, new Lexer.NumericToken("1", 9 , 1))
    )
    expect(parse("val x = (1;2);").simplify()).toEqualWithType(
        expression_tester(br_semicolon)
    )

    expect(parse("val x = let val y = 42 in  1;2;3  end;").simplify()).toEqualWithType(
        parse("val x = let val y = 42 in (1;2;3) end;").simplify()
    )
    /*
    expect(parse("val x = while true do 1;").simplify()).toEqualWithType(
        parse("val x = let val rec fish = fn () => if true then (1;fish()) else () in fish() end;")
    )
    */

    expect(parse("val x = [1];").simplify()).toEqualWithType(
        expression_tester(new Expr.FunctionApplication(-1, new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("::", 0)), new Expr.Record(-1, true, [
            ["1", new Expr.Constant(9, new Lexer.NumericToken("1", 9, 1))],
            ["2", new Expr.ValueIdentifier(0, new Lexer.IdentifierToken("nil",0))],
        ])))
    )
    //TODO
});

function get42(pos: Errors.Position): Expr.Expresion {
    return new Expr.Constant(pos, new Lexer.NumericToken('42', pos, 42));
}

function pattern_tester(pattern: Expr.Pattern, pos42: Errors.Position): Decl.Declaration {
    return new Decl.SequentialDeclaration(0, [
        new Decl.ValueDeclaration(0, [], [
            new Decl.ValueBinding(4, false, pattern, get42(pos42))
        ], 2)
    ], 1);
}

it("pat", () => {
    expect(parse("val () = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record(4, true, []),
            9
        )
    )

    expect(parse("val (_,{}) = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record(4, true, [
                ["1", new Expr.Wildcard(5)],
                ["2", new Expr.Record(8, true, [])]
            ]),
            13
        )
    )
    //TODO especially the list stuff as soon as it is fixed in exp
    //TODO
});

it("patrow", () => {
    expect(parse("val {x  } = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record(5, true, [
                ["x", new Expr.ValueIdentifier(5, new Lexer.AlphanumericIdentifierToken("x", 5))]
            ]),
            12
        )
    );
    expect(parse("val {x  as y} = 42;").simplify()).toEqualWithType(
        parse("val {x = x  as y} = 42;")
    );
    expect(parse("val {x:int} = 42;")).toEqualWithType(
        pattern_tester(
            new Expr.Record(5, true, [
                [
                    "x",
                    new Expr.TypedExpression(
                        5,
                        new Expr.ValueIdentifier(5, new Lexer.AlphanumericIdentifierToken("x", 5)),
                        new Type.PrimitiveType('int', [], 7)
                    )
                ]
            ]),
            14
        )
    );
    //TODO
});

// val x = 42 :ty
function type_tester(type: Type.Type) {
    return expression_tester(new Expr.TypedExpression(
        8,
        get42(8),
        type
    ))
}

it("ty", () => {
    //currently irrelevant, use when testing for positions
    /*
    expect(parse("val x = 42:int;").simplify()).toEqualWithType(
        parse("val x = 42:int;")
    )
    */
    expect(parse("val x = 42:int * int;").simplify()).toEqualWithType(
        type_tester(new Type.RecordType(
            new Map([
                ["1", new Type.PrimitiveType("int", [], 11)],
                ["2", new Type.PrimitiveType("int", [], 17)]
            ]),
            true,
        ))
    )

    expect(parse("val x = 42:int * int * int;").simplify()).toEqualWithType(
        type_tester(new Type.RecordType(
            new Map([
                ["1", new Type.PrimitiveType("int", [], 11)],
                ["2", new Type.PrimitiveType("int", [], 17)],
                ["3", new Type.PrimitiveType("int", [], 23)]
            ]),
            true,
        ))
    )
    //TODO
});

function fvalbind_helper(expr: Expr.Expression) {
    return new Decl.SequentialDeclaration(0, [
        new Decl.FunctionDeclaration(0, [], [
            new Decl.FunctionValueBinding(4,[
                    [
                        [new Expr.ValueIdentifier(6, new Lexer.AlphanumericIdentifierToken('x', 6))],
                        undefined,
                        expr
                    ]
                ],
                new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken('f', 4)),
            )
        ], 2)
    ], 1)
}

it("fvalbind", () => {
    expect(parse("fun f x = 1;").simplify()).toEqualWithType(
        parse("fun f = fn fish => case (fish) of (x) => 1;").simplify()
    )
    //TODO
});

it("dec", () => {
    expect(parse("fun 'a f x = 42;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0, [
             new Decl.ValueDeclaration(0, [new Type.TypeVariable('\'a', false, 4)], [
                 new Decl.ValueBinding(7,
                     true,
                     new Expr.ValueIdentifier(7, new Lexer.AlphanumericIdentifierToken('f', 7)),
                     new Expr.Lambda(-1,
                         new Expr.Match(-1, [
                             [new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken('__arg0', -1)),
                                new Expr.FunctionApplication(-1,
                                    new Expr.Lambda(-1,
                                        new Expr.Match(-1, [
                                            [new Expr.ValueIdentifier(9, new Lexer.AlphanumericIdentifierToken('x', 9)), get42(13)]
                                        ])
                                    )
                                    new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken('__arg0', -1)),
                                 )
                             ]
                         ])
                     )
                 )
             ], 2)
        ], 1)
    )
    expect(parse("fun 'a f x = 42 and g x = 42;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0, [
             new Decl.ValueDeclaration(0, [new Type.TypeVariable('\'a', false, 4)], [
                 new Decl.ValueBinding(7,
                     true,
                     new Expr.ValueIdentifier(7, new Lexer.AlphanumericIdentifierToken('f', 7)),
                     new Expr.Lambda(-1,
                         new Expr.Match(-1, [
                             [new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken('__arg0', -1)),
                                new Expr.FunctionApplication(-1,
                                    new Expr.Lambda(-1,
                                        new Expr.Match(-1, [
                                            [new Expr.ValueIdentifier(9, new Lexer.AlphanumericIdentifierToken('x', 9)), get42(13)]
                                        ])
                                    )
                                    new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken('__arg0', -1)),
                                 )
                             ]
                         ])
                     )
                 ),
                 new Decl.ValueBinding(20,
                     true,
                     new Expr.ValueIdentifier(20, new Lexer.AlphanumericIdentifierToken('g', 20)),
                     new Expr.Lambda(-1,
                         new Expr.Match(-1, [
                             [new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken('__arg0', -1)),
                                new Expr.FunctionApplication(-1,
                                    new Expr.Lambda(-1,
                                        new Expr.Match(-1, [
                                            [new Expr.ValueIdentifier(22, new Lexer.AlphanumericIdentifierToken('x', 22)), get42(26)]
                                        ])
                                    )
                                    new Expr.ValueIdentifier(-1, new Lexer.IdentifierToken('__arg0', -1)),
                                 )
                             ]
                         ])
                     )
                 )
             ], 2)
        ], 1)
    )
    //TODO withtype
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
    expect(parse("1;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration(0,[new Decl.ValueDeclaration(
            0,
            [],
            [new Decl.ValueBinding(
                0,
                false,
                new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken("it", -1)),
                new Expr.Constant(0, new Lexer.NumericToken("1",0,1))
            )], 2
        )], 1)
    )
    //TODO
});
