import * as Lexer from '../src/lexer';
import * as Token from '../src/tokens';
import * as Parser from '../src/parser';
import * as Errors from '../src/errors';

// import * as API from '../src/main';

// import * as State from '../src/state';
import * as InitialState from '../src/initialState';
import * as Expr from '../src/expressions';
import * as Decl from '../src/declarations';
import * as Type from '../src/types';
// import * as Val from '../src/values';
import * as Modu from '../src/modules';

import * as TestHelper from './test_helper';
TestHelper.init();

function createItExpression(exp: Expr.Expression): Decl.Declaration {
    return new Decl.SequentialDeclaration( [
        new Decl.ValueDeclaration( [], [
            new Decl.ValueBinding( false,
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                exp
            )
        ], 2)
    ], 1);
}

function pattern_tester(pattern: Expr.Pattern): Decl.Declaration {
    return new Decl.SequentialDeclaration( [
        new Decl.ValueDeclaration( [], [
            new Decl.ValueBinding( false, pattern, get42())
        ], 2)
    ], 1);
}

function spec_tester(specs: Modu.Specification[]): Decl.Declaration {
    return new Decl.SequentialDeclaration( [
        new Modu.SignatureDeclaration( [
            new Modu.SignatureBinding(
                new Token.AlphanumericIdentifierToken("a"),
                new Modu.SignatureExpression(
                    new Modu.SequentialSpecification( specs)
                )
            )
        ])
    ], 1)
}

function create_infix(id: number) {
    return new Decl.InfixDeclaration(
        [
            new Token.AlphanumericIdentifierToken("x")
        ], 0, id
    )
}

function create_infixr(id: number) {
    return new Decl.InfixRDeclaration(
        [
            new Token.AlphanumericIdentifierToken("x")
        ], 0, id
    )
}

function prefixWithOp(tok: Token.IdentifierToken): Token.IdentifierToken {
    tok.opPrefixed = true;
    return tok;
}

function get42(): Expr.PatternExpression {
    return new Expr.Constant(new Token.NumericToken('42', 42));
}

const sampleExpression1: string = 'if 5 then 9 else 7';
function createSampleExpression1(): Expr.Expression {
    return new Expr.Conditional(
        new Expr.Constant(new Token.NumericToken('5', 5)),
        new Expr.Constant(new Token.NumericToken('9', 9)),
        new Expr.Constant(new Token.NumericToken('7', 7))
    );
}

const sampleExpression2: string = 'if 1 then 2 else 3';
function createSampleExpression2(): Expr.Expression {
    return new Expr.Conditional(
        new Expr.Constant(new Token.NumericToken('1', 1)),
        new Expr.Constant(new Token.NumericToken('2', 2)),
        new Expr.Constant(new Token.NumericToken('3', 3))
    );
}

function parse(str: string): Decl.Declaration {
    return Parser.parse(Lexer.lex(str), InitialState.getInitialState());
}

it("basic", () => {
    let testcase_empty: string = ';';
    let testcase_simple1: string = 'val x = 42;';
    let testcase_sample_expr1: string = sampleExpression1 + ';';
    let testcase_sample_expr2: string = sampleExpression2 + ';';

    expect(parse(testcase_empty)).toEqualWithType(
        new Decl.SequentialDeclaration( [], 1)
    );
    expect(parse(testcase_simple1)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')),
                    get42()
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_sample_expr1)).toEqualWithType(createItExpression(
        createSampleExpression1()
    ));
    expect(parse(testcase_sample_expr2)).toEqualWithType(createItExpression(
        createSampleExpression2()
    ));
});

it("atomic expression - special constant", () => {
    let testcase_special_zero: string = '0;';
    let testcase_special_int: string = '42;';
    let testcase_special_real: string = '42.0;';
    let testcase_special_word: string = '0w42;';
    let testcase_special_char: string = '#"c";';
    let testcase_special_string: string = '"str";';

    expect(parse(testcase_special_zero)).toEqualWithType(createItExpression(
        new Expr.Constant( new Token.IntegerConstantToken('0', 0))
    ));
    expect(parse(testcase_special_int)).toEqualWithType(createItExpression(
        get42()
    ));
    expect(parse(testcase_special_real)).toEqualWithType(createItExpression(
        new Expr.Constant( new Token.RealConstantToken('42.0', 42.0))
    ));
    expect(parse(testcase_special_word)).toEqualWithType(createItExpression(
        new Expr.Constant( new Token.WordConstantToken('0w42', 42))
    ));
    expect(parse(testcase_special_char)).toEqualWithType(createItExpression(
        new Expr.Constant( new Token.CharacterConstantToken('#"c"', 'c'))
    ));
    expect(parse(testcase_special_string)).toEqualWithType(createItExpression(
        new Expr.Constant( new Token.StringConstantToken('"str"', 'str'))
    ));
});

it("atomic expression - value identifier", () => {
    let testcase_vid_with_op: string = 'op +;';
    let testcase_vid_with_op_long: string = 'op Math.pow;';
    let testcase_vid_without_op: string = 'blub;';
    let testcase_vid_without_op_long: string = 'Reals.nan;';
    let testcase_star: string = 'op*;';
    let testcase_equals: string = 'op=;';

    expect(parse(testcase_vid_with_op)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(
            prefixWithOp(new Token.IdentifierToken('+'))
        )
    ));
    expect(parse(testcase_vid_with_op_long)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(
            prefixWithOp(new Token.LongIdentifierToken('Math.pow', [
                    new Token.AlphanumericIdentifierToken('Math')
                ],
                new Token.AlphanumericIdentifierToken('pow')
            ))
        )
    ));
    expect(parse(testcase_vid_without_op)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(
            new Token.AlphanumericIdentifierToken('blub')
        )
    ))
    expect(parse(testcase_vid_without_op_long)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(
            new Token.LongIdentifierToken('Reals.nan', [
                    new Token.AlphanumericIdentifierToken('Reals')
                ],
                new Token.AlphanumericIdentifierToken('nan')
            )
        )
    ));

    expect(parse(testcase_star)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier( prefixWithOp(new Token.StarToken()))
    ));

    expect(parse(testcase_equals)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier( prefixWithOp(new Token.EqualsToken()))
    ));
});

it("atomic expression - records", () => {
    let testcase_rec_empty: string = '{};';
    let testcase_rec_single: string = '{ 1 = hello };';
    let testcase_rec_multiple: string = '{ 1 = hello, world = 42, what = ever};';

    expect(parse(testcase_rec_empty)).toEqualWithType(createItExpression(
        new Expr.Record(
            true,
            []
        )
    ));
    expect(parse(testcase_rec_single)).toEqualWithType(createItExpression(
        new Expr.Record(
            true,[
                ['1', new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('hello'))]
            ]
        )
    ));
    expect(parse(testcase_rec_multiple)).toEqualWithType(createItExpression(
        new Expr.Record(
            true,[
                ['1', new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('hello'))],
                ['world', get42()],
                ['what', new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('ever'))]
            ]
        )
    ));
});


it("atomic expression - record selector", () => {
    let testcase_sel_alphanum: string = '#hi;';
    let testcase_sel_numeric: string = '#42;';
    let testcase_sel_non_alphanum: string = '# ###;';
    let testcase_sel_star: string = '# *;';

    expect(parse(testcase_sel_alphanum)).toEqualWithType(createItExpression(
        new Expr.RecordSelector( new Token.AlphanumericIdentifierToken('hi'))
    ));
    expect(parse(testcase_sel_numeric)).toEqualWithType(createItExpression(
        new Expr.RecordSelector( new Token.NumericToken('42', 42))
    ));
    expect(parse(testcase_sel_non_alphanum)).toEqualWithType(createItExpression(
        new Expr.RecordSelector( new Token.IdentifierToken('###'))
    ));
    expect(parse(testcase_sel_star)).toEqualWithType(createItExpression(
        new Expr.RecordSelector( new Token.StarToken())
    ));
});

it("atomic expression - 0 tuple", () => {
    let testcase_empty_tuple: string = '();';

    expect(parse(testcase_empty_tuple)).toEqualWithType(createItExpression(
        new Expr.Tuple( [])
    ));
});

it("atomic expression - n tuple", () => {
    let testcase_no_single_tuple: string = '(42);';
    let testcase_2_tuple: string = '(42, ' + sampleExpression1 + ');';
    let testcase_3_tuple: string = '(42, ' + sampleExpression1 + ', ' + sampleExpression2 + ');';

    expect(parse(testcase_no_single_tuple)).toEqualWithType(createItExpression(
        get42()
    ));
    expect(parse(testcase_2_tuple)).toEqualWithType(createItExpression(
        new Expr.Tuple( [
            get42(),
            createSampleExpression1()
        ])
    ));
    expect(parse(testcase_3_tuple)).toEqualWithType(createItExpression(
        new Expr.Tuple( [
            get42(),
            createSampleExpression1(),
            createSampleExpression2()
        ])
    ));
});

it("atomic expression - list", () => {
    let testcase_empty_list: string = '[];';
    let testcase_1_list: string = '[42];';
    let testcase_2_list: string = '[42, ' + sampleExpression1 + '];';
    let testcase_3_list: string = '[42, ' + sampleExpression1 + ', ' + sampleExpression2 + '];';

    expect(parse(testcase_empty_list)).toEqualWithType(createItExpression(
        new Expr.List( [
        ])
    ));
    expect(parse(testcase_1_list)).toEqualWithType(createItExpression(
        new Expr.List( [
            get42()
        ])
    ));
    expect(parse(testcase_2_list)).toEqualWithType(createItExpression(
        new Expr.List( [
            get42(),
            createSampleExpression1()
        ])
    ));
    expect(parse(testcase_3_list)).toEqualWithType(createItExpression(
        new Expr.List( [
            get42(),
            createSampleExpression1(),
            createSampleExpression2()
        ])
    ));
});

it("atomic expression - sequence", () => {
    let testcase_2_seq: string = '(42; ' + sampleExpression1 + ');';
    let testcase_3_seq: string = '(42; ' + sampleExpression1 + '; ' + sampleExpression2 + ');';

    expect(parse(testcase_2_seq)).toEqualWithType(createItExpression(
        new Expr.Sequence( [
            get42(),
            createSampleExpression1()
        ])
    ));
    expect(parse(testcase_3_seq)).toEqualWithType(createItExpression(
        new Expr.Sequence( [
            get42(),
            createSampleExpression1(),
            createSampleExpression2()
        ])
    ));
});

