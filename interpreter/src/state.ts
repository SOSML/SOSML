// TODO This is still far from unfinished
// TODO Add method for working properly with environments
// TODO Add types
//
// TODO Remove stuff not needed for our subset of SML

import { FunctionType, PrimitiveType, PrimitiveTypes, TupleType, Type } from './types';
import { Value } from './values';
import { Token, LongIdentifierToken } from './lexer';
import { InternalInterpreterError } from './errors';

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
    identifierStatus: IdentifierStatus = IdentifierStatus.CONSTRUCTOR; // move to Value?

    constructor(public type: Type, public args: Type[]) {}
}

type TypeEnvironment = { [name: string]: ConstructorInformation }; // maps constructors to arguments and type
type ValueEnvironment = { [name: string]: IdentifierInformation }; // maps identifiers to type, value, etc.

export class Environment {
    // TODO structEnvironment
    constructor(public /*private*/ structEnvironment: any, private typeEnvironment: TypeEnvironment,
                private valueEnvironment: ValueEnvironment ) {

    }

    // TODO: structures?
    lookup(name: string): IdentifierInformation | ConstructorInformation | undefined {
        if (this.typeEnvironment.hasOwnProperty(name)) {
            return this.typeEnvironment[name];
        } else {
            return this.valueEnvironment[name];
        }
    }

    addValue(name: string, type: Type, value: Value | undefined = undefined) {
        this.valueEnvironment[name] = new IdentifierInformation(type, value);
    }

    addConstructor(name: string, type: Type, args: Type[]) {
        this.typeEnvironment[name] = new ConstructorInformation(type, args);
    }
}


type TypeNames = { [name: string]: Type };

export class InfixStatus {
    constructor(public infix: boolean, public precedence: number = 0, public rightAssociative: boolean = false) {}
}

type InfixEnvironment = { [name: string]: InfixStatus };

export class State {
    constructor(public parent: State | undefined, private typeNames: TypeNames,
                public /*private*/ functorEnvironment: any, public /*private*/ signatureEnvironment: any,
                private environment: Environment, private infixEnvironment: InfixEnvironment) {
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

    addValue(name: string, type: Type, value: Value | undefined = undefined) {
        this.environment.addValue(name, type, value);
    }

    addConstructor(name: string, type: Type, args: Type[]) {
        this.environment.addConstructor(name, type, args);
    }

    lookupInfixStatus(name: string): InfixStatus {
        if (this.infixEnvironment.hasOwnProperty(name) || !this.parent) {
            return this.infixEnvironment[name];
        } else {
            return this.parent.lookupInfixStatus(name);
        }
    }

    getIdentifierInformation(id: Token): InfixStatus {
        if (id.isVid() || id instanceof LongIdentifierToken ) {
            return this.lookupInfixStatus(id.getText());
        } else {
            throw new InternalInterpreterError(id.position,
                'You gave me some "' + id.getText() + '" (' + id.constructor.name
                + ') but I only want (Long)IdentifierToken.');
        }
    }

    addIdentifierInformation(id: Token, precedence: number,
                             rightAssociative: boolean, infix: boolean): void {
        if (id.isVid() || id instanceof LongIdentifierToken) {
            this.addInfix(id.getText(), infix, precedence, rightAssociative);
        }
    }

    addInfix(name: string, infix: boolean = true, precedence: number = 0, rightAssociative: boolean = false) {
        this.infixEnvironment[name] = new InfixStatus(infix, precedence, rightAssociative);
    }

    lookupType(name: string): Type | undefined {
        if (this.typeNames.hasOwnProperty(name) || !this.parent) {
            return this.typeNames[name];
        } else {
            return this.parent.lookupType(name);
        }
    }

    addType(name: string, type: Type) {
        this.typeNames[name] = type;
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
    return initialState.getNestedState();
}
