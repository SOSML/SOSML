import { Pattern } from './expressions';
import { Expression } from './expressions';
import { IdentifierToken, Token } from './lexer';
import { Type, TypeVariable } from './types';
import { State } from './state';
import { InternalInterpreterError } from './errors';
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
}

export class ExceptionDeclaration extends Declaration {
}

export class ValueBinding {
// <rec> pattern = expression
    isRecursive: boolean;
    pattern: Pattern;
    expression: Expression;
}

// TODO: derived form
export class FunctionValueBinding {
    name: IdentifierToken;
    parameters: Pattern[][];
    type: Type | undefined;
    bodies: Expression[];
}

export class TypeBinding {
// typeVariableSequence name = type
    typeVariableSequence: TypeVariable[];
    name: IdentifierToken;
    type: Type;
}

export class DatatypeBinding {
// typeVariableSequence name = <op> constructor <of type>
    typeVariableSequence: TypeVariable[];
    name: IdentifierToken;
    // type: [constructorName, <type>]
    type: [IdentifierToken, Type | undefined][];
}

export class DirectExceptionBinding extends ExceptionDeclaration {
// <op> name <of type>
    name: IdentifierToken;
    type: Type | undefined;
}

export class ExceptionAlias extends ExceptionDeclaration {
// <op> name = <op> oldname
    name: IdentifierToken;
    oldname: Token;
}

// Declaration subclasses
export class ValueDeclaration extends Declaration {
// val typeVariableSequence valueBinding
    typeVariableSequence: TypeVariable[];
    valueBinding: ValueBinding[];
}

// TODO: derived form
export class FunctionDeclaration extends Declaration {
// fun typeVariableSequence functionValueBinding
    typeVariableSequence: TypeVariable[];
    functionValueBinding: FunctionValueBinding[];
}

// TODO: derived form
export class TypeDeclaration extends Declaration {
// type typeBinding
    typeBinding: TypeBinding[];
}

// TODO: maybe merge with DatatypeBinding? <withtype typeBinding> is a derived form
export class DatatypeDeclaration extends Declaration {
// datatype datatypeBinding <withtype typeBinding>
    datatypeBinding: DatatypeBinding[];
    typeBinding: (TypeBinding[]) | undefined;
}

export class DatatypeReplication extends Declaration {
// datatype name -=- datatype oldname
    name: IdentifierToken;
    oldname: Token;
}

export class AbstypeDeclaration extends Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    datatypeBinding: DatatypeBinding[];
    typeBinding: (TypeBinding[]) | undefined;
    declaration: Declaration;
}

export class LocalDeclaration extends Declaration {
// local declaration in body end
    declaration: Declaration;
    body: Declaration;
}

export class OpenDeclaration extends Declaration {
// open name_1 ... name_n
    names: Token; // longstrid
}

export class SequentialDeclarations extends Declaration {
// declaration1 <;> declaration2
    declarations: Declaration[];
}

export class InfixLDirective extends Declaration {
// infix <level> name_1 ... name_n
    level: number;
    names: IdentifierToken[];
}

export class InfixRDirective extends Declaration {
// infixr <level> name_1 ... name_n
    level: number;
    names: IdentifierToken[];
}

export class NonfixDirective extends Declaration {
// nonfix name_1 ... name_n
    names: IdentifierToken[];
}
