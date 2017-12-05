import { TypeVariable, RecordType, Type, FunctionType, CustomType, AnyType, TypeVariableBind, Domain } from './types';
import { Declaration, ValueBinding, ValueDeclaration } from './declarations';
import { Token, IdentifierToken, ConstantToken, IntegerConstantToken, RealConstantToken,
         NumericToken, WordConstantToken, CharacterConstantToken, StringConstantToken,
         LongIdentifierToken } from './tokens';
import { State, IdentifierStatus } from './state';
import { InternalInterpreterError, ElaborationError, EvaluationError, ParserError, Warning } from './errors';
import { Value, CharValue, StringValue, Integer, Real, Word, ValueConstructor,
         ExceptionConstructor, PredefinedFunction, RecordValue, FunctionValue,
         ExceptionValue, ConstructedValue, ReferenceValue } from './values';
import { EvaluationResult, EvaluationParameters, EvaluationStack, IdCnt } from './evaluator';

export abstract class Expression {
    position: number;

    getType(state: State,
            tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string            = '\'*t0',
            tyVars: Set<string>         = new Set<string>(),
            forceRebind: boolean       = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {
        throw new InternalInterpreterError(this.position, 'Called "getType" on a derived form.');
    }

    // Computes the value of an expression, returns [computed value, is thrown exception]
    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        throw new InternalInterpreterError(this.position, 'Called "getValue" on a derived form.');
    }

    // Returns whether the expression could do nasty stuff (value polymorphism ...)
    isSafe(state: State): boolean {
        return true;
    }

    getExplicitTypeVariables(): Set<TypeVariable> {
        return new Set<TypeVariable>();
    }

    toString(): string {
        throw new InternalInterpreterError(this.position,
            'You humans can\'t seem to write bug-free code. What an inferior species.');
    }

    abstract simplify(): Expression;
}


export interface Pattern {
    // Returns which bindings would be created by matching v to this Pattern,
    // or undefined, if v does not match this Pattern.
    position: number;
    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>];
    matches(state: State, v: Value): [string, Value][] | undefined;
    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain;
    simplify(): PatternExpression;
    toString(indentation: number, oneLine: boolean): string;
}

export type PatternExpression = Pattern & Expression;

export class Constant extends Expression implements Pattern {
    constructor(public position: number, public token: ConstantToken) { super(); }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        return new Domain([]);
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        return [[], this.getType(state, tyVarBnd)[0], tyVarBnd];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        // the call to compute just gets two states but will not use them
        let val = this.compute({'state': state, 'modifiable': state, 'recResult': undefined}, []);
        if (val === undefined || val.value === undefined) {
            throw new InternalInterpreterError(this.token.position,
                'How is this undefined?');
        }
        if ((<Value> val.value).equals(v)) {
            return [];
        } else {
            return undefined;
        }
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            return [new CustomType('int'), [], nextName, tyVars, tyVarBnd,
                state.valueIdentifierId];
        } else if (this.token instanceof RealConstantToken) {
            return [new CustomType('real'), [], nextName, tyVars, tyVarBnd,
                state.valueIdentifierId];
        } else if (this.token instanceof WordConstantToken) {
            return [new CustomType('word'), [], nextName, tyVars, tyVarBnd,
                state.valueIdentifierId];
        } else if (this.token instanceof CharacterConstantToken) {
            return [new CustomType('char'), [], nextName, tyVars, tyVarBnd,
                state.valueIdentifierId];
        } else if (this.token instanceof StringConstantToken) {
            return [new CustomType('string'), [], nextName, tyVars, tyVarBnd,
                state.valueIdentifierId];
        } else {
            throw new InternalInterpreterError(this.token.position,
                '"' + this + '" does not seem to be a valid constant.');
        }
    }

    simplify(): Constant { return this; }

    toString(): string {
        return this.token.getText();
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let val: Value | undefined = undefined;
        if (this.token instanceof IntegerConstantToken || this.token instanceof NumericToken) {
            val = new Integer((<IntegerConstantToken | NumericToken> this.token).value);
        } else if (this.token instanceof RealConstantToken) {
            val = new Real((<RealConstantToken> this.token).value);
        } else if (this.token instanceof WordConstantToken) {
            val = new Word((<WordConstantToken> this.token).value);
        } else if (this.token instanceof CharacterConstantToken) {
            val = new CharValue((<CharacterConstantToken> this.token).value);
        } else if (this.token instanceof StringConstantToken) {
            val = new StringValue((<StringConstantToken> this.token).value);
        }

        if (val === undefined) {
            throw new EvaluationError(this.token.position, 'You sure that this is a constant?');
        }

        return {
            'newState': undefined,
            'value': val,
            'hasThrown': false,
        };
    }
}

export class ValueIdentifier extends Expression implements Pattern {
// op longvid or longvid
    constructor(public position: number, public name: Token) { super(); }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        let val = state.getStaticValue(this.name.getText());
        if (this.name instanceof LongIdentifierToken) {
            let reslv = state.getAndResolveStaticStructure(this.name);
            if (reslv !== undefined) {
                val = reslv.getValue(this.name.id.getText());
            } else {
                val = undefined;
            }
        }
        if (val !== undefined && val[1] === IdentifierStatus.VALUE_VARIABLE) {
            return new Domain(undefined);
        } else if (val === undefined && tyVarBnd.has('\'**' + this.name.getText())) {
            return new Domain(undefined);
        } else if (val === undefined) {
            throw new ElaborationError(this.position, 'RAINBOW!');
        }

        if (this.name instanceof LongIdentifierToken) {
            return new Domain([this.name.id.getText()]);
        }

        return new Domain([this.name.getText()]);
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let res: [Type, IdentifierStatus] | undefined = undefined;
        if (this.name instanceof LongIdentifierToken) {
            let st = state.getAndResolveStaticStructure(<LongIdentifierToken> this.name);
            if (st !== undefined) {
                res = st.getValue((<LongIdentifierToken> this.name).id.getText());
                if (res !== undefined) {
                    let nst = new State(0, undefined, st, state.dynamicBasis, [0, {}]);
                    res = [res[0].qualify(nst, this.name), res[1]];
                }
            }
        } else {
            res = state.getStaticValue(this.name.getText());
        }

        let mps = tyVarBnd;
        let bnd = false;
        if (res === undefined || res[1] === IdentifierStatus.VALUE_VARIABLE) {
            let tv = new TypeVariable('\'**' + this.name.getText());
            if (forceRebind) {
                res = [new TypeVariableBind('\'**' + this.name.getText(), tv), 0];
                bnd = true;
            } else if (tyVarBnd.has(tv.name)) {
                let tmp = (<[Type, boolean]> tyVarBnd.get(tv.name))[0].instantiate(
                    state, mps);
                return [tmp, [], nextName, tyVars, mps, state.valueIdentifierId];
            } else if (res === undefined) {
                throw new ElaborationError(this.position, 'Unbound value identifier "'
                    + this.name.getText() + '".');
            }
        }

        let vars = new Set<string>();
        let frees = new Set<string>();
        let repl = new Map<string, string>();
        while (res[0] instanceof TypeVariableBind) {
            if ((<TypeVariableBind> res[0]).isFree) {
                frees = frees.add((<TypeVariableBind> res[0]).name);
                repl.set((<TypeVariableBind> res[0]).name, (<TypeVariableBind> res[0]).name);
            } else {
                vars = vars.add((<TypeVariableBind> res[0]).name);
            }
            res[0] = (<TypeVariableBind> res[0]).type;
        }

        // force generating another new name
        vars = vars.add('*');

        let nwvar: string[] = [];

