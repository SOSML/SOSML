const Lexer = require("../src/lexer");
const Parser = require("../src/parser");
const Errors = require("../src/errors");

const State = require("../src/state.ts");
const Expr = require("../src/expressions.ts");
const Decl = require("../src/declarations.ts");
const Type = require("../src/types.ts");

const TestHelper = require("./test_helper.ts");
TestHelper.init();

function createItExpression(exp: Expr.Expression): void {
    return new Decl.SequentialDeclaration(0, [
        new Decl.ValueDeclaration(0, [], [
            new Decl.ValueBinding(0, false,
                new Expr.ValueIdentifier(-1, new Lexer.AlphanumericIdentifierToken('it', -1)),
                exp
            )
        ])
    ]);
}

function pattern_tester(pattern: Expr.Pattern, pos42: Errors.Position): Decl.Declaration {
    return new Decl.ValueDeclaration(0, [], [
        new Decl.ValueBinding(4, false, pattern, get42(pos42))
    ] )
}

function prefixWithOp(tok: Lexer.IdentifierToken): Lexer.IdentifierToken {
    tok.opPrefixed = true;
    return tok;
}

function get42(pos: Errors.Position): Expr.Expresion {
    return new Expr.Constant(pos, new Lexer.NumericToken('42', pos, 42));
}

const sampleExpression1: string = 'if 5 then 9 else 7';
function createSampleExpression1(pos: Errors.Position): Expr.Expression {
    return new Expr.Conditional(pos,
            new Expr.Constant(pos+3, new Lexer.NumericToken('5', pos+3, 5)),
            new Expr.Constant(pos+10, new Lexer.NumericToken('9', pos+10, 9)),
            new Expr.Constant(pos+17, new Lexer.NumericToken('7', pos+17, 7))
        );
    );
}
const sampleExpression2: string = 'if 1 then 2 else 3';
function createSampleExpression2(pos: Errors.Position): Expr.Expression {
    return new Expr.Conditional(pos,
            new Expr.Constant(pos+3, new Lexer.NumericToken('1', pos+3, 1)),
            new Expr.Constant(pos+10, new Lexer.NumericToken('2', pos+10, 2)),
            new Expr.Constant(pos+17, new Lexer.NumericToken('3', pos+17, 3))
        );
    );
}

function parse(str: string): Decl.Declaration {
    return Parser.parse(Lexer.lex(str), State.getInitialState());
}

it("basic", () => {
    let testcase_empty: string = ';';
    let testcase_simple1: string = 'val x = 42;';
    let testcase_sample_expr1: string = sampleExpression1 + ';';
    let testcase_sample_expr2: string = sampleExpression2 + ';';

    expect(parse(testcase_empty)).toEqualWithType(
        new Decl.SequentialDeclaration(0, [])
    );
    expect(parse(testcase_simple1)).toEqualWithType(
        new Decl.SequentialDeclaration(0, [
            new Decl.ValueDeclaration(0, [], [
                new Decl.ValueBinding(4, false,
                    new Expr.ValueIdentifier(4, new Lexer.AlphanumericIdentifierToken('x', 4)),
                    get42(8)
                )
            ])
        ])
    );
    expect(parse(testcase_sample_expr1)).toEqualWithType(createItExpression(
        createSampleExpression1(0)
    ));
    expect(parse(testcase_sample_expr2)).toEqualWithType(createItExpression(
        createSampleExpression2(0)
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
        new Expr.Constant(0, new Lexer.IntegerConstantToken('0', 0, 0))
    ));
    expect(parse(testcase_special_int)).toEqualWithType(createItExpression(
        get42(0)
    ));
    expect(parse(testcase_special_real)).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.RealConstantToken('42.0', 0, 42.0))
    ));
    expect(parse(testcase_special_word)).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.WordConstantToken('0w42', 0, 42))
    ));
    expect(parse(testcase_special_char)).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.CharacterConstantToken('#"c"', 0, 'c'))
    ));
    expect(parse(testcase_special_string)).toEqualWithType(createItExpression(
        new Expr.Constant(0, new Lexer.StringConstantToken('"str"', 0, 'str'))
    ));
});

