import { Type } from './types';
import { Pattern } from './patterns';

// Interfaces

// All expressions
export interface Expression {
}

// Infix expressions
export interface InfExp extends Expression {
}

// Application evpressions
export interface AppExp extends InfExp {
}

// Atomic expressions
export interface AtExp extends AppExp {
}

// Classes
export class Match {
// pat => exp or pat => exp | match
    pat: Pattern;
    exp: Expression;
    match: Match | undefined;
}

export class ExpressionRow {
// lab = exp or lab = exp, exprow
    lab: any; // Label
    exp: Expression;
    exprow: ExpressionRow | undefined;
}

// InfExp subclasses
export class InfixExpression implements InfExp {
// infexp1 vid infexp2
    infexp1: InfixExpression;
    vid: any;
    infexp2: InfixExpression;
}

// Expression subclasses
export class TypedExpression implements Expression {
// exp: ty (L)
    exp: Expression;
    ty: Type;
}

export class Conjunction implements Expression {
// exp1 andalso exp2
    exp1: Expression;
    exp2: Expression;
}

export class Disjunction implements Expression {
// exp1 orelse exp2
    exp1: Expression;
    exp2: Expression;
}

export class HandleException implements Expression {
// exp handle match
    exp: Expression;
    match: Match;
}

export class RaiseException implements Expression {
// raise exp
    exp: Expression;
}

export class Conditional implements Expression {
// if exp1 then exp2 else exp3
    exp1: Expression;
    exp2: Expression;
    exp3: Expression;
}

export class Iteration implements Expression {
// while exp1 do exp2
    exp1: Expression;
    exp2: Expression;
}

export class CaseAnalysis implements Expression {
// case exp of match
    exp: Expression;
    match: Match;
}

export class Function implements Expression {
// fn match
    match: Match;
}

// AppExp subclasses
export class ApplicationExpression implements AppExp {
// appexp atexp
    appexp: AppExp;
    atExp: AtExp;
}

// AtExp subclasses
export class SpecialConstant implements AtExp {
    scon: any;
}

export class ValueIdentifier implements AtExp {
// op longvid or longvid
    op: 'op' | undefined;
    longvid: any;
}

export class Record implements AtExp {
// { exprow } or { }
    exprow: ExpressionRow | undefined;
}

export class RecordSelector implements AtExp {
// #lab
    lab: any; // Label
}

export class Tuple implements AtExp {
// (exp1, ..., expn), n != 1
    exp: Expression[];
}

export class List implements AtExp {
// [exp1, ..., expn]
    exp: Expression[];
}

export class Sequence implements AtExp {
// (exp1; ...; expn), n >= 2
    exp: Expression[];
}

export class LocalDeclaration implements AtExp {
// let dec in exp1; ...; expn end
    dec: any; // TODO Declaration;
    exp: Expression[];
}