it("atomic expression - local declaration", () => {
    let testcase_single_exp = 'let val it = 42 in 42 end;';
    let testcase_multiple: string = 'let val it = 42; in 42; ' + sampleExpression1 + '; ' + sampleExpression2 + ' end;';
    let testcase_surplus_semicolon = 'let 42 in 42; end;';
    let testcase_infix1 = 'infix f; let infixr f in a f b f c end; a f b f c;';
    let testcase_infix2 = 'infixr f; let infix f in a f b f c end; a f b f c;';
    let testcase_infix3 = 'infix f; let nonfix f in a f b f c end; a f b f c;';
    let testcase_infix4 = 'let infix f in a f b f c end; a f b f c;';

    expect(parse(testcase_single_exp)).toEqualWithType(createItExpression(
        new Expr.LocalDeclarationExpression(
            new Decl.SequentialDeclaration( [
                new Decl.ValueDeclaration( [], [
                    new Decl.ValueBinding( false,
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                        get42()
                    )
                ], 4)
            ], 3),
            get42()
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.LocalDeclarationExpression(
            new Decl.SequentialDeclaration( [
                new Decl.ValueDeclaration( [], [
                    new Decl.ValueBinding( false,
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                        get42()
                    )
                ], 4)
            ], 3),
            new Expr.Sequence( [
                get42(),
                createSampleExpression1(),
                createSampleExpression2()
            ])
        )
    ));
    expect(parse(testcase_infix1)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.LocalDeclarationExpression(
                        new Decl.SequentialDeclaration( [
                            new Decl.InfixRDeclaration( [
                                new Token.AlphanumericIdentifierToken('f')
                            ], 0, 5)
                        ], 4),
                        new Expr.FunctionApplication(
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                            new Expr.Tuple( [
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                new Expr.FunctionApplication(
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                    new Expr.Tuple( [
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                                    ])
                                )
                            ])
                        )
                    )
                )
            ], 3),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                        new Expr.Tuple( [
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                ])
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                        ])
                    )
                )
            ], 7)
        ], 1)
    );
    expect(parse(testcase_infix2)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.LocalDeclarationExpression(
                        new Decl.SequentialDeclaration( [
                            new Decl.InfixDeclaration( [
                                new Token.AlphanumericIdentifierToken('f')
                            ], 0, 5)
                        ], 4),
                        new Expr.FunctionApplication(
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                            new Expr.Tuple( [
                                new Expr.FunctionApplication(
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                    new Expr.Tuple( [
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
                                    ])
                                ),
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                            ])
                        )
                    )
                )
            ], 3),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                        new Expr.Tuple( [
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                                ])
                            )
                        ])
                    )
                )
            ], 7)
        ], 1)
    );
    expect(parse(testcase_infix3)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.LocalDeclarationExpression(
                        new Decl.SequentialDeclaration( [
                            new Decl.NonfixDeclaration( [
                                new Token.AlphanumericIdentifierToken('f')
                            ], 5)
                        ], 4),
                        new Expr.FunctionApplication(
                            new Expr.FunctionApplication(
                                new Expr.FunctionApplication(
                                    new Expr.FunctionApplication(
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
                                    ),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
                                ),
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                        )
                    )
                )
            ], 3),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                        new Expr.Tuple( [
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                ])
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                        ])
                    )
                )
            ], 7)
        ], 1)
    );
    expect(parse(testcase_infix4)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.LocalDeclarationExpression(
                        new Decl.SequentialDeclaration( [
                            new Decl.InfixDeclaration( [
                                new Token.AlphanumericIdentifierToken('f')
                            ], 0, 4)
                        ], 3),
                        new Expr.FunctionApplication(
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                            new Expr.Tuple( [
                                new Expr.FunctionApplication(
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                    new Expr.Tuple( [
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                    ])
                                ),
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                            ])
                        )
                    )
                )
            ], 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.FunctionApplication(
                            new Expr.FunctionApplication(
                                new Expr.FunctionApplication(
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
                                ),
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
                        ),
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                    )
                )
            ], 6)
        ], 1)
    );

    expect(() => { parse(testcase_surplus_semicolon); }).toThrow(Errors.ParserError);
});

it("atomic expression - bracketed expression", () => {
    let testcase_bracket1: string = '(42);';
    let testcase_bracket2: string = '(' + sampleExpression1 + ');';
    let testcase_bracket3: string = '(' + sampleExpression2 + ');';

    expect(parse(testcase_bracket1)).toEqualWithType(createItExpression(
        get42()
    ));
    expect(parse(testcase_bracket2)).toEqualWithType(createItExpression(
        createSampleExpression1()
    ));
    expect(parse(testcase_bracket3)).toEqualWithType(createItExpression(
        createSampleExpression2()
    ));
});

it("expression row", () => {
    let testcase_alphanum: string = '{ hi = 42};';
    let testcase_numeric: string = '{ 1337 = 42};';
    let testcase_non_alphanum: string = '{ ### = ' + sampleExpression1 + '};';
    let testcase_star: string = '{ * = ' + sampleExpression2 + ' };';
    let testcase_zero: string = '{ 0 = 42};';
    let testcase_reserved_word: string = '{ val = 42};';
    let testcase_equals: string = '{ = = 42};';

    expect(parse(testcase_alphanum)).toEqualWithType(createItExpression(
        new Expr.Record( true, [
            ["hi", get42()]
        ]),
    ));
    expect(parse(testcase_numeric)).toEqualWithType(createItExpression(
        new Expr.Record( true, [
            ["1337", get42()]
        ]),
    ));
    expect(parse(testcase_non_alphanum)).toEqualWithType(createItExpression(
        new Expr.Record( true, [
            ["###", createSampleExpression1()]
        ]),
    ));
    expect(parse(testcase_star)).toEqualWithType(createItExpression(
        new Expr.Record( true, [
            ["*", createSampleExpression2()]
        ]),
    ));

    expect(() => { parse(testcase_zero); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_reserved_word); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_equals); }).toThrow(Errors.ParserError);
});

it("application expression", () => {
    let testcase_simple: string = 'a b c d e f g;';
    let testcase_bracketed: string = 'a b c d (e f g);';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.FunctionApplication(
            new Expr.FunctionApplication(
                new Expr.FunctionApplication(
                    new Expr.FunctionApplication(
                        new Expr.FunctionApplication(
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                        ),
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d'))
                    ),
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('e'))
                ),
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
            ),
            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g'))
        )
    ));
    expect(parse(testcase_bracketed)).toEqualWithType(createItExpression(
        new Expr.FunctionApplication(
            new Expr.FunctionApplication(
                new Expr.FunctionApplication(
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
                    ),
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                ),
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d'))
            ),
            new Expr.FunctionApplication(
                new Expr.FunctionApplication(
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('e')),
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
                ),
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g'))
            )
        )
    ));
});

it("infix expression", () => {
    let testcase_predefined: string = 'a + b;';
    let testcase_left: string = 'infix f; a f b f c f d;';
    let testcase_right: string = 'infixr f; a f b f c f d;';
    let testcase_prio_left: string = 'infix 5 f; infix 4 g; a g b f c g d;';
    let testcase_prio_right: string = 'infixr 5 f; infixr 4 g; a g b f c g d;';
    let testcase_non_colliding: string = 'infix 1 f; infixr 1 g; infix h; a f b h c g d;';
    let testcase_colliding: string = 'infix a; infixr b; 0 a 1 b 2;';

    expect(parse(testcase_predefined)).toEqualWithType(createItExpression(
        new Expr.FunctionApplication(
            new Expr.ValueIdentifier( new Token.IdentifierToken('+')),
            new Expr.Tuple( [
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
            ])
        )
    ));
    expect(parse(testcase_left)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                        new Expr.Tuple( [
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                new Expr.Tuple( [
                                    new Expr.FunctionApplication(
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                        new Expr.Tuple( [
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                        ])
                                    ),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c'))
                                ])
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d'))
                        ])
                    )
                )
            ], 3)
        ], 1)
    );
    expect(parse(testcase_right)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                        new Expr.Tuple( [
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                    new Expr.FunctionApplication(
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                        new Expr.Tuple( [
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c')),
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d')),
                                        ])
                                    )
                                ])
                            )
                        ])
                    )
                )
            ], 3)
        ], 1)
    );
    expect(parse(testcase_prio_left)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 5, 2),
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('g')
            ], 4, 3),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                        new Expr.Tuple( [
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                    new Expr.FunctionApplication(
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                        new Expr.Tuple( [
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c')),
                                        ])
                                    )
                                ])
                            ),
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d'))
                        ])
                    )
                )
            ], 4)
        ], 1)
    );
    expect(parse(testcase_prio_right)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 5, 2),
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('g')
            ], 4, 3),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                        new Expr.Tuple( [
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                                new Expr.Tuple( [
                                    new Expr.FunctionApplication(
                                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                        new Expr.Tuple( [
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c')),
                                        ])
                                    ),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d'))
                                ])
                            )
                        ])
                    )
                )
            ], 4)
        ], 1)
    );
    expect(parse(testcase_non_colliding)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 1, 2),
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('g')
            ], 1, 3),
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('h')
            ], 0, 4),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    new Expr.FunctionApplication(
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('h')),
                        new Expr.Tuple( [
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b')),
                                ])
                            ),
                            new Expr.FunctionApplication(
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                                new Expr.Tuple( [
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('c')),
                                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('d'))
                                ])
                            )
                        ])
                    ),
                )
            ], 5)
        ], 1)
    );
    expect(() => { parse(testcase_colliding); }).toThrow(Errors.ParserError);
});

it("expression - typed expression", () => {
    let testcase_simple: string = '42: \'a;';
    let testcase_nested: string = '42: \'a: \'b;';
    let testcase_precedence_conj: string = '42 andalso 42: \'a -> \'b;';
    let testcase_precedence_disj: string = '42 orelse 42: \'a -> \'b;';
    let testcase_precedence_handle: string = '42 handle _ => 42 : \'a -> \'b;';
    let testcase_precedence_raise: string = 'raise 42: \'a -> \'b;';
    let testcase_precedence_if: string = 'if ' + sampleExpression1 + ' then ' + sampleExpression2 + ' else 42: \'a -> \'b;';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TypeVariable('\'a')
        )
    ));
    expect(parse(testcase_nested)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            new Expr.TypedExpression(
                get42(),
                new Type.TypeVariable('\'a')
            ),
            new Type.TypeVariable('\'b')
        )
    ));
    expect(parse(testcase_precedence_conj)).toEqualWithType(createItExpression(
        new Expr.Conjunction(
            get42(),
            new Expr.TypedExpression(
                get42(),
                new Type.FunctionType(
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                )
            )
        )
    ));
    expect(parse(testcase_precedence_disj)).toEqualWithType(createItExpression(
        new Expr.Disjunction(
            get42(),
            new Expr.TypedExpression(
                get42(),
                new Type.FunctionType(
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                )
            )
        )
    ));
    expect(parse(testcase_precedence_handle)).toEqualWithType(createItExpression(
        new Expr.HandleException(
            get42(),
            new Expr.Match(
                [[new Expr.Wildcard(),
                    new Expr.TypedExpression(
                        get42(),
                        new Type.FunctionType(
                            new Type.TypeVariable('\'a'),
                            new Type.TypeVariable('\'b'),
                        )
                    )
                ]]
            )
        )
    ));
    expect(parse(testcase_precedence_raise)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            new Expr.TypedExpression(
                get42(),
                new Type.FunctionType(
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                )
            )
        )
    ));
    expect(parse(testcase_precedence_if)).toEqualWithType(createItExpression(
        new Expr.Conditional(
            createSampleExpression1(),
            createSampleExpression2(),
            new Expr.TypedExpression(
                get42(),
                new Type.FunctionType(
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                )
            )
        )
    ));
});