it("atomic expression - value identifier", () => {
    let testcase_vid_with_op: string = 'op +;';
    let testcase_vid_with_op_long: string = 'op Math.pow;';
    let testcase_vid_without_op: string = 'blub;';
    let testcase_vid_without_op_long: string = 'Reals.nan;';

    expect(parse(testcase_vid_with_op)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(0,
            prefixWithOp(new Lexer.IdentifierToken('+', 3))
        )
    ));
    expect(parse(testcase_vid_with_op_long)).toEqualWithType(createItExpression(
        new Expr.ValueIdentifier(0,
            prefixWithOp(new Lexer.LongIdentifierToken('Math.pow', 3, [
                    new Lexer.AlphanumericIdentifierToken('Math', 3)
                ],
                new Lexer.AlphanumericIdentifierToken('pow', 8)
            ))
        )
    ));

    //TODO last 2 testcases
});

it("atomic expression - records", () => {
    let testcase_rec_empty: string = '{}';
    let testcase_rec_single: string = '{ 0 = hello }';
    let testcase_rec_multiple: string = '{ 0 = hello, world = 42, what = ever}';

    //TODO test the testcases
});


it("atomic expression - record selector", () => {
    //TODO tests
});

it("atomic expression - 0 tuple", () => {
    //TODO tests
});

it("atomic expression - n tuple", () => {
    //TODO tests
});

it("atomic expression - list", () => {
    //TODO tests
});

it("atomic expression - sequence", () => {
    //TODO tests
});

it("atomic expression - local declaration", () => {
    //TODO tests
});

it("atomic expression - bracketed expression", () => {
    //TODO tests
});

it("expression row", () => {
    //TODO tests
});

it("application expression", () => {
    //TODO tests
});

it("infix expression", () => {
    //TODO tests
});

it("expression - passthrough", () => {
    //TODO tests
});

it("expression - typed expression", () => {
    //TODO tests
});

it("expression - conjunction", () => {
    //TODO tests
});

it("expression - disjunction", () => {
    //TODO tests
});

it("expression - handle exception", () => {
    //TODO tests
});

it("expression - raise exception", () => {
    //TODO tests
});

it("expression - conditional", () => {
    //TODO tests
});

it("expression - iteration", () => {
    //TODO tests
});

it("expression - case analysis", () => {
    //TODO tests
});

it("expression - function", () => {
    //TODO tests
});

it("matches", () => {
    //TODO tests
});

it("declaration - value declaration", () => {
    //TODO tests
});

it("declaration - function declaration", () => {
    //TODO tests
});

it("declaration - type declaration", () => {
    //TODO tests
});

it("declaration - datatype declaration", () => {
    //TODO tests
});

it("declaration - datatype replication", () => {
    //TODO tests
});

it("declaration - abstype declaration", () => {
    //TODO tests
});

it("declaration - exception declaration", () => {
    //TODO tests
});

it("declaration - local declaration", () => {
    //TODO tests
});

it("declaration - open declaration", () => {
    //TODO tests
});

it("declaration - empty declaration", () => {
    //TODO tests
});

it("declaration - sequential declaration", () => {
    //TODO tests
});

it("declaration - infix (L) directive", () => {
    //TODO tests
});

it("declaration - infix (R) directive", () => {
    //TODO tests
});

it("declaration - nonfix directive", () => {
    //TODO tests
});

it("value bindings - non recursive", () => {
    //TODO tests
});

it("value bindings - recursive", () => {
    //TODO tests
});

it("function value bindings", () => {
    //TODO tests
});

it("type bindings", () => {
    //TODO tests
});

it("datatype bindings", () => {
    //TODO tests
});

