import { Type } from './types';
import { Pattern } from './patterns';
import { Token, IdentifierToken, LongIdentifierToken } from './lexer';

// Interfaces

// All expressions
export interface Expression {
}

// Infix expressions
export interface InfExp extends Expression {
}

// Application evpressions
export interface ApplicationExpression extends InfExp {
}

// Atomic expressions
export interface AtomicExpression extends ApplicationExpression {
}

// Classes
export class Match {
// pat => exp or pat => exp | match
    matches: [Pattern,  Expression][];
}

// InfExp subclasses
export class InfixExpression implements InfExp {
// leftOperand operator rightOperand
    leftOperand: InfixExpression;
    operator: IdentifierToken;
    rightOperand: InfixExpression;
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
export class FunctionApplication implements ApplicationExpression {
// function argument
    function: ApplicationExpression;
    argument: AtomicExpression;
}

// AtomicExpression subclasses
export class Constant implements AtomicExpression {
    token: Token;
}

export class ValueIdentifier implements AtomicExpression {
// op longvid or longvid
    opPrefixed: boolean;
    name: LongIdentifierToken;
}

export class Record implements AtomicExpression {
// { lab = exp, ... } or { }
    entries: [Token, Expression][];
}

export class RecordSelector implements AtomicExpression {
// #label record
    label: Token;
    record: Expression;
}

export class Tuple implements AtomicExpression {
// (exp1, ..., expn), n != 1
    expressions: Expression[];
}

export class List implements AtomicExpression {
// [exp1, ..., expn]
    expressions: Expression[];
}

export class Sequence implements AtomicExpression {
// (exp1; ...; expn), n >= 2
    expressions: Expression[];
}

export class LocalDeclaration implements AtomicExpression {
// let dec in exp1; ...; expn end
    declaration: any; // TODO Declaration;
    expressions: Expression[];
}
