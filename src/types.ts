import { ElaborationError, Warning } from './errors';
import { State, StaticBasis, DynamicBasis } from './state';
import { LongIdentifierToken } from './tokens';
import { Pattern, Expression, ValueIdentifier, Record, LayeredPattern, Wildcard,
         FunctionApplication, TypedExpression } from './expressions';

export class Domain {
    constructor(public entries: string[] | Map<string, Domain> | undefined) {
    }

    getSize(): number {
        if (this.entries instanceof Array) {
            return this.entries.length;
        }
        if (this.entries === undefined) {
            return 1;
        }
        let res = 1;
        this.entries.forEach((val: Domain) => {
            res *= val.getSize();
        });
        return res;
    }

    isInfinite(): boolean {
        if (this.entries === undefined) {
            return true;
        }
        if (this.entries instanceof Map) {
            let good = false;
            this.entries.forEach((val: Domain, key: string) => {
                good = good || val.isInfinite();
            });
            return good;
        }
        return false;
    }

    getValues(): string[] {
        if (this.entries instanceof Array) {
            return this.entries;
        }
        if (this.entries instanceof Map) {
            // This stuff here is rather fragile; it may break if you look at it . . .
            let res: string[] = [];
            this.entries.forEach((val: Domain, key: string) => {
                if (!val.isInfinite()) {
                    let cur = val.getValues();
                    let nres: string[] = [];
                    if (res.length === 0) {
                        res = cur;
                    } else {
                        for (let i of res) {
                            for (let j of cur) {
                                nres.push(i + ' * ' + j);
                            }
                        }
                        res = nres;
                    }
                }
            });
            return res;
        }
        throw new ElaborationError(-1, 'Irredeemable.');
    }

    finitize(other: Domain): Domain {
        if (this.entries instanceof Array) {
            return new Domain(this.entries);
        }
        if (this.entries === undefined) {
            return new Domain(other.entries);
        }
        let res = new Map<string, Domain>();
        this.entries.forEach((val: Domain, key: string) => {
            res = res.set(key, val.finitize(<Domain> (<Map<string, Domain>> other.entries).get(key)));
        });
        return new Domain(res);
    }

