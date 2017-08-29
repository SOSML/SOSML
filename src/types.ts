import { ElaborationError } from './errors';
import { State } from './state';
import { LongIdentifierToken } from './tokens';

export abstract class Type {
    abstract toString(): string;
    abstract equals(other: any): boolean;

    // Constructs types with type variables instantiated as much as possible
    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        throw new ElaborationError(-1,
            'I mustn\'t run away. I mustn\'t run away. I mustn\'t run away.');
    }

    // Merge this type with the other type. This operation is commutative
    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type): [Type, Map<string, [Type, boolean]>] {
        throw new ElaborationError(-1, 'I don\'t know anything.');
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        throw new ElaborationError(-1, 'Yeaaah.');
    }

    // Return all (free) type variables
    getTypeVariables(free: boolean = false): Set<string> {
        throw new ElaborationError(-1, 'This is wrong.\nI said with a posed look.');
    }

    // Get all type variables in order (they may appear more than once)
    getOrderedTypeVariables(): string[] {
        throw new ElaborationError(-1, 'You seem well today.\nDid something nice happen?');
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        throw new ElaborationError(-1, 'あんたバカ?');
    }

    // Mark all type variables as free
    makeFree(): Type {
        return this;
    }

    simplify(): Type {
        return this;
    }

    admitsEquality(state: State): boolean {
        return false;
    }

    // Normalizes a type. Free type variables need to get new names **across** different decls.
    normalize(nextFree: number = 0): [Type, number] {
        let orderedVars = this.getOrderedTypeVariables();
        let freeVars = this.getTypeVariables(true);
        let replacements = new Map<string, string>();
        let rcnt = 0;

        for (let v of orderedVars) {
            if (replacements.has(v)) {
                continue;
            }

            let nextVar = '';
            let cnt = ++rcnt;
            if (freeVars.has(v)) {
                cnt = ++nextFree;
            }
            if (cnt <= 26) {
                nextVar = String.fromCharCode('a'.charCodeAt(0) + cnt - 1);
            } else {
                while (cnt > 0) {
                    let nextChar = (--cnt) % 26;
                    nextVar = String.fromCharCode('a'.charCodeAt(0) + nextChar) + nextVar;
                    cnt = Math.floor(cnt / 26);
                }
            }

            let newVar = '\'';
            if (v.length > 2 && v.charAt(1) === '\'') {
                newVar += '\'';
            }

            if (freeVars.has(v)) {
                newVar += '~';
            }
            newVar += nextVar;

            if (freeVars.has(v)) {
                newVar = newVar.toUpperCase();
            }

            replacements.set(v, newVar);
        }

        return [this.replaceTypeVariables(replacements), nextFree];
    }
}

// A type representing any type
export class AnyType extends Type {
    constructor() {
        super();
    }

    toString(): string {
        return 'any';
    }

    equals(other: any) {
        return true;
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        return this;
    }

    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type): [Type, Map<string, [Type, boolean]>] {
        return [other, tyVarBnd];
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        return [this, tyVarBnd];
    }

    getTypeVariables(free: boolean = false): Set<string> {
        return new Set<string>();
    }

    getOrderedTypeVariables(): string[] {
        return [];
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        return this;
    }
}

export class TypeVariableBind extends Type {
    isFree: boolean;
    constructor(public name: string, public type: Type, public domain: Type[] = []) {
        super();
        this.isFree = false;
    }

    simplify(): TypeVariableBind {
        let res = new TypeVariableBind(this.name, this.type.simplify(), this.domain);
        res.isFree = this.isFree;
        return res;
    }

    makeFree(): Type {
        let res = new TypeVariableBind(this.name, this.type.makeFree(), this.domain);
        res.isFree = true;
        return res;
    }