it("expression - conjunction", () => {
    let testcase_simple: string = '42 andalso 42;';
    let testcase_associativity: string = '42 andalso (' + sampleExpression1 + ') andalso (' + sampleExpression2 + ');';
    let testcase_precedence_disj1: string = '42 andalso (' + sampleExpression1 + ') orelse (' + sampleExpression2 + ');';
    let testcase_precedence_disj2: string = '42 orelse (' + sampleExpression1 + ') andalso (' + sampleExpression2 + ');';
    let testcase_precedence_handle1: string = '42 andalso (' + sampleExpression1 + ') handle _ => 42;';
    let testcase_precedence_handle2: string = '(' + sampleExpression1 + ') handle _ => 42 andalso 42;';

    let testcase_precedence_raise: string = 'raise 42 andalso (' + sampleExpression1 + ');';
    let testcase_precedence_if: string = 'if 42 then (' + sampleExpression1 + ') else 42 andalso (' + sampleExpression2 + ');';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.Conjunction(
            get42(),
            get42()
        )
    ));
    expect(parse(testcase_associativity)).toEqualWithType(createItExpression(
        new Expr.Conjunction(
            new Expr.Conjunction(
                get42(),
                createSampleExpression1()
            ),
            createSampleExpression2()
        )
    ));
    expect(parse(testcase_precedence_disj1)).toEqualWithType(createItExpression(
        new Expr.Disjunction(
            new Expr.Conjunction(
                get42(),
                createSampleExpression1()
            ),
            createSampleExpression2()
        )
    ))
    expect(parse(testcase_precedence_disj2)).toEqualWithType(createItExpression(
        new Expr.Disjunction(
            get42(),
            new Expr.Conjunction(
                createSampleExpression1(),
                createSampleExpression2()
            )
        )
    ));
    expect(parse(testcase_precedence_handle1)).toEqualWithType(createItExpression(
        new Expr.HandleException(
            new Expr.Conjunction(
                get42(),
                createSampleExpression1()
            ),
            new Expr.Match(
                [[new Expr.Wildcard(), get42()]]
            )
        )
    ));
    expect(parse(testcase_precedence_handle2)).toEqualWithType(createItExpression(
        new Expr.HandleException(
            createSampleExpression1(),
            new Expr.Match(
                [[new Expr.Wildcard(),
                    new Expr.Conjunction(
                        get42(),
                        get42()
                    )
                ]]
            )
        )
    ));
    expect(parse(testcase_precedence_raise)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            new Expr.Conjunction(
                get42(),
                createSampleExpression1()
            )
        )
    ));
    expect(parse(testcase_precedence_if)).toEqualWithType(createItExpression(
        new Expr.Conditional(
            get42(),
            createSampleExpression1(),
            new Expr.Conjunction(
                get42(),
                createSampleExpression2()
            )
        )
    ));
});

it("expression - disjunction", () => {
    let testcase_simple: string = '42 orelse 42;';
    let testcase_associativity: string = '42 orelse (' + sampleExpression1 + ') orelse (' + sampleExpression2 + ');';
    let testcase_precedence_handle1: string = '42 orelse (' + sampleExpression1 + ') handle _ => 42;';
    let testcase_precedence_handle2: string = '(' + sampleExpression1 + ') handle _ => 42 orelse 42;';

    let testcase_precedence_raise: string = 'raise 42 orelse (' + sampleExpression1 + ');';
    let testcase_precedence_if: string = 'if 42 then (' + sampleExpression1 + ') else 42 orelse (' + sampleExpression2 + ');';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.Disjunction(
            get42(),
            get42()
        )
    ));
    expect(parse(testcase_associativity)).toEqualWithType(createItExpression(
        new Expr.Disjunction(
            new Expr.Disjunction(
                get42(),
                createSampleExpression1()
            ),
            createSampleExpression2()
        )
    ));
    expect(parse(testcase_precedence_handle1)).toEqualWithType(createItExpression(
        new Expr.HandleException(
            new Expr.Disjunction(
                get42(),
                createSampleExpression1()
            ),
            new Expr.Match(
                [[new Expr.Wildcard(), get42()]]
            )
        )
    ));
    expect(parse(testcase_precedence_handle2)).toEqualWithType(createItExpression(
        new Expr.HandleException(
            createSampleExpression1(),
            new Expr.Match(
                [[new Expr.Wildcard(),
                    new Expr.Disjunction(
                        get42(),
                        get42()
                    )
                ]]
            )
        )
    ));
    expect(parse(testcase_precedence_raise)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            new Expr.Disjunction(
                get42(),
                createSampleExpression1()
            )
        )
    ));
    expect(parse(testcase_precedence_if)).toEqualWithType(createItExpression(
        new Expr.Conditional(
            get42(),
            createSampleExpression1(),
            new Expr.Disjunction(
                get42(),
                createSampleExpression2()
            )
        )
    ));
});

it("expression - handle exception", () => {
    let testcase_simple: string = '42 handle _ => ' + sampleExpression1 + ';';
    let testcase_precedence_raise: string = 'raise 42 handle _ => ' + sampleExpression1 + ';';
    let testcase_precedence_if: string = 'if 42 then ' + sampleExpression1 + ' else 42 handle _ => ' + sampleExpression2 + ';';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.HandleException(
            get42(),
            new Expr.Match(
                [[new Expr.Wildcard(), createSampleExpression1()]]
            )
        )
    ));
    expect(parse(testcase_precedence_raise)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            new Expr.HandleException(
                get42(),
                new Expr.Match(
                    [[new Expr.Wildcard(), createSampleExpression1()]]
                )
            )
        )
    ));
    expect(parse(testcase_precedence_if)).toEqualWithType(createItExpression(
        new Expr.Conditional(
            get42(),
            createSampleExpression1(),
            new Expr.HandleException(
                get42(),
                new Expr.Match(
                    [[new Expr.Wildcard(), createSampleExpression2()]]
                )
            )
        )
    ));
});

it("expression - raise exception", () => {
    let testcase_simple1: string = 'raise 42;';
    let testcase_simple2: string = 'raise ' + sampleExpression1 + ';';
    let testcase_simple3: string = 'raise ' + sampleExpression2 + ';';

    expect(parse(testcase_simple1)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            get42()
        )
    ));
    expect(parse(testcase_simple2)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            createSampleExpression1()
        )
    ));
    expect(parse(testcase_simple3)).toEqualWithType(createItExpression(
        new Expr.RaiseException(
            createSampleExpression2()
        )
    ));
});

it("expression - conditional", () => {
    let testcase_simple: string = 'if 42 then ' + sampleExpression1 + ' else ' + sampleExpression2 + ';';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.Conditional(
            get42(),
            createSampleExpression1(),
            createSampleExpression2()
        )
    ));
});

it("expression - iteration", () => {
    let testcase_simple: string = 'while true do 42;';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.While(
            new Expr.ValueIdentifier(
                new Token.AlphanumericIdentifierToken('true')
            ),
            get42()
        )
    ));
});

it("expression - case analysis", () => {
    let testcase_simple: string = 'case 42 of _ => 42;';
    let testcase_multipattern: string = 'case ' + sampleExpression1 + ' of _ => 42 | 42 => ' + sampleExpression2 + ';';
    let testcase_nested: string = 'case 42 of _ => case ' + sampleExpression2 + ' of _ => 42 | 42 => ' + sampleExpression1 +';';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.CaseAnalysis(
            get42(),
            new Expr.Match(
                [[new Expr.Wildcard(), get42()]]
            )
        )
    ));
    expect(parse(testcase_multipattern)).toEqualWithType(createItExpression(
        new Expr.CaseAnalysis(
            createSampleExpression1(),
            new Expr.Match(
                [
                    [new Expr.Wildcard(), get42()],
                    [get42(), createSampleExpression2()]
                ]
            )
        )
    ));
    expect(parse(testcase_nested)).toEqualWithType(createItExpression(
        new Expr.CaseAnalysis(
            get42(),
            new Expr.Match(
                [[new Expr.Wildcard(),
                    new Expr.CaseAnalysis(
                        createSampleExpression2(),
                        new Expr.Match(
                            [
                                [new Expr.Wildcard(), get42()],
                                [get42(), createSampleExpression1()]
                            ]
                        )
                    )
                ]]
            )
        )
    ));
});

it("expression - function", () => {
    let testcase_simple: string = 'fn _ => 42;';
    let testcase_multipattern: string = 'fn _ => 42 | 42 => ' + sampleExpression2 + ';';
    let testcase_nested: string = 'fn _ => fn _ => 42 | 42 => ' + sampleExpression1 +';';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.Lambda(
            new Expr.Match(
                [[new Expr.Wildcard(), get42()]]
            )
        )
    ));
    expect(parse(testcase_multipattern)).toEqualWithType(createItExpression(
        new Expr.Lambda(
            new Expr.Match(
                [
                    [new Expr.Wildcard(), get42()],
                    [get42(), createSampleExpression2()]
                ]
            )
        )
    ));
    expect(parse(testcase_nested)).toEqualWithType(createItExpression(
        new Expr.Lambda(
            new Expr.Match(
                [[new Expr.Wildcard(),
                    new Expr.Lambda(
                        new Expr.Match(
                            [
                                [new Expr.Wildcard(), get42()],
                                [get42(), createSampleExpression1()]
                            ]
                        )
                    )
                ]]
            )
        )
    ));
});

it("matches", () => {
    //TODO tests
});

it("declaration - value declaration", () => {
    let testcase_0_tyvar: string = 'val x = 42;';
    let testcase_1_tyvar: string = 'val \'a x = 42;';
    let testcase_1_tyvar_seq: string = 'val (\'a) x = 42;';
    let testcase_2_tyvar: string = 'val (\'a, \'b) x = 42;';
    let testcase_3_tyvar: string = 'val (\'a, \'b, \'c) x = 42;';

    expect(parse(testcase_0_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')),
                    get42()
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_1_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [
                    new Type.TypeVariable('\'a')
                ], [
                    new Decl.ValueBinding( false,
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')),
                        get42()
                    )
                ], 2
            )
        ], 1)
    );
    expect(parse(testcase_1_tyvar_seq)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [
                    new Type.TypeVariable('\'a')
                ], [
                    new Decl.ValueBinding( false,
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')),
                        get42()
                    )
                ], 2
            )
        ], 1)
    );
    expect(parse(testcase_2_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b')
                ], [
                    new Decl.ValueBinding( false,
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')),
                        get42()
                    )
                ], 2
            )
        ], 1)
    );
    expect(parse(testcase_3_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                    new Type.TypeVariable('\'c')
                ], [
                    new Decl.ValueBinding( false,
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x')),
                        get42()
                    )
                ], 2
            )
        ], 1)
    );
});

it("declaration - function declaration", () => {
    let testcase_0_tyvar: string = 'fun f x = 42;';
    let testcase_1_tyvar: string = 'fun \'a f x = 42;';
    let testcase_1_tyvar_seq: string = 'fun (\'a) f x = 42;';
    let testcase_2_tyvar: string = 'fun (\'a, \'b) f x = 42;';
    let testcase_3_tyvar: string = 'fun (\'a, \'b, \'c) f x = 42;';

    expect(parse(testcase_0_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            undefined,
                            get42(),
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_1_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [
                    new Type.TypeVariable('\'a')
                ], [
                    new Decl.FunctionValueBinding([
                            [
                                [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                                undefined,
                                get42(),
                            ]
                        ],
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                    )
                ], 2
            )
        ], 1)
    );
    expect(parse(testcase_1_tyvar_seq)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [
                    new Type.TypeVariable('\'a')
                ], [
                    new Decl.FunctionValueBinding([
                            [
                                [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                                undefined,
                                get42(),
                            ]
                        ],
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                    )
                ], 2
            )
        ], 1)
    );
    expect(parse(testcase_2_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b')
                ], [
                    new Decl.FunctionValueBinding([
                            [
                                [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                                undefined,
                                get42(),
                            ]
                        ],
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                    )
                ], 2
            )
        ], 1)
    );
    expect(parse(testcase_3_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                    new Type.TypeVariable('\'c')
                ], [
                    new Decl.FunctionValueBinding([
                            [
                                [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                                undefined,
                                get42(),
                            ]
                        ],
                        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                    )
                ], 2
            )
        ], 1)
    );
    expect(() => { parse("fun f = 42;"); }).toThrow(Errors.ParserError);
});

