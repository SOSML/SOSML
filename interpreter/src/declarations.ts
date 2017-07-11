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

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): ExceptionDeclaration {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

// Declaration subclasses
export class ValueDeclaration extends Declaration {
// val typeVariableSequence valueBinding
    constructor(public position: Position, public typeVariableSequence: TypeVariable[],
                public valueBinding: ValueBinding[]) {
        super();
    }

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): ValueDeclaration {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
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

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): ASTNode {
        // TODO this stuff here is work, need to check whether the stuff in fvalbind is
        // infixd or not
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

// TODO: derived form
export class TypeDeclaration extends Declaration {
// type typeBinding
    constructor(public position: Position, public typeBinding: TypeBinding[]) {
        super();
    }

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): TypeDeclaration {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

// TODO: maybe merge with DatatypeBinding? <withtype typeBinding> is a derived form
export class DatatypeDeclaration extends Declaration {
// datatype datatypeBinding <withtype typeBinding>
    constructor(public position: Position, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined) {
        super();
    }

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): DatatypeDeclaration {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

export class DatatypeReplication extends Declaration {
// datatype name -=- datatype oldname
    constructor(public position: Position, public name: IdentifierToken,
                public oldname: Token) {
        super();
    }

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): DatatypeReplication {
        return this;
    }
}

export class AbstypeDeclaration extends Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    constructor(public position: Position, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public declaration: Declaration) {
        super();
    }

    simplify(): ASTNode {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
    reParse(state: State): AbstypeDeclaration {
        // TODO
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

export class LocalDeclaration extends Declaration {
// local declaration in body end
    constructor(public position: Position, public declaration: Declaration, public body: Declaration) {
        super();
    }

    simplify(): LocalDeclaration {
        return new LocalDeclaration(this.position, this.declaration.simplify(), this.body.simplify());
    }
    reParse(state: State): LocalDeclaration {
        let nstate = state.clone();
        return new LocalDeclaration(this.position, this.declaration.reParse(nstate), this.body.reParse(nstate));
    }
}

export class OpenDeclaration extends Declaration {
// open name_1 ... name_n
    constructor(public position: Position, public names: Token[]) {
        super();
    }

    simplify(): OpenDeclaration {
        return this;
    }
    reParse(state: State): OpenDeclaration {
        return this;
    }
}

export class SequentialDeclaration extends Declaration {
// declaration1 <;> declaration2
    constructor(public position: Position, public declarations: Declaration[]) {
        super();
    }

    simplify(): SequentialDeclaration {
        let decls: Declaration[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].simplify());
        }
        return new SequentialDeclaration(this.position, decls);
    }
    reParse(state: State): SequentialDeclaration {
        let decls: Declaration[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].reParse(state));
            let decl = this.declarations[i].simplify();
            decl.checkStaticSemantics(state);
            decl.evaluate(state);
        }
        return new SequentialDeclaration(this.position, decls);
    }
}

export class InfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[],
                public precedence: number = 0) {
        super();
    }

    simplify(): InfixDeclaration {
        return this;
    }
    reParse(state: State): InfixDeclaration {
        return this;
    }
}

export class InfixRDeclaration extends Declaration {
// infixr <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[],
                public precedence: number = 0) {
        super();
    }

    simplify(): InfixRDeclaration {
        return this;
    }
    reParse(state: State): InfixRDeclaration {
        return this;
    }
}

export class NonfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: Position, public operators: IdentifierToken[]) {
        super();
    }

    simplify(): NonfixDeclaration {
        return this;
    }
    reParse(state: State): NonfixDeclaration {
        return this;
    }
}

export class EmptyDeclaration extends Declaration {
// exactly what it sais on the tin.
    constructor() {
        super();
    }

    simplify(): EmptyDeclaration {
        return this;
    }
    reParse(state: State): EmptyDeclaration {
        return this;
    }
}