    match(position: number, other: Domain[]): Warning[] {
        let res: Warning[] = [];
        let nonex = false;
        let redun = false;
        // let nondis = false;

        if (this.entries === undefined) {
            nonex = true;
            for (let i of other) {
                if (i.entries === undefined) {
                    if (!nonex) {
                        redun = true;
                    }
                    nonex = false;
                }
            }
        } else if (this.entries instanceof Map) {
            type col = { [name: string]: string };
            let fnd = new Set<string>();
            for (let i = 0; i < other.length; ++i) {
                if (other[i].entries === undefined) {
                    nonex = false;
                    redun = (i < other.length - 1);
                    break;
                }
                if (other[i].entries instanceof Array) {
                    throw new ElaborationError(position, 'Pizza…');
                }
                if (other[i].entries instanceof Map) {
                    let cur: col[] = [];
                    let add = true;
                    this.entries.forEach((val: Domain, key: string) => {
                        // Check that all infin-dom have val undef in other;
                        // Otherwise that match rule does not change the exhaust
                        if (val.isInfinite()) {
                            if (!(<Domain> (<Map<string, Domain>> other[i].entries).get(key)).isInfinite()) {
                                add = false;
                            }
                        } else {
                            let ncur: col[] = [];

                            for (let j of (<Domain> (<Map<string, Domain>>
                                other[i].entries).get(key)).finitize(val).getValues()) {
                                if (cur.length === 0) {
                                    let nk: col = {};
                                    nk[key] = j;
                                    ncur.push(nk);
                                } else {
                                    for (let k of cur) {
                                        let nk: col = {};
                                        for (let w in k) {
                                            if (k.hasOwnProperty(w)) {
                                                nk[w] = k[w];
                                            }
                                        }
                                        nk[key] = j;
                                        ncur.push(nk);
                                    }
                                }
                            }
                            cur = ncur;
                        }
                    });
                    let good = false;
                    for (let j of cur) {
                        if (!fnd.has(JSON.stringify(j))) {
                            good = true;
                        }
                        // else {
                        //    nondis = true;
                        // }
                        if (add) {
                            fnd = fnd.add(JSON.stringify(j));
                        }
                    }
                    if (cur.length > 0) {
                        redun = redun || !good;
                    }
                }
            }
            nonex = fnd.size !== this.getSize();
        } else {
            let fnd = new Map<string, boolean>();
            for (let i of this.entries) {
                fnd = fnd.set(i, false);
            }
            nonex = true;
            for (let i = 0; i < other.length; ++i) {
                if (other[i].entries === undefined) {
                    nonex = false;
                    redun = (i < other.length - 1);
                    break;
                }
                if (other[i].entries instanceof Array) {
                    for (let j of <string[]> other[i].entries) {
                        fnd = fnd.set(j, true);
                    }
                }
                throw new ElaborationError(position,
                    'I\'m not interested in ordinary people\'s bugs. But, if any of you are aliens, '
                    + 'time-travelers, or espers, please come see me. That is all!');
            }
            if (!nonex) {
                let missing: string[] = [];
                fnd.forEach((val: boolean, key: string) => {
                    if (!val) {
                        missing.push(key);
                    }
                });

                if (missing.length > 0) {
                    let rs = '';
                    for (let i = 0; i < missing.length; ++i) {
                        if (i > 0) {
                            rs += ', ';
                        }
                        rs += '"' + missing[i] + '"';
                    }
                    if (missing.length > 1) {
                        rs = ' (Rules for constructors ' + res + ' are non-exhaustive.)\n';
                    } else if (missing.length > 0) {
                        rs = ' (Rules for constructor ' + res + ' are non-exhaustive.)\n';
                    } else {
                        rs = '\n';
                    }
                    nonex = false;
                    res.push(new Warning(position, 'Pattern matching is non-exhaustive.' + res));
                }
            }
        }

        if (nonex) {
            res.push(new Warning(position, 'Pattern matching is non-exhaustive.\n'));
        }
        // if (nondis) {
            // res.push(new Warning(position, 'Some rules are not disjoint.\n'));
        // }
        if (redun) {
            res.push(new Warning(position, 'Some cases are unused in this match.\n'));
        }

        return res;
    }
}

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
        throw new ElaborationError(-1, 'I don\'t know anything. But you know everything.');
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        throw new ElaborationError(-1, 'I don\'t know everything. I just know what I know.');
    }

    // Return all (free) type variables
    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        throw new ElaborationError(-1, 'This is wrong.\nI said with a posed look.');
    }

    // Get all type variables in order (they may appear more than once)
    getOrderedTypeVariables(): string[] {
        throw new ElaborationError(-1, 'You seem well today.\nDid something nice happen?');
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        throw new ElaborationError(-1, 'あんたバカ?');
    }

    qualify(state: State, qualifiers: LongIdentifierToken): Type {
        return this;
    }

    propagate(domains: Map<string, Type[]> = new Map<string, Type[]>()): Type {
        return this;
    }

    checkExhaustiveness(state: State, tyVarBnd: Map<string, [Type, boolean]>, position: number, match:
        [Pattern & Expression, Expression][]): Warning[] {
        if (match.length > 1) {
            return [new Warning(match[1][0].position,
                'Some cases are unused in this match.')];
        }
        return [];
    }

    // Mark all type variables as free
    makeFree(): Type {
        return this;
    }

    simplify(): Type {
        return this;
    }

    isOpaque(): boolean {
        return false;
    }

    getOpaqueName(): string {
        return 'undefined';
    }

    admitsEquality(state: State): boolean {
        return false;
    }

    getDomain(state: State): Domain {
        return new Domain(undefined);
    }

    flatten(repl: Map<string, Type> = new Map<string, Type>()): Type {
        return this;
    }

    // Normalizes a type. Free type variables need to get new names **across** different decls.
    // removes all positions in types
    normalize(nextFree: number = 0, options: { [name: string]: any } = {}): [Type, number] {
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
        let restp = this.replaceTypeVariables(replacements);
        if (options.strictMode !== false) {
            // Do this also if strictMode is undefined
            restp = restp.flatten(new Map<string, Type>());
        }
        return [restp, nextFree];
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

    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        return new Map<string, Type[]>();
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

    flatten(repl: Map<string, Type>): Type {
        if (this.domain.length > 0) {
            repl = repl.set(this.name, this.domain[0]);
            return this.type.flatten(repl);
        }
        let res = new TypeVariableBind(this.name, this.type.flatten(repl), this.domain);
        res.isFree = this.isFree;
        return res;
    }

    qualify(state: State, qualifiers: LongIdentifierToken): Type {
        let res = new TypeVariableBind(this.name, this.type.qualify(state, qualifiers), this.domain);
        res.isFree = this.isFree;
        return res;
    }

    propagate(domains: Map<string, Type[]> = new Map<string, Type[]>()): Type {
        if (this.domain.length > 0) {
            domains = domains.set(this.name, this.domain);
        }
        let res = new TypeVariableBind(this.name, this.type.propagate(domains), this.domain);
        res.isFree = this.isFree;
        return res;
    }

    isOpaque(): boolean {
        return this.type.isOpaque();
    }

    getOpaqueName(): string {
        return this.type.getOpaqueName();
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>) {
        let res = new TypeVariableBind(this.name,
            this.type.instantiate(state, tyVarBnd), this.domain);
        res.isFree = this.isFree;
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

    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        let rec = this.type.getTypeVariables(free);
        let res = new Map<string, Type[]>();

        rec.forEach((dom: Type[], id: string) => {
            if (id !== this.name || free === this.isFree) {
                if (res.has(id)) {
                    res = res.set(id, TypeVariable.mergeDomain(dom, <Type[]> res.get(id)));
                } else {
                    res = res.set(id, dom);
                }
            }
        });
        if (free && this.isFree && !res.has(this.name)) {
            res = res.set(this.name, this.domain);
        }
        return res;
    }

    getOrderedTypeVariables(): string[] {
        return [this.name].concat(this.type.getOrderedTypeVariables());
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        if (replacements.has(this.name)) {
            let res = new TypeVariableBind(<string> replacements.get(this.name),
                this.type.replaceTypeVariables(replacements, free), this.domain);
            if (free.has(this.name)) {
                res.isFree = true;
            } else {
                res.isFree = this.isFree;
            }
            return res;
        } else {
            let res = new TypeVariableBind(this.name, this.type.replaceTypeVariables(replacements, free), this.domain);
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

    static mergeDomain(domain: Type[], other: Type[]): Type[] {
        if (domain.length === 0) {
            return other;
        }
        if (other.length === 0) {
            return domain;
        }
        let res: Type[] = [];
        for (let i of domain) {
            for (let j of other) {
                if (i.equals(j)) {
                    res.push(i);
                }
            }
        }
        return res;
    }

    constructor(public name: string, public position: number = 0, public domain: Type[] = []) {
        super();
        this.isFree = false;
    }

    makeFree(): Type {
        let res = new TypeVariable(this.name, this.position, this.domain);
        res.isFree = true;
        return res;
    }

    flatten(repl: Map<string, Type>): Type {
        if (this.domain.length > 0) {
            repl = repl.set(this.name, this.domain[0]);
            return this.domain[0];
        }
        if (repl.has(this.name)) {
            return <Type> repl.get(this.name);
        }
        return this;
    }

    propagate(domains: Map<string, Type[]> = new Map<string, Type[]>()): Type {
        let dom: Type[] = [];
        if (domains.has(this.name)) {
            dom = <Type[]> domains.get(this.name);
        }
        let res = new TypeVariable(this.name, this.position, dom);
        res.isFree = this.isFree;
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
                'Type clash. An expression of type "' + this.normalize()[0]
                + '" cannot have type "' + (<[Type, boolean]> tyVarBnd.get(this.name))[0].normalize()[0]
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
                if (ths.name === oth.name) {
                    let ndomain = TypeVariable.mergeDomain(ths.domain, oth.domain);
                    if (ndomain.length === 0 && ths.domain.length + oth.domain.length > 0) {
                        throw ['Cannot merge domains of "' + ths.normalize(0, {'strictMode': false})[0]
                            + '" and "' + other.normalize(0, {'strictMode': false})[0]
                            + '" ({' + ths.domain + '} and {' + oth.domain + '})'];
                    }
                    let res = new TypeVariable(ths.name, ths.position, ndomain);
                    res.isFree = ths.isFree && oth.isFree;
                    return [res, tyVarBnd];
                } else {
                    let repl = new Map<string, string>();
                    let rs = ths;
                    if (ths.name < oth.name) {
                        ths.domain = TypeVariable.mergeDomain(ths.domain, oth.domain);
                        repl.set(oth.name, ths.name);
                    } else {
                        oth.domain = TypeVariable.mergeDomain(ths.domain, oth.domain);
                        repl.set(ths.name, oth.name);
                        rs = oth;
                    }
                    if (rs.domain.length === 0 && ths.domain.length + oth.domain.length > 0) {
                        throw ['Cannot merge domains of "' + this.normalize(0, {'strictMode': false})[0]
                            + '" and "' + other.normalize(0, {'strictMode': false})[0]
                            + '". ({' + ths.domain + '} and {' + oth.domain + '})'];
                    }
                    let nvb = new Map<string, [Type, boolean]>();
                    tyVarBnd.forEach((val: [Type, boolean], key: string) => {
                        nvb = nvb.set(key, [val[0].replaceTypeVariables(repl), val[1]]);
                    });
                    rs.isFree = ths.isFree && oth.isFree;
                    if (ths.name < oth.name) {
                        nvb.set(oth.name, [ths, rs.isFree]);
                    } else {
                        nvb.set(ths.name, [oth, rs.isFree]);
                    }
                    let dm = rs.domain;
                    if (nvb.has('$' + ths.name)) {
                        dm = TypeVariable.mergeDomain(dm,
                            (<[TypeVariable, boolean]> nvb.get('$' + ths.name))[0].domain);
                    }
                    if (nvb.has('$' + oth.name)) {
                        dm = TypeVariable.mergeDomain(dm,
                            (<[TypeVariable, boolean]> nvb.get('$' + oth.name))[0].domain);
                    }
                    nvb.set('$' + ths.name, [new TypeVariable(ths.name, -1, dm), rs.isFree]);
                    nvb.set('$' + oth.name, [new TypeVariable(oth.name, -1, dm), rs.isFree]);

                    return [rs, nvb];
                }
            } else {
                let otv = oth.getTypeVariables();
                if (otv.has((<TypeVariable> ths).name)) {
                    // console.log(otv);
                    // console.log(ths);
                    throw new ElaborationError(-1,
                        'Type clash. An expression of type "' + (<TypeVariable> ths).normalize()[0]
                        + '" cannot have type "' + oth.normalize()[0] + '" because of circularity.');
                }
                if (ths.isFree) {
                    oth = oth.makeFree();
                }
                if (ths.admitsEquality(state) && !oth.admitsEquality(state)) {
                    let nt = oth.makeEqType(state, tyVarBnd);
                    if (!nt[0].admitsEquality(state)) {
                        throw ['Type "' + oth.normalize()[0] + '" does not admit equality.', ths, oth];
                    } else {
                        oth = nt[0];
                        tyVarBnd = nt[1];
                    }
                }
                if (ths.domain.length > 0 && TypeVariable.mergeDomain(ths.domain, [oth]).length === 0) {
                    throw ['Type "' + oth.normalize(0, {'strictMode': false})[0]
                        + '" is not part of the domain of "'
                        + ths.normalize(0, {'strictMode': false})[0] + '" ({'
                        + ths.domain + '}).'];
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
            let n = new TypeVariable('\'' + this.name, this.position, this.domain);
            n.isFree = this.isFree;
            tyVarBnd = tyVarBnd.set(n.name, [tmp[0], n.isFree]);
        }
        let nt = new TypeVariable('\'' + this.name, this.position, this.domain);
        return [nt, tyVarBnd.set(this.name, [nt, this.isFree])];
    }

    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        let res = new Map<string, Type[]>();
        if (!free || this.isFree) {
            res = res.set(this.name, this.domain);
        }
        return res;
    }

    getOrderedTypeVariables(): string[] {
        return [this.name];
    }

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string> = new Set<string>()): Type {
        if (replacements.has(this.name)) {
            let res = new TypeVariable(<string> replacements.get(this.name), 0, this.domain);
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

    getDomain(state: State): Domain {
        let res = new Map<string, Domain>();

        this.elements.forEach((val: Type, key: string) => {
            res = res.set(key, val.getDomain(state));
        });

        return new Domain(res);
    }

    checkExhaustiveness(state: State, tyVarBnd: Map<string, [Type, boolean]>, position: number, match:
        [Pattern & Expression, Expression][]): Warning[] {

        let needsCatchAll = new Map<string, boolean>();
        let domains = new Map<string, Domain>();
        this.elements.forEach((val: Type, key: string) => {
            domains = domains.set(key, val.getDomain(state));
        });

        this.elements.forEach((val: Type, key: string) => {
            needsCatchAll = needsCatchAll.set(key, (<Domain> domains.get(key)).isInfinite());
        });

        let found: Domain[] = [];
        for (let i = 0; i < match.length; ++i) {
            let fnsh = false;
            let cur = new Map<string, Domain>();
            if (match[i][0] instanceof Record) {
                fnsh = true;
                this.elements.forEach((val: Type, key: string) => {
                    let tmp = (<Pattern&Expression> (<Record> match[i][0]).getEntry(
                        key)).getMatchedValues(state, tyVarBnd);
                    fnsh = fnsh && (tmp.entries === undefined);
                    cur = cur.set(key, (tmp.entries === undefined && needsCatchAll.get(key) !== true) ?
                        (<Domain> domains.get(key)) : tmp);
                });
                if (fnsh && i === match.length - 1) {
                    return [];
                } else if (fnsh) {
                    return [new Warning(position, 'Some cases are unused in this match.\n')];
                }
                found.push(new Domain(cur));
            }

            if (((match[i][0] instanceof ValueIdentifier || match[i][0] instanceof Wildcard
                || match[i][0] instanceof LayeredPattern || match[i][0] instanceof TypedExpression)
                && match[i][0].getMatchedValues(state, tyVarBnd).entries === undefined)) {
                if (i !== match.length - 1) {
                    return [new Warning(position, 'Some cases are unused in this match.\n')];
                }
                return [];
            }
        }

        return this.getDomain(state).match(position, found);
    }

    makeFree(): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.makeFree());
        });
        return new RecordType(newElements, this.complete, this.position);
    }

    flatten(repl: Map<string, Type>): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.flatten(repl));
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

    qualify(state: State, qualifiers: LongIdentifierToken): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.qualify(state, qualifiers));
        });
        return new RecordType(newElements, this.complete, this.position);
    }

    propagate(domains: Map<string, Type[]> = new Map<string, Type[]>()): Type {
        let newElements: Map<string, Type> = new Map<string, Type>();
        this.elements.forEach((type: Type, key: string) => {
            newElements.set(key, type.propagate(domains));
        });
        return new RecordType(newElements, this.complete, this.position);
    }

    merge(state: State, tyVarBnd: Map<string, [Type, boolean]>, other: Type): [Type, Map<string, [Type, boolean]>] {
        if (other instanceof TypeVariable || other instanceof AnyType) {
            return other.merge(state, tyVarBnd, this);
        }

        other = other.instantiate(state, tyVarBnd);

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
                    if (!(<RecordType> other).elements.has(key)) {
                        throw ['Records don\'t agree on members ("' + key
                            + '" occurs only once.)', this.instantiate(state, tybnd),
                            other.instantiate(state, tybnd)];
                    }
                });
            }

            return [new RecordType(rt, this.complete || other.complete, this.position), tybnd];
        }

        // Merging didn't work
        throw ['Cannot merge "' + this.instantiate(state, tyVarBnd).normalize()[0] + '" and "'
            + other.instantiate(state, tyVarBnd).normalize()[0] + '".', this.constructor.name,
            other.constructor.name];
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

    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        let res = new Map<string, Type[]>();
        this.elements.forEach((val: Type) => {
            val.getTypeVariables(free).forEach((dom: Type[], id: string) => {
                if (res.has(id)) {
                    res = res.set(id, TypeVariable.mergeDomain(dom, <Type[]> res.get(id)));
                } else {
                    res = res.set(id, dom);
                }
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
        return new RecordType(rt, this.complete, 0);
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
        let isTuple = this.elements.size !== 1;
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
                if (sub instanceof FunctionType ||
                    (sub instanceof RecordType && (<RecordType> sub).elements.size !== 0)) {
                    res += '(' + sub + ')';
                } else {
                    res += sub;
                }
            }
            return res + '';
        }

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
        }

        let res = true;
        this.elements.forEach((val: Type, name: string) => {
            if (!val.equals(other.elements.get(name))) {
                res = false;
            }
        });
        other.elements.forEach((val: Type, name: string) => {
            if (!val.equals(this.elements.get(name))) {
                res = false;
            }
        });
        return res;
    }
}