it("declaration - type declaration", () => {
    let testcase_alphanum: string = 'type blub = \'a;';
    let testcase_nonalphanum: string = 'type #### = \'a;';
    let testcase_numeric: string = 'type 42 = \'a;';
    let testcase_star: string = 'type * = \'a;';

    expect(parse(testcase_alphanum)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.TypeDeclaration( [
                new Decl.TypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_nonalphanum)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.TypeDeclaration( [
                new Decl.TypeBinding( [] ,
                    new Token.IdentifierToken('####'),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
    expect(() => { parse(testcase_numeric); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_star); }).toThrow(Errors.ParserError);
});


it("declaration - datatype declaration", () => {
    let testcase_alphanum: string = 'datatype blub = X of \'a;';
    let testcase_nonalphanum: string = 'datatype #### = X of \'a;';
    let testcase_numeric: string = 'datatype 42 = X of \'a;';
    let testcase_star: string = 'datatype * = X of \'a;';
    //TODO test withtype

    expect(parse(testcase_alphanum)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [new Token.AlphanumericIdentifierToken('X'), new Type.TypeVariable('\'a')]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_nonalphanum)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.IdentifierToken('####'),
                    [
                        [new Token.AlphanumericIdentifierToken('X'), new Type.TypeVariable('\'a')]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(() => { parse(testcase_numeric); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_star); }).toThrow(Errors.ParserError);
});

it("declaration - datatype replication", () => {
    //TODO tests
});

it("declaration - abstype declaration", () => {
    //TODO tests
});

it("declaration - exception declaration", () => {
    let testcase_simple: string = 'exception X;';
    let testcase_of: string = 'exception X of \'a;';

    expect(parse(testcase_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.DirectExceptionBinding(
                    new Token.AlphanumericIdentifierToken('X'),
                    undefined
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_of)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.DirectExceptionBinding(
                    new Token.AlphanumericIdentifierToken('X'),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
});

it("declaration - local declaration", () => {
    let testcase_single1: string = 'local val it = 42 in end;';
    let testcase_single2: string = 'local val it = 42; in end;';
    let testcase_multiple: string = 'local val it = 42; val it = 42 in end;';
    // let testcase_single_dec: string = 'local in val it = 42 end;';
    let testcase_multiple_dec: string = 'local in val it = 42; val it = 42 end;';

    expect(parse(testcase_single1)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.LocalDeclaration(
                new Decl.SequentialDeclaration( [
                    new Decl.ValueDeclaration( [], [
                        new Decl.ValueBinding( false,
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                            get42()
                        )
                    ], 4)
                ], 3),
                new Decl.SequentialDeclaration( [
                ], 6), 2
            )
        ], 1)
    );
    expect(parse(testcase_single2)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.LocalDeclaration(
                new Decl.SequentialDeclaration( [
                    new Decl.ValueDeclaration( [], [
                        new Decl.ValueBinding( false,
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                            get42()
                        )
                    ], 4)
                ], 3),
                new Decl.SequentialDeclaration( [
                ], 6), 2
            )
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.LocalDeclaration(
                new Decl.SequentialDeclaration( [
                    new Decl.ValueDeclaration( [], [
                        new Decl.ValueBinding( false,
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                            get42()
                        )
                    ], 4),
                    new Decl.ValueDeclaration( [], [
                        new Decl.ValueBinding( false,
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                            get42()
                        )
                    ], 5)
                ], 3),
                new Decl.SequentialDeclaration( [
                ], 7), 2
            )
        ], 1)
    );
    expect(parse(testcase_multiple_dec)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.LocalDeclaration(
                new Decl.SequentialDeclaration( [
                ], 3),
                new Decl.SequentialDeclaration( [
                    new Decl.ValueDeclaration( [], [
                        new Decl.ValueBinding( false,
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                            get42()
                        )
                    ], 6),
                    new Decl.ValueDeclaration( [], [
                        new Decl.ValueBinding( false,
                            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                            get42()
                        )
                    ], 7)
                ], 5), 2
            )
        ], 1)
    );
});

it("declaration - open declaration", () => {
    let testcase_single: string = 'open stru;';
    let testcase_multiple: string = 'open stru stra.stru;';


    expect(parse(testcase_single)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.OpenDeclaration( [
                new Token.AlphanumericIdentifierToken('stru')
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.OpenDeclaration( [
                new Token.AlphanumericIdentifierToken('stru'),
                new Token.LongIdentifierToken('stra.stru', [
                    new Token.AlphanumericIdentifierToken('stra')
                ], new Token.AlphanumericIdentifierToken('stru'))
            ], 2)
        ], 1)
    );
});

it("declaration - empty declaration", () => {
    let testcase: string = ';';

    expect(parse(testcase)).toEqualWithType(
        new Decl.SequentialDeclaration( [
        ], 1)
    );
});

it("declaration - sequential declaration", () => {
    let testcase: string = 'val it = 42; val it = 42; val it = 42;';

    expect(parse(testcase)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    get42()
                )
            ], 2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    get42()
                )
            ], 3),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('it')),
                    get42()
                )
            ], 4)
        ], 1)
    );
});

it("declaration - infix (L) directive", () => {
    let testcase_simple: string = 'infix f;';
    let testcase_0: string = 'infix 0 f;';
    let testcase_9: string = 'infix 9 f;';
    let testcase_star: string = 'infix *;';
    let testcase_multiple: string = 'infix * f g;';
    let testcase_double_digit1: string = 'infix 00 f;';
    let testcase_double_digit2: string = 'infix 10 f;';
    let testcase_negative: string = 'infix ~1 f;';
    let testcase_prime: string = 'infix \'a;';

    expect(parse(testcase_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2)
        ], 1)
    );
    expect(parse(testcase_0)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2)
        ], 1)
    );
    expect(parse(testcase_9)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 9, 2)
        ], 1)
    );
    expect(parse(testcase_star)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.StarToken()
            ], 0, 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [
                new Token.StarToken(),
                new Token.AlphanumericIdentifierToken('f'),
                new Token.AlphanumericIdentifierToken('g')
            ], 0, 2)
        ], 1)
    );
    expect(() => { parse(testcase_double_digit1); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_double_digit2); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_negative); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_prime); }).toThrow(Errors.ParserError);
});

it("declaration - infix (R) directive", () => {
    let testcase_simple: string = 'infixr f;';
    let testcase_0: string = 'infixr 0 f;';
    let testcase_9: string = 'infixr 9 f;';
    let testcase_star: string = 'infixr *;';
    let testcase_multiple: string = 'infixr * f g;';
    let testcase_double_digit1: string = 'infixr 00 f;';
    let testcase_double_digit2: string = 'infixr 10 f;';
    let testcase_negative: string = 'infixr ~1 f;';
    let testcase_prime: string = 'infixr \'a;';

    expect(parse(testcase_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2)
        ], 1)
    );
    expect(parse(testcase_0)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 0, 2)
        ], 1)
    );
    expect(parse(testcase_9)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 9, 2)
        ], 1)
    );
    expect(parse(testcase_star)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.StarToken()
            ], 0, 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixRDeclaration( [
                new Token.StarToken(),
                new Token.AlphanumericIdentifierToken('f'),
                new Token.AlphanumericIdentifierToken('g')
            ], 0, 2)
        ], 1)
    );
    expect(() => { parse(testcase_double_digit1); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_double_digit2); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_negative); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_prime); }).toThrow(Errors.ParserError);
});

it("declaration - nonfix directive", () => {
    let testcase_simple: string = 'nonfix f;';
    let testcase_star: string = 'nonfix *;';
    let testcase_multiple: string = 'nonfix * f g;';
    let testcase_prime: string = 'nonfix \'a;';
    let testcase_no_precedence: string = 'nonfix 0 f;';

    expect(parse(testcase_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.NonfixDeclaration( [
                new Token.AlphanumericIdentifierToken('f')
            ], 2)
        ], 1)
    );
    expect(parse(testcase_star)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.NonfixDeclaration( [
                new Token.StarToken()
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.NonfixDeclaration( [
                new Token.StarToken(),
                new Token.AlphanumericIdentifierToken('f'),
                new Token.AlphanumericIdentifierToken('g')
            ], 2)
        ], 1)
    );
    expect(() => { parse(testcase_prime); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_no_precedence); }).toThrow(Errors.ParserError);
});

it("value bindings - non recursive", () => {
    let testcase_single: string = 'val _ = 42;';
    let testcase_multiple: string = 'val _ = 42 and x = ' + sampleExpression1 + ';';
    let testcase_disallowed_tyseq: string = 'val _ = 42 and \'a _ = 42;';

    expect(parse(testcase_single)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.Wildcard(),
                    get42()
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.Wildcard(),
                    get42()
                ),
                new Decl.ValueBinding( false,
                    new Expr.ValueIdentifier(
                        new Token.AlphanumericIdentifierToken('x')
                    ),
                    createSampleExpression1()
                )
            ], 2)
        ], 1)
    );
    expect(() => { parse(testcase_disallowed_tyseq); }).toThrow(Errors.ParserError);
});

it("value bindings - recursive", () => {
    let testcase_single: string = 'val rec _ = fn _ => 42;';
    let testcase_multirec: string = 'val rec rec rec _ = fn _ => 42;';
    let testcase_multiple: string = 'val _ = fn _ => 42 and rec f = fn _ => ' + sampleExpression1 + ' and g = fn _ => ' + sampleExpression2 + ';';
    let testcase_no_lambda: string = 'val rec _ = 42;';
    expect(parse(testcase_single)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( true,
                    new Expr.Wildcard(),
                    new Expr.Lambda(
                        new Expr.Match( [
                            [new Expr.Wildcard(), get42()]
                        ])
                    )
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multirec)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( true,
                    new Expr.Wildcard(),
                    new Expr.Lambda(
                        new Expr.Match( [
                            [new Expr.Wildcard(), get42()]
                        ])
                    )
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false,
                    new Expr.Wildcard(),
                    new Expr.Lambda(
                        new Expr.Match( [
                            [new Expr.Wildcard(), get42()]
                        ])
                    )
                ),
                new Decl.ValueBinding( true,
                    new Expr.ValueIdentifier(
                        new Token.AlphanumericIdentifierToken('f')
                    ),
                    new Expr.Lambda(
                        new Expr.Match( [
                            [new Expr.Wildcard(), createSampleExpression1()]
                        ])
                    )
                ),
                new Decl.ValueBinding( true,
                    new Expr.ValueIdentifier(
                        new Token.AlphanumericIdentifierToken('g')
                    ),
                    new Expr.Lambda(
                        new Expr.Match( [
                            [new Expr.Wildcard(), createSampleExpression2()]
                        ])
                    )
                )
            ], 2)
        ], 1)
    );
    expect(() => {parse(testcase_no_lambda);}).toThrow(Errors.ParserError);
});

it("function value bindings", () => {
    let testcase_simple: string = 'fun f x = 42;';
    let testcase_op: string = 'fun op f x = 42;';
    let testcase_ty: string = 'fun f x : \'a = 42;';
    let testcase_op_ty: string = 'fun op f x : \'a = 42;';
    let testcase_multiple_matches: string = 'fun f x = 42 | f _ = ' + sampleExpression1 + ';';
    let testcase_multiple_bindings: string = 'fun f x = 42 | f _ = ' + sampleExpression1 + ' and g x = ' + sampleExpression2 + ';';
    let testcase_infix: string = 'infix f; fun a f b = 42;';
    //TODO more infix tests!!

    expect(parse(testcase_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            undefined,
                            get42(),
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_op)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            undefined,
                            get42(),
                        ]
                    ],
                    new Expr.ValueIdentifier( prefixWithOp(new Token.AlphanumericIdentifierToken('f'))),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_ty)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            new Type.TypeVariable('\'a'),
                            get42(),
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_op_ty)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            new Type.TypeVariable('\'a'),
                            get42(),
                        ]
                    ],
                    new Expr.ValueIdentifier( prefixWithOp(new Token.AlphanumericIdentifierToken('f'))),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple_matches)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            undefined,
                            get42(),
                        ], [
                            [new Expr.Wildcard()],
                            undefined,
                            createSampleExpression1()
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple_bindings)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            undefined,
                            get42(),
                        ], [
                            [new Expr.Wildcard()],
                            undefined,
                            createSampleExpression1()
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f')),
                ),
                new Decl.FunctionValueBinding([
                        [
                            [new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('x'))],
                            undefined,
                            createSampleExpression2()
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('g')),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_infix)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.InfixDeclaration( [new Token.AlphanumericIdentifierToken("f")], 0, 2),
            new Decl.FunctionDeclaration( [], [
                new Decl.FunctionValueBinding( [
                        [
                            [new Expr.Tuple( [
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('a')),
                                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('b'))
                            ])],
                            undefined,
                            get42()
                        ]
                    ],
                    new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken('f'))
                )
            ], 3)
        ], 1)
    );
});