        vars.forEach((val: string) => {
            let cur = (+nextName.substring(3)) + 1;
            let nm = '';
            for (; ; ++cur) {
                nextName = '\'' + nextName[1] + nextName[2] + cur;
                if (!vars.has(nextName) && !tyVars.has(nextName) && !tyVarBnd.has(nextName)
                    && state.getStaticValue(nextName) === undefined) {
                    if (val[1] === '\'') {
                        nm = '\'' + nextName;
                    } else {
                        nm = nextName;
                    }
                    nwvar.push(nm);
                    repl = repl.set(val, nm);
                    break;
                }
            }
        });
        for (let i = 0; i < nwvar.length; ++i) {
            tyVars = tyVars.add(nwvar[i]);
        }

        let r2 = res[0].replaceTypeVariables(repl, frees).instantiate(state, mps);

        if (bnd) {
            mps = mps.set('\'**' + this.name.getText(), [r2, false]);
        }
        return [r2, [], nextName, tyVars, mps, state.valueIdentifierId];
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        if (this.name instanceof LongIdentifierToken) {
            throw new ElaborationError(this.position, 'Variable names in patterns cannot be qualified.');
        }

        let res = state.getStaticValue(this.name.getText());

        if (res === undefined || res[1] === IdentifierStatus.VALUE_VARIABLE) {
            return [[[this.name.getText(), t.instantiate(state, tyVarBnd)]],
                t.instantiate(state, tyVarBnd), tyVarBnd];
        }

        let tmp = this.getType(state, tyVarBnd, '\'*g0');
        tmp[3].forEach((val: string) => {
            let nname = '\'*p' + val.substring(3);
            if (val[1] === '\'') {
                nname = '\'\'*p' + val.substring(4);
            }
            tmp[4] = tmp[4].set(val, [new TypeVariable(nname), false]);
        });
        res[0] = tmp[0];
        tyVarBnd = tmp[4];

        try {
            let rt = t.merge(state, tyVarBnd, res[0]);
            return [[], rt[0], rt[1]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position,
                'Type clash: "' + t.normalize()[0] + '" vs. "'
                + res[0].normalize()[0] + '": ' + e[0]);
        }
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (this.name instanceof LongIdentifierToken) {
            throw new EvaluationError(this.position, 'Variable names in patterns cannot be qualified.');
        }

        let res = state.getDynamicValue(this.name.getText());
        if (res === undefined || res[1] === IdentifierStatus.VALUE_VARIABLE) {
            return [[this.name.getText(), v]];
        }
        if (v.equals(res[0])) {
            return [];
        }
        return undefined;
    }

    simplify(): ValueIdentifier { return this; }

    toString(): string {
        return this.name.getText();
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        let res: [Value, IdentifierStatus] | undefined = undefined;
        if (this.name instanceof LongIdentifierToken) {
            let st = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.name);
            if (st !== undefined) {
                res = st.getValue((<LongIdentifierToken> this.name).id.getText());
            }
        } else {
            res = state.getDynamicValue(this.name.getText());
        }

        if (res === undefined) {
            throw new EvaluationError(this.position, 'Unbound value identifier "'
                + this.name.getText() + '".');
        }

        if (res[1] === IdentifierStatus.VALUE_CONSTRUCTOR
            && (<ValueConstructor> res[0]).numArgs === 0) {
            return {
                'newState': undefined,
                'value': (<ValueConstructor> res[0]).construct(),
                'hasThrown': false,
            };
        }
        if (res[1] === IdentifierStatus.EXCEPTION_CONSTRUCTOR
            && (<ExceptionConstructor> res[0]).numArgs === 0) {
            return {
                'newState': undefined,
                'value': (<ExceptionConstructor> res[0]).construct(),
                'hasThrown': false,
            };
        }

        return {
            'newState': undefined,
            'value': res[0],
            'hasThrown': false,
        };
    }
}

export class Record extends Expression implements Pattern {
// { lab = exp, ... } or { }
// a record(pattern) is incomplete if it ends with '...'
    constructor(public position: number, public complete: boolean,
                public entries: [string, Expression|PatternExpression][]) {
        super();
        this.entries.sort();
        for (let i = 1; i < this.entries.length; ++i) {
            if (this.entries[i][0] === this.entries[i - 1][0]) {
                throw new ElaborationError(this.position,
                    'Label "' + this.entries[i][0] + '" occurs more than once in the same record.');
            }
        }
    }

    getExplicitTypeVariables(): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        for (let i = 0; i < this.entries.length; ++i) {
            this.entries[i][1].getExplicitTypeVariables().forEach((val: TypeVariable) => {
                res = res.add(val);
            });
        }
        return res;
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        let res = new Map<string, Domain>();
        let def = false;
        for (let i of this.entries) {
            res = res.set(i[0], (<PatternExpression> i[1]).getMatchedValues(state, tyVarBnd));
            def = def || ((<Domain> res.get(i[0])).entries !== undefined);
        }
        if (!def) {
            return new Domain(undefined);
        }
        return new Domain(res);
    }

    getEntry(name: string): Expression | PatternExpression {
        for (let i = 0; i < this.entries.length; ++i) {
            if (this.entries[i][0] === name) {
                return this.entries[i][1];
            }
        }
        throw new InternalInterpreterError(this.position,
            'Yeah, "' + name + '" would be nice to have.');
    }

    isSafe(state: State): boolean {
        for (let i = 0; i < this.entries.length; ++i) {
            if (!this.entries[i][1].isSafe(state)) {
                return false;
            }
        }
        return true;
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        if (!(t instanceof RecordType)) {
            t = t.instantiate(state, tyVarBnd);
        }
        if (t instanceof TypeVariable) {
            let ntype = new Map<string, Type>();
            for (let i = 0; i < this.entries.length; ++i) {
                let ntv = new TypeVariable((<TypeVariable> t).name + '*' + i);
                ntv.isFree = (<TypeVariable> t).isFree;
                ntype = ntype.set(this.entries[i][0], ntv);
            }
            let tp = new RecordType(ntype, this.complete);
            tyVarBnd = tyVarBnd.set(t.name, [tp, t.isFree]);
            t = tp;
        }


        if (!(t instanceof RecordType)) {
            throw new ElaborationError(this.position,
                'Expected pattern of a record type, got "' + t.constructor.name + '".');
        }
        if (this.complete && this.entries.length !== (<RecordType> t).elements.size) {
            throw new ElaborationError(this.position,
                'Expected a record type with ' + this.entries.length + ' entries,'
                + ' but the given one has ' + (<RecordType> t).elements.size + '.');
        }

        let res: [string, Type][] = [];
        let rtp = new Map<string, Type>();
        let bnd = tyVarBnd;

        for (let i = 0; i < this.entries.length; ++i) {
            if (!(<RecordType> t).hasType(this.entries[i][0])) {
                throw new ElaborationError(this.position, 'I am mad scientist. Sunovabitch!');
            }
            let cur = (<PatternExpression> this.entries[i][1]).matchType(
                state, bnd, (<RecordType> t).getType(this.entries[i][0]));

            res = res.concat(cur[0]);
            rtp = rtp.set(this.entries[i][0], cur[1]);
            bnd = cur[2];
        }
        return [res, new RecordType(rtp), bnd];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (!(v instanceof RecordValue)) {
            return undefined;
        }
        if (this.complete && this.entries.length !== (<RecordValue> v).entries.size) {
            return undefined;
        }

        let res: [string, Value][] = [];

        for (let i = 0; i < this.entries.length; ++i) {
            if (!(<RecordValue> v).hasValue(this.entries[i][0])) {
                return undefined;
            }
            let cur = (<PatternExpression> this.entries[i][1]).matches(
                state, (<RecordValue> v).getValue(this.entries[i][0]));
            if (cur === undefined) {
                return cur;
            }
            for (let j = 0; j < cur.length; ++j) {
                res.push(cur[j]);
            }
        }
        return res;
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let e: Map<string, Type> = new Map<string, Type>();
        let warns: Warning[] = [];
        let bnds = tyVarBnd;
        for (let i: number = 0; i < this.entries.length; ++i) {
            let name: string = this.entries[i][0];
            let exp: Expression = this.entries[i][1];
            if (e.has(name)) {
                throw new ElaborationError(this.position,
                    'Label "' + name + '" occurs more than once in the same record.');
            }

            if (exp instanceof ValueIdentifier) {
                let tm = state.getStaticValue((<ValueIdentifier> exp).name.getText());
                if (tm !== undefined && tm[1] !== IdentifierStatus.VALUE_VARIABLE
                    && tm[0] instanceof FunctionType) {
                    throw new ElaborationError(exp.position,
                        'Unary constructor in the pattern needs an argument.');
                }
            }


            let tmp = exp.getType(state, bnds, nextName, tyVars, forceRebind);

            warns = warns.concat(tmp[1]);
            nextName = tmp[2];
            tyVars = tmp[3];
            tmp[4].forEach((val: [Type, boolean], key: string) => {
                bnds = bnds.set(key, val);
            });
            state.valueIdentifierId = tmp[5];
            e = e.set(name, tmp[0]);
        }
        return [new RecordType(e, this.complete), warns, nextName, tyVars, bnds, state.valueIdentifierId];
    }

    simplify(): Record {
        let newEntries: [string, Expression][] = [];
        for (let i = 0; i < this.entries.length; ++i) {
            let e: [string, Expression] = this.entries[i];
            newEntries.push([e[0], e[1].simplify()]);
        }
        return new Record(this.position, this.complete, newEntries);
    }

    toString(): string {
        let result: string = '{';
        let first: boolean = true;
        for (let i = 0; i < this.entries.length; ++i) {
            if (!first) {
                result += ', ';
            }
            first = false;
            result += this.entries[i][0] + ' = '
                + this.entries[i][1];
        }
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        if (params.step === undefined) {
            params.step = -1;
            params.nentr = new Map<string, Value>();
        }

        let nentr: Map<string, Value> = params.nentr;
        let step: number = params.step;

        if (step >= 0) {
            let val = params.recResult;
            if (val === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }

            if (val.hasThrown) {
                // Computing some expression failed
                return {
                    'newState': undefined,
                    'value': val.value,
                    'hasThrown': true,
                };
            }
            nentr = nentr.set(this.entries[step][0], <Value> val.value);
        }
        ++step;
        if (step < this.entries.length) {
            params.step = step;
            params.nentr = nentr;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.entries[step][1],
                'params': {'state': state, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }

        return {
            'newState': undefined,
            'value': new RecordValue(nentr),
            'hasThrown': false,
        };
    }
}

