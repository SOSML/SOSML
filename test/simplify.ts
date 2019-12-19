import * as Lexer from '../src/lexer';
import * as Token from '../src/tokens';
import * as Parser from '../src/parser';
import * as InitialState from '../src/initialState';
import * as Expr from '../src/expressions';
import * as Decl from '../src/declarations';
import * as Type from '../src/types';
import * as TestHelper from './test_helper';
TestHelper.init();

function parse(str: string): Decl.Declaration {
    return Parser.parse(Lexer.lex(str), InitialState.getInitialState());
}

function expression_tester(expression: Expr.Expression) {
    return new Decl.SequentialDeclaration(
        [
            new Decl.ValueDeclaration(
                [],
                [
                    new Decl.ValueBinding(
                        false,
                        new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x")),
                        expression
                    )
                ], 2
            )
        ], 1
    )
}

it("exp - tuple to record", () => {
    expect(parse("val x = ();").simplify()).toEqualWithType(
        expression_tester(new Expr.Record( true, []))
    );

    let record: Expr.Record = new Expr.Record( true, [
        ["1", new Expr.Constant( new Token.NumericToken("11", 11))],
        ["2", new Expr.Constant( new Token.NumericToken("12", 12))]
    ]);
    expect(parse("val x = (11, 12);").simplify()).toEqualWithType(
        expression_tester(record)
    );

    let record1: Expr.Record = new Expr.Record( true, [
        ["1", new Expr.Constant( new Token.NumericToken("11", 11))],
        ["2", new Expr.Constant( new Token.NumericToken("12", 12))],
        ["3", new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("a"))],
        ["4", new Expr.Constant( new Token.NumericToken("14", 14))],
    ]);
    expect(parse("val x = (11, 12, a, 14);").simplify()).toEqualWithType(
        expression_tester(record1)
    );

    expect(parse("val x = (11);").simplify()).toEqualWithType(
        expression_tester(new Expr.Constant( new Token.NumericToken("11", 11)))
    )
});

it("exp", () => {
    let lambda: Expr.Lambda = new Expr.Lambda(
        new Expr.Match(
            [[
                new Expr.Record(
                    false,
                    [["y", new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("fish"))]]
                ),
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("fish"))
            ]]
        )
    );
    let try_this: string = "val x = fn {y = fish, ...} => fish;";
    expect(parse(try_this).simplify()).toEqualWithType(
        expression_tester(lambda)
    );

    let lambda1: Expr.Lambda = new Expr.Lambda(
        new Expr.Match(
            [[
                new Expr.Record(
                    false,
                    [["y", new Expr.ValueIdentifier( new Token.IdentifierToken("__rs"))]]
                ),
                new Expr.ValueIdentifier( new Token.IdentifierToken("__rs"))
            ]]
        )
    );
    expect(parse("val x = # y;").simplify()).toEqualWithType(
        expression_tester(lambda1)
    );

    let case_stuff: Expr.Expression = new Expr.FunctionApplication(
        new Expr.Lambda(
            new Expr.Match(
                [[new Expr.Wildcard(), new Expr.Constant( new Token.NumericToken("1", 1))]]
            )
        ),
        new Expr.Constant( new Token.NumericToken("42", 42))
    );
    expect(parse("val x = case 42 of _ => 1;").simplify()).toEqualWithType(
        expression_tester(case_stuff)
    );

    let if_then_else: Expr.Expression = new Expr.FunctionApplication(
        new Expr.Lambda( new Expr.Match( [
            [new Expr.ValueIdentifier( new Token.IdentifierToken("true")), new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("blah"))],
            [new Expr.ValueIdentifier( new Token.IdentifierToken("false")), new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("blub"))]
        ])),
        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("fish"))
    )
    expect(parse("val x = if fish then blah else blub;").simplify()).toEqualWithType(
        expression_tester(if_then_else)
    )

    let orelse: Expr.Expression = new Expr.FunctionApplication(
        new Expr.Lambda( new Expr.Match( [
            [new Expr.ValueIdentifier( new Token.IdentifierToken("true")), new Expr.ValueIdentifier( new Token.IdentifierToken("true"))],
            [new Expr.ValueIdentifier( new Token.IdentifierToken("false")), new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("blub"))]
        ])),
        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("fish"))
    )
    expect(parse("val x = fish orelse blub;").simplify()).toEqualWithType(
        expression_tester(orelse)
    )

    let andalso: Expr.Expression = new Expr.FunctionApplication(
        new Expr.Lambda( new Expr.Match( [
            [new Expr.ValueIdentifier( new Token.IdentifierToken("true")), new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("blah"))],
            [new Expr.ValueIdentifier( new Token.IdentifierToken("false")), new Expr.ValueIdentifier( new Token.IdentifierToken("false"))]
        ])),
        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("fish"))
    )
    expect(parse("val x = fish andalso blah;").simplify()).toEqualWithType(
        expression_tester(andalso)
    )

    let br_semicolon: Expr.Expression = new Expr.FunctionApplication(
        new Expr.Lambda( new Expr.Match( [
            [new Expr.Wildcard(), new Expr.Constant( new Token.NumericToken("2", 2))]
        ])),
        new Expr.Constant( new Token.NumericToken("1", 1))
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
        expression_tester(new Expr.FunctionApplication( new Expr.ValueIdentifier( new Token.IdentifierToken("::")), new Expr.Record( true, [
            ["1", new Expr.Constant( new Token.NumericToken("1", 1))],
            ["2", new Expr.ValueIdentifier( new Token.IdentifierToken("nil"))],
        ])))
    )
    //TODO
});