it("type bindings", () => {
    let testcase_1_tyvar: string = 'type \'a blub = \'a;';
    let testcase_2_tyvar: string = 'type (\'a, \'b) blub = \'a;';
    let testcase_multiple: string = 'type \'a blub = \'a and \'b blob = \'b;';

    expect(parse(testcase_1_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.TypeDeclaration( [
                new Decl.TypeBinding( [
                        new Type.TypeVariable('\'a')
                    ],
                    new Token.AlphanumericIdentifierToken('blub'),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_2_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.TypeDeclaration( [
                new Decl.TypeBinding( [
                        new Type.TypeVariable('\'a'),
                        new Type.TypeVariable('\'b')
                    ],
                    new Token.AlphanumericIdentifierToken('blub'),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.TypeDeclaration( [
                new Decl.TypeBinding( [
                        new Type.TypeVariable('\'a')
                    ],
                    new Token.AlphanumericIdentifierToken('blub'),
                    new Type.TypeVariable('\'a')
                ),
                new Decl.TypeBinding( [
                        new Type.TypeVariable('\'b')
                    ],
                    new Token.AlphanumericIdentifierToken('blob'),
                    new Type.TypeVariable('\'b')
                )
            ], 2)
        ], 1)
    );
});

it("datatype bindings", () => {
    let testcase_1_tyvar: string = 'datatype \'a blub = x of \'a;';
    let testcase_2_tyvar: string = 'datatype (\'a, \'b) blub = x;';
    let testcase_multiple: string = 'datatype \'a blub = x of \'a and \'b blob = y;';

    expect(parse(testcase_1_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [
                        new Type.TypeVariable('\'a')
                    ],
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [new Token.AlphanumericIdentifierToken('x'), new Type.TypeVariable('\'a')]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_2_tyvar)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [
                        new Type.TypeVariable('\'a'),
                        new Type.TypeVariable('\'b')
                    ],
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [new Token.AlphanumericIdentifierToken('x'), undefined]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [
                        new Type.TypeVariable('\'a')
                    ],
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [new Token.AlphanumericIdentifierToken('x'), new Type.TypeVariable('\'a')]
                    ]
                ),
                new Decl.DatatypeBinding( [
                        new Type.TypeVariable('\'b')
                    ],
                    new Token.AlphanumericIdentifierToken('blob'),
                    [
                        [new Token.AlphanumericIdentifierToken('y'), undefined]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
});

it("constructor bindings", () => {
    let testcase_simple: string = 'datatype blub = X;';
    let testcase_op: string = 'datatype blub = op X;';
    let testcase_of: string = 'datatype blub = X of \'a;';
    let testcase_op_of: string = 'datatype blub = op X of \'a;';
    let testcase_multiple: string = 'datatype blub = op X of \'a | Y;';
    let testcase_multiple_datatypes: string = 'datatype blub = op X of \'a | Y and blob = Z;';

    expect(parse(testcase_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [new Token.AlphanumericIdentifierToken('X'), undefined]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_op)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [prefixWithOp(new Token.AlphanumericIdentifierToken('X')), undefined]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_of)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [new Token.AlphanumericIdentifierToken('X'), new Type.TypeVariable('\'a')]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_op_of)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [prefixWithOp(new Token.AlphanumericIdentifierToken('X')), new Type.TypeVariable('\'a')]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [prefixWithOp(new Token.AlphanumericIdentifierToken('X')), new Type.TypeVariable('\'a')],
                        [new Token.AlphanumericIdentifierToken('Y'), undefined]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
    expect(parse(testcase_multiple_datatypes)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.DatatypeDeclaration( [
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blub'),
                    [
                        [prefixWithOp(new Token.AlphanumericIdentifierToken('X')), new Type.TypeVariable('\'a')],
                        [new Token.AlphanumericIdentifierToken('Y'), undefined]
                    ]
                ),
                new Decl.DatatypeBinding( [] ,
                    new Token.AlphanumericIdentifierToken('blob'),
                    [
                        [new Token.AlphanumericIdentifierToken('Z'), undefined]
                    ]
                )
            ], undefined, 2)
        ], 1)
    );
});

it("exception bindings", () => {
    let testcase_direct_simple: string = 'exception X;';
    let testcase_direct_op: string = 'exception op X;';
    let testcase_direct_of: string = 'exception X of \'a;';
    let testcase_direct_op_of: string = 'exception op X of \'a;';
    let testcase_alias_simple: string = 'exception X = Y;';
    let testcase_alias_op: string = 'exception op X = op Y;';
    let testcase_multiple: string = 'exception X = Y and Z of \'a and W = Y;';


    expect(parse(testcase_direct_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.DirectExceptionBinding(
                    new Token.AlphanumericIdentifierToken('X'),
                    undefined
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_direct_op)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.DirectExceptionBinding(
                    prefixWithOp(new Token.AlphanumericIdentifierToken('X')),
                    undefined
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_direct_of)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.DirectExceptionBinding(
                    new Token.AlphanumericIdentifierToken('X'),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_direct_op_of)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.DirectExceptionBinding(
                    prefixWithOp(new Token.AlphanumericIdentifierToken('X')),
                    new Type.TypeVariable('\'a')
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_alias_simple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.ExceptionAlias(
                    new Token.AlphanumericIdentifierToken('X'),
                    new Token.AlphanumericIdentifierToken('Y'),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_alias_op)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.ExceptionAlias(
                    prefixWithOp(new Token.AlphanumericIdentifierToken('X')),
                    prefixWithOp(new Token.AlphanumericIdentifierToken('Y')),
                )
            ], 2)
        ], 1)
    );
    expect(parse(testcase_multiple)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Decl.ExceptionDeclaration( [
                new Decl.ExceptionAlias(
                    new Token.AlphanumericIdentifierToken('X'),
                    new Token.AlphanumericIdentifierToken('Y'),
                ),
                new Decl.DirectExceptionBinding(
                    new Token.AlphanumericIdentifierToken('Z'),
                    new Type.TypeVariable('\'a')
                ),
                new Decl.ExceptionAlias(
                    new Token.AlphanumericIdentifierToken('W'),
                    new Token.AlphanumericIdentifierToken('Y'),
                )
            ], 2)
        ], 1)
    );
});

it("atomic pattern - wildcard", () => {
    let wildcard_test:string = "val _ = 42;";
    expect(parse(wildcard_test)).toEqualWithType(pattern_tester(
        new Expr.Wildcard()));
});

it("atomic pattern - special constant", () => {
    let special_constant:string = "val 42 = 42;";
    expect(parse(special_constant)).toEqualWithType(pattern_tester(get42()));
});

it("atomic pattern - value identifier", () => {
    let atomic_pattern_vid_no_op: string = "val x = 42;";
    let atomic_pattern_vid_with_op: string = "val op x = 42;";
    expect(parse(atomic_pattern_vid_no_op)).toEqualWithType(pattern_tester(
        new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x"))
    ));
    expect(parse(atomic_pattern_vid_with_op)).toEqualWithType(pattern_tester(
        new Expr.ValueIdentifier(prefixWithOp(new Token.AlphanumericIdentifierToken("x")))
    ));
});

it("atomic pattern - record", () => {
    let atomic_pattern_record: string = "val { x = _ } = 42;";
    expect(parse(atomic_pattern_record)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["x", new Expr.Wildcard()]])));
    let atomic_pattern_record1: string = "val { x = _, y = 10 } = 42;";
    expect(parse(atomic_pattern_record1)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["x", new Expr.Wildcard()],
    ["y", new Expr.Constant( new Token.NumericToken("10", 10))]])
    ));
    let atomic_pattern_record2: string = "val { x = _, y = 10, ... } = 42;";
    expect(parse(atomic_pattern_record2)).toEqualWithType(pattern_tester(
        new Expr.Record( false, [["x", new Expr.Wildcard()],
    ["y", new Expr.Constant( new Token.NumericToken("10", 10))]])
    ));
    let atomic_pattern_record_non_atomic: string = "val { x = _:int } = 42;";
    expect(parse(atomic_pattern_record_non_atomic)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["x", new Expr.TypedExpression( new Expr.Wildcard(),
            new Type.CustomType('int', []))]])
    ));
});

it("atomic pattern - 0-tuple", () => {
    let atomic_pattern_0_tuple: string = "val () = 42;";
    expect(parse(atomic_pattern_0_tuple)).toEqualWithType(pattern_tester(
        new Expr.Tuple( [])
    ));
});

it("atomic pattern - n-tuple", () => {

    let atomic_pattern_2_tuple:string = "val (_,_) = 42;";
    expect(parse(atomic_pattern_2_tuple)).toEqualWithType(pattern_tester(
        new Expr.Tuple( [
            new Expr.Wildcard(),
            new Expr.Wildcard()
        ])
    ));

    let atomic_pattern_3_tuple:string = "val (_,_,x) = 42;";
    expect(parse(atomic_pattern_3_tuple)).toEqualWithType(pattern_tester(
        new Expr.Tuple( [
            new Expr.Wildcard(),
            new Expr.Wildcard(),
            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x"))
        ])
    ));

    let atomic_pattern_tuple_pat:string = "val (_:int,_) = 42;";
    expect(parse(atomic_pattern_tuple_pat)).toEqualWithType(pattern_tester(
        new Expr.Tuple( [new Expr.TypedExpression( new Expr.Wildcard(),
            new Type.CustomType('int', [])),
            new Expr.Wildcard()
        ])
    ));
});

it("atomic pattern - list", () => {
    let atomic_pattern_0_list:string = "val [] = 42;";
    let atomic_pattern_1_list:string = "val [_] = 42;";
    let atomic_pattern_2_list:string = "val [_,_] = 42;";
    expect(parse(atomic_pattern_0_list)).toEqualWithType(pattern_tester(
        new Expr.List( [])
    ));
    expect(parse(atomic_pattern_1_list)).toEqualWithType(pattern_tester(
        new Expr.List( [new Expr.Wildcard()])
    ));
    expect(parse(atomic_pattern_2_list)).toEqualWithType(pattern_tester(
        new Expr.List( [new Expr.Wildcard(), new Expr.Wildcard()])
    ));
    let atomic_pattern_list_pat:string = "val [_:int] = 42;";
    expect(parse(atomic_pattern_list_pat)).toEqualWithType(pattern_tester(
        new Expr.List( [new Expr.TypedExpression( new Expr.Wildcard(),
            new Type.CustomType('int', []))])
    ));
});

it("atomic pattern - bracketed", () => {
    let atomic_pattern_bracketed:string = "val (_) = 42;";
    expect(parse(atomic_pattern_bracketed)).toEqualWithType(pattern_tester(
        new Expr.Wildcard()
    ));
    let atomic_pattern_multi_bracketed:string = "val (((_))) = 42;";
    expect(parse(atomic_pattern_multi_bracketed)).toEqualWithType(pattern_tester(
        new Expr.Wildcard()
    ));
});

it("pattern row - wildcard", () => {
    let patrow_wildcard:string = "val { ... } = 42;";
    expect(parse(patrow_wildcard)).toEqualWithType(pattern_tester(
        new Expr.Record( false, [])
    ));
});

