import { Pattern } from './expressions';
import { Expression } from './expressions';
import { IdentifierToken, Token } from './lexer';
import { Type, TypeVariable } from './types';
import { State } from './state';
import { InternalInterpreterError, Position } from './errors';
import { ASTNode } from './ast';


export abstract class Declaration extends ASTNode {
    checkStaticSemantics(state: State): void {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    evaluate(state: State): void {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    prettyPrint(indentation: number, oneLine: boolean): string {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    simplify(): ASTNode {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }

    reParse(state: State): ASTNode {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

export interface ExceptionBinding {
}

export class ValueBinding {
// <rec> pattern = expression
    constructor(public position: Position, public isRecursive: boolean,
                public pattern: Pattern, public expression: Expression) {
    }
}

// TODO: derived form
export class FunctionValueBinding {
    constructor(public position: Position,
                public parameters: [Pattern[], Type|undefined, Expression][]) {
    }
}

export class TypeBinding {
// typeVariableSequence name = type
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: Type) {
    }
}

export class DatatypeBinding {
// typeVariableSequence name = <op> constructor <of type>
    // type: [constructorName, <type>]
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: [IdentifierToken, Type | undefined][]) {
    }
}

export class DirectExceptionBinding implements ExceptionBinding {
// <op> name <of type>
    constructor(public position: Position, public name: IdentifierToken, public type: Type | undefined) {
    }
}

export class ExceptionAlias implements ExceptionBinding {
// <op> name = <op> oldname
    constructor(public position: Position, public name: IdentifierToken, public oldname: Token) {
    }
}

export class ExceptionDeclaration extends Declaration {
    constructor(public position: Position, public bindings: ExceptionBinding[]) {
        super();
    }
}

// Declaration subclasses
export class ValueDeclaration extends Declaration {
// val typeVariableSequence valueBinding
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public valueBinding: ValueBinding[]) {
        super();
    }
}

// TODO: derived form
//
// TODO this Declaration needs a second parsing step.
export class FunctionDeclaration extends Declaration {
// fun typeVariableSequence functionValueBinding
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public functionValueBinding: FunctionValueBinding[]) {
        super();
    }
}

// TODO: derived form
export class TypeDeclaration extends Declaration {
// type typeBinding
    constructor(public position: Position, public typeBinding: TypeBinding[]) {
        super();
    }
}

// TODO: maybe merge with DatatypeBinding? <withtype typeBinding> is a derived form
export class DatatypeDeclaration extends Declaration {
// datatype datatypeBinding <withtype typeBinding>
    constructor(public position: Position, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined) {
        super();
    }
}

export class DatatypeReplication extends Declaration {
// datatype name -=- datatype oldname
    constructor(public position: Position, public name: IdentifierToken,
                public oldname: Token) {
        super();
    }
}

export class AbstypeDeclaration extends Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    constructor(public position: Position, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public declaration: Declaration) {
        super();
    }
}

export class LocalDeclaration extends Declaration {
// local declaration in body end
    constructor(public position: Position, public declaration: Declaration, public body: Declaration) {
        super();
    }
}

export class OpenDeclaration extends Declaration {
// open name_1 ... name_n
    constructor(public position: Position, public names: Token[]) {
        super();
    }
}

export class SequentialDeclaration extends Declaration {
// declaration1 <;> declaration2
    constructor(public position: Position, public declarations: Declaration[]) {
        super();
    }
}

export class InfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[],
                public precedence: number = 0) {
        super();
    }
}

export class InfixRDeclaration extends Declaration {
// infixr <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[],
                public precedence: number = 0) {
        super();
    }
}

export class NonfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[]) {
        super();
    }
}

export class EmptyDeclaration extends Declaration {
// exactly what it sais on the tin.
    constructor() {
        super();
    }
}
