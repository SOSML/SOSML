import { Type } from './types';
import { Value, ReferenceValue } from './values';
import { Token, LongIdentifierToken } from './tokens';
import { InternalInterpreterError } from './errors';

export enum IdentifierStatus {
    VALUE_VARIABLE,
    VALUE_CONSTRUCTOR,
    EXCEPTION_CONSTRUCTOR
}

// maps id to [Value, rebindable, intermediate]
type DynamicValueEnvironment = { [name: string]: [Value, IdentifierStatus] };
// maps id to [type, intermediate]
type StaticValueEnvironment = { [name: string]: [Type, IdentifierStatus] | undefined };

export class TypeInformation {
    // Every constructor also appears in the value environment,
    // thus it suffices to record their names here.
    constructor(public type: Type, public constructors: string[],
                public arity: number, public allowsEquality: boolean = true) { }
}

// maps type name to constructor names
type DynamicTypeEnvironment = { [name: string]: string[] };
// maps type name to (Type, constructor name)
type StaticTypeEnvironment = { [name: string]: TypeInformation };

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

    getValue(name: string): [Value, IdentifierStatus] | undefined {
        return this.valueEnvironment[name];
    }

    getType(name: string): string[] | undefined {
        return this.typeEnvironment[name];
    }

    setValue(name: string, value: Value, is: IdentifierStatus): void {
        this.valueEnvironment[name] = [value, is];
    }

    setType(name: string, type: string[]) {
        this.typeEnvironment[name] = type;
    }
}

export class StaticBasis {
    constructor(public typeEnvironment: StaticTypeEnvironment,
                public valueEnvironment: StaticValueEnvironment) {
    }

    getValue(name: string): [Type, IdentifierStatus] | undefined {
        return this.valueEnvironment[name];
    }

    getType(name: string): TypeInformation | undefined {
        return this.typeEnvironment[name];
    }

    setValue(name: string, value: Type, is: IdentifierStatus): void {
        this.valueEnvironment[name] = [value, is];
    }

    deleteValue(name: string): void {
        this.valueEnvironment[name] = undefined;
    }

    setType(name: string, type: Type, constructors: string[], arity: number) {
        this.typeEnvironment[name] = new TypeInformation(type, constructors, arity);
    }
}

export type Memory = [number, {[address: number]: Value}];

export class State {
    static allowsRebind(name: string): boolean {
        return {
            'true': false,
            'false': false,
            'nil': false,
            '::': false,

            '=': false,

            'ref': false,
            ':=': false,
            '!': false
        }[name] === undefined;
    }

    // The states' ids are non-decreasing; a single declaration uses the same ids
    constructor(public id: number,
                public parent: State | undefined,
                public staticBasis: StaticBasis,
                public dynamicBasis: DynamicBasis,
                public memory: Memory,
                private infixEnvironment: InfixEnvironment = {},
                private valueIdentifierId: { [name: string]: number } = {},
                private declaredIdentifiers: Set<string> = new Set<string>()) {
    }

    getDefinedIdentifiers(idLimit: number = 0): Set<string> {
        let rec = new Set<string>();
        if (this.parent !== undefined && this.parent.id >= idLimit) {
            rec = this.parent.getDefinedIdentifiers();
        }

        this.declaredIdentifiers.forEach((val: string) => {
            rec.add(val);
        });

        return rec;
    }

    getMemoryChanges(stopId: number): [number, Value][] {
        if (this.id === stopId) {
            return [];
        }
        let res: [number, Value][] = [];

        if (this.parent !== undefined) {
            res = this.parent.getMemoryChanges(stopId);
        }

        for (let i in this.memory[1]) {
            if (this.memory[1].hasOwnProperty(i)) {
                res.push([+i, this.memory[1][i]]);
            }
        }
        return res;
    }

    getNestedState(newId: number|undefined = undefined) {
        if (newId === undefined) {
            newId = this.id + 1;
        }
        let res = new State(<number> newId, this,
            new StaticBasis({}, {}),
            new DynamicBasis({}, {}),
            [this.memory[0], {}]);
        return res;
    }

    getCell(address: number): Value | undefined {
        if (this.memory[1][address] !== undefined) {
            return this.memory[1][address];
        } else if (this.parent === undefined) {
            return undefined;
        } else {
            return (<State> this.parent).getCell(address);
        }
    }

    // Gets an identifier's type. The value  intermediate  determines whether to return intermediate results
    getStaticValue(name: string, idLimit: number = 0): [Type, IdentifierStatus] | undefined {
        let result = this.staticBasis.getValue(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            if (result !== undefined) {
                return [result[0], result[1]];
            }
            return result;
        } else {
            return this.parent.getStaticValue(name, idLimit);
        }
    }

    getStaticType(name: string, idLimit: number = 0): TypeInformation | undefined {
        let result = this.staticBasis.getType(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getStaticType(name, idLimit);
        }
    }

    getDynamicValue(name: string, idLimit: number = 0): [Value, IdentifierStatus] | undefined {
        let result = this.dynamicBasis.getValue(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            if (result !== undefined) {
                return [result[0], result[1]];
            }
            return result;
        } else {
            return this.parent.getDynamicValue(name, idLimit);
        }
    }

    getDynamicType(name: string, idLimit: number = 0): string[] | undefined {
        let result = this.dynamicBasis.getType(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            if (result !== undefined) {
                return [result[0], result[1]];
            }
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

    getValueIdentifierId(name: string, idLimit: number = 0): number {
        if (this.valueIdentifierId.hasOwnProperty(name)) {
            return this.valueIdentifierId[name];
        } else if (!this.parent || this.parent.id < idLimit) {
            return 0;
        } else {
            return this.parent.getValueIdentifierId(name, idLimit);
        }
    }

    incrementValueIdentifierId(name: string, atId: number|undefined = undefined): void {
        if (atId === undefined || this.id === atId) {
            this.valueIdentifierId[name] = this.getValueIdentifierId(name, atId) + 1;
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.incrementValueIdentifierId(name, atId);
        }
    }

    setCell(address: number, value: Value) {
        if (address >= this.memory[0]) {
            this.memory[0] = address + 1;
        }
        this.memory[1][address] = value;
    }

    setNewCell(value: Value): ReferenceValue {
        this.memory[1][this.memory[0]] = value;
        return new ReferenceValue(this.memory[0]++);
    }

    deleteStaticValue(name: string) {
        this.staticBasis.deleteValue(name);
        if (this.parent !== undefined) {
            (<State> this.parent).deleteStaticValue(name);
        }
    }

   setStaticValue(name: string, type: Type, is: IdentifierStatus, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setValue(name, type, is);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            (<State> this.parent).setStaticValue(name, type, is, atId);
        }
    }

    setStaticType(name: string, type: Type, constructors: string[], arity: number,
                  atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setType(name, type, constructors, arity);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            (<State> this.parent).setStaticType(name, type, constructors, arity, atId);
        }
    }

    setDynamicValue(name: string, value: Value, is: IdentifierStatus, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setValue(name, value, is);
            this.declaredIdentifiers.add(name);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicValue(name, value, is, atId);
        }
    }

    setDynamicType(name: string, constructors: string[], atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setType(name, constructors);
            this.declaredIdentifiers.add(name);
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
