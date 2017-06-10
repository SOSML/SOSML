import { Type } from './types';
import { Pattern } from './patterns';
import { Token } from './lexer';

// Interfaces

// All expressions
export interface Expression {
}

// Atomic expressions
export interface AtomicExpression extends Expression {
}

// Classes
export class Match {
// pat => exp or pat => exp | match
    patterns: [Pattern, Expression];
}

//
export class InfixExpression {
// InfExp = infexp1 vid infexp2
    leftOperand: InfixExpression;
    operator: ValueIdentifier;
    rightOperand: InfixExpression;
}

// Expression subclasses
export class TypedExpression implements Expression {
// exp: ty (L)
    expression: Expression;
    type: Type;
}

// TODO: better name?
export class BooleanOperation implements Expression {
// exp1 andalso exp2, exp1 orelse exp2
    isConjunction: boolean; // otherwise it is a disjunction
    leftOperand: Expression;
    rightOperand: Expression;
}

export class HandleException implements Expression {
// exp handle match
    expression: Expression;
    match: Match;
}

export class RaiseException implements Expression {
// raise exp
    exp: Expression;
}

export class Conditional implements Expression {
// if exp1 then exp2 else exp3
    condition: Expression;
    ifTrue: Expression;
    ifFalse: Expression;
}

// TODO: not functional
export class Iteration implements Expression {
// while exp1 do exp2
    condition: Expression;
    body: Expression;
}

export class CaseAnalysis implements Expression {
// case exp of match
    expression: Expression;
    match: Match;
}

export class Lambda implements Expression {
// fn match
    match: Match;
}

export class ApplicationExpression {
// appexp atexp
    function: Expression;
    argument: Expression;
}

export class RecordSelector implements Expression {
// #lab
    label: Token; // Label
    record: Expression;
}

// Atomic Expressions

export class Constant implements AtomicExpression {
    token: Token;
}

export class ValueIdentifier implements AtomicExpression {
// op longvid or longvid
    op: boolean; // whether this identifier is preceded by 'op'
    name: Token;
}

export class Record implements AtomicExpression {
// { exprow } or { }
// exprow = lab = exp or lab = exp, exprow
    // label and corresponding value
    entries: [Token, Expression];
}

// TODO: syntactic sugar
export class Tuple implements AtomicExpression {
// (exp1, ..., expn), n > 1
    exp: Expression[];
}

// TODO: syntactic sugar
export class List implements AtomicExpression {
// [exp1, ..., expn]
    exp: Expression[];
}

// TODO: not really functional?
export class Sequence implements AtomicExpression {
// (exp1; ...; expn), n >= 2
    exp: Expression[];
}

export class LocalDeclaration implements AtomicExpression {
// let dec in exp1; ...; expn end
    dec: any; // TODO: Declaration;
    // this expression may be a sequence even without parentheses
    exp: Expression;
}
