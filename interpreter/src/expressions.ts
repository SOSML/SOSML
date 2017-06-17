import { Type } from './types';
import { Token, IdentifierToken } from './lexer';
import { Declaration } from './declarations';
import { ASTNode } from './ast';
import { State } from './state';
import { InternalCompilerError } from './errors';
import { Value } from './values';


export abstract class Expression extends ASTNode {
    type: Type;

    checkStaticSemantics(state: State): void {
        this.type = this.computeType(state);
    }

    getType(state: State): Type {
        if (this.type === undefined) { // TODO: is this.type really undefined if we never assign anything?
            throw new InternalCompilerError(this.position, 'didn\'t call checkStaticSemantics before getType');
        }
        return this.type;
    }

    computeType(state: State): Type {
        throw new InternalCompilerError(this.position, 'called computeType on derived form');
    }

    evaluate(state: State): void {
        // TODO: should create a binding for the variable it to this expression value
    }

    getValue(state: State): Value {
        throw new InternalCompilerError(this.position, 'called getValue on derived form');
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = false): string {
        // TODO: move to subclasses
        throw new InternalCompilerError(this.position, 'not yet implemented');
    }

    simplify(): ASTNode {
        // TODO: move to subclasses
        throw new InternalCompilerError(this.position, 'not yet implemented');
    }
}


export interface Pattern {
    matches(state: State, v: Value): boolean;
}

export class Wilcard extends Expression implements Pattern {
    getValue(state: State): Value {
        throw new InternalCompilerError(this.position, 'called getValue on a pattern wildcard');
    }

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}

export class LayeredPattern extends Expression implements Pattern {
// <op> identifier <:type> as pattern
    identifier: IdentifierToken;
    typeAnnotation: Type | undefined;
    pattern: Pattern;

    getValue(state: State): Value {
        throw new InternalCompilerError(this.position, 'called getValue on a pattern');
    }

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}


export class Match extends ASTNode {
// pat => exp or pat => exp | match
    patternType: Type;
    returnType: Type;
    matches: [Pattern,  Expression][];

    checkStaticSemantics(state: State) {
        // TODO
    }

    simplify(): ASTNode {
        // TODO
        throw new InternalCompilerError(this.position, 'not yet implemented');
    }

    prettyPrint(indentation: number = 0, oneLine: boolean = false): string {
        // TODO
        throw new InternalCompilerError(this.position, 'not yet implemented');
    }

    evaluate(state: State): void {
        // TODO: probably remove
        throw new InternalCompilerError(this.position, 'not yet implemented');
    }

    getValue(state: State, matchWith: Value): Value {
        // TODO
        throw new InternalCompilerError(this.position, 'not yet implemented');
    }
}

export class TypedExpression extends Expression implements Pattern {
// expression: type (L)
    expression: Expression;
    typeAnnotation: Type;

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}

export class HandleException extends Expression {
// expression handle match
    expression: Expression;
    match: Match;
}

export class RaiseException extends Expression {
// raise expression
    expression: Expression;
}

export class Lambda extends Expression {
// fn match
    match: Match;
}

export class FunctionApplication extends Expression implements Pattern {
// function argument
    // May represent either a function application or a constructor with an argument
    function: Expression;
    argument: Expression;

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}

export class Constant extends Expression implements Pattern {
    token: Token;

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}

export class ValueIdentifier extends Expression implements Pattern {
// op longvid or longvid
    name: Token;

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}

export class Record extends Expression implements Pattern {
// { lab = exp, ... } or { }
    complete: boolean; // a record(pattern) is incomplete if it ends with '...'
    entries: [Token, Expression][];

    matches(state: State, v: Value): boolean {
        // TODO
        return false;
    }
}

export class LocalDeclaration extends Expression {
// let dec in exp1; ...; expn end
    declaration: Declaration;
    // A sequential expression exp1; ... ; expn is represented as such, despite the potentially missing parentheses
    expressions: Expression;
}


// The following classes are derived forms. They will not be present in the simplified AST and do not implement
// checkSemantics/getType and evaluate.

export class InfixExpression extends Expression implements Pattern {
// leftOperand operator rightOperand
    leftOperand: Expression;
    operator: ValueIdentifier;
    rightOperand: Expression;

    matches(state: State, v: Value): boolean {
        throw new InternalCompilerError(this.position, 'called matches on derived form');
    }
}

export class Conjunction extends Expression {
// leftOperand andalso rightOperand
    leftOperand: Expression;
    rightOperand: Expression;
}

export class Disjunction extends Expression {
// leftOperand orelse rightOperand
    leftOperand: Expression;
    rightOperand: Expression;
}

export class Tuple extends Expression implements Pattern {
// (exp1, ..., expn), n != 1
    expressions: Expression[];

    matches(state: State, v: Value): boolean {
        throw new InternalCompilerError(this.position, 'called matches on derived form');
    }
}

export class List extends Expression implements Pattern {
// [exp1, ..., expn]
    expressions: Expression[];

    matches(state: State, v: Value): boolean {
        throw new InternalCompilerError(this.position, 'called matches on derived form');
    }
}

export class Sequence extends Expression {
// (exp1; ...; expn), n >= 2
    expressions: Expression[];
}

export class RecordSelector extends Expression {
// #label record
    label: Token;
}

export class CaseAnalysis extends Expression {
// case expression of match
    expression: Expression;
    match: Match;
}

export class Conditional extends Expression {
// if condition then ifTrue else ifFalse
    condition: Expression;
    ifTrue: Expression;
    ifFalse: Expression;
}