it("pattern row - pattern row", () => {
    let patrow_label: string = "val { l1 = _ } = 42;";
    expect(parse(patrow_label)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["l1", new Expr.Wildcard()]])
    ));
    let patrow_label1: string = "val { 1 = _ } = 42;";
    expect(parse(patrow_label1)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["1", new Expr.Wildcard()]])
    ));
    let patrow_label2: string = "val { * = _ } = 42;";
    expect(parse(patrow_label2)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["*", new Expr.Wildcard()]])
    ));
    let patrow_label3: string = "val { $ = _ } = 42;";
    expect(parse(patrow_label3)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["$", new Expr.Wildcard()]])
    ));
    let patrow_label4: string = "val { ## = _ } = 42;";
    expect(parse(patrow_label4)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [["##", new Expr.Wildcard()]])
    ));
    let patrow_label5: string = "val { ## = x } = 42;";
    expect(parse(patrow_label5)).toEqualWithType(pattern_tester(
        new Expr.Record( true, [[
            "##",
            new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x"))
        ]])
    ));
});

it("pattern row - wrong label", () => {
    let not_patrow_label: string = "val { 0 = _ } = 42;";
    expect(() => {parse(not_patrow_label);}).toThrow(Errors.ParserError);
    let not_patrow_label1: string = "val { 01 = _ } = 42;";
    expect(() => {parse(not_patrow_label1);}).toThrow(Errors.ParserError);
    let not_patrow_label2: string = "val { 'l = _ } = 42;";
    expect(() => {parse(not_patrow_label2);}).toThrow(Errors.ParserError);
    let not_patrow_label3: string = "val { = = _ } = 42;";
    expect(() => {parse(not_patrow_label3);}).toThrow(Errors.ParserError);
    let not_patrow_label4: string = "val { # = _ } = 42;";
    expect(() => {parse(not_patrow_label4);}).toThrow(Errors.ParserError);
});

it("pattern row - label as variable", () => {
    let patrow_as_label: string = "val {x:int as _} = 42;";
    expect(parse(patrow_as_label)).toEqualWithType(pattern_tester(
        new Expr.Record(
            true,
            [["x", new Expr.LayeredPattern( new Token.AlphanumericIdentifierToken("x"),
                new Type.CustomType("int", []),
                new Expr.Wildcard()) ]]
        ),
    ));
    // let patrow_as_label1: string = "val {x as _} = 42;";
    // let patrow_as_label2: string = "val {x:int} = 42;";

    //TODO test further as soon as fixed
});

it("pattern - atomic", () => {
    //tests already tested via atomic tests
});

it("pattern - constructed value", () => {
    let pattern_cons_val: string = "val x _ = 42;";
    expect(parse(pattern_cons_val)).toEqualWithType(pattern_tester(
        new Expr.FunctionApplication(
            new Expr.ValueIdentifier(
                new Token.AlphanumericIdentifierToken("x"),
            ),
            new Expr.Wildcard())
    ))

    let x: Token.AlphanumericIdentifierToken = new Token.AlphanumericIdentifierToken("x");
    x.opPrefixed = true;
    let pattern_cons_val_with_op: string = "val op x _ = 42;";
    expect(parse(pattern_cons_val_with_op)).toEqualWithType(pattern_tester(
        new Expr.FunctionApplication(
            new Expr.ValueIdentifier(
                x
            ),
            new Expr.Wildcard())
    ));
});

it("pattern - constructed value (infix)", () => {
    let pattern_infix:string = "infix x; val _ x _ = 42;";
    let pattern: Expr.PatternExpression = new Expr.FunctionApplication(
        new Expr.ValueIdentifier(
            new Token.AlphanumericIdentifierToken("x")
        ), new Expr.Tuple([
            new Expr.Wildcard(),
            new Expr.Wildcard()
        ])
    );
    expect(parse(pattern_infix)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            create_infix(2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false, pattern, get42())
            ], 3)
        ], 1)
    );

    pattern_infix = "infix x; val a x b x c = 42;";
    pattern = new Expr.FunctionApplication(
        new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x")),
        new Expr.Tuple([
            new Expr.FunctionApplication(
                new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x")),
                new Expr.Tuple([
                    new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("a")),
                    new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("b")),
                ])
            ),
            new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("c")),
        ])
    );
    expect(parse(pattern_infix)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            create_infix(2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false, pattern, get42())
            ], 3)
        ], 1)
    );
});

it("pattern - constructed value (infixr)", () => {
    let pattern_infix:string = "infixr x; val _ x _ = 42;";
    let pattern: Expr.PatternExpression = new Expr.FunctionApplication(
        new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x")),
        new Expr.Tuple([
            new Expr.Wildcard(),
            new Expr.Wildcard()
        ])
    );
    expect(parse(pattern_infix)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            create_infixr(2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false, pattern, get42())
            ], 3)
        ], 1)
    )

    pattern_infix = "infixr x; val a x b x c = 42;";
    pattern = new Expr.FunctionApplication(
        new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x")),
        new Expr.Tuple([
            new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("a")),
            new Expr.FunctionApplication(
                new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("x")),
                new Expr.Tuple([
                    new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("b")),
                    new Expr.ValueIdentifier(new Token.AlphanumericIdentifierToken("c")),
                ])
            ),
        ])
    );
    expect(parse(pattern_infix)).toEqualWithType(
        new Decl.SequentialDeclaration( [
            create_infixr(2),
            new Decl.ValueDeclaration( [], [
                new Decl.ValueBinding( false, pattern, get42())
            ], 3)
        ], 1)
    );
});

it("pattern - typed", () => {
    let pattern_type:string = "val x : int = 42;";
    expect(parse(pattern_type)).toEqualWithType(pattern_tester(
        new Expr.TypedExpression(
        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x")),
        new Type.CustomType('int', [])
    )));

    let pattern_func_type:string = "val x : int -> int = 42;";
    expect(parse(pattern_func_type)).toEqualWithType(pattern_tester(
        new Expr.TypedExpression(
        new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x")),
        new Type.FunctionType(
            new Type.CustomType('int', []),
        new Type.CustomType('int', [])))
    ));

    let double_typed: string = "val x:int:int = 42;";
    expect(parse(double_typed)).toEqualWithType(pattern_tester(
        new Expr.TypedExpression(
            new Expr.TypedExpression(
                new Expr.ValueIdentifier( new Token.AlphanumericIdentifierToken("x")),
                new Type.CustomType('int', [])
            ),
            new Type.CustomType('int', [])
        )
    ));

    let list_typed: string = "val []:int = 42;"
    expect(parse(list_typed)).toEqualWithType(pattern_tester(
        new Expr.TypedExpression(
            new Expr.List( []),
            new Type.CustomType('int', [])
        )
    ));
});

it("pattern - layered", () => {
    let layered: string = "val x as _ = 42;";
    expect(parse(layered)).toEqualWithType(pattern_tester(
        new Expr.LayeredPattern(
            new Token.AlphanumericIdentifierToken("x"),
            undefined,
            new Expr.Wildcard()
        ),
    ));
    let x: Token.AlphanumericIdentifierToken = new Token.AlphanumericIdentifierToken("x");
    x.opPrefixed = true;
    let layered1: string = "val op x as _ = 42;";
    expect(parse(layered1)).toEqualWithType(pattern_tester(
        new Expr.LayeredPattern(
            x,
            undefined,
            new Expr.Wildcard()
        ),
    ));
    let layered2: string = "val x :int as _ = 42;";
    expect(parse(layered2)).toEqualWithType(pattern_tester(
        new Expr.LayeredPattern(
            new Token.AlphanumericIdentifierToken("x"),
            new Type.CustomType("int", []),
            new Expr.Wildcard()
        ),
    ));
    let layered3: string = "val op x:int as _ = 42;";
    expect(parse(layered3)).toEqualWithType(pattern_tester(
        new Expr.LayeredPattern(
            x,
            new Type.CustomType("int", []),
            new Expr.Wildcard()
        ),
    ));
});

it("type - type variable", () => {
    let testcase_tyvar: string = '42: \'a;';
    let testcase_etyvar: string = '42: \'\'meaningoflive;';

    expect(parse(testcase_tyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TypeVariable('\'a')
        )
    ));
    expect(parse(testcase_etyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TypeVariable('\'\'meaningoflive')
        )
    ));
});

it("type - record type expression", () => {
    let testcase_empty: string = '42: {};';
    let testcase_single: string = '42: { hi : \'int };';
    let testcase_multiple: string = '42: { hello: \'a, world: \'b };';
    let testcase_no_unit: string = '42: ();';
    let testcase_no_same_label: string = '42: { hi: \'a, hi: \'a };';

    expect(parse(testcase_empty)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([]),
                true,
            )
        )
    ));
    expect(parse(testcase_single)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'int')]
                ]),
                true,
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hello", new Type.TypeVariable('\'a')],
                    ["world", new Type.TypeVariable('\'b')]
                ]),
                true,
            )
        )
    ));
    expect(() => { parse(testcase_no_unit); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_no_same_label); }).toThrow(Errors.ParserError);
});

it("type - type construction", () => {
    let testcase_small: string = '42: list;';
    let testcase_single: string = '42: \'a list;';
    let testcase_multiple: string = '42: (\'a * \'b, \'c) list;';

    expect(parse(testcase_small)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.CustomType('list', [])
        )
    ));
    expect(parse(testcase_single)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.CustomType('list', [new Type.TypeVariable('\'a')])
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.CustomType('list', [
                    new Type.TupleType([
                            new Type.TypeVariable('\'a'),
                            new Type.TypeVariable('\'b')
                        ],
                    ),
                    new Type.TypeVariable('\'c'),
                ]
            )
        )
    ));
});

it("type - tuple type", () => {
    let testcase_simple: string = '42: \'a * \'b;';
    let testcase_multiple: string = '42: \'a * \'b * \'c;';
    let testcase_bracketed: string = '42: \'a * (\'b * \'c);';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TupleType([
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b')
                ],
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TupleType([
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                    new Type.TypeVariable('\'c')
                ],
            )
        )
    ));
    expect(parse(testcase_bracketed)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TupleType([
                    new Type.TypeVariable('\'a'),
                    new Type.TupleType([
                            new Type.TypeVariable('\'b'),
                            new Type.TypeVariable('\'c')
                        ],
                    )
                ],
            )
        )
    ));
});

it("type - function type expression", () => {
    let testcase_simple: string = '42: \'a -> \'b;';
    let testcase_multiple: string = '42: \'a -> \'b -> \'c;';
    let testcase_multiple_bracketed: string = '42: (\'a -> \'b) -> \'c;';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.FunctionType(
                new Type.TypeVariable('\'a'),
                new Type.TypeVariable('\'b'),
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.FunctionType(
                new Type.TypeVariable('\'a'),
                new Type.FunctionType(
                    new Type.TypeVariable('\'b'),
                    new Type.TypeVariable('\'c'),
                ),
            )
        )
    ));
    expect(parse(testcase_multiple_bracketed)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.FunctionType(
                new Type.FunctionType(
                    new Type.TypeVariable('\'a'),
                    new Type.TypeVariable('\'b'),
                ),
                new Type.TypeVariable('\'c'),
            )
        )
    ));
});

it("type - bracketed", () => {
    let testcase_simple: string = '42: (\'a);';
    let testcase_multiple_nested: string = '42: ((((\'a -> \'b))));';
    let testcase_nested_complex = '42: ({ hi: (\'a)});';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.TypeVariable('\'a'))
        )
    );
    expect(parse(testcase_multiple_nested)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.FunctionType(
                new Type.TypeVariable('\'a'),
                new Type.TypeVariable('\'b'),
            )
        )
    ));
    expect(parse(testcase_nested_complex)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a')]
                ]),
                true,
            )
        )
    ));
});

