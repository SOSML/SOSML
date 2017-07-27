import { Position } from './errors';
import { State } from './state';

export abstract class Type {
    abstract prettyPrint(): string;
    abstract equals(other: any): boolean;

    // Constructs types with type variables instantiated as much as possible
    instantiate(state: State): Type {
        return this.simplify().instantiate(state);
    }

    // Return all (free) type variables
    getTypeVariables(free: boolean): Set<TypeVariable> {
        return this.simplify().getTypeVariables(free);
    }

    // Checks if two types are unifyable; returns all required type variable bindings
    matches(state: State, type: Type): [string, Type][] | undefined {
        return this.simplify().matches(state, type);
    }

    simplify(): Type {
        return this;
    }

    admitsEquality(state: State): boolean {
        return false;
    }
}

export class PrimitiveType extends Type {
    constructor(public name: string, public parameters: Type[] = [], public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type {
        return this;
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        for (let i = 0; i < this.parameters.length; ++i) {
            this.parameters[i].getTypeVariables(free).forEach((value: TypeVariable) => {
                res.add(value);
            });
        }
        return res;
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        if (type instanceof PrimitiveType) {
            if (this.name !== (<PrimitiveType> type).name
                || this.parameters.length !== (<PrimitiveType> type).parameters.length) {
                return undefined;
            }
            for (let i = 0; i < this.parameters.length; ++i) {
                if (this.parameters[i].matches(state, (<PrimitiveType> type).parameters[i]) === undefined) {
                    return undefined;
                }
            }

            return [];
        }

        // TODO
        if (type instanceof TypeVariable) {
            if ((<TypeVariable> type).domain === []) {
                return undefined;
            }
        }

        // None of the possible types matched
        return undefined;
    }

    admitsEquality(state: State): boolean {
        for (let i = 0; i < this.parameters.length; ++i) {
            if (!this.parameters[i].admitsEquality(state)) {
                return false;
            }
        }
        return state.getPrimitiveType(this.name).allowsEquality;
    }

    prettyPrint(): string {
        let res = '';
        for (let i = 0; i < this.parameters.length; ++i) {
            res += this.parameters[i].prettyPrint() + ' ';
        }
        return res += this.name;
    }

    equals(other: any): boolean {
        if (!(other instanceof PrimitiveType)) {
            return false;
        }
        if (this.name !== (<PrimitiveType> other).name) {
            return false;
        }
        if (this.parameters.length !== (<PrimitiveType> other).parameters.length) {
            return false;
        }
        for (let i = 0; i < this.parameters.length; ++i) {
            if (!this.parameters[i].equals((<PrimitiveType> other).parameters[i])) {
                return false;
            }
        }
        return true;
    }

    simplify(): Type {
        let param: Type[] = [];
        for (let i = 0; i < this.parameters.length; ++i) {
            param.push(this.parameters[i].simplify());
        }
        return new PrimitiveType(this.name, param, this.position);
    }
}

export class TypeVariable extends Type {
    constructor(public name: string, public isFree: boolean = true, public position: Position = 0,
                public domain: Type[] = []) {
        super();
    }

    kill(): Type {
        if (this.domain.length === 0) {
            // Real type vars won't die so easily
            return this;
        }
        return this.domain[0];
    }

    prettyPrint(): string {
        return this.name;
    }

    instantiate(state: State): Type {
        // let res = state.getStaticValue(this.name);
        // if (!this.isFree || res === undefined) {
        //     return this;
        // }
        throw new Error('ニャ－');
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        if (free === this.isFree) {
            res.add(this);
        }
        return res;
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        for (let i = 0; i < this.domain.length; ++i) {
            if (!this.domain[i].admitsEquality(state)) {
                return false;
            }
        }
        if (this.domain.length === 0 ) {
            return this.name[1] === '\'';
        } else {
            return true;
        }
    }