function get42(): Expr.PatternExpression {
    return new Expr.Constant(new Token.NumericToken('42', 42));
}

function pattern_tester(pattern: Expr.Pattern): Decl.Declaration {
    return new Decl.SequentialDeclaration([
        new Decl.ValueDeclaration([], [
            new Decl.ValueBinding(false, pattern, get42())
        ], 2)
    ], 1);
}

it("pat", () => {
    expect(parse("val () = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record( true, []),
        )
    )

    expect(parse("val (_,{}) = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record( true, [
                ["1", new Expr.Wildcard()],
                ["2", new Expr.Record( true, [])]
            ]),
        )
    )
    //TODO especially the list stuff as soon as it is fixed in exp
    //TODO
});

it("patrow", () => {
    expect(parse("val {x  } = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record( true, [
                ["x", new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x"))]
            ]),
        )
    );
    expect(parse("val {x as y} = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record(
                true,
                [
                    [
                        "x",
                        new Expr.LayeredPattern(
                            new Token.AlphanumericIdentifierToken("x"),
                            undefined,
                            new Expr.ValueIdentifier(
                                new Token.AlphanumericIdentifierToken("y")
                            )
                        )
                    ]
                ]
            ),
        )
    );
    expect(parse("val {x:int} = 42;").simplify()).toEqualWithType(
        pattern_tester(
            new Expr.Record( true, [
                [
                    "x",
                    new Expr.TypedExpression(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x")),
                        new Type.CustomType('int', [])
                    )
                ]
            ]),
        )
    );
    //TODO
});

// val x = 42 :ty
function type_tester(type: Type.Type) {
    return expression_tester(new Expr.TypedExpression(
        get42(),
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
                ["1", new Type.CustomType("int", [])],
                ["2", new Type.CustomType("int", [])]
            ]),
            true,
        ))
    )

    expect(parse("val x = 42:int * int * int;").simplify()).toEqualWithType(
        type_tester(new Type.RecordType(
            new Map([
                ["1", new Type.CustomType("int", [])],
                ["2", new Type.CustomType("int", [])],
                ["3", new Type.CustomType("int", [])]
            ]),
            true,
        ))
    )
    //TODO
});

