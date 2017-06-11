import { Type } from './types';
import { Pattern } from './patterns';
import { Token, IdentifierToken, LongIdentifierToken } from './lexer';
import { Declaration } from './declarations';

// Interfaces

// All expressions
export interface Expression {
}

// Classes
export class Match {
// pat => exp or pat => exp | match
    matches: [Pattern,  Expression][];
}

// Expression subclasses
export class InfixExpression implements Expression {
// leftOperand operator rightOperand
    leftOperand: Expression;
    operator: IdentifierToken;
    rightOperand: Expression;
}

// Expression subclasses
export class TypedExpression implements Expression {
// expression: type (L)
    expression: Expression;
    type: Type;
}

export class Conjunction implements Expression {
// leftOperand andalso rightOperand
    leftOperand: Expression;
    rightOperand: Expression;
}

export class Disjunction implements Expression {
// leftOperand orelse rightOperand
    leftOperand: Expression;
    rightOperand: Expression;
}

export class HandleException implements Expression {
// expression handle match
    expression: Expression;
    match: Match;
}

export class RaiseException implements Expression {
// raise expression
    expression: Expression;
}

export class Conditional implements Expression {
// if condition then ifTrue else ifFalse
    condition: Expression;
    ifTrue: Expression;
    ifFalse: Expression;
}

export class Iteration implements Expression {
// while condition do body
    condition: Expression;
    body: Expression;
}

export class CaseAnalysis implements Expression {
// case expression of match
    expression: Expression;
    match: Match;
}

export class Lambda implements Expression {
// fn match
    match: Match;
}

// ApplicationExpression subclasses
export class FunctionApplication implements Expression {
// function argument
    function: Expression;
    argument: Expression;
}

export class Constant implements Expression {
    token: Token;
}

export class ValueIdentifier implements Expression {
// op longvid or longvid
    opPrefixed: boolean;
    name: LongIdentifierToken;
}

export class Record implements Expression {
// { lab = exp, ... } or { }
    entries: [Token, Expression][];
}

export class RecordSelector implements Expression {
// #label record
    label: Token;
    record: Expression;
}

export class Tuple implements Expression {
// (exp1, ..., expn), n != 1
    expressions: Expression[];
}

export class List implements Expression {
// [exp1, ..., expn]
    expressions: Expression[];
}

export class Sequence implements Expression {
// (exp1; ...; expn), n >= 2
    expressions: Expression[];
}

export class LocalDeclaration implements Expression {
// let dec in exp1; ...; expn end
    declaration: Declaration;
    expressions: Expression[];
}
