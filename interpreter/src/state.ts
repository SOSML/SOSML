// TODO This is still far from unfinished
// TODO Add method for working properly with environments
// TODO Add types
//
// TODO Remove stuff not needed for our subset of SML

import { Type } from './types';
import { IdentifierToken } from './lexer';

export enum IdentifierStatus {
    CONSTANT,
    VALUE,
    EXCEPTION
}

export class IdentifierInformation {
    type: Type;
    identifierStatus: IdentifierStatus;
    precedence: number;
    rightAssociative: boolean;
    infix: boolean;
}

export interface ValueEnvironment {
    // maps value identifiers to (type scheme, identifier status)
    [name: string]: IdentifierInformation;
}

export class ConstructorInformation {
    type: Type;
    identifierStatus: IdentifierStatus;
}

export interface ConstructorSet {
    [name: string]: ConstructorInformation;
}

export class TypeDefinition {
    type: Type;
    constructors: ConstructorSet;
}

export interface TypeEnvironment {
    // maps type name to (type, [constructor])
    [name: string]: TypeDefinition;
}

export class Environment {
    structEnvironment:  any; // TODO
    typeEnvironment: TypeEnvironment;
    valueEnvironment: ValueEnvironment;
}

export class TypeName {
    name: string;
    arity: number;
    allowsEquality: boolean;
}

export class State {
    typeNames:              TypeName[];         // Type names
    functorEnvironment:     any;         // Functor environment TODO
    signatureEnvironment:   any;         // Signature environment TODO
    environment:            Environment;

    getIdentifierInformation(id: IdentifierToken): IdentifierInformation {
        return this.environment.valueEnvironment[id.text];
    }
}