export class LocalDeclarationExpression extends Expression {
// let dec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such,
// despite the potentially missing parentheses
    constructor(public position: number, public declaration: Declaration, public expression: Expression) { super(); }

    simplify(): LocalDeclarationExpression {
        return new LocalDeclarationExpression(this.position, this.declaration.simplify(), this.expression.simplify());
    }

    toString(): string {
        let res = 'let ' + this.declaration;
        res += ' in ' + this.expression + ' end';
        return res;
    }

    isSafe(state: State): boolean {
        return this.expression.isSafe(state);
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let nstate = state.getNestedState(state.id);
        tyVarBnd.forEach((val: [Type, boolean], key: string) => {
            if (key[1] === '*' && key[2] === '*') {
                nstate.setStaticValue(key.substring(3),
                    val[0].instantiate(state, tyVarBnd), IdentifierStatus.VALUE_VARIABLE);
            }
        });

        let nvbnd = new Map<string, [Type, boolean]>();
        tyVarBnd.forEach((val: [Type, boolean], key: string) => {
            nvbnd = nvbnd.set(key, val);
        });

        let res = this.declaration.elaborate(nstate, nvbnd, nextName);

            /*
        nextName = res[3];
        let names = new Set<string>();
        tyVarBnd.forEach((val: [Type, boolean], key: string) => {
            if (key[1] === '*' && key[2] === '*') {
                names.add(key);
            }
        });
        while (true) {
            let change = false;
            let nnames = new Set<string>();
            names.forEach((val: string) => {
                if (res[2].has(val)) {
                    res[2].get(val)[0].instantiate(nstate, res[2]).getTypeVariables().forEach((v: string) => {
                        if (!names.has(v)) {
                            change = true;
                            nnames.add(v);
                            console.nog(v);
                        }
                    });
                }
            });
            nnames.forEach((val: string) => {
                names.add(val);
            });
            if (!change) {
                break;
            }
        }
        let nbnds = new Map<string, [Type, boolean]>();
        res[2].forEach((val: [Type, boolean], key: string) => {
            //            if (names.has(key)) {
                nbnds = nbnds.set(key, [val[0].instantiate(res[0], res[2]), val[1]]);
                // }
        });
        for (let i = 0; i < chg.length; ++i) {
            if ((<[Type, boolean]> tyVarBnd.get(chg[i][0]))[0].equals(
                (<[Type, boolean]> res[2].get(chg[i][0]))[0])) {
                // Make sure we're not using some type of some rebound identifier
                let tmp = chg[i][1][0].merge(nstate, tyVarBnd,
                    chg[i][1][0].instantiate(nstate, res[2]));
                tyVarBnd = tmp[1];
            }
        }
                */

        let r2 = this.expression.getType(res[0], res[2], res[3], tyVars, forceRebind);
        return [r2[0], res[1].concat(r2[1]), r2[2], r2[3], r2[4], r2[5]];
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        if (params.step === undefined) {
            params.step = -1;
        }

        let step: number = params.step;

        if (step === -1) {
            let nstate = state.getNestedState(0).getNestedState(state.id);
            params.step = step + 1;
            params.state = state;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.declaration,
                'params': {'state': nstate, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }

        if (step === 0) {
            let res = params.recResult;
            if (res === undefined
                || res.newState === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }
            let nstate = <State> res.newState;
            if (res.hasThrown) {
                return {
                    'newState': undefined,
                    'value': res.value,
                    'hasThrown': true,
                };
            }

            callStack.push({
                'next': this.expression,
                'params': {'state': nstate, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }
        let nres = params.recResult;
        if (nres === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        return {
            'newState': undefined,
            'value': nres.value,
            'hasThrown': nres.hasThrown,
        };
    }
}

export class TypedExpression extends Expression implements Pattern {
// expression: type (L)
    constructor(public position: number, public expression: Expression,
                public typeAnnotation: Type) { super(); }

    getExplicitTypeVariables(): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        this.typeAnnotation.getTypeVariables().forEach((val: Type[], key: string) => {
            res = res.add(new TypeVariable(key, 0, val));
        });
        return res;
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        return (<PatternExpression> this.expression).getMatchedValues(state, tyVarBnd);
    }

    isSafe(state: State): boolean {
        return this.expression.isSafe(state);
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        let tp = (<PatternExpression> this.expression).matchType(state, tyVarBnd, t);

        try {
            let res = tp[1].merge(state, tp[2], this.typeAnnotation.instantiate(state, tp[2]));
            for (let i = 0; i < tp[0].length; ++i) {
                tp[0][i][1] = tp[0][i][1].instantiate(state, res[1]);
            }
            return [tp[0], res[0], res[1]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position,
                'The annotated type "' + this.typeAnnotation
                + '" does not match the expression\'s type "'
                + tp[1].normalize()[0] + '": ' + e[0]);
        }
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return (<PatternExpression> this.expression).matches(state, v);
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let tp = this.expression.getType(state, tyVarBnd, nextName, tyVars, forceRebind);

        try {
            let ann = this.typeAnnotation.instantiate(state, tp[4]);
            let tmp = tp[0].merge(state, tp[4], ann);
            return [tmp[0], tp[1], tp[2], tp[3], tmp[1], tp[5]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position,
                'The specified type "' + this.typeAnnotation
                + '" does not match the annotated expression\'s type "'
                + tp[0].normalize()[0] + '": ' + e[0]);
        }
    }

    simplify(): TypedExpression {
        return new TypedExpression(this.position,
            this.expression.simplify(), this.typeAnnotation.simplify());
    }

    toString(): string {
        let res = '( ' + this.expression;
        res += ': ' + this.typeAnnotation;
        return res + ' )';
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        return this.expression.compute(params, callStack);
    }
}

// May represent either a function application or a constructor with an argument
export class FunctionApplication extends Expression implements Pattern {
// function argument
    constructor(public position: number,
                public func: Expression,
                public argument: Expression|PatternExpression) { super(); }

    getExplicitTypeVariables(): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        this.func.getExplicitTypeVariables().forEach((val: TypeVariable) => {
            res = res.add(val);
        });
        this.argument.getExplicitTypeVariables().forEach((val: TypeVariable) => {
            res = res.add(val);
        });
        return res;
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        if (!(this.func instanceof ValueIdentifier)) {
            throw new InternalInterpreterError(this.position, 'Beep. Beep-Beep-Beep. Beep-Beep.');
        }

        let arg = (<PatternExpression> this.argument).getMatchedValues(state, tyVarBnd);
        if (arg.entries === undefined) {
            return new Domain([this.func.name.getText()]);
        }
        // TODO
        // Correctly implementing this should be really tedious
        return new Domain([this.func.name.getText()]);
    }

    isSafe(state: State): boolean {
        if (!(this.func instanceof ValueIdentifier)) {
            return false;
        }
        let f = state.getStaticValue((<ValueIdentifier> this.func).name.getText());
        if (f === undefined) {
            return false;
        }
        return f[1] !== IdentifierStatus.VALUE_VARIABLE;
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        if (!(this.func instanceof ValueIdentifier)) {
            throw new ElaborationError(this.position, 'Non-identifier applied to a pattern.');
        }

        let ti = state.getStaticValue((<ValueIdentifier> this.func).name.getText());
        if (ti === undefined || ti[1] === IdentifierStatus.VALUE_VARIABLE) {
            throw new ElaborationError(this.position, 'Expected a constructor, "'
                + (<ValueIdentifier> this.func).name.getText() + '" isn\'t.');
        }

        let tmp = this.func.getType(state, tyVarBnd, '\'g0');
        tmp[3].forEach((val: string) => {
            let nname = '\'p' + val.substring(2);
            if (val[1] === '\'') {
                nname = '\'\'p' + val.substring(3);
            }
            tmp[4] = tmp[4].set(val, [new TypeVariable(nname), false]);
        });
        ti[0] = tmp[0];
        tyVarBnd = tmp[4];

        if (!(ti[0] instanceof FunctionType)) {
            throw new ElaborationError(this.position, 'This is truly more...slothful.');
        }

        try {
            let ft = <FunctionType> ti[0];
            let mg = ft.returnType.merge(state, tyVarBnd, t);

            let res = (<PatternExpression> this.argument).matchType(state, mg[1],
                ft.parameterType.instantiate(state, mg[1]));
            return [res[0], mg[0], res[2]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position, 'Merge failed: ' + e[0]);
        }
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        if (v instanceof FunctionValue) {
            throw new EvaluationError(this.position,
                'You simply cannot match function values.');
        } else if (v instanceof ConstructedValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText()
                === (<ConstructedValue> v).constructorName
                && (<ValueIdentifier> this.func).name.getText() !== 'ref') {
                if ((<ConstructedValue> v).argument !== undefined) {
                    return (<PatternExpression> this.argument).matches(
                        state, <Value> (<ConstructedValue> v).argument);
                }
                return [];
            }
            return undefined;
        } else if (v instanceof ExceptionValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText()
                === (<ExceptionValue> v).constructorName) {
                if ((<ExceptionValue> v).argument !== undefined) {
                    return (<PatternExpression> this.argument).matches(
                        state, <Value> (<ExceptionValue> v).argument);
                }
                return [];
            }
            return undefined;
        } else if (v instanceof PredefinedFunction) {
            throw new EvaluationError(this.position,
                'You simply cannot match predefined functions.');
        } else if (v instanceof ReferenceValue) {
            if (this.func instanceof ValueIdentifier
                && (<ValueIdentifier> this.func).name.getText() === 'ref') {
                return (<PatternExpression> this.argument).matches(
                    state, <Value> state.getCell((<ReferenceValue> v).address));
            }
            return undefined;
        }
        throw new EvaluationError(this.position, 'Help me, I\'m broken. ('
            + v.constructor.name + ').' );
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        if (forceRebind && this.func instanceof ValueIdentifier) {
            let t = state.getStaticValue((<ValueIdentifier> this.func).name.getText());
            if (t === undefined || t[1] === IdentifierStatus.VALUE_VARIABLE) {
                throw new ElaborationError(this.position,
                    '"' + (<ValueIdentifier> this.func).name.getText() + '" is not a constructor.');
            }
        }

        let f = this.func.getType(state, tyVarBnd, nextName, tyVars, forceRebind);
        state.valueIdentifierId = f[5];

        let nf4 = new Map<string, [Type, boolean]>();
        f[4].forEach((val: [Type, boolean], key: string) => {
            nf4 = nf4.set(key, val);
        });
        let arg = this.argument.getType(state, nf4, f[2], f[3], forceRebind);

        arg[4].forEach((val: [Type, boolean], key: string) => {
            f[4] = f[4].set(key, val);
        });

        f[0] = f[0].instantiate(state, f[4]);

        if (f[0] instanceof TypeVariable) {
            let tva = new TypeVariable((<TypeVariable> f[0]).name + '*a');
            let tvb = new TypeVariable((<TypeVariable> f[0]).name + '*b');
            tva.isFree = (<TypeVariable> f[0]).isFree;
            tvb.isFree = (<TypeVariable> f[0]).isFree;

            let ntype = new FunctionType(tva, tvb);
            f[4] = f[4].set((<TypeVariable> f[0]).name, [ntype, (<TypeVariable> f[0]).isFree]);
            f[0] = ntype;
        }
        if (f[0] instanceof AnyType) {
            f[0] = new FunctionType(new AnyType(), new AnyType());
        }

        if (f[0] instanceof FunctionType) {
            try {
                let tp = (<FunctionType> f[0]).parameterType.merge(state, f[4], arg[0]);

                let restp = (<FunctionType> f[0]).returnType;
                if ((<FunctionType> f[0]).parameterType instanceof RecordType
                    && (!(<RecordType> (<FunctionType> f[0]).parameterType).complete)) {
                    restp = restp.replace((<FunctionType> f[0]).parameterType, tp[0]);
                }

                return [restp.instantiate(state, tp[1]), f[1].concat(arg[1]), arg[2],
                    arg[3], tp[1], arg[5]];
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(this.position,
                    'Type clash. Functions of type "' + f[0].normalize()[0]
                    + '" cannot take an argument of type "' + arg[0].normalize()[0] + '": ' + e[0]);
            }
        } else {
            throw new ElaborationError(this.func.position,
                '"' + this.func + '" of type "'
                + f[0].normalize()[0] + '" is not a function.');
        }
    }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, this.func.simplify(), this.argument.simplify());
    }

    toString(): string {
        let res = '( ' +  this.func;
        res += ' ' + this.argument;
        return res + ' )';
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        let modifiable = params.modifiable;
        if (params.step === undefined) {
            params.step = -1;
        }

        let step: number = params.step;


        if (this.func instanceof ValueIdentifier) {
            if (this.func.name.getText() === 'ref'
                || this.func.name.getText() === ':='
                || this.func.name.getText() === '!') {
                if (step === -1) {
                    params.step = step + 1;
                    params.state = state;
                    callStack.push({'next': this, 'params': params});
                    callStack.push({
                        'next': this.argument,
                        'params': {'state': state, 'modifiable': modifiable, 'recResult': undefined}
                    });
                    return;
                }

                let aVal = params.recResult;
                if (aVal === undefined
                    || aVal.value === undefined) {
                    throw new InternalInterpreterError(-1, 'How is this undefined?');
                }
                if (aVal.hasThrown) {
                    return {
                        'newState': undefined,
                        'value': aVal.value,
                        'hasThrown': true,
                    };
                }
                let val = <Value> aVal.value;

                if (this.func.name.getText() === 'ref') {
                    let res: ReferenceValue = modifiable.setNewCell(val);

                    return {
                        'newState': undefined,
                        'value': res,
                        'hasThrown': false,
                    };
                } else if (this.func.name.getText() === ':=') {
                    if ((!(val instanceof RecordValue))
                        || (!((<RecordValue> val).getValue('1') instanceof ReferenceValue))) {
                        throw new EvaluationError(this.position, 'That\'s not how ":=" works.');
                    }
                    modifiable.setCell((<ReferenceValue> (<RecordValue> val).getValue('1')).address,
                        (<RecordValue> val).getValue('2'));
                    return {
                        'newState': undefined,
                        'value': new RecordValue(),
                        'hasThrown': false,
                    };
                } else if (this.func.name.getText() === '!') {
                    if (!(val instanceof ReferenceValue)) {
                        throw new EvaluationError(this.position,
                            'You cannot dereference "' + this.argument + '".');
                    }
                    return {
                        'newState': undefined,
                        'value': modifiable.getCell((<ReferenceValue> val).address),
                        'hasThrown': false,
                    };
                }
            }
        }

        if (step === -1) {
            params.step = step + 1;
            params.state = state;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.func,
                'params': {'state': state, 'modifiable': modifiable, 'recResult': undefined}
            });
            return;
        }

        if (step === 0) {
            let funcVal = params.recResult;
            if (funcVal === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }
            if (funcVal.hasThrown) {
                // computing the function failed
                return funcVal;
            }

            params.step = step + 1;
            params.state = state;
            params.funcVal = funcVal;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.argument,
                'params': {'state': state, 'modifiable': modifiable, 'recResult': undefined}
            });
            return;
        }

        if (step === 1) {
            let funcVal = <EvaluationResult> params.funcVal;
            let argVal = <EvaluationResult> params.recResult;

            if (funcVal === undefined
                || funcVal.value === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }
            if (argVal === undefined
                || argVal.value === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }

            if (argVal.hasThrown) {
                return {
                    'newState': undefined,
                    'value': argVal.value,
                    'hasThrown': true,
                };
            }
            if (funcVal.value instanceof FunctionValue) {
                (<FunctionValue> funcVal.value).compute(callStack, <Value> argVal.value, modifiable);
                return;
            } else if (funcVal.value instanceof ValueConstructor) {
                return {
                    'newState': undefined,
                    'value': (<ValueConstructor> funcVal.value).construct(argVal.value),
                    'hasThrown': false,
                };
            } else if (funcVal.value instanceof ExceptionConstructor) {
                return {
                    'newState': undefined,
                    'value': (<ExceptionConstructor> funcVal.value).construct(argVal.value),
                    'hasThrown': false,
                };
            } else if (funcVal.value instanceof PredefinedFunction) {
                let res = (<PredefinedFunction> funcVal.value).apply(argVal.value);
                for (let warn of res[2]) {
                    modifiable.addWarning(warn);
                }
                return {
                    'newState': undefined,
                    'value': res[0],
                    'hasThrown': res[1],
                };
            }
            throw new EvaluationError(this.position, 'Cannot evaluate the function "'
                + this.func + '" (' + funcVal[0].constructor.name + ').');
        }
        // brace so linter does not complain about shadowed names
        {
            let res = <EvaluationResult> params.recResult;
            if (res === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }

            return {
                'newState': undefined,
                'value': res.value,
                'hasThrown': res.hasThrown,
            };
        }
    }
}

