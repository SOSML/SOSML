import { Position, InternalInterpreterError } from './errors';
import { State } from './state';

export abstract class Type {
    static printTypeArray(type: Type[]): string {
        if (type.length === 1) {
            return type[0].prettyPrint();
        }
        let result = '[ ';
        for (let i = 0; i < type.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += type[i].prettyPrint();
        }
        result += ' ]';
        return result;
    }

    static simplifyTypeArray(type: Type[]): Type[] {
        let result: Type[] = [];
        for (let i = 0; i < type.length; ++i) {
            result.push(type[i].simplify());
        }
        return result;
    }

    abstract prettyPrint(): string;
    abstract equals(other: any): boolean;

    // Constructs types with type variables instantiated as much as possible
    instantiate(state: State): Type[] {
        return this.simplify().instantiate(state);
    }

    // Return all (free) type variables
    getTypeVariables(free: boolean): Set<TypeVariable> {
        return this.simplify().getTypeVariables(free);
    }

    // Checks if two types are unifyable; returns all required type variable bindings
    matches(state: State, type: Type[]): [string, Type[]][] | undefined {
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
    constructor(public name: string, public parameters: Type[][] = [], public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type[] {
        return [this];
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        return new Set<TypeVariable>();
    }

    matches(state: State, type: Type[]): [string, Type[]][] | undefined {
        throw new Error( 'nya' );
        /* for (let i = 0; i < type.length; ++i) {
            if (type[i].equals(this)) {
                return [];
            }
        }

        // None of the possible types matched
        return undefined; */
    }

    admitsEquality(state: State): boolean {
        return state.getPrimitiveType(this.name).allowsEquality;
    }

    prettyPrint(): string {
        let res = '';
        for (let i = 0; i < this.parameters.length; ++i) {
            res += Type.printTypeArray(this.parameters[i]) + ' ';
        }
        return res += this.name;
    }

    equals(other: any): boolean {
        throw new Error('nya');
        /*
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
        return true; */
    }

    simplify(): Type {
        let param: Type[][] = [];
        for (let i = 0; i < this.parameters.length; ++i) {
            param.push(Type.simplifyTypeArray(this.parameters[i]));
        }
        return new PrimitiveType(this.name, param, this.position);
    }
}

export class TypeVariable extends Type {
    constructor(public name: string, public isFree: boolean = true, public position: Position = 0) {
        super();
    }

    prettyPrint(): string {
        return this.name;
    }

    instantiate(state: State): Type[] {
        let res = state.getStaticValue(this.name);
        if (!this.isFree || res === undefined) {
            return [this];
        }
        return <Type[]> res;
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        if (free === this.isFree) {
            res.add(this);
        }
        return res;
    }

    matches(state: State, type: Type[]): [string, Type[]][] | undefined {
        if (this.isFree) {
            // TODO Filter out <this> type var from type?
            return [[this.name, type]];
        } else {
            for (let i = 0; i < type.length; ++i) {
                if (type[i].equals(this)) {
                    return [];
                }
            }
        }

        // None of the possible types matched
        return undefined;
    }

    admitsEquality(state: State): boolean {
        return this.name[1] === '\'';
    }

    equals(other: any): boolean {
        return other instanceof TypeVariable && this.name === other.name;
    }
}

export class RecordType extends Type {
    constructor(public elements: Map<string, Type[]>, public complete: boolean = true, public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type[] {
        // TODO
        throw new Error('ニャ－');
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        // TODO
        throw new Error('ニャ－');
    }

    matches(state: State, type: Type[]): [string, Type[]][] | undefined {
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
        this.elements.forEach((type: Type[], key: string) => {
            if (!first) {
                result += ', ';
            } else {
                first = false;
            }
            result += key + ' : ' + Type.printTypeArray(type);
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
        let newElements: Map<string, Type[]> = new Map<string, Type[]>();
        this.elements.forEach((type: Type[], key: string) => {
            newElements.set(key, Type.simplifyTypeArray(type));
        });
        return new RecordType(newElements, this.complete);
    }

    equals(other: any): boolean {
        // TODO Do types need an equals?

        throw new InternalInterpreterError(-1, '～ニャ－～');

        /*
        if (!(other instanceof RecordType) || this.complete !== other.complete) {
            return false;
        } else {
            if (other === this) {
                return true;
            }
            for (let name in this.elements) {
                if (!this.elements.hasOwnProperty(name)) {
                    if (!(<Type> this.elements.get(name) as Type).equals(other.elements.get(name))) {
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
        return true; */
    }
}

export class FunctionType extends Type {
    constructor(public parameterType: Type[], public returnType: Type[], public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type[] {
        // TODO
        throw new Error('ニャ－');
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        // TODO
        throw new Error('ニャ－');
    }

    matches(state: State, type: Type[]): [string, Type[]][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        throw new InternalInterpreterError(-1, '～ニャ－～');
        // return this.parameterType.admitsEquality(state) && this.returnType.admitsEquality(state);
    }


    prettyPrint(): string {
        return '( ' + Type.printTypeArray(this.parameterType)
            + ' -> ' + Type.printTypeArray(this.returnType) + ' )';
    }

    simplify(): FunctionType {
        return new FunctionType(Type.simplifyTypeArray(this.parameterType),
            Type.simplifyTypeArray(this.returnType), this.position);
    }

    equals(other: any): boolean {
        throw new InternalInterpreterError(-1, '～ニャ－～');
        // return other instanceof FunctionType && this.parameterType.equals(other.parameterType)
        //  && this.returnType.equals(other.returnType);
    }
}

// A custom defined type similar to "list" or "option".
// May have a type argument.
export class CustomType extends Type {
    constructor(public name: string,
                public typeArguments: Type[][] = [],
                public position: Position = 0) {
        super();
    }

    instantiate(state: State): Type[] {
        if (this.typeArguments.length > 0) {
            // TODO
            throw new Error('ニャ－');
        } else {
            return [this];
        }
    }

    getTypeVariables(free: boolean): Set<TypeVariable> {
        if (this.typeArguments.length > 0) {
            // TODO
            throw new Error('ニャ－');
        }
        return new Set<TypeVariable>();
    }

    matches(state: State, type: Type[]): [string, Type[]][] | undefined {
        // TODO
        throw new Error('ニャ－');
    }

    admitsEquality(state: State): boolean {
        throw new InternalInterpreterError(-1, '～ニャ－～');
        /* for (let i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].admitsEquality(state)) {
                return false;
            }
        }
        return true; */
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
            result += Type.printTypeArray(this.typeArguments[i]);
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
        let args: Type[][] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(Type.simplifyTypeArray(this.typeArguments[i]));
        }
        return new CustomType(this.name, args);
    }

    equals(other: any): boolean {
        throw new InternalInterpreterError(-1, '～ニャ－～');

        /*
        if (!(other instanceof CustomType) || this.name !== other.name) {
            return false;
        }
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].equals(other.typeArguments[i])) {
                return false;
            }
        }
        return true; */
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
        let entries: Map<string, Type[]> = new Map<string, Type[]>();
        for (let i: number = 0; i < this.elements.length; ++i) {
            entries.set('' + (i + 1), [this.elements[i].simplify()]);
        }
        return new RecordType(entries, true);
    }

    equals(other: any): boolean {
        return this.simplify().equals(other);
    }
}