    toString(): string {
        let frees = new Set<[string, Type[]]>();
        let bound = new Set<[string, Type[]]>();

        let ct: Type = this;
        while (ct instanceof TypeVariableBind) {
            if ((<TypeVariableBind> ct).isFree) {
                frees = frees.add([(<TypeVariableBind> ct).name, (<TypeVariableBind> ct).domain]);
            } else {
                bound = bound.add([(<TypeVariableBind> ct).name, (<TypeVariableBind> ct).domain]);
            }
            ct = (<TypeVariableBind> ct).type;
        }

        let res = '';
        if (bound.size > 0) {
            res += '∀';
            bound.forEach((val: [string, Type[]]) => {
                res += ' ' + val[0];
                if (val[1].length > 0) {
                    res += ' ∈ {';
                    for (let i = 0; i < val[1].length; ++i) {
                        if (i > 0) {
                            res += ', ';
                        }
                        res += val[1][i];
                    }
                    res += '}';
                }
            });
            res += ' . ';
        }
        res += ct;

        if (frees.size > 0) {
            res += ',';
            frees.forEach((val: [string, Type[]]) => {
                res += ' ' + val[0];
                if (val[1].length > 0) {
                    res += ' ∈ {';
                    for (let i = 0; i < val[1].length; ++i) {
                        if (i > 0) {
                            res += ', ';
                        }
                        res += val[1][i];
                    }
                    res += '}';
                }
            });
            res += ' free';
        }

        return res;
    }

    getTypeVariables(free: boolean = false): Set<string> {
        let rec = this.type.getTypeVariables(free);
        let res = new Set<string>();

        rec.forEach((val: string) => {
            if (val !== this.name || free === this.isFree) {
                res.add(val);
            }
        });
        if (free && this.isFree && !res.has(this.name)) {
            res.add(this.name);
        }
        return res;
    }

    getOrderedTypeVariables(): string[] {
        return [this.name].concat(this.type.getOrderedTypeVariables());
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        if (replacements.has(this.name)) {
            let res = new TypeVariableBind(<string> replacements.get(this.name),
                this.type.replaceTypeVariables(replacements, free));
            if (free.has(this.name)) {
                res.isFree = true;
            } else {
                res.isFree = this.isFree;
            }
            return res;
        } else {
            let res = new TypeVariableBind(this.name, this.type.replaceTypeVariables(replacements, free));
            res.isFree = this.isFree;
            return res;
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
    isFree: boolean;
    constructor(public name: string, public position: number = 0) {
        super();
        this.isFree = false;
    }

    makeFree(): Type {
        let res = new TypeVariable(this.name, this.position);
        res.isFree = true;
        return res;
    }

    toString(): string {
        return this.name;
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        if (!tyVarBnd.has(this.name)) {
            return this;
        }
        if (seen.has(this.name)) {
            throw new ElaborationError(-1,
                'Type clash. An expression of type "' + this.name
                + '" cannot have type "' + (<[Type, boolean]> tyVarBnd.get(this.name))[0]
                + '" because of circularity.');
        }
        let nsen = new Set<string>();
        seen.forEach((val: string) => {
            nsen.add(val);
        });
        nsen.add(this.name);
        return (<[Type, boolean]> tyVarBnd.get(this.name))[0].instantiate(state, tyVarBnd, nsen);
    }

    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type): [Type, Map<string, [Type, boolean]>] {
        if (other instanceof AnyType) {
            return [this, tyVarBnd];
        }

        let ths = this.instantiate(state, tyVarBnd);

        if (ths instanceof TypeVariable) {
            let oth = other.instantiate(state, tyVarBnd);

            if (oth instanceof TypeVariable) {
                // TODO equality checks
                if (ths.name === oth.name) {
                    return [ths, tyVarBnd];
                } else {
                    let repl = new Map<string, string>();
                    let rs = ths;
                    if (ths.name < oth.name) {
                        repl.set(oth.name, ths.name);
                    } else {
                        repl.set(ths.name, oth.name);
                        rs = oth;
                    }
                    let nvb = new Map<string, [Type, boolean]>();
                    tyVarBnd.forEach((val: [Type, boolean], key: string) => {
                        nvb = nvb.set(key, [val[0].replaceTypeVariables(repl), val[1]]);
                    });
                    if (ths.name < oth.name) {
                        nvb.set(oth.name, [ths, oth.isFree]);
                    } else {
                        nvb.set(ths.name, [oth, ths.isFree]);
                    }
                    return [rs, nvb];
                }
            } else {
                let otv = oth.getTypeVariables();
                if (otv.has((<TypeVariable> ths).name)) {
                    throw new ElaborationError(-1,
                        'Type clash. An expression of type "' + (<TypeVariable> ths).name
                        + '" cannot have type "' + oth + '" because of circularity.');
                }
                if (ths.isFree) {
                    oth = oth.makeFree();
                }
                if (ths.admitsEquality(state) && !oth.admitsEquality(state)) {
                    let nt = oth.makeEqType(state, tyVarBnd);
                    if (!nt[0].admitsEquality(state)) {
                        throw ['Type "' + oth + '" does not admit equality.', ths, oth];
                    } else {
                        oth = nt[0];
                        tyVarBnd = nt[1];
                    }
                }
                return [oth, tyVarBnd.set(ths.name, [oth, ths.isFree])];
            }
        } else {
            return ths.merge(state, tyVarBnd, other);
        }
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        if (this.admitsEquality(state)) {
            return [this, tyVarBnd];
        }
        if (tyVarBnd.has(this.name)) {
            let tmp = (<[Type, boolean]> tyVarBnd.get(this.name))[0].makeEqType(state, tyVarBnd);
            tyVarBnd = tmp[1];
            let n = new TypeVariable('\'' + this.name, this.position);
            n.isFree = this.isFree;
            tyVarBnd = tyVarBnd.set(n.name, [tmp[0], n.isFree]);
        }
        let nt = new TypeVariable('\'' + this.name, this.position);
        return [nt, tyVarBnd.set(this.name, [nt, this.isFree])];
    }

    getTypeVariables(free: boolean = false): Set<string> {
        let res = new Set<string>();
        if (!free || this.isFree) {
            res.add(this.name);
        }
        return res;
    }

    getOrderedTypeVariables(): string[] {
        return [this.name];
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        if (replacements.has(this.name)) {
            let res = new TypeVariable(<string> replacements.get(this.name), this.position);
            if (free.has(this.name)) {
                res.isFree = true;
            } else {
                res.isFree = this.isFree;
            }
            return res;
        }
        return this;
    }

    admitsEquality(state: State): boolean {
        return this.name[1] === '\'';
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
        if (!(other instanceof TypeVariable && this.name === other.name)) {
            return false;
        }
        return true;
    }
}

export class RecordType extends Type {
    constructor(public elements: Map<string, Type>, public complete: boolean = true,
                public position: number = 0) {
        super();
    }

