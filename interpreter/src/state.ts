// TODO This is still far from unfinished
// TODO set method for working properly with environments
// TODO set types
//
// TODO Remove stuff not needed for our subset of SML

import { Type } from './types';
import { Value } from './values';
import { Token, IdentifierToken, LongIdentifierToken } from './lexer';
import { InternalInterpreterError } from './errors';
import { _getInitialState } from './initialState';

// ???
export enum IdentifierStatus {
    Constructor,    // Used for evaluating closed stuff, i.e. constructors
    Predefined,     // Used for predefined functions that need to be evaluated differently
    Exception,      // Used to construct exceptions which are different from Constructors
    Value,          // Used for computed values
}

export class ValueInformation {
    constructor(public type: Type[],
                public value: Value | undefined,
                public identifierStatus: IdentifierStatus) { }
}

// maps identifiers to type, value, etc.
type ValueEnvironment = { [name: string]: ValueInformation };

export class TypeInformation {
    // Every constructor also appears in the value environment,
    // thus it suffices to record their names here.
    constructor(public type: Type, public constructors: string[]) { }
}

// maps constructors to arguments and type
type TypeEnvironment = { [name: string]: TypeInformation };

export class Environment {
    // TODO structEnvironment
    constructor(public /*private*/ structEnvironment: any,
                private typeEnvironment: TypeEnvironment,
                private valueEnvironment: ValueEnvironment ) {

    }

    getValue(name: string): ValueInformation | undefined {
        return this.valueEnvironment[name];
    }

    setValue(name: string, type: Type, value: Value | undefined = undefined,
             idStatus: IdentifierStatus = IdentifierStatus.Predefined) {
        this.valueEnvironment[name]
            = new ValueInformation([type], value, idStatus);
    }

    updateValue(name: string, value: Value,
                idStatus: IdentifierStatus = IdentifierStatus.Predefined) {
        if (this.valueEnvironment[name] !== undefined) {
            this.valueEnvironment[name].value = value;
            this.valueEnvironment[name].identifierStatus = idStatus;
        } else {
            this.valueEnvironment[name] = new ValueInformation([], value, idStatus);
        }
    }

    setType(name: string, type: Type, constructors: string[]) {
        this.typeEnvironment[name] = new TypeInformation(type, constructors);
    }

    getType(name: string): TypeInformation {
        return this.typeEnvironment[name];
    }
}


// Maps type name to (arity, allows Equality)
type TypeNames = { [name: string]: [number, boolean] };

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

    getValue(name: string): ValueInformation | undefined {
        let result: ValueInformation | undefined;
        result = this.environment.getValue(name);
        if (result !== undefined || !this.parent) {
            return result;
        } else {
            return this.parent.getValue(name);
        }
    }

    getTypeInformation(name: string): TypeInformation | undefined {
        let result: TypeInformation | undefined;
        result = this.environment.getType(name);
        if (result !== undefined || !this.parent) {
            return result;
        } else {
            return this.parent.getTypeInformation(name);
        }
    }

    getInfixStatus(id: Token): InfixStatus {
        if (id instanceof IdentifierToken
            || id instanceof LongIdentifierToken ) {
            if (this.infixEnvironment.hasOwnProperty(id.getText()) || !this.parent) {
                return this.infixEnvironment[id.getText()];
            } else {
                return this.parent.getInfixStatus(id);
            }
        } else {
            throw new InternalInterpreterError(id.position,
                'You gave me some "' + id.getText() + '" (' + id.constructor.name
                + ') but I only want (Long)IdentifierToken.');
        }
    }

    getPrimitiveType(name: string): [number, boolean] {
        if (this.typeNames.hasOwnProperty(name) || !this.parent) {
            return this.typeNames[name];
        } else {
            return this.parent.getPrimitiveType(name);
        }
    }

    updateValue(name: string, value: Value,
                idStatus: IdentifierStatus = IdentifierStatus.Predefined) {
        this.environment.updateValue(name, value, idStatus);
    }

    setValue(name: string, type: Type,
             value: Value | undefined = undefined,
             idStatus: IdentifierStatus = IdentifierStatus.Predefined) {
        this.environment.setValue(name, type, value, idStatus);
    }

    setTypeInformation(name: string, type: Type, constructors: string[]) {
        this.environment.setType(name, type, constructors);
    }

    setInfixStatus(id: Token, precedence: number,
                   rightAssociative: boolean, infix: boolean): void {
        if (id instanceof IdentifierToken
            || id instanceof LongIdentifierToken) {
            this.infixEnvironment[id.getText()]
                = new InfixStatus(infix, precedence, rightAssociative);
        }
    }
}

export function getInitialState() {
    return _getInitialState();
}