it("type row", () => {
    let testcase_alphanum: string = '42: { hi: \'a};';
    let testcase_numeric: string = '42: { 1337: \'a};';
    let testcase_non_alphanum: string = '42: { ### : \'a};';
    let testcase_star: string = '42: { * : \'a};';
    let testcase_zero: string = '42: { 0: \'a};';
    let testcase_reserved_word: string = '42: { val: \'a};';
    let testcase_equals: string = '42: { =: \'a};';
    let testcase_ident: string = '42: { hi: a};';
    let testcase_tyvar: string = '42: { hi: \'a};';
    let testcase_etyvar: string = '42: { hi: \'\'a};';

    expect(parse(testcase_alphanum)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a')]
                ]),
                true
            )
        )
    ));
    expect(parse(testcase_numeric)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["1337", new Type.TypeVariable('\'a')]
                ]),
                true
            )
        )
    ));
    expect(parse(testcase_non_alphanum)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["###", new Type.TypeVariable('\'a')]
                ]),
                true
            )
        )
    ));
    expect(parse(testcase_star)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["*", new Type.TypeVariable('\'a')]
                ]),
                true
            )
        )
    ));

    expect(() => { parse(testcase_zero); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_reserved_word); }).toThrow(Errors.ParserError);
    expect(() => { parse(testcase_equals); }).toThrow(Errors.ParserError);

    expect(parse(testcase_ident)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.CustomType('a', [])]
                ]),
                true
            )
        )
    ));
    expect(parse(testcase_tyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a')]
                ]),
                true
            )
        )
    ));
    expect(parse(testcase_etyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(
            get42(),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'\'a')]
                ]),
                true
            )
        )
    ));
});


it("module language - structure", () => {
    expect(parse("structure a = struct val x = 4 end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.StructureExpression(
                        new Decl.SequentialDeclaration([
                            new Decl.ValueDeclaration( [], [
                                new Decl.ValueBinding( false,
                                    new Expr.ValueIdentifier(
                                        new Token.AlphanumericIdentifierToken("x")
                                    ),
                                    new Expr.Constant(
                                        new Token.NumericToken("4", 4)
                                    )
                                )
                            ], 4)
                        ], 3)
                    )
                )
            ])
        ], 1)
    );
    expect(parse("structure a = struct val x = 4; val x = 4 end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.StructureExpression(
                        new Decl.SequentialDeclaration([
                            new Decl.ValueDeclaration( [], [
                                new Decl.ValueBinding( false,
                                    new Expr.ValueIdentifier(
                                        new Token.AlphanumericIdentifierToken("x")
                                    ),
                                    new Expr.Constant(
                                        new Token.NumericToken("4", 4)
                                    )
                                )
                            ], 4),
                            new Decl.ValueDeclaration( [], [
                                new Decl.ValueBinding( false,
                                    new Expr.ValueIdentifier(
                                        new Token.AlphanumericIdentifierToken("x")
                                    ),
                                    new Expr.Constant(
                                        new Token.NumericToken("4", 4)
                                    )
                                )
                            ], 5)
                        ], 3)
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a = struct end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.StructureExpression(
                        new Decl.SequentialDeclaration([], 3)
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a = struct end and b = struct end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.StructureExpression(
                        new Decl.SequentialDeclaration([], 3)
                    )
                ),
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.StructureExpression(
                        new Decl.SequentialDeclaration([],5)
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a = b.b;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.StructureIdentifier(
                        new Token.LongIdentifierToken("b.b",
                            [
                                new Token.AlphanumericIdentifierToken("b")
                            ],
                            new Token.AlphanumericIdentifierToken("b"),
                        )
                    )
                )
            ])
        ], 1)
    );
    // TODO test that dec in let can only be strdec. Especially in combination with local
    expect(parse("structure a = let structure a = struct end in x.x end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.LocalDeclarationStructureExpression(
                        new Decl.SequentialDeclaration( [
                            new Modu.StructureDeclaration( [
                                new Modu.StructureBinding(
                                    new Token.AlphanumericIdentifierToken("a"),
                                    new Modu.StructureExpression(
                                        new Decl.SequentialDeclaration( [], 5)
                                    )
                                )
                            ])
                        ], 3),
                        new Modu.StructureIdentifier(
                            new Token.LongIdentifierToken("x.x",
                                [new Token.AlphanumericIdentifierToken("x")],
                                new Token.AlphanumericIdentifierToken("x")
                            )
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a = b:c;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.TransparentConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("b")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a:b = c;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.TransparentConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("b")
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a = b:>c;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.OpaqueConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("b")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a:>b = c;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.OpaqueConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("b")
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a:>b = c and d:e = f;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.OpaqueConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("b")
                        )
                    )
                ),
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("d"),
                    new Modu.TransparentConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("f")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("e")
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a:b = c and d:>e = f;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.TransparentConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("b")
                        )
                    )
                ),
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("d"),
                    new Modu.OpaqueConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("f")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("e")
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("structure a = b (c);")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.FunctorApplication(
                        new Token.AlphanumericIdentifierToken("b"),
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("c")
                        )
                    )
                )
            ])
        ], 1)
    );
});

it("module language - structure derived", () => {
    let seq =
    new Decl.SequentialDeclaration(
        [
            new Modu.StructureDeclaration(
                [
                    new Modu.StructureBinding(
                        new Token.AlphanumericIdentifierToken('a'),
                        new Modu.StructureIdentifier(
                             new Token.AlphanumericIdentifierToken('b')
                        )
                    )
                ]
            )
        ]
    );
    seq.id=3;
    expect(parse("structure a = b (structure a = b);")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.StructureDeclaration( [
                new Modu.StructureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.FunctorApplication(
                        new Token.AlphanumericIdentifierToken("b"),
                        new Modu.StructureExpression(
                            seq
                        )
                    )
                )
            ])
        ], 1)
    );
});

it("module language - signature", () => {
    expect(parse("signature a = sig end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.SignatureDeclaration( [
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.SignatureExpression(
                        new Modu.SequentialSpecification( [])
                    )
                )
            ])
        ], 1)
    );

    expect(parse("signature a = sig end and b = sig end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.SignatureDeclaration( [
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.SignatureExpression(
                        new Modu.SequentialSpecification( [])
                    )
                ),
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureExpression(
                        new Modu.SequentialSpecification( [])
                    )
                )
            ])
        ], 1)
    );

    expect(parse("signature a = a;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.SignatureDeclaration( [
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("a")
                    )
                )
            ])
        ], 1)
    );

    expect(parse("signature a = sig end where type int=a;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.SignatureDeclaration( [
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.TypeRealisation(
                        new Modu.SignatureExpression(
                            new Modu.SequentialSpecification( [])
                        ),
                        [],
                        new Token.AlphanumericIdentifierToken("int"),
                        new Type.CustomType("a", [])
                    )
                )
            ])
        ], 1)
    );

    expect(parse("signature a = b where type c=d and   type e=f;")).toEqualWithType(
       parse("signature a = b where type c=d where type e=f;")
    );

    expect(() => {parse("signature a = b and type c=d and   type e=f;")}).toThrow(Errors.InterpreterError);
});

it("module language - functor", () => {
    expect(parse("functor a (b: c) = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.StructureIdentifier(
                        new Token.AlphanumericIdentifierToken("d")
                    )
                )
            ])
        ], 1)
    );

    expect(() => {parse("functor a (b: fun) = d;")}).toThrow();

    expect(() => {parse("functor a (fun: c) = d;")}).toThrow();

    expect(() => {parse("functor fun (b: c) = d;")}).toThrow();

    expect(parse("functor a (b: c) = d and a (b: c) = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.StructureIdentifier(
                        new Token.AlphanumericIdentifierToken("d")
                    )
                ),
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.StructureIdentifier(
                        new Token.AlphanumericIdentifierToken("d")
                    )
                )
            ])
        ], 1)
    );

    expect(parse("functor a (b: c):f = d and a (b: c) = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.TransparentConstraint(
                        new Modu.StructureIdentifier(
                            new Token.AlphanumericIdentifierToken("d")
                        ),
                        new Modu.SignatureIdentifier(
                            new Token.AlphanumericIdentifierToken("f")
                        )
                    )
                ),
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.StructureIdentifier(
                        new Token.AlphanumericIdentifierToken("d")
                    )
                )
            ])
        ], 1)
    );

    expect(parse("functor a (b: c):e = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.TransparentConstraint(
                        new Modu.StructureIdentifier( new Token.AlphanumericIdentifierToken("d")),
                        new Modu.SignatureIdentifier( new Token.AlphanumericIdentifierToken("e"))
                    )
                )
            ])
        ], 1)
    );

    expect(parse("functor a (b: c):>e = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("b"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("c")
                    ),
                    new Modu.OpaqueConstraint(
                        new Modu.StructureIdentifier( new Token.AlphanumericIdentifierToken("d")),
                        new Modu.SignatureIdentifier( new Token.AlphanumericIdentifierToken("e"))
                    )
                )
            ])
        ], 1)
    );

    expect(parse("functor a (val a:int) = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("__farg"),
                    new Modu.SignatureExpression(
                        new Modu.SequentialSpecification([
                            new Modu.ValueSpecification( [[
                                new Token.AlphanumericIdentifierToken("a"),
                                new Type.CustomType("int", [])
                            ]])
                        ])
                    ),
                    new Modu.LocalDeclarationStructureExpression(
                        new Decl.OpenDeclaration([new Token.AlphanumericIdentifierToken("__farg")]),
                        new Modu.StructureIdentifier( new Token.AlphanumericIdentifierToken("d"))
                    )
                )
            ])
        ], 1)
    );

    expect(parse("functor a (val a:int) :b = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("__farg"),
                    new Modu.SignatureExpression(
                        new Modu.SequentialSpecification([
                            new Modu.ValueSpecification( [[
                                new Token.AlphanumericIdentifierToken("a"),
                                new Type.CustomType("int", [])
                            ]])
                        ])
                    ),
                    new Modu.LocalDeclarationStructureExpression(
                        new Decl.OpenDeclaration([new Token.AlphanumericIdentifierToken("__farg")]),
                        new Modu.TransparentConstraint(
                            new Modu.StructureIdentifier( new Token.AlphanumericIdentifierToken("d")),
                            new Modu.SignatureIdentifier( new Token.AlphanumericIdentifierToken("b"))
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("functor a (val a:int):>b = d;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.FunctorDeclaration( [
                new Modu.FunctorBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Token.AlphanumericIdentifierToken("__farg"),
                    new Modu.SignatureExpression(
                        new Modu.SequentialSpecification([
                            new Modu.ValueSpecification( [[
                                new Token.AlphanumericIdentifierToken("a"),
                                new Type.CustomType("int", [])
                            ]])
                        ])
                    ),
                    new Modu.LocalDeclarationStructureExpression(
                        new Decl.OpenDeclaration( [new Token.AlphanumericIdentifierToken("__farg")]),
                        new Modu.OpaqueConstraint(
                            new Modu.StructureIdentifier( new Token.AlphanumericIdentifierToken("d")),
                            new Modu.SignatureIdentifier( new Token.AlphanumericIdentifierToken("b"))
                        )
                    )
                )
            ])
        ], 1)
    );
//TODO test the and on the derive forms
});