export class FunctionType extends Type {
    constructor(public parameterType: Type, public returnType: Type, public position: number = 0) {
        super();
    }

    makeFree(): Type {
        return new FunctionType(this.parameterType.makeFree(), this.returnType.makeFree(), this.position);
    }

    flatten(repl: Map<string, Type>): Type {
        return new FunctionType(this.parameterType.flatten(repl), this.returnType.flatten(repl), this.position);
    }

    instantiate(state: State, tyVarBnd: Map<string, [Type, boolean]>, seen: Set<string> = new Set<string>()): Type {
        return new FunctionType(this.parameterType.instantiate(state, tyVarBnd, seen),
            this.returnType.instantiate(state, tyVarBnd, seen), this.position);
    }

    qualify(state: State, qualifiers: LongIdentifierToken): Type {
        return new FunctionType(this.parameterType.qualify(state, qualifiers),
            this.returnType.qualify(state, qualifiers), this.position);
    }

    propagate(domains: Map<string, Type[]> = new Map<string, Type[]>()): Type {
        return new FunctionType(this.parameterType.propagate(domains),
            this.returnType.propagate(domains), this.position);
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
        throw ['Cannot merge "' + this.instantiate(state, tyVarBnd).normalize()[0] + '" and "'
            + other.instantiate(state, tyVarBnd).normalize()[0] + '".', this.constructor.name,
            other.constructor.name];
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        return [this, tyVarBnd];
    }

    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        let res = new Map<string, Type[]>();
        this.parameterType.getTypeVariables(free).forEach((dom: Type[], id: string) => {
            if (res.has(id)) {
                res = res.set(id, TypeVariable.mergeDomain(dom, <Type[]> res.get(id)));
            } else {
                res = res.set(id, dom);
            }
        });
        this.returnType.getTypeVariables(free).forEach((dom: Type[], id: string) => {
            if (res.has(id)) {
                res = res.set(id, TypeVariable.mergeDomain(dom, <Type[]> res.get(id)));
            } else {
                res = res.set(id, dom);
            }
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
        return new FunctionType(res, res2, 0);
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
export class CustomType extends Type {
    constructor(public name: string,
                public typeArguments: Type[] = [],
                public position: number = 0,
                public qualifiedName: LongIdentifierToken | undefined = undefined,
                public opaque: boolean = false,
                public id: number = 0) {
        super();
    }

    getDomain(state: State): Domain {
        let tp = state.getStaticType(this.name);
        if (this.qualifiedName !== undefined) {
            let reslv = state.getAndResolveStaticStructure(this.qualifiedName);
            if (reslv !== undefined) {
                tp = reslv.getType(this.name);
            } else {
                tp = undefined;
            }
        }
        if (tp === undefined) {
            throw new ElaborationError(this.position, 'Mi…sa…Mi…sa…ka…MisakaMisakaMisakaMisaka');
        }

        if (tp.constructors.length === 0) {
            return new Domain(undefined);
        } else {
            return new Domain(tp.constructors);
        }
    }

    checkExhaustiveness(state: State, tyVarBnd: Map<string, [Type, boolean]>, position: number, match:
        [Pattern & Expression, Expression][]): Warning[] {

        let tp = state.getStaticType(this.name);
        if (this.qualifiedName !== undefined) {
            let reslv = state.getAndResolveStaticStructure(this.qualifiedName);
            if (reslv !== undefined) {
                tp = reslv.getType(this.name);
            } else {
                tp = undefined;
            }
        }
        if (tp === undefined) {
            throw new ElaborationError(position, 'Mi…sa…Mi…sa…ka…MisakaMisakaMisakaMisaka');
        }
        let found = new Map<string, boolean>();
        for (let i = 0; i < tp.constructors.length; ++i) {
            found = found.set(tp.constructors[i], false);
        }

        let needCatchAll = tp.constructors.length === 0;
        let hasCatchAll = false;

        let needExtraWork = new Map<string, [Pattern & Expression, Expression][]>();
        let redun = false;

        for (let i = 0; i < match.length; ++i) {
            if (hasCatchAll) {
                return [new Warning(match[i][0].position,
                    'Some cases are unused in this match.')];
            }
            if (match[i][0] instanceof FunctionApplication) {
                let cn = (<ValueIdentifier> (<FunctionApplication> match[i][0]).func).name.getText();
                if (((<ValueIdentifier> (<FunctionApplication> match[i][0]).func).name)
                    instanceof LongIdentifierToken) {
                    cn = (<LongIdentifierToken> (<ValueIdentifier> (<FunctionApplication>
                        match[i][0]).func).name).id.getText();
                }

                let old: [Pattern & Expression, Expression][] = [];
                if (needExtraWork.has(cn)) {
                    old = <[Pattern & Expression, Expression][]> needExtraWork.get(cn);
                }
                old.push([<Pattern & Expression> (<FunctionApplication> match[i][0]).argument, match[i][1]]);
                needExtraWork = needExtraWork.set(cn, old);
                continue;
            }

            let tmp = match[i][0].getMatchedValues(state, tyVarBnd).entries;
            if (tmp === undefined) {
                hasCatchAll = true;
                continue;
            }
            if (tmp instanceof Map) {
                throw new ElaborationError(position, 'Anpan.');
            }
            for (let j of tmp) {
                if (found.has(j)) {
                    if (found.get(j) === true) {
                        redun = true;
                    }
                    found = found.set(j, true);
                }
            }
        }

        let result: Warning[] = [];
        needExtraWork.forEach((val: [Pattern & Expression, Expression][], key: string) => {
            let cinf = state.getStaticValue(key);
            let reslv: StaticBasis | undefined = undefined;
            if (this.qualifiedName !== undefined) {
                reslv = state.getAndResolveStaticStructure(this.qualifiedName);
                if (reslv !== undefined) {
                    cinf = reslv.getValue(key);
                } else {
                    cinf = undefined;
                }
            }
            if (cinf === undefined || cinf[1] === 0) {
                throw new ElaborationError(position, 'Unacceptable.');
            }
            let ctp = cinf[0];
            while (ctp instanceof TypeVariableBind) {
                ctp = (<TypeVariableBind> ctp).type;
            }
            if (this.qualifiedName !== undefined) {
                ctp = ctp.qualify(new State(0, undefined, <StaticBasis> reslv,
                    new DynamicBasis({}, {}, {}, {}, {}), [0, {}]), this.qualifiedName);
            }
            if (!(ctp instanceof FunctionType)) {
                throw new ElaborationError(position, 'Unacceptable.');
            }

            let rt = ctp.returnType.merge(state, new Map<string, [Type, boolean]>(), this);
            ctp = ctp.parameterType.instantiate(state, rt[1]);
            let tmp = ctp.checkExhaustiveness(state, tyVarBnd, position, val);

            let bad = false;
            for (let e of tmp) {
                if (e.message.includes('non-exhaustive')) {
                    bad = true;
                } else {
                    result.push(new Warning(e.position, 'Constructor "' + key + '": ' + e.message));
                }
            }
            if (!bad) {
                if (found.has(key)) {
                    if (found.get(key) === true) {
                        redun = true;
                    }
                    found = found.set(key, true);
                }
            }
        });

        let ok = !needCatchAll || hasCatchAll;
        let missing: string[] = [];
        found.forEach((val: boolean, key: string) => {
            if (!val) {
                missing.push(key);
                ok = false;
            }
        });

        if (!ok) {
            let res = '';
            for (let i = 0; i < missing.length; ++i) {
                if (i > 0) {
                    res += ', ';
                }
                res += '"' + missing[i] + '"';
            }
            if (missing.length > 1) {
                res = ' (Rules for constructors ' + res + ' are non-exhaustive.)\n';
            } else if (missing.length > 0) {
                res = ' (Rules for constructor ' + res + ' are non-exhaustive.)\n';
            } else {
                res = '\n';
            }

            if (!hasCatchAll) {
                result = result.concat([new Warning(position, 'Pattern matching is non-exhaustive.' + res)]);
            }
        }

        if (redun) {
            result.push(new Warning(position, 'Some cases are unused in this match.'));
        }

        return result;
    }

    isOpaque(): boolean {
        return this.opaque;
    }

    getOpaqueName(): string {
        if (this.isOpaque) {
            return this.name;
        } else {
            return 'undefined';
        }
    }

    makeFree(): Type {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].makeFree());
        }
        return new CustomType(this.name, res, this.position,
            this.qualifiedName, this.opaque, this.id);
    }

