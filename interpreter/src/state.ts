import { Type, PrimitiveType } from './types';
import { Value, StringValue } from './values';
import { Token, LongIdentifierToken } from './lexer';
import { InternalInterpreterError } from './errors';

// maps id to Value
type DynamicValueEnvironment = { [name: string]: Value };
// maps id to type (multiple if overloaded)
type StaticValueEnvironment = { [name: string]: Type[] };

export class TypeInformation {
    // Every constructor also appears in the value environment,
    // thus it suffices to record their names here.
    constructor(public type: Type, public constructors: string[]) { }
}

// maps type name to constructor names
type DynamicTypeEnvironment = { [name: string]: string[] };
// maps type name to (Type, constructor name)
type StaticTypeEnvironment = { [name: string]: TypeInformation };

export class TypeNameInformation {
    constructor(public arity: number,
                public allowsEquality: boolean) {
    }
}

// Maps type name to (arity, allows Equality)
type TypeNames = { [name: string]: TypeNameInformation };

export class InfixStatus {
    constructor(public infix: boolean,
                public precedence: number = 0,
                public rightAssociative: boolean = false) {}
}

type InfixEnvironment = { [name: string]: InfixStatus };

export class DynamicBasis {
    constructor(public typeEnvironment: DynamicTypeEnvironment,
                public valueEnvironment: DynamicValueEnvironment) {
    }

    getValue(name: string): Value | undefined {
        return this.valueEnvironment[name];
    }

    getType(name: string): string[] | undefined {
        return this.typeEnvironment[name];
    }

    setValue(name: string, value: Value): void {
        this.valueEnvironment[name] = value;
    }

    setType(name: string, type: string[]) {
        this.typeEnvironment[name] = type;
    }
}

export class StaticBasis {
    constructor(public typeEnvironment: StaticTypeEnvironment,
                public valueEnvironment: StaticValueEnvironment) {
    }

    getValue(name: string): Type[] | undefined {
        return this.valueEnvironment[name];
    }

    getType(name: string): TypeInformation | undefined {
        return this.typeEnvironment[name];
    }

    setValue(name: string, value: Type): void {
        this.valueEnvironment[name] = [value];
    }

    setType(name: string, type: Type, constructors: string[]) {
        this.typeEnvironment[name] = new TypeInformation(type, constructors);
    }
}

let emptyStdFile: DynamicValueEnvironment = {
    '__stdout': new StringValue(''),
    '__stdin': new StringValue(''),
    '__stderr': new StringValue('')
};
export class State {
    private stdfiles = emptyStdFile;

    constructor(public id: number,
                public parent: State | undefined,
                public staticBasis: StaticBasis,
                public dynamicBasis: DynamicBasis,
                private typeNames: TypeNames,
                private infixEnvironment: InfixEnvironment) {
    }

    getNestedState() {
        return new State(this.id + 1, this,
            new StaticBasis({}, {}),
            new DynamicBasis({}, {}),
            {}, {});
    }

    getStaticValue(name: string, idLimit: number = 0): Type[] | undefined {
        if (this.stdfiles[name] !== undefined) {
            return [new PrimitiveType('string')];
        }
        let result: Type[] | undefined;
        result = this.staticBasis.getValue(name);
        if (result !== undefined || !this.parent || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getStaticValue(name, idLimit);
        }
    }

    getStaticType(name: string, idLimit: number = 0): TypeInformation | undefined {
        let result: TypeInformation | undefined;
        result = this.staticBasis.getType(name);
        if (result !== undefined || !this.parent || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getStaticType(name, idLimit);
        }
    }

    getDynamicValue(name: string, idLimit: number = 0): Value | undefined {
        if (this.stdfiles[name] !== undefined
            && (<StringValue> this.stdfiles[name]).value !== '') {
            return this.stdfiles[name];
        }
        let result: Value | undefined;
        result = this.dynamicBasis.getValue(name);
        if (result !== undefined || !this.parent || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getDynamicValue(name, idLimit);
        }
    }

    getDynamicType(name: string, idLimit: number = 0): string[] | undefined {
        let result: string[] | undefined;
        result = this.dynamicBasis.getType(name);
        if (result !== undefined || !this.parent || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getDynamicType(name, idLimit);
        }
    }

    getInfixStatus(id: Token, idLimit: number = 0): InfixStatus {
        if (id.isVid() || id instanceof LongIdentifierToken ) {
            if (this.infixEnvironment.hasOwnProperty(id.getText()) || !this.parent
                || this.parent.id < idLimit) {
                return this.infixEnvironment[id.getText()];
            } else {
                return this.parent.getInfixStatus(id, idLimit);
            }
        } else {
            throw new InternalInterpreterError(id.position,
                'You gave me some "' + id.getText() + '" (' + id.constructor.name
                + ') but I only want (Long)IdentifierToken.');
        }
    }

    getPrimitiveType(name: string, idLimit: number = 0): TypeNameInformation {
        if (this.typeNames.hasOwnProperty(name) || !this.parent || this.parent.id < idLimit) {
            return this.typeNames[name];
        } else {
            return this.parent.getPrimitiveType(name, idLimit);
        }
    }

    setStaticValue(name: string, type: Type, atId: number|undefined = undefined) {
        if (this.stdfiles[name] !== undefined) {
            return;
        }
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setValue(name, type);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            (<State> this.parent).setStaticValue(name, type, atId);
        }
    }

    setStaticType(name: string, type: Type,
                  constructors: string[],
                  atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setType(name, type, constructors);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            (<State> this.parent).setStaticType(name, type, constructors, atId);
        }
    }

    setDynamicValue(name: string, value: Value, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            if (this.stdfiles[name] !== undefined) {
                if (value instanceof StringValue) {
                    this.stdfiles[name] = (<StringValue> this.stdfiles[name]).concat(value);
                    return;
                } else {
                    throw new InternalInterpreterError(-1, 'Wrong type.');
                }
            }
            this.dynamicBasis.setValue(name, value);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicValue(name, value, atId);
        }
    }

    setDynamicType(name: string,
                   constructors: string[],
                   atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setType(name, constructors);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicType(name, constructors, atId);
        }
    }


    setInfixStatus(id: Token, precedence: number,
                   rightAssociative: boolean,
                   infix: boolean,
                   atId: number|undefined = undefined): void {
        if (atId === undefined || atId === this.id) {
            if (id.isVid() || id instanceof LongIdentifierToken) {
                this.infixEnvironment[id.getText()]
                    = new InfixStatus(infix, precedence, rightAssociative);
            }
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setInfixStatus(id, precedence, rightAssociative, infix, atId);
        }
    }
}
