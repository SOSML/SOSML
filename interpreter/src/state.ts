// TODO This is still far from unfinished
// TODO Add method for working properly with environments
// TODO Add types
//
// TODO Remove stuff not needed for our subset of SML

import { FunctionType, PrimitiveType, PrimitiveTypes, TupleType, Type } from './types';
import { IdentifierToken, Token, LongIdentifierToken } from './lexer';
import { InternalInterpreterError } from './errors.ts';

// ???
export enum IdentifierStatus {
    CONSTANT,
    VALUE,
    EXCEPTION
}

export class IdentifierInformation {
    constructor(
        public type: Type,
        public identifierStatus: IdentifierStatus,
        public precedence: number,
        public rightAssociative: boolean,
        public infix: boolean) {}

    clone(): IdentifierInformation {
        // TODO
        throw new Error('nyi\'an :/');
    }
}

export interface ValueEnvironment {
    // maps value identifiers to (type scheme, identifier status)
    [name: string]: IdentifierInformation;
}

export class ConstructorInformation {
    type: Type;
    identifierStatus: IdentifierStatus;

    clone(): ConstructorInformation {
        // TODO
        throw new Error('nyi\'an :/');
    }
}

export interface ConstructorSet {
    [name: string]: ConstructorInformation;
}

export class TypeDefinition {
    type: Type;
    constructors: ConstructorSet;

    clone(): TypeEnvironment {
        // TODO
        throw new Error('nyi\'an :/');
    }
}

export interface TypeEnvironment {
    // maps type name to (type, [constructor])
    [name: string]: TypeDefinition;
}

export class Environment {
    // TODO structEnvironment
    constructor(public structEnvironment: any, public typeEnvironment: TypeEnvironment,
                public valueEnvironment: ValueEnvironment) {
    }

    clone(): Environment {
        throw new Error('nyi\'an :/');
    }
}

export class TypeName {
    constructor(public name: string, public arity: number, public allowsEquality: boolean) {
    }

    clone(): TypeName {
        return new TypeName(this.name, this.arity, this.allowsEquality);
    }
}

export class State {
    // typeNames:              TypeName[];         // Type names
    // functorEnvironment:     any;         // Functor environment TODO
    // signatureEnvironment:   any;         // Signature environment TODO
    // environment:            Environment;

    constructor(public typeNames: TypeName[], public functorEnvironment: any,
                public signatureEnvironment: any, public environment: Environment) {
    }

    clone(): State {
        let tns: TypeName[] = [];
        for (let i = 0; i < this.typeNames.length; ++i) {
            tns.push(this.typeNames[i].clone());
        }
        return new State(tns, this.functorEnvironment, this.signatureEnvironment,
                         this.environment.clone());
    }

    getIdentifierInformation(id: Token): IdentifierInformation {
        if (id instanceof IdentifierToken) {
            return this.environment.valueEnvironment[id.text];
        } else if (id instanceof LongIdentifierToken) {
            // TODO
            return this.environment.valueEnvironment[id.text];
        } else {
            throw new InternalInterpreterError(id.position, 'Not an identifier');
        }
    }
}


// Initial static basis (see SML Definition, appendix C through E)
// currently (very) incomplete

let int = new PrimitiveType(PrimitiveTypes.int);
let real = new PrimitiveType(PrimitiveTypes.real);
// let word = new PrimitiveType(PrimitiveTypes.word);
// let string = new PrimitiveType(PrimitiveTypes.string);
// let char = new PrimitiveType(PrimitiveTypes.char);
let bool = new PrimitiveType(PrimitiveTypes.bool);

// TODO: overloading is not yet implemented. Change these types once it is.
let wordInt = int;
// let realInt = int;
let num = int;
let numTxt = int;

let wordIntFunction = new FunctionType(new TupleType([wordInt, wordInt]), wordInt);
let numFunction = new FunctionType(new TupleType([num, num]), num);
let realFunction = new FunctionType(new TupleType([real, real]), real);
let numTxtBoolFunction = new FunctionType(new TupleType([numTxt, numTxt]), bool);

let initialState: State = new State(
    [],
    undefined,
    undefined,
    new Environment(
        undefined,
        {},
        {
            'div': new IdentifierInformation(wordIntFunction, IdentifierStatus.VALUE, 7, false, true),
            'mod': new IdentifierInformation(wordIntFunction, IdentifierStatus.VALUE, 7, false, true),
            '*': new IdentifierInformation(numFunction, IdentifierStatus.VALUE, 7, false, true),
            '/': new IdentifierInformation(realFunction, IdentifierStatus.VALUE, 7, false, true),

            '+': new IdentifierInformation(numFunction, IdentifierStatus.VALUE, 6, false, true),
            '-': new IdentifierInformation(numFunction, IdentifierStatus.VALUE, 6, false, true),

            '<': new IdentifierInformation(numTxtBoolFunction, IdentifierStatus.VALUE, 4, false, true),
            '>': new IdentifierInformation(numTxtBoolFunction, IdentifierStatus.VALUE, 4, false, true),
            '<=': new IdentifierInformation(numTxtBoolFunction, IdentifierStatus.VALUE, 4, false, true),
            '>=': new IdentifierInformation(numTxtBoolFunction, IdentifierStatus.VALUE, 4, false, true),
        }
    )
);

export function getInitialState(): State {
    return initialState;
}