    flatten(repl: Map<string, Type>): Type {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].flatten(repl));
        }
        return new CustomType(this.name, res, this.position,
            this.qualifiedName, this.opaque, this.id);
    }

    qualify(state: State, qualifiers: LongIdentifierToken): Type {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].qualify(state, qualifiers));
        }
        let rs = new CustomType(this.name, res, this.position,
            this.qualifiedName, this.opaque, this.id);

        let tp = state.getStaticType(this.name);
        if (tp !== undefined) {
            rs.qualifiedName = qualifiers;
        }
        return rs;
    }

    propagate(domains: Map<string, Type[]> = new Map<string, Type[]>()): Type {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].propagate(domains));
        }
        return new CustomType(this.name, res, this.position,
            this.qualifiedName, this.opaque, this.id);
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
                let tyvars = tp.type.getTypeVariables();
                let nnm = 1;
                let repl = new Map<string, string>();

                tyvars.forEach((val: Type[], key: string) => {
                    // TODO: Test that this is enough, i.e. we don't need to ensure that
                    // the generated new names don't exist
                    repl = repl.set(key, '\'*q' + nnm);
                    ++nnm;
                });

                let ntype = <FunctionType> tp.type.replaceTypeVariables(repl);
                let mt = this.merge(state, tyVarBnd, ntype.parameterType, true);
                let newstate = state.getNestedState(state.id);
                newstate.setStaticType(this.name, ntype.returnType, [], -1);
                return ntype.returnType.instantiate(newstate, mt[1]);
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(-1, 'Instantiating "' + this.normalize()[0]
                    + '" failed: ' + e[0]);
            }
        } else if (tp === undefined) {
            if (this.id > 0) {
                throw new ElaborationError(-1, 'Unbound type "' + this.name + '/' + this.id + '".');
            }
            throw new ElaborationError(-1, 'Unbound type "' + this.name + '".');
        } else if (tp !== undefined && tp.type.isOpaque()) {
            this.opaque = true;
        } else if (tp !== undefined && ((!(tp.type instanceof CustomType))
            || this.typeArguments.length !== (<CustomType> tp.type).typeArguments.length)) {
            throw new ElaborationError(this.position, 'Arity mismatch: '
                + this.normalize()[0] + ' vs ' + tp.type.normalize()[0] + '.');
        } else if (tp !== undefined && ((!(tp.type instanceof CustomType))
            || this.id > (<CustomType> tp.type).id)) {
            if (this.id > 0) {
                throw new ElaborationError(-1, 'Unbound type "' + this.name + '/' + this.id + '".');
            }
            throw new ElaborationError(-1, 'Unbound type "' + this.name + '".');
        }

        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].instantiate(state, tyVarBnd, seen));
        }
        return new CustomType(this.name, res, this.position,
            this.qualifiedName, this.opaque, this.id);
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
        let ths2 = <CustomType> ths;

        if (oth instanceof CustomType && ths2.name === (<CustomType> oth).name
            && ths2.id === (<CustomType> oth).id) {

            let res: Type[] = [];
            let tybnd = tyVarBnd;
            for (let i = 0; i < (<CustomType> ths).typeArguments.length; ++i) {
                let tmp = (<CustomType> ths).typeArguments[i].merge(state,
                    tybnd, oth.typeArguments[i]);
                res.push(tmp[0]);
                tybnd = tmp[1];
            }

            return [new CustomType(ths2.name, res, ths2.position, ths2.qualifiedName,
                ths2.opaque, ths2.id), tybnd];
        }

        // Merging didn't work
        throw ['Cannot merge "' + this.instantiate(state, tyVarBnd).normalize()[0] + '" and "'
            + other.instantiate(state, tyVarBnd).normalize()[0] + '".', this.constructor.name,
            other.constructor.name];
    }

    makeEqType(state: State, tyVarBnd: Map<string, [Type, boolean]>): [Type, Map<string, [Type, boolean]>] {
        let res: Type[] = [];
        for (let i = 0; i < this.typeArguments.length; ++i) {
            let tmp = this.typeArguments[i].makeEqType(state, tyVarBnd);
            res.push(tmp[0]);
            tyVarBnd = tmp[1];
        }
        return [new CustomType(this.name, res, this.position,
            this.qualifiedName, this.opaque, this.id), tyVarBnd];
    }

    getTypeVariables(free: boolean = false): Map<string, Type[]> {
        let res = new Map<string, Type[]>();
        if (this.typeArguments.length > 0) {
            for (let i = 0; i < this.typeArguments.length; ++i) {
                this.typeArguments[i].getTypeVariables(free).forEach((dom: Type[], id: string) => {
                    if (res.has(id)) {
                        res = res.set(id, TypeVariable.mergeDomain(dom, <Type[]> res.get(id)));
                    } else {
                        res = res.set(id, dom);
                    }
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

    replaceTypeVariables(replacements: Map<string, string>, free: Set<string>): Type {
        let rt: Type[] = [];

        for (let i = 0; i < this.typeArguments.length; ++i) {
            rt.push(this.typeArguments[i].replaceTypeVariables(replacements, free));
        }
        return new CustomType(this.name, rt, 0,
            this.qualifiedName, this.opaque, this.id);
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
            || (this.typeArguments.length === 1 && (this.typeArguments[0] instanceof FunctionType
            || this.typeArguments[0] instanceof RecordType))) {
            result += '(';
        }
        for (let i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i];
        }
        if (this.typeArguments.length > 1
            || (this.typeArguments.length === 1 && (this.typeArguments[0] instanceof FunctionType
            || this.typeArguments[0] instanceof RecordType))) {
            result += ')';
        }
        if (this.typeArguments.length > 0) {
            result += ' ';
        }
        if (this.qualifiedName !== undefined) {
            for (let i = 0; i < this.qualifiedName.qualifiers.length; ++i) {
                result += this.qualifiedName.qualifiers[i].getText() + '.';
            }
        }
        result += this.name;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        return result;
    }

    simplify(): Type {
        let args: Type[] = [];
        for (let i: number = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].simplify());
        }
        return new CustomType(this.name, args, this.position,
            this.qualifiedName, this.opaque, this.id);
    }

    equals(other: any): boolean {
        if (other instanceof AnyType) {
            return true;
        }
        if (!(other instanceof CustomType) || this.name !== other.name || this.id !== other.id) {
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