    equals(other: any): boolean {
        if (!(other instanceof TypeVariable && this.name === other.name)) {
            return false;
        }
        if (this.domain.length !== (<TypeVariable> other).domain.length) {
            return false;
        }
        for (let i = 0; i < this.domain.length; ++i) {
            if (!this.domain[i].equals((<TypeVariable> other).domain[i])) {
                return false;
            }
        }
        return true;
    }
}

export class RecordType extends Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true, public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type {
        // TODO
        throw new Error('ニャ－');
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        // TODO
        throw new Error('ニャ－');
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        // TODO
        throw new Error('ニャ－');
    }


    prettyPrint(): string {
        // TODO: print as Tuple if possible
        let result: string = '{';
        let first: boolean = true;
        this.elements.forEach((type: Type, key: string) => {
            if (!first) {
                result += ', ';
            } else {
                first = false;
            }
            result += key + ' : ' + type.prettyPrint();
        });
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    }

    simplify(): RecordType {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.simplify());
        });
        return new RecordType(newElements, this.complete);
    }

    equals(other: any): boolean {
        if (!(other instanceof RecordType) || this.complete !== other.complete) {
            return false;
        } else {
            if (other === this) {
                return true;
            }
            for (let name in this.elements) {
                if (!this.elements.hasOwnProperty(name)) {
                    if (!(this.elements.get(name) as Type).equals(other.elements.get(name))) {
                        return false;
                    }
                }
            }
            for (let name in other.elements) {
                if (!other.elements.hasOwnProperty(name)) {
                    if (!(other.elements.get(name) as Type).equals(this.elements.get(name))) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}

export class FunctionType extends Type {
    constructor(public parameterType: Type, public returnType: Type, public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type {
        // TODO
        throw new Error('ニャ－');
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        this.parameterType.getTypeVariables(free).forEach((value: TypeVariable) => {
            res.add(value);
        });
        this.returnType.getTypeVariables(free).forEach((value: TypeVariable) => {
            res.add(value);
        });
        return res;
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        return this.parameterType.admitsEquality(state) && this.returnType.admitsEquality(state);
    }


    prettyPrint(): string {
        return '( ' + this.parameterType.prettyPrint()
            + ' -> ' + this.returnType.prettyPrint() + ' )';
    }

    simplify(): FunctionType {
        return new FunctionType(this.parameterType.simplify(), this.returnType.simplify(), this.position);
    }

    equals(other: any): boolean {
        return other instanceof FunctionType && this.parameterType.equals(other.parameterType)
            && this.returnType.equals(other.returnType);
    }
}

// A custom defined type similar to "list" or "option".
// May have a type argument.
export class CustomType extends Type {
    constructor(public name: string,
                public typeArguments: Type[] = [],
                public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type {
        if (this.typeArguments.length > 0) {
            // TODO
            throw new Error('ニャ－');
        } else {
            return this;
        }
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        if (this.typeArguments.length > 0) {
            // TODO
            throw new Error('ニャ－');
        }
        return new Set<TypeVariable>();
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].admitsEquality(state)) {
                return false;
            }
        }
        return true;
    }

    prettyPrint(): string {
        let result: string = '';
        if (this.typeArguments.length > 1) {
            result += '( ';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i].prettyPrint();
        }
        if (this.typeArguments.length > 1) {
            result += ' )';
        }
        if (this.typeArguments.length > 0) {
            result += ' ';
        }
        result += this.name;
        return result;
    }

    simplify(): Type {
        let args: Type[] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].simplify());
        }
        return new CustomType(this.name, args);
    }

    equals(other: any): boolean {
        if (!(other instanceof CustomType) || this.name !== other.name) {
            return false;
        }
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].equals(other.typeArguments[i])) {
                return false;
            }
        }
        return true;
    }
}

export class TupleType extends Type {
    constructor(public elements: Type[], public position: Position = 0) {
        super();
    }

    prettyPrint(): string {
        let result: string = '( ';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i].prettyPrint();
        }
        return result + ' )';
    }

    simplify(): RecordType {
        let entries: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries.set(String(i + 1), this.elements[i].simplify());
        }
        return new RecordType(entries, true);
    }

    equals(other: any): boolean {
        return this.simplify().equals(other);
    }
}