it("constructor bindings", () => {
    //TODO tests
});

it("exception bindings", () => {
    //TODO tests
});

it("constructor bindings", () => {
    //TODO tests
});

it("atomic pattern - wildcard", () => {
    let wildcard_test:string = "val _ = 42;";
    expect(parse(wildcard_test).toEqualWithType(pattern_tester(
        new Expr.Wildcard(4), 8)));
});

it("atomic pattern - special constant", () => {
    let special_constant:string = "val 42 = 42;";
    expect(parse(special_constant).toEqualWithType(pattern_tester(
        new Expr.Constant(4,
        new Lexer.IntegerConstantToken("42", 4, 42))
    , 9)));
});

it("atomic pattern - value identifier", () => {
    let atomic_pattern_vid_no_op: string = "val x = 42;";
    let atomic_pattern_vid_with_op: string = "val op x = 42;";
    expect(parse(atomic_pattern_vid_no_op).toEqualWithType(pattern_tester(
        new Expr.ValueIdentifier(4,
        new Lexer.LongIdentifierToken("x", 4, [], new Lexer.IdentifierToken("x", 4)))
    , 8)));
    expect(parse(atomic_pattern_vid_with_op).toEqualWithType(pattern_tester(
        new Expr.ValueIdentifier(4,
        new Lexer.LongIdentifierToken("x", 4, [], new Lexer.IdentifierToken("x", 4)))
    , 8)));
});

it("atomic pattern - record", () => {
    let atomic_pattern_record: string = "val { x = _ } = 42;";
    expect(parse(atomic_pattern_record).toEqualWithType(pattern_tester(
        new Expr.Record(4, true, [["x", new Expr.Wildcard(10)]])
    , 16)))
});

it("atomic pattern - 0-tuple", () => {
    let atomic_pattern_0_tuple: string = "val () = 42;";
    expect(parse(atomic_pattern_0_tuple).toEqualWithType(pattern_tester(
        new Expr.Tuple(4, [])
    , 9)));
});

it("atomic pattern - n-tuple", () => {

    let atomic_pattern_2_tuple:string = "val (_,_) = 42;";
    expect(parse(atomic_pattern_2_tuple).toEqualWithType(pattern_tester(
        new Expr.Tuple(4, [
            new Expr.Wildcard(5),
            new Expr.Wildcard(7)
        ])
    , 12)));
});

it("atomic pattern - list", () => {
    let atomic_pattern_0_list:string = "val [] = 42;";
    let atomic_pattern_1_list:string = "val [_] = 42;";
    let atomic_pattern_2_list:string = "val [_,_] = 42;";
    expect(parse(atomic_pattern_0_list).toEqualWithType(pattern_tester(
        new Expr.List(4, [])
    , 9)));
    expect(parse(atomic_pattern_1_list).toEqualWithType(pattern_tester(
        new Expr.List(4, [new Expr.Wildcard(5)])
    , 10)));
    expect(parse(atomic_pattern_1_list).toEqualWithType(pattern_tester(
        new Expr.List(4, [new Expr.Wildcard(5), new Expr.Wildcard(7)])
    , 12)));
});

it("atomic pattern - bracketed", () => {
    let atomic_pattern_bracketed:string = "val (_) = 42;";
    expect(parse(atomic_pattern_bracketed).toEqualWithType(pattern_tester(
        new Expr.Tuple(4, [new Expr.Wildcard(5)])
    , 10)));
});

it("pattern row - wildcard", () => {
    let patrow_wildcard:string = "val { ... } = 42;";
    expect(parse(patrow_wildcard).toEqualWithType(pattern_tester(
        new Expr.Record(4, false, [])
    , 14)));
});

it("pattern row - pattern row", () => {
    let patrow_patrow: string = "val { ... , ... } = 42;";
    expect(parse(patrow_wildcard).toEqualWithType(pattern_tester(
        new Expr.Record(4, false, [])
    , 20)));
    let patrow_label: string = "val { l1 = _ } = 42;";
    expect(parse(patrow_label).toEqualWithType(pattern_tester(
        new Expr.Record(4, true, ["l1", new Wildcard(11)])
    , 17)));
});

