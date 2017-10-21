import { Type } from './types';
import { Value, ReferenceValue } from './values';
import { Token, IdentifierToken, LongIdentifierToken } from './tokens';
import { Warning, InternalInterpreterError, EvaluationError } from './errors';
import { Structure } from './modules';
import { Expression } from './expressions';

export enum IdentifierStatus {
    VALUE_VARIABLE,
    VALUE_CONSTRUCTOR,
    EXCEPTION_CONSTRUCTOR
}

// maps id to [Value, rebindable, intermediate]
export type DynamicValueEnvironment = { [name: string]: [Value, IdentifierStatus] };

export type DynamicValueInterface = { [name: string]: IdentifierStatus };

// maps id to [type, intermediate]
export type StaticValueEnvironment = { [name: string]: [Type, IdentifierStatus] | undefined };

export class TypeInformation {
    // Every constructor also appears in the value environment,
    // thus it suffices to record their names here.
    constructor(public type: Type, public constructors: string[],
                public arity: number, public allowsEquality: boolean = true) { }
}

// maps type name to constructor names
export type DynamicTypeEnvironment = { [name: string]: string[] };

export type DynamicTypeInterface = { [name: string]: string[] };

// maps type name to (Type, constructor name)
export type StaticTypeEnvironment = { [name: string]: TypeInformation };


export type DynamicStructureEnvironment = { [name: string]: DynamicBasis };

export type DynamicStructureInterface = { [name: string]: DynamicInterface };

export type StaticStructureEnvironment = { [name: string]: StaticBasis };


export type DynamicSignatureEnvironment = { [name: string]: DynamicInterface };

export type StaticSignatureEnvironment = { [name: string]: StaticBasis };


export class DynamicFunctorInformation {
    constructor(public paramName: IdentifierToken, public param: DynamicInterface,
                public body: Expression & Structure, public state: State) {
    }
}

export type DynamicFunctorEnvironment = { [name: string]: DynamicFunctorInformation };

export type StaticFunctorEnvironment = { [name: string]: [StaticBasis, StaticBasis] };


export class DynamicInterface {
    constructor(public typeInterface: DynamicTypeInterface,
                public valueInterface: DynamicValueInterface,
                public structureInterface: DynamicStructureInterface) {
    }

    extend(other: DynamicInterface): DynamicInterface {
        for (let i in other.typeInterface) {
            if (other.typeInterface.hasOwnProperty(i)) {
                this.typeInterface[i] = other.typeInterface[i];
            }
        }
        for (let i in other.valueInterface) {
            if (other.valueInterface.hasOwnProperty(i)) {
                this.valueInterface[i] = other.valueInterface[i];
            }
        }
        for (let i in other.structureInterface) {
            if (other.structureInterface.hasOwnProperty(i)) {
                this.structureInterface[i] = other.structureInterface[i];
            }
        }

        return this;
    }
}

export class InfixStatus {
    constructor(public infix: boolean,
                public precedence: number = 0,
                public rightAssociative: boolean = false) {}
}

export type InfixEnvironment = { [name: string]: InfixStatus };

export class DynamicBasis {
    constructor(public typeEnvironment: DynamicTypeEnvironment,
                public valueEnvironment: DynamicValueEnvironment,
                public structureEnvironment: DynamicStructureEnvironment,
                public signatureEnvironment: DynamicSignatureEnvironment,
                public functorEnvironment: DynamicFunctorEnvironment) {
    }

    getValue(name: string): [Value, IdentifierStatus] | undefined {
        return this.valueEnvironment[name];
    }

    getType(name: string): string[] | undefined {
        return this.typeEnvironment[name];
    }

    getStructure(name: string): DynamicBasis | undefined {
        return this.structureEnvironment[name];
    }

    getSignature(name: string): DynamicInterface | undefined {
        return this.signatureEnvironment[name];
    }

    getFunctor(name: string): DynamicFunctorInformation | undefined {
        return this.functorEnvironment[name];
    }

    setValue(name: string, value: Value, is: IdentifierStatus): void {
        this.valueEnvironment[name] = [value, is];
    }

    setType(name: string, type: string[]) {
        this.typeEnvironment[name] = type;
    }

    setStructure(name: string, structure: DynamicBasis) {
        this.structureEnvironment[name] = structure;
    }

    setSignature(name: string, signature: DynamicInterface) {
        this.signatureEnvironment[name] = signature;
    }