    makeFree(): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.makeFree());
        });
        return new RecordType(newElements, this.complete, this.position);
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.instantiate(state, tyVarBnd, seen));
        });
        return new RecordType(newElements, this.complete, this.position);
    }

    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type): [Type, Map<string, [Type, boolean]>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }

        if (other instanceof RecordType) {
            if (!this.complete && other.complete) {
                return other.merge(state, tyVarBnd, this);
            }

            let rt: Map<string, Type> = new Map<string, Type>();
            let tybnd = tyVarBnd;
            other.elements.forEach((val: Type, key: string) => {
                if (this.complete && !this.elements.has(key)) {
                    throw ['Records don\'t agree on members ("' + key
                        + '" occurs only once.)', this.instantiate(state, tybnd),
                        other.instantiate(state, tybnd)];
                }

                if (!this.elements.has(key)) {
                    rt = rt.set(key, val.instantiate(state, tybnd));
                } else {
                    let mg = val.merge(state, tybnd, <Type> this.elements.get(key));
                    rt = rt.set(key, mg[0]);
                    tybnd = mg[1];
                }
            });

            if (other.complete) {
                this.elements.forEach((val: Type, key: string) => {
                    if (!other.elements.has(key)) {
                        throw ['Records don\'t agree on members ("' + key
                            + '" occurs only once.)', this.instantiate(state, tybnd),
                            other.instantiate(state, tybnd)];
                    }
                });
            }

            return [new RecordType(rt, this.complete || other.complete, this.position), tybnd];
        }

        // Merging didn't work
        throw ['Cannot merge "RecordType" and "' + other.constructor.name + '".',
            this.instantiate(state, tyVarBnd),
            other.instantiate(state, tyVarBnd)];
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            let tmp = type.makeEqType(state, tyVarBnd);
            newElements.set(key, tmp[0]);
            tyVarBnd = tmp[1];
        });
        return [new RecordType(newElements, this.complete, this.position), tyVarBnd];
    }

    getTypeVariables(free: boolean = false): Set<string> {
        let res = new Set<string>();
        this.elements.forEach((val: Type) => {
            val.getTypeVariables(free).forEach((id: string) => {
                res.add(id);
            });
        });
        return res;
    }

    getOrderedTypeVariables(): string[] {
        let res: string[] = [];
        this.elements.forEach((val: Type) => {
            res = res.concat(val.getOrderedTypeVariables());
        });
        return res;
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        let rt: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((val: Type, key: string) => {
            rt = rt.set(key, val.replaceTypeVariables(replacements, free));
        });
        return new RecordType(rt, this.complete, this.position);
    }

    getType(name: string): Type {
        if (!this.elements.has(name)) {
            throw new ElaborationError(0, 'Tried accessing non-existing record part.');
        }
        return <Type> this.elements.get(name);
    }

    hasType(name: string): boolean {
        return this.elements.has(name);
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

    toString(): string {
        let isTuple = true;
        for (let i = 1; i <= this.elements.size; ++i) {
            if (!this.elements.has('' + i)) {
                isTuple = false;
            }
        }

        if (isTuple) {
            if (this.elements.size === 0) {
                return 'unit';
            }
            let res: string = '';
            for (let i = 1; i <= this.elements.size; ++i) {
                if (i > 1) {
                    res += ' * ';
                }
                let sub = this.elements.get('' + i);
                if (sub instanceof FunctionType) {
                    res += '(' + sub + ')';
                } else {
                    res += sub;
                }
            }
            return res + '';
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
            result += key + ': ' + type;
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
        if (other instanceof AnyType) {
            return true;
        }
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

    makeFree(): Type {
        return new FunctionType(this.parameterType.makeFree(), this.returnType.makeFree());
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        return new FunctionType(this.parameterType.instantiate(state, tyVarBnd, seen),
            this.returnType.instantiate(state, tyVarBnd, seen), this.position);
    }

    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type): [Type, Map<string, [Type, boolean]>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }
        if (other instanceof FunctionType) {
            let p = this.parameterType.merge(state, tyVarBnd, other.parameterType);
            let r = this.returnType.merge(state, p[1], other.returnType);

            return [new FunctionType(p[0], r[0], this.position), r[1]];
        }

        // Merging didn't work
        throw ['Cannot merge "FunctionType" and "' + other.constructor.name + '".',
            this.instantiate(state, tyVarBnd),
            other.instantiate(state, tyVarBnd)];
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        return [this, tyVarBnd];
    }

    getTypeVariables(free: boolean = false): Set<string> {
        let res = new Set<string>();
        this.parameterType.getTypeVariables(free).forEach((value: string) => {
            res.add(value);
        });
        this.returnType.getTypeVariables(free).forEach((value: string) => {
            res.add(value);
        });
        return res;
    }

    getOrderedTypeVariables(): string[] {
        let res: string[] = [];
        res = res.concat(this.parameterType.getOrderedTypeVariables());
        res = res.concat(this.returnType.getOrderedTypeVariables());
        return res;
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        let res = this.parameterType.replaceTypeVariables(replacements, free);
        let res2 = this.returnType.replaceTypeVariables(replacements, free);
        return new FunctionType(res, res2, this.position);
    }

    admitsEquality(state: State): boolean {
        return false;
    }

    toString(): string {
        if (this.parameterType instanceof FunctionType) {
            return '(' + this.parameterType + ')'
                + ' → ' + this.returnType;
        } else {
            return this.parameterType
                + ' → ' + this.returnType;
        }
    }

    simplify(): FunctionType {
        return new FunctionType(this.parameterType.simplify(),
            this.returnType.simplify(), this.position);
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
        return other instanceof FunctionType && this.parameterType.equals(other.parameterType)
            && this.returnType.equals(other.returnType);
    }
}

