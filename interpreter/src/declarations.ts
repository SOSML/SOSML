import { Pattern } from './expressions';
import { Expression } from './expressions';
import { IdentifierToken, Token } from './lexer';
import { Type, TypeVariable } from './types';
// import { ASTNode } from './ast'


export abstract class Declaration /* extends ASTNode */ {
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

export class TypeDeclaration {
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
export class ValueDeclaration implements Declaration {
// val typeVariableSequence valueBinding
    typeVariableSequence: TypeVariable[];
    valueBinding: ValueBinding[];
}

// TODO: derived form
export class FunctionDeclaration implements Declaration {
// fun typeVariableSequence functionValueBinding
    typeVariableSequence: TypeVariable[];
    functionValueBinding: FunctionValueBinding[];
}

// TODO: derived form
export class TypeDeclarationList implements Declaration {
// type typeBinding
    typeBinding: TypeDeclaration[];
}

// TODO: maybe merge with DatatypeBinding? <withtype typeBinding> is a derived form
export class DatatypeDeclaration implements Declaration {
// datatype datatypeBinding <withtype typeBinding>
    datatypeBinding: DatatypeBinding[];
    typeBinding: (TypeDeclaration[]) | undefined;
}

export class DatatypeReplication implements Declaration {
// datatype name -=- datatype oldname
    name: IdentifierToken;
    oldname: Token;
}

export class AbstypeDeclaration implements Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    datatypeBinding: DatatypeBinding[];
    typeBinding: (TypeDeclaration[]) | undefined;
    declaration: Declaration;
}

export class LocalDeclaration implements Declaration {
// local declaration in body end
    declaration: Declaration;
    body: Declaration;
}

export class OpenDeclaration implements Declaration {
// open name_1 ... name_n
    names: Token; // longstrid
}

export class SequentialDeclarations implements Declaration {
// declaration1 <;> declaration2
    declarations: Declaration[];
}

export class InfixLDirective implements Declaration {
// infix <level> name_1 ... name_n
    level: number;
    names: IdentifierToken[];
}

export class InfixRDirective implements Declaration {
// infixr <level> name_1 ... name_n
    level: number;
    names: IdentifierToken[];
}

export class NonfixDirective implements Declaration {
// nonfix name_1 ... name_n
    names: IdentifierToken[];
}
