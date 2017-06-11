import { Pattern } from './patterns';
import { Expression } from './expressions';
import { IdentifierToken, LongIdentifierToken } from './lexer';
import { Type, TypeVariable } from './types';

// interfaces

export interface Declaration {
}

export interface ExceptionBinding {
}

// classes

export class ValueBinding {
// <rec> pattern = expression
    isRecursive: boolean;
    pattern: Pattern;
    expression: Expression;
}

export class FunctionValueBinding {
    opPrefixed: boolean;
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
    // type: [opPrefixed, constructorName, <type>]
    type: [boolean, IdentifierToken, Type | undefined][];
}

export class DirectExceptionBinding implements ExceptionBinding {
// <op> name <of type>
    opPrefixed: boolean;
    name: IdentifierToken;
    type: Type | undefined;
}

export class LongExceptionBinding implements ExceptionBinding {
// <op> name = <op> oldname
    opPrefixed: boolean;
    name: IdentifierToken;
    oldnameOpPrefixed: boolean;
    oldname: LongIdentifierToken;
}

// Declaration subclasses
export class ValueDeclaration implements Declaration {
// val typeVariableSequence valueBinding
    typeVariableSequence: TypeVariable[];
    valueBinding: ValueBinding[];
}

export class FunctionDeclaration implements Declaration {
// fun typeVariableSequence functionValueBinding
    typeVariableSequence: TypeVariable[];
    functionValueBinding: FunctionValueBinding[];
}

export class TypeDeclaration implements Declaration {
// type typeBinding
    typeBinding: TypeBinding[];
}

export class DatatypeDeclaration implements Declaration {
// datatype datatypeBinding <wtihtype typeBinding>
    datatypeBinding: DatatypeBinding[];
    typeBinding: (TypeBinding[]) | undefined;
}

export class DatatypeReplication implements Declaration {
// datatype name -=- datatype oldname
    name: IdentifierToken;
    oldname: LongIdentifierToken;
}

export class AbstypeDeclaration implements Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    datatypeBinding: DatatypeBinding[];
    typeBinding: (TypeBinding[]) | undefined;
    declaration: Declaration;
}

export class ExceptionDeclaration implements Declaration {
// exception exceptionBinding
    exceptionBinding: ExceptionBinding[];
}

export class LocalDeclaration implements Declaration {
// local declaration in body end
    declaration: Declaration;
    body: Declaration;
}

export class OpenDeclaration implements Declaration {
// open name_1 ... name_n
    names: LongIdentifierToken; // longstrid
}

export class SequentialDaclaration implements Declaration {
// declaration1 <;> declaration2
    declaration1: Declaration;
    declaration2: Declaration;
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