// A custom defined type similar to "list" or "option".
// May have a type argument.
// TODO ID?
export class CustomType extends Type {
    constructor(public name: string,
                public typeArguments: Type[] = [],
                public position: number = 0,
                public qualifiedName: LongIdentifierToken | undefined = undefined) {
        super();
    }

    makeFree(): Type {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].makeFree());
        }
        return new CustomType(this.name, res, this.position, this.qualifiedName);
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        let tp = state.getStaticType(this.name);
        if (this.qualifiedName !== undefined) {
            let rsv = state.getAndResolveStaticStructure(this.qualifiedName);
            if (rsv !== undefined) {
                tp = rsv.getType(this.name);
            } else {
                tp = undefined;
            }
        }
        if (tp !== undefined && tp.type instanceof FunctionType) {
            try {
                let mt = this.merge(state, tyVarBnd,  (<FunctionType> tp.type).parameterType, true);
                return (<FunctionType> tp.type).returnType.instantiate(state, mt[1], seen);
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(-1,
                    'Instantiating "' + this + '" failed:\n'
                    + 'Cannot merge "' + e[1] + '" and "' + e[2]
                    + '" (' + e[0] + ').');
            }
        } else if (tp === undefined) {
            throw new ElaborationError(-1, 'Unbound type "' + this.name + '".');
        }

        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].instantiate(state, tyVarBnd, seen));
        }
        return new CustomType(this.name, res, this.position, this.qualifiedName);
    }

    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type,
          noinst: boolean = false): [Type, Map<string, [Type, boolean]>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }

        let ths: Type = this;
        let oth = other;
        if (!noinst) {
            // Remove type alias and stuff
            ths = this.instantiate(state, tyVarBnd);

            if (!(ths instanceof CustomType)) {
                return ths.merge(state, tyVarBnd, other);
            }
            oth = other.instantiate(state, tyVarBnd);
        }

        if (oth instanceof CustomType && (<CustomType> ths).name === (<CustomType> oth).name
            && (<CustomType> ths).typeArguments.length === (<CustomType> oth).typeArguments.length) {
            let res: Type[] = [];
            let tybnd = tyVarBnd;

            for (let i = 0; i < (<CustomType> ths).typeArguments.length; ++i) {
                let tmp = (<CustomType> ths).typeArguments[i].merge(state, tybnd, oth.typeArguments[i]);
                res.push(tmp[0]);
                tybnd = tmp[1];
            }

            return [new CustomType((<CustomType> ths).name, res, this.position, this.qualifiedName),
                tybnd];
        }

        // Merging didn't work
        throw ['Cannot merge "CustomType" and "' + other.constructor.name + '".',
            this.instantiate(state, tyVarBnd),
            other.instantiate(state, tyVarBnd)];
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            let tmp = this.typeArguments[i].makeEqType(state, tyVarBnd);
            res.push(tmp[0]);
            tyVarBnd = tmp[1];
        }
        return [new CustomType(this.name, res, this.position, this.qualifiedName), tyVarBnd];
    }

    getTypeVariables(free: boolean = false): Set<string> {
        let res = new Set<string>();
        if (this.typeArguments.length > 0) {
            for (let i = 0; i < this.typeArguments.length; ++i) {
                this.typeArguments[i].getTypeVariables(free).forEach((val: string) => {
                    res.add(val);
                });
            }
        }
        return res;
    }

    getOrderedTypeVariables(): string[] {
        let res: string[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res = res.concat(this.typeArguments[i].getOrderedTypeVariables());
        }
        return res;
    }

    replaceTypeVariables(replacements: Map<string, string> = new Map<string, string>(),
                         free: Set<string> = new Set<string>()): Type {
        let rt: Type[] = [];

        for (let i = 0; i < this.typeArguments.length; ++i) {
            rt.push(this.typeArguments[i].replaceTypeVariables(replacements, free));
        }
        return new CustomType(this.name, rt, this.position, this.qualifiedName);
    }

    admitsEquality(state: State): boolean {
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].admitsEquality(state)) {
                return false;
            }
        }
        return true;
    }

    toString(): string {
        let result: string = '';
        if (this.typeArguments.length > 1
            || (this.typeArguments.length === 1 && this.typeArguments[0] instanceof FunctionType)) {
            result += '(';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i];
        }
        if (this.typeArguments.length > 1
            || (this.typeArguments.length === 1 && this.typeArguments[0] instanceof FunctionType)) {
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
        return new CustomType(this.name, args, this.position, this.qualifiedName);
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
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

    toString(): string {
        let result: string = '(';
        for (let i: number = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i];
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