    setFunctor(name: string, functor: DynamicFunctorInformation) {
        this.functorEnvironment[name] = functor;
    }

    extend(other: DynamicBasis): DynamicBasis {
        for (let i in other.typeEnvironment) {
            if (other.typeEnvironment.hasOwnProperty(i)) {
                this.typeEnvironment[i] = other.typeEnvironment[i];
            }
        }
        for (let i in other.valueEnvironment) {
            if (other.valueEnvironment.hasOwnProperty(i)) {
                this.valueEnvironment[i] = other.valueEnvironment[i];
            }
        }
        for (let i in other.structureEnvironment) {
            if (other.structureEnvironment.hasOwnProperty(i)) {
                this.structureEnvironment[i] = other.structureEnvironment[i];
            }
        }
        for (let i in other.signatureEnvironment) {
            if (other.signatureEnvironment.hasOwnProperty(i)) {
                this.signatureEnvironment[i] = other.signatureEnvironment[i];
            }
        }
        for (let i in other.functorEnvironment) {
            if (other.functorEnvironment.hasOwnProperty(i)) {
                this.functorEnvironment[i] = other.functorEnvironment[i];
            }
        }
        return this;
    }

    restrict(sig: DynamicInterface): DynamicBasis {
        let res = new DynamicBasis({}, {}, {}, this.signatureEnvironment, this.functorEnvironment);

        for (let i in sig.typeInterface) {
            if (sig.typeInterface.hasOwnProperty(i)
                && this.typeEnvironment.hasOwnProperty(i)) {
                let tmp = new Set<string>();
                let ntp: string[] = [];
                for (let j = 0; j < this.typeEnvironment[i].length; ++j) {
                    tmp = tmp.add(this.typeEnvironment[i][j]);
                }
                for (let j = 0; j < sig.typeInterface[i].length; ++j) {
                    if (tmp.has(sig.typeInterface[i][j])) {
                        ntp.push(sig.typeInterface[i][j]);
                    }
                }
                res.typeEnvironment[i] = ntp;
            }
        }

        for (let i in sig.valueInterface) {
            if (sig.valueInterface.hasOwnProperty(i)
                && this.valueEnvironment.hasOwnProperty(i)) {
                res.valueEnvironment[i] = [this.valueEnvironment[i][0], sig.valueInterface[i]];
            }
        }

        for (let i in sig.structureInterface) {
            if (sig.structureInterface.hasOwnProperty(i)
                && this.structureEnvironment.hasOwnProperty(i)) {
                res.structureEnvironment[i]
                    = this.structureEnvironment[i].restrict(sig.structureInterface[i]);
            }
        }

        return res;
    }
}

export class StaticBasis {
    constructor(public typeEnvironment: StaticTypeEnvironment,
                public valueEnvironment: StaticValueEnvironment,
                public structureEnvironment: StaticStructureEnvironment,
                public signatureEnvironment: StaticSignatureEnvironment,
                public functorEnvironment: StaticFunctorEnvironment) {
    }

    getValue(name: string): [Type, IdentifierStatus] | undefined {
        return this.valueEnvironment[name];
    }

    getType(name: string): TypeInformation | undefined {
        return this.typeEnvironment[name];
    }

    getStructure(name: string): StaticBasis | undefined {
        return this.structureEnvironment[name];
    }

    getSignature(name: string): StaticBasis | undefined {
        return this.signatureEnvironment[name];
    }

    getFunctor(name: string): [StaticBasis, StaticBasis] | undefined {
        return this.functorEnvironment[name];
    }


    setValue(name: string, value: Type, is: IdentifierStatus): void {
        this.valueEnvironment[name] = [value, is];
    }

    deleteValue(name: string): void {
        this.valueEnvironment[name] = undefined;
    }

    setType(name: string, type: Type, constructors: string[], arity: number, admitsEquality: boolean = false) {
        this.typeEnvironment[name] = new TypeInformation(type, constructors, arity, admitsEquality);
    }

    setStructure(name: string, structure: StaticBasis) {
        this.structureEnvironment[name] = structure;
    }

    setSignature(name: string, signature: StaticBasis) {
        this.signatureEnvironment[name] = signature;
    }

    setFunctor(name: string, functor: [StaticBasis, StaticBasis]) {
        this.functorEnvironment[name] = functor;
    }