export class HandleException extends Expression {
    // expression handle match
    constructor(public position: number, public expression: Expression, public match: Match) {
        super();
    }

    getExplicitTypeVariables(): Set<TypeVariable> {
        return this.expression.getExplicitTypeVariables();
    }

    isSafe(state: State): boolean {
        return this.expression.isSafe(state);
    }

    simplify(): HandleException {
        return new HandleException(this.position, this.expression.simplify(), this.match.simplify());
    }

    toString(): string {
        let res = '( ' + this.expression + ' )';
        res += ' handle ' + this.match;
        return res;
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let mtp = this.match.getType(state, tyVarBnd, nextName, tyVars, forceRebind, false);
        if (!(mtp[0] instanceof FunctionType)) {
            throw new ElaborationError(this.match.position,
                'You can only handle things of type "exn" and not "'
                + (<FunctionType> mtp[0]).parameterType.normalize()[0] + '".');
        }
        try {
            (<FunctionType> mtp[0]).parameterType.merge(state, mtp[4], new CustomType('exn'));
        } catch (e) {
            throw new ElaborationError(this.match.position,
                'You can only handle things of type "exn" and not "'
                + (<FunctionType> mtp[0]).parameterType.normalize()[0] + '".');
        }
        let rt = (<FunctionType> mtp[0]).returnType;
        state.valueIdentifierId = mtp[5];
        let etp = this.expression.getType(state, mtp[4], mtp[2], mtp[3], forceRebind);

        try {
            let res = rt.merge(state, etp[4], etp[0]);
            return [res[0], mtp[1].concat(etp[1]), etp[2], etp[3], res[1], etp[5]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.expression.position,
                'The "handle" cannot change the type of the expression from "'
                + etp[0].normalize()[0] + '" to "' + rt.normalize()[0] + '": ' + e[0]);
        }
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        if (params.recResult === undefined) {
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.expression,
                'params': {'state': state, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }
        let res = params.recResult;
        if (res === undefined
            || res.value === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        if (params.exprResult === undefined) {
            if (res.hasThrown) {

                params.exprResult = res;
                callStack.push({'next': this, 'params': params});
                callStack.push({
                    'next': this.match,
                    'params': {
                        'state': state,
                        'modifiable': params.modifiable,
                        'recResult': undefined,
                        'value': res.value
                    }
                });
                return;
            }
            return res;
        }
        res = params.exprResult;
        let next = params.recResult;
        if (res === undefined
            || res.value === undefined
            || next === undefined
            || next.value === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        if (!next.hasThrown || !(<Value> next.value).equals(new ExceptionValue('Match', undefined, 0))) {
            // Exception got handled
            return {
                'newState': undefined,
                'value': next.value,
                'hasThrown': next.hasThrown,
            };
        }
        return {
            'newState': undefined,
            'value': res.value,
            'hasThrown': res.hasThrown,
        };
    }
}

export class RaiseException extends Expression {
    // raise expression
    constructor(public position: number, public expression: Expression) { super(); }

    getExplicitTypeVariables(): Set<TypeVariable> {
        return this.expression.getExplicitTypeVariables();
    }

    simplify(): RaiseException {
        return new RaiseException(this.position, this.expression.simplify());
    }

    isSafe(state: State): boolean {
        return this.expression.isSafe(state);
    }

    toString(): string {
        return 'raise ' + this.expression;
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let res = this.expression.getType(state, tyVarBnd, nextName, tyVars, forceRebind);
        try {
            let mg = res[0].merge(state, tyVarBnd, new CustomType('exn'));
            // TODO This is a really sloppy way to set a new "nextName"
            return [new TypeVariable(res[2]), res[1], res[2] + '0', res[3], mg[1], res[5]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.expression.position,
                'Raising anything but exceptions will only raise exceptions: ' + e[0]);
        }
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        if (params.recResult === undefined) {
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.expression,
                'params': {'state': state, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }

        let res = params.recResult;
        if (res === undefined
            || res.value === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        if (!(res.value instanceof ExceptionValue)) {
            throw new EvaluationError(this.position,
                'Cannot "raise" value of type "' + (<Value> res.value).constructor.name
                + '" (type must be "exn").');
        }
        return {
            'newState': state,
            'value': res.value,
            'hasThrown': true,
        };
    }
}

export class Lambda extends Expression {
    // fn match
    constructor(public position: number, public match: Match) { super(); }

    getExplicitTypeVariables(): Set<TypeVariable> {
        return this.match.getExplicitTypeVariables();
    }

    simplify(): Lambda {
        return new Lambda(this.position, this.match.simplify());
    }

    toString(): string {
        return '( fn ' + this.match + ' )';
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {
        return this.match.getType(state, tyVarBnd, nextName, tyVars, forceRebind);
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        // We need to ensure that the function value receives a capture
        // of the current state, and that that capture stays that way
        // (Local declarations may change the past, so we must record that, too.
        let nstate = state.getNestedState(state.id);

        if (nstate.insideLocalDeclBody) {
            nstate.dynamicBasis = state.getDynamicLocalDeclChanges(-1);
            nstate.insideLocalDeclBody = false;
        }

        return {
            'newState': undefined,
            'value': new FunctionValue(nstate, [], this.match),
            'hasThrown': false,
        };
    }
}

// Matches

export class Match {
    // pat => exp or pat => exp | match
    constructor(public position: number, public matches: [PatternExpression, Expression][]) { }

    getExplicitTypeVariables(): Set<TypeVariable> {
        let res = new Set<TypeVariable>();
        for (let i = 0; i < this.matches.length; ++i) {
            this.matches[i][0].getExplicitTypeVariables().forEach((val: TypeVariable) => {
                res = res.add(val);
            });
            this.matches[i][1].getExplicitTypeVariables().forEach((val: TypeVariable) => {
                res = res.add(val);
            });
        }
        return res;
    }

    toString(): string {
        let res = '';
        for (let i = 0; i < this.matches.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.matches[i][0];
            res += ' => ' + this.matches[i][1];
        }
        return res;
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        let value: Value = params.value;
        if (value === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }

        for (let i = 0; i < this.matches.length; ++i) {
            let nstate = state.getNestedState(state.id);

            let res = this.matches[i][0].matches(nstate, value);
            if (res !== undefined) {
                for (let j = 0; j < res.length; ++j) {
                    nstate.setDynamicValue(res[j][0], res[j][1], IdentifierStatus.VALUE_VARIABLE);
                }
                callStack.push({
                    'next': this.matches[i][1],
                    'params': {'state': nstate, 'modifiable': params.modifiable, 'recResult': undefined}
                });
                return;
            }
        }
        return {
            'newState': undefined,
            'value': new ExceptionValue('Match', undefined, 0),
            'hasThrown': true,
        };
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false, checkEx: boolean = true):
    [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let restp: Type = new FunctionType(new AnyType(), new AnyType());
        let warns: Warning[] = [];
        let bnds = tyVarBnd;
        let keep = new Map<string, [Type, boolean]>();

        for (let i = 0; i < this.matches.length; ++i) {

            if (this.matches[i][0] instanceof ValueIdentifier) {
                let tm = state.getStaticValue((<ValueIdentifier> this.matches[i][0]).name.getText());
                if (tm !== undefined && tm[1] !== IdentifierStatus.VALUE_VARIABLE
                    && tm[0] instanceof FunctionType) {
                    throw new ElaborationError(this.matches[i][0].position,
                        'Unary constructor in the pattern needs an argument.');
                }
            }

            let nmap = new Map<string, [Type, boolean]>();
            bnds.forEach((val: [Type, boolean], key: string) => {
                nmap = nmap.set(key, val);
            });
            let r1 = this.matches[i][0].getType(state, bnds, nextName, tyVars, true);
            state.valueIdentifierId = r1[5];
            warns = warns.concat(r1[1]);
            let r2 = this.matches[i][1].getType(state, r1[4], r1[2], r1[3], forceRebind);
            warns = warns.concat(r2[1]);
            state.valueIdentifierId = r2[5];
            nextName = r2[2];
            tyVars = r2[3];

            let rtp = new FunctionType(r1[0], r2[0]);

            try {
                [restp, bnds] = restp.merge(state, r2[4], rtp);
                restp = restp.instantiate(state, bnds);
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(this.position, 'Match rules disagree on type: ' + e[0]);
            }
            restp = restp.instantiate(state, bnds);
            bnds.forEach((val: [Type, boolean], key: string) => {
                if (key[1] !== '*' || key[2] !== '*') {
                    nmap = nmap.set(key, [val[0].instantiate(state, bnds), val[1]]);
                } else {
                    keep = keep.set(key, val);
                }
            });
            bnds = nmap;
        }

        let nbnds = new Map<string, [Type, boolean]>();
        bnds.forEach((val: [Type, boolean], key: string) => {
            nbnds = nbnds.set(key, val);
        });
        keep.forEach((val: [Type, boolean], key: string) => {
            nbnds = nbnds.set(key, val);
        });

        if (checkEx) {
            try {
                warns = warns.concat((<FunctionType> restp).parameterType.checkExhaustiveness(
                    state, nbnds, this.position, this.matches));
            } catch (e) {
                warns.push(new Warning(this.position, 'Couldn\'t check exhaustiveness: ' + e.message + '\n'));
            }
        }

        return [restp, warns, nextName, tyVars, bnds, state.valueIdentifierId];
    }

    simplify(): Match {
        let newMatches: [PatternExpression, Expression][] = [];
        for (let i = 0; i < this.matches.length; ++i) {
            let m: [PatternExpression, Expression] = this.matches[i];
            newMatches.push([m[0].simplify(), m[1].simplify()]);
        }
        return new Match(this.position, newMatches);
    }
}

// Pure Patterns

export class Wildcard extends Expression implements Pattern {
    constructor(public position: number) { super(); }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        // Wildcards catch everything
        return new Domain(undefined);
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        let cur = (+nextName.substring(3)) + 1;
        let nm = '';
        for (; ; ++cur) {
            nextName = '\'' + nextName[1] + nextName[2] + cur;
            if (!tyVars.has(nextName) && !tyVarBnd.has(nextName)
                && state.getStaticValue(nextName) === undefined) {
                nm = nextName;
                return [new TypeVariable(nm), [], nm, tyVars.add(nm), tyVarBnd, state.valueIdentifierId];
            }
        }

    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        throw new InternalInterpreterError(this.position,
            'Wildcards are far too wild to have a value.');
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        return [[], t, tyVarBnd];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return [];
    }

    simplify(): Wildcard {
        return this;
    }

    toString(): string {
        return '_';
    }
}

export class LayeredPattern extends Expression implements Pattern {
    // <op> identifier <:type> as pattern
    constructor(public position: number, public identifier: IdentifierToken,
                public typeAnnotation: Type | undefined,
                public pattern: Expression|PatternExpression) { super(); }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        return (<PatternExpression> this.pattern).getMatchedValues(state, tyVarBnd);
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {
        if (!forceRebind) {
            throw new InternalInterpreterError(this.position,
                'Layered patterns are far too layered to have a type.');
        }

        let valid = new ValueIdentifier(-1, this.identifier);
        let gtp = valid.getType(state, tyVarBnd, nextName, tyVars, true);
        let tp = gtp[0];

        if (this.typeAnnotation !== undefined) {
            try {
                let mg = tp.merge(state, gtp[4], <Type> this.typeAnnotation);
                tyVarBnd = mg[1];
                tp = mg[0];
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(this.position, 'Wrong type annotation: ' + e[0]);
            }
        }

        let argtp = this.pattern.getType(state, tyVarBnd, gtp[2], gtp[3], true);

        try {
            let mg = tp.merge(state, argtp[4], argtp[0]);
            tyVarBnd = mg[1];
            tp = mg[0];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position, 'Wrong type annotation: ' + e[0]);
        }

        return [tp, gtp[1].concat(argtp[1]), argtp[2], argtp[3], tyVarBnd, state.valueIdentifierId];
    }

    compute(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        throw new InternalInterpreterError(this.position,
            'Layered patterns are far too layered to have a value.');
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>]  {

        let tp = t;
        if (this.typeAnnotation !== undefined) {
            try {
                let mg = t.merge(state, tyVarBnd, <Type> this.typeAnnotation);
                tyVarBnd = mg[1];
                tp = mg[0];
            } catch (e) {
                if (!(e instanceof Array)) {
                    throw e;
                }
                throw new ElaborationError(this.position, 'Wrong type annotation: ' + e[0]);
            }
        }
        let res = (<PatternExpression> this.pattern).matchType(state, tyVarBnd, tp);
        let result: [string, Type][] = [[this.identifier.getText(), tp]];
        return [result.concat(res[0]), t, res[2]];
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let res = (<PatternExpression> this.pattern).matches(state, v);
        if (res === undefined) {
            return res;
        }
        let result: [string, Value][] = [[this.identifier.getText(), v]];
        return result.concat(res);
    }

    simplify(): LayeredPattern {
        if (this.typeAnnotation) {
            return new LayeredPattern(this.position, this.identifier, this.typeAnnotation.simplify(),
                this.pattern.simplify());
        } else {
            return new LayeredPattern(this.position, this.identifier, undefined, this.pattern.simplify());
        }
    }

    toString(): string {
        return this.identifier.getText() + ' as ' + this.pattern;
    }
}

// Successor ML

export class ConjunctivePattern extends Expression implements Pattern {
// pat1 as pat2
    constructor(public position: number, public left: PatternExpression,
                public right: PatternExpression) {
        super();
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {
        let r1 = this.left.getType(state, tyVarBnd, nextName, tyVars, forceRebind);
        let r2 = this.right.getType(state, r1[4], r1[2], r1[3], forceRebind);

        try {
            let res = r1[0].merge(state, r2[4], r2[0]);
            return [res[0], r1[1].concat(r2[1]), r2[2], r2[3], res[1], r2[5]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position,
                'Both patterns of a conjunctive pattern must have the same type.');
        }
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        // TODO
        return new Domain([]);
    }

    simplify(): ConjunctivePattern {
        return new ConjunctivePattern(this.position, this.left.simplify(), this.right.simplify());
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>]  {
        // TODO
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let r1 = this.left.matches(state, v);

        if (r1 === undefined) {
            return undefined;
        }

        let nstate = state.getNestedState(state.id);
        for (let i of r1) {
            nstate.setDynamicValue(i[0], i[1], IdentifierStatus.VALUE_VARIABLE);
        }

        let r2 = this.right.matches(nstate, v);

        if (r2 === undefined) {
            return undefined;
        }

        return (<[string, Value][]> r1).concat(r2);
    }
}

export class DisjunctivePattern extends Expression implements Pattern {
// pat1 | pat2
    constructor(public position: number, public left: PatternExpression,
                public right: PatternExpression) {
        super();
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {
        let r1 = this.left.getType(state, tyVarBnd, nextName, tyVars, forceRebind);
        let r2 = this.right.getType(state, r1[4], r1[2], r1[3], forceRebind);

        try {
            let res = r1[0].merge(state, r2[4], r2[0]);
            return [res[0], r1[1].concat(r2[1]), r2[2], r2[3], res[1], r2[5]];
        } catch (e) {
            if (!(e instanceof Array)) {
                throw e;
            }
            throw new ElaborationError(this.position,
                'Both patterns of a disjunctive pattern must have the same type.');
        }
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        // TODO
        return new Domain([]);
    }

    simplify(): DisjunctivePattern {
        return new DisjunctivePattern(this.position, this.left.simplify(), this.right.simplify());
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>]  {
        // TODO
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let r1 = this.left.matches(state, v);
        if (r1 !== undefined) {
            return r1;
        }
        return this.right.matches(state, v);
    }
}

export class NestedMatch extends Expression implements Pattern {
// pat1 with pat2 = exp
    constructor(public position: number, public pattern: PatternExpression,
                public nested: PatternExpression, public expression: Expression) {
        super();
    }

    getType(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
            nextName: string = '\'*t0', tyVars: Set<string> = new Set<string>(),
            forceRebind: boolean = false)
        : [Type, Warning[], string, Set<string>, Map<string, [Type, boolean]>, IdCnt] {

        // TODO
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        // TODO
        return new Domain([]);
    }

    simplify(): NestedMatch {
        return new NestedMatch(this.position, this.pattern.simplify(),
            this.nested.simplify(), this.expression.simplify());
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>]  {
        // TODO
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        let r1 = this.pattern.matches(state, v);
        if (r1 === undefined) {
            return undefined;
        }

        // TODO
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }
}

// The following classes are derived forms.
// They will not be present in the simplified AST and do not implement elaborate/getType

export class InfixExpression extends Expression implements Pattern {
    // operators: (op, idx), to simplify simplify
    constructor(public expressions: Expression[], public operators: [IdentifierToken, number][]) {
        super();
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        throw new InternalInterpreterError(this.position, 'This call is trash.');
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        return this.reParse(state).matchType(state, tyVarBnd, t);
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.reParse(state).matches(state, v);
    }

    simplify(): FunctionApplication {
        throw new InternalInterpreterError(this.position, 'Ouch, I\'m not fully parsed.');
    }

    reParse(state: State): FunctionApplication {
        let ops = this.operators;
        let exps = this.expressions;
        let poses: number[][] = [];
        for (let i = 0; i < exps.length; ++i) {
            poses.push([i]);
        }
        ops.sort(([a, p1], [b, p2]) => {
            let sta = state.getInfixStatus(a);
            let stb = state.getInfixStatus(b);
            if (sta.precedence > stb.precedence) {
                return -1;
            }
            if (sta.precedence < stb.precedence) {
                return 1;
            }
            if (sta.rightAssociative) {
                if (p1 > p2) {
                    return -1;
                }
                if (p1 < p2) {
                    return 1;
                }
            } else {
                if (p1 > p2) {
                    return 1;
                }
                if (p1 < p2) {
                    return -1;
                }
            }
            return 0;
        });

        // Using copy by reference to make this work whithout shrinking the array
        for (let i = 0; i < ops.length; ++i) {
            if (i > 0) {
                let info1 = state.getInfixStatus(ops[i][0]);
                let info2 = state.getInfixStatus(ops[i - 1][0]);

                if (info1.precedence === info2.precedence
                    && info1.rightAssociative !== info2.rightAssociative
                    && (poses[ops[i - 1][1] + 1] === poses[ops[i][1]]
                        || poses[ops[i - 1][1]] === poses[ops[i][1] + 1])) {
                    throw new ParserError('Could you ever imagine left associatives '
                        + 'and right associatives living together in peace?', ops[i][0].position);
                }
            }

            let left = exps[ops[i][1]];
            let right = exps[ops[i][1] + 1];
            let com = new FunctionApplication(ops[i][0].position,
                new ValueIdentifier(ops[i][0].position, ops[i][0]),
                new Tuple(ops[i][0].position, [left, right]));
            let npos = poses[ops[i][1]];
            for (let j of poses[ops[i][1] + 1]) {
                npos.push(j);
            }
            for (let j of npos) {
                poses[j] = npos;
                exps[j] = com;
            }
        }
        return <FunctionApplication> exps[0];
    }
}

let falseConstant = new ValueIdentifier(0, new IdentifierToken('false', 0));
let trueConstant = new ValueIdentifier(0, new IdentifierToken('true', 0));
let nilConstant = new ValueIdentifier(0, new IdentifierToken('nil', 0));
let consConstant = new ValueIdentifier(0, new IdentifierToken('::', 0));

export class Conjunction extends Expression {
    // leftOperand andalso rightOperand
    constructor(public position: number, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, this.rightOperand,
            falseConstant).simplify();
    }

    toString(): string {
        return '( ' + this.leftOperand + ' andalso '
            + this.rightOperand + ' )';
    }
}

export class Disjunction extends Expression {
    // leftOperand orelse rightOperand
    constructor(public position: number, public leftOperand: Expression, public rightOperand: Expression) { super(); }

    simplify(): FunctionApplication {
        return new Conditional(this.position, this.leftOperand, trueConstant, this.rightOperand).simplify();
    }

    toString(): string {
        return '( ' + this.leftOperand + ' orelse '
            + this.rightOperand + ' )';
    }
}

export class Tuple extends Expression implements Pattern {
    // (exp1, ..., expn), n > 1
    constructor(public position: number, public expressions: Expression[]) { super(); }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        throw new InternalInterpreterError(this.position,
            'What a wonderful explosion. I\'m going to faint now, though…');
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        return this.simplify().matchType(state, tyVarBnd, t);
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): Record {
        let entries: [string, Expression][] = [];
        for (let i = 0; i < this.expressions.length; ++i) {
            entries.push(['' + (i + 1), this.expressions[i].simplify()]);
        }
        return new Record(this.position, true, entries);
    }

    toString(): string {
        let res = '( ';
        for (let i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.expressions[i];
        }
        return res + ' )';
    }
}

export class List extends Expression implements Pattern {
    // [exp1, ..., expn]
    constructor(public position: number, public expressions: Expression[]) { super(); }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        throw new InternalInterpreterError(this.position, 'You did nothing wrong.');
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>] {
        return this.simplify().matchType(state, tyVarBnd, t);
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        return this.simplify().matches(state, v);
    }

    simplify(): PatternExpression {
        let res: PatternExpression = nilConstant;
        for (let i = this.expressions.length - 1; i >= 0; --i) {
            let pair = new Tuple(-1, [this.expressions[i], res]).simplify();
            res = new FunctionApplication(-1, consConstant, pair);
        }
        return res;
    }

    toString(): string {
        let res = '[ ';
        for (let i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.expressions[i];
        }
        return res + ' ]';
    }
}

export class Sequence extends Expression {
    // (exp1; ...; expn), n >= 2
    constructor(public position: number, public expressions: Expression[]) { super(); }

    simplify(): FunctionApplication {
        let pos = this.expressions.length - 1;
        let match = new Match(-1, [[new Wildcard(0), this.expressions[pos]]]);
        let res = new CaseAnalysis(-1, this.expressions[pos - 1], match);
        for (let i = pos - 2; i >= 0; --i) {
            match = new Match(-1, [[new Wildcard(0), res]]);
            res = new CaseAnalysis(-1, this.expressions[i], match);
        }
        return res.simplify();
    }

    toString(): string {
        let res = '( ';
        for (let i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += '; ';
            }
            res += this.expressions[i];
        }
        return res + ' )';
    }
}

export class RecordSelector extends Expression {
    // #label record
    constructor(public position: number, public label: IdentifierToken | NumericToken) { super(); }

    simplify(): Lambda {
        return new Lambda(this.position, new Match(-1, [[
            new Record(-1, false, [[this.label.text, new ValueIdentifier(-1, new IdentifierToken('__rs', -1))]]),
            new ValueIdentifier(-1, new IdentifierToken('__rs', -1))]]));
    }

    toString(): string {
        return '#' + this.label.getText();
    }
}

export class CaseAnalysis extends Expression {
    // case expression of match
    constructor(public position: number, public expression: Expression, public match: Match) { super(); }

    simplify(): FunctionApplication {
        return new FunctionApplication(this.position, new Lambda(this.position,
            this.match.simplify()),
            this.expression.simplify());
    }

    toString(): string {
        return 'case ' + this.expression + ' of ' + this.match;
    }
}

export class Conditional extends Expression {
    // if condition then consequence else alternative
    constructor(public position: number, public condition: Expression, public consequence: Expression,
                public alternative: Expression) { super(); }

    simplify(): FunctionApplication {
        let match: Match = new Match(this.position, [[trueConstant, this.consequence],
            [falseConstant, this.alternative]]);
        return new CaseAnalysis(this.position, this.condition, match).simplify();
    }

    toString(): string {
        return 'if ' + this.condition + ' then ' + this.consequence + ' else ' + this.alternative;
    }
}

export class While extends Expression {
    // while exp do exp
    constructor(public position: number, public condition: Expression,
                public body: Expression) {
        super();
    }

    simplify(): Expression {
        let nm = new ValueIdentifier(this.position, new IdentifierToken('__whl', this.position));
        let fapp = new FunctionApplication(this.position, nm, new Tuple(this.position, []));
        let cond = new Conditional(this.position, this.condition,
            new Sequence(this.position, [this.body, fapp]), new Tuple(this.position, []));
        let valbnd = new ValueBinding(this.position, true, nm,
            new Lambda(this.position, new Match(this.position,
                [[new Tuple(this.position, []), cond]])));
        let dec = new ValueDeclaration(this.position, [], [valbnd]);

        return new LocalDeclarationExpression(this.position, dec, fapp).simplify();
    }

    toString(): string {
        return '( while ' + this.condition + ' do ' + this.body + ' )';
    }
}

// Successor ML
export class PatternGuard extends Expression implements Pattern {
// pat if exp
    constructor(public position: number, public pattern: PatternExpression,
                public condition: Expression) {
        super();
    }

    getMatchedValues(state: State, tyVarBnd: Map<string, [Type, boolean]>): Domain {
        return new Domain([]);
    }

    simplify(): NestedMatch {
        return new NestedMatch(this.position, this.pattern.simplify(),
            trueConstant, this.condition.simplify());
    }

    matchType(state: State, tyVarBnd: Map<string, [Type, boolean]>, t: Type):
        [[string, Type][], Type, Map<string, [Type, boolean]>]  {
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }

    matches(state: State, v: Value): [string, Value][] | undefined {
        throw new InternalInterpreterError(this.position, '「ニャ－、ニャ－」');
    }
}