it("pattern row - label as variable", () => {
    let patrow_as_label: string = "val {x:int as _} = 42;";
    let patrow_as_label1: string = "val {x as _} = 42;";
    let patrow_as_label2: string = "val {x:int} = 42;";
    //TODO dunno what to do
});

it("pattern - atomic", () => {
    //TODO ? tests already tested via atomic tests
});

it("pattern - constructed value", () => {
    let pattern_cons_val: string = "val x _ = 42;";
    let pattern_cons_val_with_op: string = "val op x _ = 42;"
    //TODO tests
});

it("pattern - constructed value (infix)", () => {
    let pattern_infix:string = "val _ x _ = 42;";
    //TODO tests
});

it("pattern - typed", () => {
    let pattern_type:string = "val x : int = 42;";
    expect(parse(pattern_type).toEqualWithType(pattern_tester(
        new Expr.TypedExpression(4,
        new Expr.ValueIdentifier(4, new Lexer.LongIdentifierToken("x", 4, [], new Lexer.IdentifierToken("x", 4))),
        new Type.PrimitiveType(Type.PrimitiveTypes.int, 8)
    ), 14
    )));
});

it("pattern - layered", () => {
    "val x as _ = 42;"
    "val op x as _ = 42;"
    "val x :int as _ = 42;"
    "val op x:int as _ = 42;"
    //TODO tests don't want anymore
});

it("type - type variable", () => {
    let testcase_tyvar: string = '42: \'a;';
    let testcase_etyvar: string = '42: \'\'meaningoflive;';

    expect(parse(testcase_tyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TypeVariable('\'a', 4)
        )
    ));
    expect(parse(testcase_etyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TypeVariable('\'\'meaningoflive', 4)
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
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([]),
                true,
                5
            )
        )
    ));
    expect(parse(testcase_single)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'int', 11)]
                ]),
                true,
                6
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hello", new Type.TypeVariable('\'a', 13)],
                    ["world", new Type.TypeVariable('\'b', 24)]
                ]),
                true,
                6
            )
        )
    ));
    expect(() => { parse(testcase_no_unit); }).toThrow(Parser.ParserError);
    expect(() => { parse(testcase_no_same_label); }).toThrow(Parser.ParserError);
});

it("type - type construction", () => {
    let testcase_small: string = '42: list;';
    let testcase_single: string = '42: \'a list;';
    let testcase_multiple: string = '42: (\'a * \'b, \'c) list;';

    expect(parse(testcase_small)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.CustomType(new Lexer.AlphanumericIdentifierToken('list', 4), [], 4)
        )
    ));
    expect(parse(testcase_single)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.CustomType(
                new Lexer.AlphanumericIdentifierToken('list', 7), [
                    new Type.TypeVariable('\'a', 4),
                ],
                4
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.CustomType(
                new Lexer.AlphanumericIdentifierToken('list', 18), [
                    new Type.TupleType([
                            new Type.TypeVariable('\'a', 5),
                            new Type.TypeVariable('\'b', 10)
                        ],
                        8
                    ),
                    new Type.TypeVariable('\'c', 14),
                ],
                4
            )
        )
    ));
});

it("type - tuple type", () => {
    let testcase_simple: string = '42: \'a * \'b;';
    let testcase_multiple: string = '42: \'a * \'b * \'c;';
    let testcase_bracketed: string = '42: \'a * (\'b * \'c);';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TupleType([
                    new Type.TypeVariable('\'a', 4),
                    new Type.TypeVariable('\'b', 9)
                ],
                7
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TupleType([
                    new Type.TypeVariable('\'a', 4),
                    new Type.TypeVariable('\'b', 9),
                    new Type.TypeVariable('\'c', 14)
                ],
                7
            )
        )
    ));
    expect(parse(testcase_bracketed)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TupleType([
                    new Type.TypeVariable('\'a', 4),
                    new Type.TupleType([
                            new Type.TypeVariable('\'b', 10),
                            new Type.TypeVariable('\'c', 15)
                        ],
                        13
                    )
                ],
                7
            )
        )
    ));
});