    extend(other: StaticBasis): StaticBasis {
        for (let i in other.typeEnvironment) {
            if (other.typeEnvironment.hasOwnProperty(i)) {
                this.typeEnvironment[i] = other.typeEnvironment[i];
            }
        }
        for (let i in other.valueEnvironment) {
            if (other.valueEnvironment.hasOwnProperty(i)) {
                this.valueEnvironment[i] = other.valueEnvironment[i];
            }
        }
        for (let i in other.structureEnvironment) {
            if (other.structureEnvironment.hasOwnProperty(i)) {
                this.structureEnvironment[i] = other.structureEnvironment[i];
            }
        }
        for (let i in other.signatureEnvironment) {
            if (other.signatureEnvironment.hasOwnProperty(i)) {
                this.signatureEnvironment[i] = other.signatureEnvironment[i];
            }
        }
        for (let i in other.functorEnvironment) {
            if (other.functorEnvironment.hasOwnProperty(i)) {
                this.functorEnvironment[i] = other.functorEnvironment[i];
            }
        }
        return this;
    }
}

export type Memory = [number, {[address: number]: Value}];
export type FreeTypeVariableInformation = [number, Map<string, [Type, boolean]>];

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
                public freeTypeVariables: FreeTypeVariableInformation
                    = [0, new Map<string, [Type, boolean]>()],
                private infixEnvironment: InfixEnvironment = {},
                public valueIdentifierId: { [name: string]: number } = {},
                public warns: Warning[] = [],
                public insideLocalDeclBody: boolean = false,
                public localDeclStart: boolean = false) {
    }

    getIdChanges(stopId: number): { [name: string]: number } {
        if (this.id <= stopId) {
            return {};
        }
        let res: { [name: string]: number } = {};

        if (this.parent !== undefined) {
            res = this.parent.getIdChanges(stopId);
        }

        for (let i in this.valueIdentifierId) {
            if (this.valueIdentifierId.hasOwnProperty(i)) {
                res[i] = this.valueIdentifierId[i];
            }
        }
        return res;
   }

   getMemoryChanges(stopId: number): [number, Value][] {
        if (this.id <= stopId) {
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

    getDynamicChanges(stopId: number): DynamicBasis {
        if (this.id <= stopId) {
            return new DynamicBasis({}, {}, {}, {}, {});
        }
        let res = new DynamicBasis({}, {}, {}, {}, {});

        if (this.parent !== undefined) {
            res = this.parent.getDynamicChanges(stopId);
        }

        res = res.extend(this.dynamicBasis);
        return res;
    }

    getDynamicLocalDeclChanges(stopId: number): DynamicBasis {
        if (this.id <= stopId || this.localDeclStart) {
            return new DynamicBasis({}, {}, {}, {}, {});
        }
        let res = new DynamicBasis({}, {}, {}, {}, {});

        if (this.parent !== undefined) {
            res = this.parent.getDynamicLocalDeclChanges(stopId);
        }

        res = res.extend(this.dynamicBasis);
        return res;
    }

    getStaticChanges(stopId: number): StaticBasis {
        if (this.id <= stopId) {
            return new StaticBasis({}, {}, {}, {}, {});
        }
        let res = new StaticBasis({}, {}, {}, {}, {});

        if (this.parent !== undefined) {
            res = this.parent.getStaticChanges(stopId);
        }

        res = res.extend(this.staticBasis);
        return res;
    }


    getNestedState(newId: number|undefined = undefined) {
        if (newId === undefined) {
            newId = this.id + 1;
        }
        let res = new State(<number> newId, this,
            new StaticBasis({}, {}, {}, {}, {}),
            new DynamicBasis({}, {}, {}, {}, {}),
            [this.memory[0], {}],
            [this.freeTypeVariables[0], new Map<string, [Type, boolean]>()]);
        res.insideLocalDeclBody = this.insideLocalDeclBody;
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

    getTypeVariableBinds(idLimit: number = 0): FreeTypeVariableInformation {
        let result = this.freeTypeVariables;
        if (this.parent === undefined || this.parent.id < idLimit) {
            let ret = new Map<string, [Type, boolean]>();
            result[1].forEach((val: [Type, boolean], key: string) => {
                ret.set(key, val);
            });

            return [result[0], ret];
        } else {
            let tmp = this.parent.getTypeVariableBinds(idLimit);
            result[1].forEach((val: [Type, boolean], key: string) => {
                tmp[1].set(key, val);
            });
            return [Math.max(result[0], tmp[0]), tmp[1]];
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

    getStaticStructure(name: string, idLimit: number = 0): StaticBasis | undefined {
        let result = this.staticBasis.getStructure(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getStaticStructure(name, idLimit);
        }
    }

    getAndResolveStaticStructure(name: LongIdentifierToken, idLimit: number = 0): StaticBasis | undefined {
        let res: StaticBasis | undefined = undefined;
        if (name.qualifiers.length === 0) {
            throw new EvaluationError(name.position,
                'Unqualified LongIdentifierToken are too unqualified to be useful here.');
        } else {
            res = this.getStaticStructure(name.qualifiers[0].getText(), idLimit);
        }

        for (let i = 1; i < name.qualifiers.length; ++i) {
            if (res === undefined) {
                return res;
            }
            res = res.getStructure(name.qualifiers[i].getText());
        }

        return res;
    }

    getStaticSignature(name: string, idLimit: number = 0): StaticBasis | undefined {
        let result = this.staticBasis.getSignature(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getStaticSignature(name, idLimit);
        }
    }

    getStaticFunctor(name: string, idLimit: number = 0): [StaticBasis, StaticBasis] | undefined {
        let result = this.staticBasis.getFunctor(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getStaticFunctor(name, idLimit);
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

    getDynamicStructure(name: string, idLimit: number = 0): DynamicBasis | undefined {
        let result = this.dynamicBasis.getStructure(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getDynamicStructure(name, idLimit);
        }
    }

    getAndResolveDynamicStructure(name: LongIdentifierToken, idLimit: number = 0): DynamicBasis | undefined {
        let res: DynamicBasis | undefined = undefined;
        if (name.qualifiers.length === 0) {
            throw new EvaluationError(name.position,
                'Unqualified LongIdentifierToken are too unqualified to be useful here.');
        } else {
            res = this.getDynamicStructure(name.qualifiers[0].getText(), idLimit);
        }

        for (let i = 1; i < name.qualifiers.length; ++i) {
            if (res === undefined) {
                return res;
            }
            res = res.getStructure(name.qualifiers[i].getText());
        }

        return res;
    }


    getDynamicSignature(name: string, idLimit: number = 0): DynamicInterface | undefined {
        let result = this.dynamicBasis.getSignature(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getDynamicSignature(name, idLimit);
        }
    }

    getDynamicFunctor(name: string, idLimit: number = 0): DynamicFunctorInformation | undefined {
        let result = this.dynamicBasis.getFunctor(name);
        if (result !== undefined || this.parent === undefined || this.parent.id < idLimit) {
            return result;
        } else {
            return this.parent.getDynamicFunctor(name, idLimit);
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

    getWarnings(): Warning[] {
        return this.warns;
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

    setStaticStructure(name: string, structure: StaticBasis, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setStructure(name, structure);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setStaticStructure(name, structure, atId);
        }
    }

    setStaticSignature(name: string, signature: StaticBasis, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setSignature(name, signature);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setStaticSignature(name, signature, atId);
        }
    }

    setStaticFunctor(name: string, functor: [StaticBasis, StaticBasis], atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setFunctor(name, functor);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setStaticFunctor(name, functor, atId);
        }
    }

    setDynamicValue(name: string, value: Value, is: IdentifierStatus, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setValue(name, value, is);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicValue(name, value, is, atId);
        }
    }

    setDynamicType(name: string, constructors: string[], atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setType(name, constructors);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicType(name, constructors, atId);
        }
    }

    setDynamicStructure(name: string, structure: DynamicBasis, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setStructure(name, structure);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicStructure(name, structure, atId);
        }
    }

    setDynamicSignature(name: string, signature: DynamicInterface, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setSignature(name, signature);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicSignature(name, signature, atId);
        }
    }

    setDynamicFunctor(name: string, functor: DynamicFunctorInformation, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setFunctor(name, functor);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setDynamicFunctor(name, functor, atId);
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

    setValueIdentifierId(name: string, setTo: number, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.valueIdentifierId[name] = setTo;
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setValueIdentifierId(name, setTo, atId);
        }
    }

    addWarning(warn: Warning, atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.warns.push(warn);
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.addWarning(warn, atId);
        }
    }

    setWarnings(warns: Warning[], atId: number|undefined = undefined) {
        if (atId === undefined || atId === this.id) {
            this.warns = warns;
        } else if (atId > this.id || this.parent === undefined) {
            throw new InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        } else {
            this.parent.setWarnings(warns, atId);
        }
    }
}
