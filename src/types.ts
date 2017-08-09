import { InternalInterpreterError } from './errors';
import { State } from './state';

export abstract class Type {
    abstract prettyPrint(): string;
    abstract equals(other: any): boolean;

    // Constructs types with type variables instantiated as much as possible
    // TODO add param for current TyVarBinds
    instantiate(state: State): Type {
        return this.simplify().instantiate(state);
    }

    // Return all (free) type variables
    // TODO add param for current TyVarBinds
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

// A type representing any type
export class AnyType extends Type {
    constructor() {
        super();
    }

    prettyPrint(): string {
        return 'any';
    }

    equals(other: any) {
        return true;
    }

    instantiate(state: State): Type {
        return this;
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        return [];
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        return new Set<TypeVariable>();
    }
}

export class TypeVariableBind extends Type {
    constructor(public name: string, public type: Type, public domain: Type[] = []) {
        super();
    }

    prettyPrint(): string {
        if (this.domain === []) {
            return '∀ ' + this.name + ' . ' + this.type.prettyPrint();
        } else {
            let res = '∀ ' + this.name + ' ∈ {';
            for (let i = 0; i < this.domain.length; ++i) {
                if (i > 0) {
                    res += ', ';
                }
                res += this.domain[i].prettyPrint();
            }
            return res + '} . ' + this.type.prettyPrint();
        }
    }

    equals(other: any) {
        if (!(other instanceof TypeVariableBind)
            || (<TypeVariableBind> other).name !== this.name) {
            return false;
        }
        return (<TypeVariableBind> other).type.equals(this.type);
    }
}

export class TypeVariable extends Type {
    constructor(public name: string, public position: number = 0) {
        super();
    }

    prettyPrint(): string {
        return this.name;
    }

    instantiate(state: State): Type {
        let res = state.getStaticValue(this.name);
        if (res === undefined || res[0].equals(this)) {
            return this;
        }
        return res[0];
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        res.add(this);
        return res;
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        // TODO
        throw new InternalInterpreterError(-1, 'ニャ－');
    }

    admitsEquality(state: State): boolean {
        return this.name[1] === '\'';
    }

    equals(other: any): boolean {
        if (!(other instanceof TypeVariable && this.name === other.name)) {
            return false;
        }
        return true;
    }
}

export class RecordType extends Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true, public position: number = 0) {
        super();
    }

    instantiate(state: State): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.instantiate(state));
        });
        return new RecordType(newElements, this.complete);
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        this.elements.forEach((val: Type) => {
            val.getTypeVariables(free).forEach((id: TypeVariable) => {
                res.add(id);
            });
        });
        return res;
    }

    matches(state: State, type: Type): [string, Type][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        let res = true;
        this.elements.forEach((type: Type, key: string) => {
            if (!type.admitsEquality(state)) {
                res = false;
            }
        });
        return res;
    }


    prettyPrint(): string {
        let isTuple = true;
        for (let i = 1; i <= this.elements.size; ++i) {
            if (!this.elements.has('' + i)) {
                isTuple = false;
            }
        }

        if (isTuple) {
            let res: string = '(';
            for (let i = 1; i <= this.elements.size; ++i) {
                if (i > 1) {
                    res += ' * ';
                }
                let sub = this.elements.get('' + i);
                if (sub !== undefined) {
                    res += sub.prettyPrint();
                } else {
                    throw new InternalInterpreterError(-1,
                        'How did we loose this value? It was there before. I promise…');
                }
            }
            return res + ')';
        }

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
        return new RecordType(newElements, this.complete, this.position);
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
    constructor(public parameterType: Type, public returnType: Type, public position: number = 0) {
        super();
    }

    instantiate(state: State): Type {
        return new FunctionType(this.parameterType.instantiate(state), this.returnType.instantiate(state),
            this.position);
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
        return '(' + this.parameterType.prettyPrint()
            + ' -> ' + this.returnType.prettyPrint() + ')';
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
                public position: number = 0) {
        super();
    }

    instantiate(state: State): Type {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].instantiate(state));
        }
        return new CustomType(this.name, res, this.position);
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        if (this.typeArguments.length > 0) {
            for (let i = 0; i < this.typeArguments.length; ++i) {
                this.typeArguments[i].getTypeVariables(free).forEach((val: TypeVariable) => {
                    res.add(val);
                });
            }
        }
        return res;
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
            result += '(';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i].prettyPrint();
        }
        if (this.typeArguments.length > 1) {
            result += ')';
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
        return new CustomType(this.name, args, this.position);
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

// Derived Types

export class TupleType extends Type {
    constructor(public elements: Type[], public position: number = 0) {
        super();
    }

    prettyPrint(): string {
        let result: string = '(';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i].prettyPrint();
        }
        return result + ')';
    }

    simplify(): RecordType {
        let entries: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries.set('' + (i + 1), this.elements[i].simplify());
        }
        return new RecordType(entries, true, this.position);
    }

    equals(other: any): boolean {
        return this.simplify().equals(other);
    }
}