/*
function fvalbind_helper(expr: Expr.Expression) {
    return new Decl.SequentialDeclaration([
        new Decl.FunctionDeclaration([], [
            new Decl.FunctionValueBinding([
                    [
                        [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                        undefined,
                        expr
                    ]
                ],
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
            )
        ], 2)
    ], 1)
}
*/

it("fvalbind", () => {
    // expect(parse("fun f x = 1;").simplify()).toEqualWithType(
    //     parse("val rec f = fn fish => case (fish) of (x) => 1;").simplify()
    // )
    //TODO
});

it("dec", () => {
    expect(parse("fun 'a f x = 42;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration([
             new Decl.ValueDeclaration([new Type.TypeVariable('\'a')], [
                 new Decl.ValueBinding(
                     true,
                     new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                     new Expr.Lambda(
                         new Expr.Match( [
                             [new Expr.ValueIdentifier( new Token.IdentifierToken('__arg0')),
                                new Expr.FunctionApplication(
                                    new Expr.Lambda(
                                        new Expr.Match( [
                                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')), get42()]
                                        ])
                                    ),
                                    new Expr.ValueIdentifier( new Token.IdentifierToken('__arg0')),
                                 )
                             ]
                         ])
                     )
                 )
             ], 2)
        ], 1)
    );
    expect(parse("fun 'a f x = 42 and g x = 42;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration([
             new Decl.ValueDeclaration([new Type.TypeVariable('\'a')], [
                 new Decl.ValueBinding(
                     true,
                     new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                     new Expr.Lambda(
                         new Expr.Match( [
                             [new Expr.ValueIdentifier( new Token.IdentifierToken('__arg0')),
                                new Expr.FunctionApplication(
                                    new Expr.Lambda(
                                        new Expr.Match( [
                                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')), get42()]
                                        ])
                                    ),
                                    new Expr.ValueIdentifier( new Token.IdentifierToken('__arg0')),
                                 )
                             ]
                         ])
                     )
                 ),
                 new Decl.ValueBinding(
                     true,
                     new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                     new Expr.Lambda(
                         new Expr.Match( [
                             [new Expr.ValueIdentifier( new Token.IdentifierToken('__arg0')),
                                new Expr.FunctionApplication(
                                    new Expr.Lambda(
                                        new Expr.Match( [
                                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')), get42()]
                                        ])
                                    ),
                                    new Expr.ValueIdentifier( new Token.IdentifierToken('__arg0')),
                                 )
                             ]
                         ])
                     )
                 )
             ], 2)
        ], 1)
    );
    //TODO withtype
});

it("strbind", () => {
    expect(parse("structure a:>b = c;")).toEqualWithType(parse("structure a:>b = c;").simplify());
    expect(parse("structure a:b = c;")).toEqualWithType(parse("structure a:b = c;").simplify());
    // this simplify is done while parsing
});

it("strexp", () => {
    //TODO
});

it("funbind", () => {
    expect(parse("functor a (b: c):e = d;")).toEqualWithType(parse("functor a (b: c):e = d;").simplify());
    expect(parse("functor a (b: c):>e = d;")).toEqualWithType(parse("functor a (b: c):>e = d;").simplify());
    expect(parse("functor a (val a:int) = d;")).toEqualWithType(parse("functor a (val a:int) = d;").simplify());
    expect(parse("functor a (val a:int):b = d;")).toEqualWithType(parse("functor a (val a:int):b = d;").simplify());
    expect(parse("functor a (val a:int):>b = d;")).toEqualWithType(parse("functor a (val a:int):>b = d;").simplify());
    // this simplify is done while parsing
});

it("program", () => {
    expect(parse("1;").simplify()).toEqualWithType(
        new Decl.SequentialDeclaration([new Decl.ValueDeclaration(
            [],
            [new Decl.ValueBinding(
                false,
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("it")),
                new Expr.Constant( new Token.NumericToken("1",1))
            )], 2
        )], 1)
    )
    //TODO
});

it("spec", () => {
    //TODO
});

it("sigexp", () => {
    //TODO
});