it("module language - spec", () => {
    expect(parse("signature a = sig end;")).toEqualWithType(
        spec_tester([])
    );

    expect(parse("signature a = sig val a:int end;")).toEqualWithType(
        spec_tester([
            new Modu.ValueSpecification([
                [
                    new Token.AlphanumericIdentifierToken("a"),
                    new Type.CustomType("int", [])
                ]
            ])
        ])
    );

    expect(parse("signature a = sig val b:c and q:m end;")).toEqualWithType(
        spec_tester([
            new Modu.ValueSpecification([
                [
                    new Token.AlphanumericIdentifierToken("b"),
                    new Type.CustomType("c", [])
                ],
                [
                    new Token.AlphanumericIdentifierToken("q"),
                    new Type.CustomType("m", [])
                ]
            ])
        ])
    );

    expect(parse("signature a = sig type a end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("a")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig type 'a b end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeSpecification([
                [
                    [
                        new Type.TypeVariable("'a")
                    ],
                    new Token.AlphanumericIdentifierToken("b")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig type ('a, 'c) b end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeSpecification([
                [
                    [
                        new Type.TypeVariable("'a"),
                        new Type.TypeVariable("'c")
                    ],
                    new Token.AlphanumericIdentifierToken("b")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig type a and 'c b end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("a")
                ],
                [
                    [
                        new Type.TypeVariable("'c")
                    ],
                    new Token.AlphanumericIdentifierToken("b")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig eqtype a end;")).toEqualWithType(
        spec_tester([
            new Modu.EqualityTypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("a")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig eqtype 'a b end;")).toEqualWithType(
        spec_tester([
            new Modu.EqualityTypeSpecification([
                [
                    [
                        new Type.TypeVariable("'a")
                    ],
                    new Token.AlphanumericIdentifierToken("b")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig eqtype ('a, 'c) b end;")).toEqualWithType(
        spec_tester([
            new Modu.EqualityTypeSpecification([
                [
                    [
                        new Type.TypeVariable("'a"),
                        new Type.TypeVariable("'c")
                    ],
                    new Token.AlphanumericIdentifierToken("b")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig eqtype a and 'c b end;")).toEqualWithType(
        spec_tester([
            new Modu.EqualityTypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("a")
                ],
                [
                    [
                        new Type.TypeVariable("'c")
                    ],
                    new Token.AlphanumericIdentifierToken("b")
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype a = b end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("a"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("b"),
                            undefined
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype 'a b = c end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [
                        new Type.TypeVariable("'a")
                    ],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("c"),
                            undefined
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype ('a, 'c) b = d end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [
                        new Type.TypeVariable("'a"),
                        new Type.TypeVariable("'c")
                    ],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("d"),
                            undefined
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype a = b and 'c b = fish end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("a"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("b"),
                            undefined
                        ]
                    ]
                ],
                [
                    [
                        new Type.TypeVariable("'c")
                    ],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("fish"),
                            undefined
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype b = fish of blub end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("fish"),
                            new Type.CustomType("blub", [])
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype b = fish | cow end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("fish"),
                            undefined
                        ],
                        [
                            new Token.AlphanumericIdentifierToken("cow"),
                            undefined
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype b = fish of blub | cow end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("fish"),
                            new Type.CustomType("blub", [])
                        ],
                        [
                            new Token.AlphanumericIdentifierToken("cow"),
                            undefined
                        ]
                    ]
                ]
            ])
        ])
    );

    expect(parse("signature a = sig datatype b = fish of blub | cow of moo end;")).toEqualWithType(
        spec_tester([
            new Modu.DatatypeSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("b"),
                    [
                        [
                            new Token.AlphanumericIdentifierToken("fish"),
                            new Type.CustomType("blub", [])
                        ],
                        [
                            new Token.AlphanumericIdentifierToken("cow"),
                            new Type.CustomType("moo", [])
                        ]
                    ]
                ]
            ])
        ])
    );
    //TODO datatype tycon -=- datatype longtycon

    expect(parse("signature a = sig exception fish end;")).toEqualWithType(
        spec_tester([
            new Modu.ExceptionSpecification([
                [
                    new Token.AlphanumericIdentifierToken("fish"),
                    undefined
                ]
            ])
        ])
    );

    expect(parse("signature a = sig exception fish and cow end;")).toEqualWithType(
        spec_tester([
            new Modu.ExceptionSpecification([
                [
                    new Token.AlphanumericIdentifierToken("fish"),
                    undefined
                ],
                [
                    new Token.AlphanumericIdentifierToken("cow"),
                    undefined
                ]
            ])
        ])
    );

    expect(parse("signature a = sig exception fish of blub and cow end;")).toEqualWithType(
        spec_tester([
            new Modu.ExceptionSpecification([
                [
                    new Token.AlphanumericIdentifierToken("fish"),
                    new Type.CustomType("blub", [])
                ],
                [
                    new Token.AlphanumericIdentifierToken("cow"),
                    undefined
                ]
            ])
        ])
    );

    expect(parse("signature a = sig exception fish of blub and cow of moo end;")).toEqualWithType(
        spec_tester([
            new Modu.ExceptionSpecification([
                [
                    new Token.AlphanumericIdentifierToken("fish"),
                    new Type.CustomType("blub", [])
                ],
                [
                    new Token.AlphanumericIdentifierToken("cow"),
                    new Type.CustomType("moo", [])
                ]
            ])
        ])
    );

    expect(parse("signature a = sig structure fish:blub end;")).toEqualWithType(
        spec_tester([
            new Modu.StructureSpecification([
                [
                    new Token.AlphanumericIdentifierToken("fish"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("blub")
                    )

                ]
            ])
        ])
    );

    expect(parse("signature a = sig structure fish:blub and cow:moo end;")).toEqualWithType(
        spec_tester([
            new Modu.StructureSpecification([
                [
                    new Token.AlphanumericIdentifierToken("fish"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("blub")
                    )
                ],
                [
                    new Token.AlphanumericIdentifierToken("cow"),
                    new Modu.SignatureIdentifier(
                        new Token.AlphanumericIdentifierToken("moo")
                    )
                ],
            ])
        ])
    );

    expect(parse("signature a = sig include a end;")).toEqualWithType(
        spec_tester([
            new Modu.IncludeSpecification( [
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken("a")
                )
            ])
        ])
    );

    expect(parse("signature a = sig include b ; val b:c end;")).toEqualWithType(
        spec_tester([
            new Modu.IncludeSpecification([
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken("b")
                )
            ]),
            new Modu.ValueSpecification( [
                [
                    new Token.AlphanumericIdentifierToken("b"),
                    new Type.CustomType("c", [])
                ]
            ])
        ])
    );

    let multi_spec = 'signature a = sig val b:c type d eqtype e datatype f = g exception h structure i:m include j val k:l end;';
    expect(parse(multi_spec)).toEqualWithType(
        spec_tester([
            new Modu.ValueSpecification([[
                new Token.AlphanumericIdentifierToken("b"),
                new Type.CustomType("c", [])
            ]]),
            new Modu.TypeSpecification( [[
                [],
                new Token.AlphanumericIdentifierToken("d")
            ]]),
            new Modu.EqualityTypeSpecification( [[
                [],
                new Token.AlphanumericIdentifierToken("e")
            ]]),
            new Modu.DatatypeSpecification( [[
                [],
                new Token.AlphanumericIdentifierToken("f"),
                [[
                    new Token.AlphanumericIdentifierToken("g"),
                    undefined
                ]]
            ]]),
            new Modu.ExceptionSpecification( [[
                new Token.AlphanumericIdentifierToken("h"),
                undefined
            ]]),
            new Modu.StructureSpecification( [[
                new Token.AlphanumericIdentifierToken("i"),
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken("m")
                )
            ]]),
            new Modu.IncludeSpecification([
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken("j")
                )
            ]),
            new Modu.ValueSpecification( [[
                new Token.AlphanumericIdentifierToken("k"),
                new Type.CustomType("l", [])
            ]])
        ])
    );
    multi_spec = 'signature a = sig val b:c;type d;eqtype e;datatype f = g;exception h;structure i:m;include j;val k:l end;';
    expect(parse(multi_spec)).toEqualWithType(
        spec_tester([
            new Modu.ValueSpecification([[
                new Token.AlphanumericIdentifierToken("b"),
                new Type.CustomType("c", [])
            ]]),
            new Modu.TypeSpecification( [[
                [],
                new Token.AlphanumericIdentifierToken("d")
            ]]),
            new Modu.EqualityTypeSpecification( [[
                [],
                new Token.AlphanumericIdentifierToken("e")
            ]]),
            new Modu.DatatypeSpecification( [[
                [],
                new Token.AlphanumericIdentifierToken("f"),
                [[
                    new Token.AlphanumericIdentifierToken("g"),
                    undefined
                ]]
            ]]),
            new Modu.ExceptionSpecification( [[
                new Token.AlphanumericIdentifierToken("h"),
                undefined
            ]]),
            new Modu.StructureSpecification( [[
                new Token.AlphanumericIdentifierToken("i"),
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken("m")
                )
            ]]),
            new Modu.IncludeSpecification([
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken("j")
                )
            ]),
            new Modu.ValueSpecification( [[
                new Token.AlphanumericIdentifierToken("k"),
                new Type.CustomType("l", [])
            ]])
        ])
    );

    expect(parse("signature a = sig val b:e sharing type c = d end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.SignatureDeclaration( [
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.SignatureExpression(
                        new Modu.SharingSpecification(
                            new Modu.SequentialSpecification([
                                new Modu.ValueSpecification([
                                    [
                                        new Token.AlphanumericIdentifierToken("b"),
                                        new Type.CustomType("e", [])
                                    ]
                                ])
                            ]),
                            [
                                new Token.AlphanumericIdentifierToken("c"),
                                new Token.AlphanumericIdentifierToken("d")
                            ]
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(parse("signature a = sig val b:e sharing type c = d.d = e end;")).toEqualWithType(
        new Decl.SequentialDeclaration( [
            new Modu.SignatureDeclaration( [
                new Modu.SignatureBinding(
                    new Token.AlphanumericIdentifierToken("a"),
                    new Modu.SignatureExpression(
                        new Modu.SharingSpecification(
                            new Modu.SequentialSpecification([
                                new Modu.ValueSpecification([
                                    [
                                        new Token.AlphanumericIdentifierToken("b"),
                                        new Type.CustomType("e", [])
                                    ]
                                ])
                            ]),
                            [
                                new Token.AlphanumericIdentifierToken("c"),
                                new Token.LongIdentifierToken("d.d", [
                                    new Token.AlphanumericIdentifierToken("d")
                                ], new Token.AlphanumericIdentifierToken("d")),
                                new Token.AlphanumericIdentifierToken("e")
                            ]
                        )
                    )
                )
            ])
        ], 1)
    );

    expect(() => { parse("signature a = sig val b:e sharing type c end;"); }).toThrow(Errors.ParserError);

    expect(parse("signature a = sig type b = c end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeAliasSpecification([
                [
                    [],
                    new Token.AlphanumericIdentifierToken("b"),
                    new Type.CustomType("c", [])
                ]
            ])
        ])
    );

    expect(parse("signature a = sig type 'a b = c end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeAliasSpecification([
                [
                    [
                        new Type.TypeVariable('\'a')
                    ],
                    new Token.AlphanumericIdentifierToken("b"),
                    new Type.CustomType("c", [])
                ]
            ])
        ])
    );

    expect(parse("signature a = sig type 'a b = c and ('d, 'e) f = g end;")).toEqualWithType(
        spec_tester([
            new Modu.TypeAliasSpecification([
                [
                    [
                        new Type.TypeVariable('\'a')
                    ],
                    new Token.AlphanumericIdentifierToken("b"),
                    new Type.CustomType("c", [])
                ],
                [
                    [
                        new Type.TypeVariable('\'d'),
                        new Type.TypeVariable('\'e')
                    ],
                    new Token.AlphanumericIdentifierToken('f'),
                    new Type.CustomType('g', [])
                ]
            ])
        ])
    );

    expect(parse("signature a = sig include a b c end;")).toEqualWithType(
        spec_tester([
            new Modu.IncludeSpecification([
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken('a')
                ),
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken('b')
                ),
                new Modu.SignatureIdentifier(
                    new Token.AlphanumericIdentifierToken('c')
                ),
            ])
        ])
    );

    //TODO sharing derive
});