it("type - function type expression", () => {
    let testcase_simple: string = '42: \'a -> \'b;';
    let testcase_multiple: string = '42: \'a -> \'b -> \'c;';
    let testcase_multiple_bracketed: string = '42: (\'a -> \'b) -> \'c;';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.TypeVariable('\'a', 4),
                new Type.TypeVariable('\'b', 10),
                7
            )
        )
    ));
    expect(parse(testcase_multiple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.TypeVariable('\'a', 4),
                new Type.FunctionType(
                    new Type.TypeVariable('\'b', 10),
                    new Type.TypeVariable('\'c', 16),
                    13
                ),
                7
            )
        )
    ));
    expect(parse(testcase_multiple_bracketed)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.FunctionType(
                    new Type.TypeVariable('\'a', 5),
                    new Type.TypeVariable('\'b', 11),
                    8
                ),
                new Type.TypeVariable('\'c', 18),
                15
            )
        )
    ));
});

it("type - bracketed", () => {
    let testcase_simple: string = '42: (\'a);';
    let testcase_multiple_nested: string = '42: ((((\'a -> \'b))));';
    let testcase_nested_complex = '42: ({ hi: (\'a)});';

    expect(parse(testcase_simple)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.TypeVariable('\'a', 5)]
        )
    ));
    expect(parse(testcase_multiple_nested)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.FunctionType(
                new Type.TypeVariable('\'a', 8),
                new Type.TypeVariable('\'b', 14),
                11
            )
        )
    ));
    expect(parse(testcase_nested_complex)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a', 12)]
                ]),
                true,
                7
            )
        )
    ));
});

it("type row", () => {
    let testcase_alphanum: string = '42: { hi: \'a};';
    let testcase_numeric: string = '42: { 1337: \'a};';
    let testcase_non_alphanum: string = '42: { ### : \'a};';
    let testcase_zero: string = '42: { 0: \'a};';
    let testcase_reserved_word: string = '42: { val: \'a};';
    let testcase_equals: string = '42: { =: \'a};';
    let testcase_ident: string = '42: { hi: a};';
    let testcase_tyvar: string = '42: { hi: \'a};';
    let testcase_etyvar: string = '42: { hi: \'\'a};';

    expect(parse(testcase_alphanum)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a', 10)]
                ]),
                true,
                6
            )
        )
    ));
    expect(parse(testcase_numeric)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["1337", new Type.TypeVariable('\'a', 12)]
                ]),
                true,
                6
            )
        )
    ));
    expect(parse(testcase_non_alphanum)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["###", new Type.TypeVariable('\'a', 12)]
                ]),
                true,
                6
            )
        )
    ));

    expect(() => { parse(testcase_zero); }).toThrow(Parser.ParserError);
    expect(() => { parse(testcase_reserved_word); }).toThrow(Parser.ParserError);
    expect(() => { parse(testcase_equals); }).toThrow(Parser.ParserError);

    expect(parse(testcase_ident)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.CustomType(
                        new Lexer.AlphanumericIdentifierToken('a', 10), [], 10)]
                ]),
                true,
                6
            )
        )
    ));
    expect(parse(testcase_tyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'a', 10)]
                ]),
                true,
                6
            )
        )
    ));
    expect(parse(testcase_etyvar)).toEqualWithType(createItExpression(
        new Expr.TypedExpression(0,
            get42(0),
            new Type.RecordType(
                new Map([
                    ["hi", new Type.TypeVariable('\'\'a', 10)]
                ]),
                true,
                6
            )
        )
    ));
});
