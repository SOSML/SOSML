// TODO This is still far from unfinished
// TODO Add method for working properly with environments
// TODO Add types
//
// TODO Remove stuff not needed for our subset of SML

import { FunctionType, PrimitiveType, PrimitiveTypes, TupleType, Type } from './types';
import { IdentifierToken, Token, LongIdentifierToken } from './lexer';
import { InternalInterpreterError } from './errors';
import { Value } from './values';

// ???
export enum IdentifierStatus {
    CONSTRUCTOR,
    VALUE,
    EXCEPTION
}

export class IdentifierInformation {
    constructor(public type: Type,
                public value: Value | undefined = undefined,
                public identifierStatus: IdentifierStatus = IdentifierStatus.VALUE) {} // move to Value?
}

export class ConstructorInformation {
    type: Type;
    arguments: Type[];
    identifierStatus: IdentifierStatus = IdentifierStatus.CONSTRUCTOR; // move to Value?
}

type TypeEnvironment = { [name: string]: ConstructorInformation }; // maps constructors to arguments and type
type ValueEnvironment = { [name: string]: IdentifierInformation }; // maps identifiers to type, value, etc.

export class Environment {
    // TODO structEnvironment
    constructor(public structEnvironment: any, public typeEnvironment: TypeEnvironment,
                public valueEnvironment: ValueEnvironment ) {

    }

    // TODO: structures?
    lookup(name: string): IdentifierInformation | ConstructorInformation | undefined {
        if (this.typeEnvironment.hasOwnProperty(name)) {
            return this.typeEnvironment[name];
        } else {
            return this.valueEnvironment[name];
        }
    }
}


type TypeNames = { [name: string]: Type };

export class InfixStatus {
    constructor(public infix: boolean, public precedence: number = 0, public rightAssociative: boolean = false) {}
}

type InfixEnvironment = { [name: string]: InfixStatus };

export class State {
    constructor(public parent: State | undefined, public typeNames: TypeNames, public functorEnvironment: any,
                public signatureEnvironment: any, public environment: Environment,
                public infixEnvironment: InfixEnvironment) {
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

    getNestedState() {
        return new State(this, {}, {}, {} , new Environment({}, {}, {}), {});
    }

    // looks up values, constructors (and structures?)
    lookupValue(name: string): IdentifierInformation | ConstructorInformation | undefined {
        let result: IdentifierInformation | ConstructorInformation | undefined;
        result = this.environment.lookup(name);
        if (result !== undefined || !this.parent) {
            return result;
        } else {
            return this.parent.lookupValue(name);
        }
    }

    lookupInfixStatus(name: string): InfixStatus {
        if (this.infixEnvironment.hasOwnProperty(name) || !this.parent) {
            return this.infixEnvironment[name];
        } else {
            return this.parent.lookupInfixStatus(name);
        }
    }

    lookupType(name: string): Type | undefined {
        if (this.typeNames.hasOwnProperty(name) || !this.parent) {
            return this.typeNames[name];
        } else {
            return this.parent.lookupType(name);
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

// TODO: very incomplet
let initialState: State = new State(
    undefined,
    {},
    undefined,
    undefined,
    new Environment(
        undefined,
        {},
        {
            'div': new IdentifierInformation(wordIntFunction),
            'mod': new IdentifierInformation(wordIntFunction),
            '*': new IdentifierInformation(numFunction),
            '/': new IdentifierInformation(realFunction),

            '+': new IdentifierInformation(numFunction),
            '-': new IdentifierInformation(numFunction),

            '<': new IdentifierInformation(numTxtBoolFunction),
            '>': new IdentifierInformation(numTxtBoolFunction),
            '<=': new IdentifierInformation(numTxtBoolFunction),
            '>=': new IdentifierInformation(numTxtBoolFunction),
        }
    ),
    {
        'div': new InfixStatus(true, 7, false),
        'mod': new InfixStatus(true, 7, false),
        '*': new InfixStatus(true, 7, false),
        '/': new InfixStatus(true, 7, false),

        '+': new InfixStatus(true, 6, false),
        '-': new InfixStatus(true, 6, false),

        '<': new InfixStatus(true, 4, false),
        '>': new InfixStatus(true, 4, false),
        '<=': new InfixStatus(true, 4, false),
        '>=': new InfixStatus(true, 4, false)
    }
);

export function getInitialState(): State {
    return initialState;
}
