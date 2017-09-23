import { Expression } from './expressions';
import { Declaration } from './declarations';
import { IdentifierToken, Token, LongIdentifierToken } from './tokens';
import { Type, TypeVariable, CustomType, TypeVariableBind, FunctionType } from './types';
import { State, DynamicInterface, DynamicStructureInterface, DynamicValueInterface, StaticBasis,
         DynamicTypeInterface, IdentifierStatus, DynamicBasis, DynamicFunctorInformation,
         TypeInformation } from './state';
import { Warning, EvaluationError, ElaborationError, InternalInterpreterError } from './errors';
import { Value } from './values';
import { getInitialState } from './initialState';
import { EvaluationResult, EvaluationParameters, EvaluationStack } from './evaluator';

// Module Expressions

// Structure Expressions

type MemBind = [number, Value][];

export interface Structure {
    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined;
    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string];
}

export class StructureExpression extends Expression implements Structure {
// struct <strdec> end
    constructor(public position: number, public structureDeclaration: Declaration) {
        super();
    }

    simplify(): StructureExpression {
        return new StructureExpression(this.position, this.structureDeclaration.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let nstate = state.getNestedState(0).getNestedState(state.id);
        let tmp = this.structureDeclaration.elaborate(nstate, tyVarBnd, nextName, true);
        return [tmp[0].getStaticChanges(0), tmp[1], tmp[2], tmp[3]];
    }

    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined {
        if (params.recResult === undefined) {
            let state = params.state;
            let nstate = state.getNestedState(0).getNestedState(state.id);

            callStack.push({'next': recCall, 'params': params});
            callStack.push({
                'next': this.structureDeclaration,
                'params': {'state': nstate, 'recResult': undefined}
            });
            return;
        }
        // braced so linter does not complain about shadowed names
        {
            let tmp = params.recResult;
            if (tmp === undefined
                || tmp.newState === undefined) {
                throw new InternalInterpreterError(-1, 'How is this undefined?');
            }
            let nstate = <State> tmp.newState;
            let mem = nstate.getMemoryChanges(0);

            if (tmp.hasThrown) {
                return [<Value> tmp.value, tmp.warns, mem];
            }

            return [nstate.getDynamicChanges(0), tmp.warns, mem];
        }
    }

    toString(): string {
        return 'struct ' + this.structureDeclaration + ' end';
    }
}

export class StructureIdentifier extends Expression implements Structure {
// longstrid
    constructor(public position: number, public identifier: Token) {
        super();
    }

    simplify(): StructureIdentifier {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res: StaticBasis | undefined = undefined;
        if (this.identifier instanceof LongIdentifierToken) {
            let st = state.getAndResolveStaticStructure(<LongIdentifierToken> this.identifier);

            if (st !== undefined) {
                res = (<StaticBasis> st).getStructure(
                    (<LongIdentifierToken> this.identifier).id.getText());
            }
        } else {
            res = state.getStaticStructure(this.identifier.getText());
        }

        if (res === undefined) {
            throw new ElaborationError(this.position, 'Undefined module "'
                + this.identifier.getText() + '".');
        }
        return [res, [], tyVarBnd, nextName];
    }

    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined {
        let state = params.state;
        let res: DynamicBasis | undefined = undefined;
        if (this.identifier instanceof LongIdentifierToken) {
            let st = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.identifier);

            if (st !== undefined) {
                res = (<DynamicBasis> st).getStructure(
                    (<LongIdentifierToken> this.identifier).id.getText());
            }
        } else {
            res = state.getDynamicStructure(this.identifier.getText());
        }

        if (res === undefined) {
            throw new EvaluationError(this.position, 'Undefined module "'
                + this.identifier.getText() + '".');
        }
        return [<DynamicBasis> res, [], []];
    }

    toString(): string {
        return this.identifier.getText();
    }
}

export class TransparentConstraint extends Expression implements Structure {
// strexp : sigexp
    constructor(public position: number, public structureExpression: Expression & Structure,
                public signatureExpression: Expression & Signature) {
        super();
    }

    simplify(): TransparentConstraint {
        return new TransparentConstraint(this.position,
            <Expression & Structure> this.structureExpression.simplify(),
            <Expression & Signature> this.signatureExpression.simplify());
    }

    restrict(sig: StaticBasis, str: StaticBasis, state: State,
             tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res = new StaticBasis({}, {}, {}, {}, {});

        let nstate = state.getNestedState(state.id);
        nstate.staticBasis = str;
        let nstate2 = state.getNestedState(state.id);
        nstate2.staticBasis = sig;

        for (let i in sig.typeEnvironment) {
            if (sig.typeEnvironment.hasOwnProperty(i)) {
                if (!str.typeEnvironment.hasOwnProperty(i)) {
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Unimplemented type "' + i + '".');
                }
                let sg = <TypeInformation> sig.typeEnvironment[i];
                let st = <TypeInformation> str.typeEnvironment[i];

                if (sg.arity !== st.arity) {
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Implementation of type "' + i
                        + '" has the wrong arity.');
                }

                try {
                    let sgtp = <CustomType> sg.type;
                    let sttp = st.type;
                    if (st.type instanceof FunctionType) {
                        sttp = (<FunctionType> st.type).parameterType;
                    }
                    let tp = sgtp.merge(nstate, tyVarBnd, sttp);

                    res.setType(i, st.type.instantiate(nstate2, tp[1]), [], sg.arity, sg.allowsEquality);
                    tyVarBnd = tp[1];
                } catch (e) {
                    if (!(e instanceof Array)) {
                        throw e;
                    }
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Wrong implementation of type "' + i + '": ' + e[0]);
                }
            }
        }

        for (let i in sig.valueEnvironment) {
            if (sig.valueEnvironment.hasOwnProperty(i)) {
                if (!str.valueEnvironment.hasOwnProperty(i)) {
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Unimplemented value "' + i + '".');
                }
                let sg = <[Type, IdentifierStatus]> sig.valueEnvironment[i];
                let st = <[Type, IdentifierStatus]> str.valueEnvironment[i];

                let repl = new Map<string, string>();
                let vsg = sg[0].getTypeVariables();
                let vst = st[0].getTypeVariables();
                while (st[0] instanceof TypeVariableBind) {
                    while (true) {
                        let cur = +nextName.substring(3);
                        let nname = '\'' + nextName[1] + nextName[2] + (cur + 1);
                        nextName = nname;

                        if (!tyVarBnd.has(nname) && !vsg.has(nname) && !vst.has(nname)) {
                            if ((<TypeVariableBind> st[0]).name[1] === '\'') {
                                nname = '\'' + nname;
                            }
                            repl = repl.set((<TypeVariableBind> st[0]).name, nname);
                            break;
                        }

                    }
                    st[0] = (<TypeVariableBind> st[0]).type;
                }
                st[0] = st[0].replaceTypeVariables(repl);

                let nsg = sg[0];
                while (nsg instanceof TypeVariableBind) {
                    while (true) {
                        let cur = +nextName.substring(3);
                        let nname = '\'' + nextName[1] + nextName[2] + (cur + 1);
                        nextName = nname;

                        if (!tyVarBnd.has(nname) && !vsg.has(nname) && !vst.has(nname)) {
                            if ((<TypeVariableBind> nsg).name[1] === '\'') {
                                nname = '\'' + nname;
                            }
                            repl = repl.set((<TypeVariableBind> nsg).name, nname);
                            break;
                        }

                    }
                    nsg = (<TypeVariableBind> nsg).type;
                }
                nsg = nsg.replaceTypeVariables(repl);

                try {
                    let mg = nsg.merge(nstate, tyVarBnd, st[0]);
                    res.setValue(i, sg[0].instantiate(nstate, mg[1]),
                        IdentifierStatus.VALUE_VARIABLE);
                } catch (e) {
                    if (!(e instanceof Array)) {
                        throw e;
                    }
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Wrong implementation of type "' + i + '": ' + e[0]);
                }
            }
        }

        for (let i in sig.structureEnvironment) {
            if (sig.structureEnvironment.hasOwnProperty(i)) {
                if (!str.structureEnvironment.hasOwnProperty(i)) {
                    throw new ElaborationError(this.position,
                        'Unimplemented structure "' + i + '".');
                }

                try {
                    let tmp = this.restrict(<StaticBasis> sig.getStructure(i),
                        <StaticBasis> str.getStructure(i), nstate, tyVarBnd, nextName);
                    res.setStructure(i, tmp[0]);
                    tyVarBnd = tmp[2];
                    nextName = tmp[3];
                } catch (e) {
                    throw new ElaborationError(this.position,
                        'Signature Mismatch: Wrong implementation of structure "' + i + '": '
                        + e.message);
                }
            }
        }

        return [res, [], tyVarBnd, nextName];
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let str = this.structureExpression.elaborate(state, tyVarBnd, nextName);
        let sig = this.signatureExpression.elaborate(state, str[2], str[3]);

        return this.restrict(sig[0], str[0], state, sig[2], sig[3]);
    }

    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined {
        let tmp = this.structureExpression.computeStructure(params, callStack, recCall);
        if (tmp === undefined) {
            return undefined;
        }
        if (tmp[0] instanceof Value) {
            return tmp;
        }
        let sig = this.signatureExpression.computeInterface(params.state);
        return [(<DynamicBasis> tmp[0]).restrict(sig), tmp[1], tmp[2]];
    }

    toString(): string {
        return this.structureExpression + ' : ' + this.signatureExpression;
    }
}

export class OpaqueConstraint extends Expression implements Structure {
// strexp :> sigexp
    constructor(public position: number, public structureExpression: Expression & Structure,
                public signatureExpression: Expression & Signature) {
        super();
    }

    simplify(): OpaqueConstraint {
        return new OpaqueConstraint(this.position,
            <Expression & Structure> this.structureExpression.simplify(),
            <Expression & Signature> this.signatureExpression.simplify());
    }

    restrict(sig: StaticBasis, str: StaticBasis, state: State,
             tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {

        let res = new StaticBasis({}, {}, {}, {}, {});

        let nstate = state.getNestedState(state.id);
        nstate.staticBasis = str;
        let nstate2 = state.getNestedState(state.id);
        nstate2.staticBasis = sig;
        nstate2 = nstate2.getNestedState(state.id);

        for (let i in sig.typeEnvironment) {
            if (sig.typeEnvironment.hasOwnProperty(i)) {
                if (!str.typeEnvironment.hasOwnProperty(i)) {
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Unimplemented type "' + i + '".');
                }
                let sg = <TypeInformation> sig.typeEnvironment[i];
                let st = <TypeInformation> str.typeEnvironment[i];

                if (sg.arity !== st.arity) {
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Implementation of type "' + i
                        + '" has the wrong arity.');
                }

                try {
                    let sgtp = <CustomType> sg.type;
                    let sttp = st.type;
                    if (st.type instanceof FunctionType) {
                        sttp = (<FunctionType> st.type).parameterType;
                    }
                    let tp = sgtp.merge(nstate, tyVarBnd, sttp);
                    // We need to create a new type here because of reference stuff
                    sgtp = new CustomType(sgtp.name, sgtp.typeArguments, sgtp.position,
                        sgtp.qualifiedName, true);

                    res.setType(i, sgtp, [], sg.arity, sg.allowsEquality);
                    nstate2.staticBasis.setType(i, sgtp, [], sg.arity, sg.allowsEquality);

                    tyVarBnd = tp[1];
                } catch (e) {
                    if (!(e instanceof Array)) {
                        throw e;
                    }
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Wrong implementation of type "' + i + '": ' + e[0]);
                }
            }
        }

        for (let i in sig.valueEnvironment) {
            if (sig.valueEnvironment.hasOwnProperty(i)) {
                if (!str.valueEnvironment.hasOwnProperty(i)) {
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Unimplemented value "' + i + '".');
                }
                let sg = <[Type, IdentifierStatus]> sig.valueEnvironment[i];
                let st = <[Type, IdentifierStatus]> str.valueEnvironment[i];

                let repl = new Map<string, string>();
                let vsg = sg[0].getTypeVariables();
                let vst = st[0].getTypeVariables();
                let nst = st[0];
                while (nst instanceof TypeVariableBind) {
                    while (true) {
                        let cur = +nextName.substring(3);
                        let nname = '\'' + nextName[1] + nextName[2] + (cur + 1);
                        nextName = nname;

                        if (!tyVarBnd.has(nname) && !vsg.has(nname) && !vst.has(nname)) {
                            if ((<TypeVariableBind> nst).name[1] === '\'') {
                                nname = '\'' + nname;
                            }
                            repl = repl.set((<TypeVariableBind> nst).name, nname);
                            break;
                        }

                    }
                    nst = (<TypeVariableBind> nst).type;
                }
                nst = nst.replaceTypeVariables(repl);

                let nsg = sg[0];
                while (nsg instanceof TypeVariableBind) {
                    while (true) {
                        let cur = +nextName.substring(3);
                        let nname = '\'' + nextName[1] + nextName[2] + (cur + 1);
                        nextName = nname;

                        if (!tyVarBnd.has(nname) && !vsg.has(nname) && !vst.has(nname)) {
                            if ((<TypeVariableBind> nsg).name[1] === '\'') {
                                nname = '\'' + nname;
                            }
                            repl = repl.set((<TypeVariableBind> nsg).name, nname);
                            break;
                        }

                    }
                    nsg = (<TypeVariableBind> nsg).type;
                }
                nsg = nsg.replaceTypeVariables(repl);

                try {
                    nsg.merge(nstate, tyVarBnd, nst);
                    res.setValue(i, sg[0].instantiate(nstate2, tyVarBnd),
                        IdentifierStatus.VALUE_VARIABLE);
                } catch (e) {
                    if (!(e instanceof Array)) {
                        throw e;
                    }
                    throw new ElaborationError(this.position,
                        'Signature mismatch: Wrong implementation of type "' + i + '": ' + e[0]);
                }
            }
        }

        for (let i in sig.structureEnvironment) {
            if (sig.structureEnvironment.hasOwnProperty(i)) {
                if (!str.structureEnvironment.hasOwnProperty(i)) {
                    throw new ElaborationError(this.position,
                        'Unimplemented structure "' + i + '".');
                }

                try {
                    let tmp = this.restrict(<StaticBasis> sig.getStructure(i),
                        <StaticBasis> str.getStructure(i), nstate, tyVarBnd, nextName);
                    res.setStructure(i, tmp[0]);
                    tyVarBnd = tmp[2];
                    nextName = tmp[3];
                } catch (e) {
                    throw new ElaborationError(this.position,
                        'Signature Mismatch: Wrong implementation of structure "' + i + '": '
                        + e.message);
                }
            }
        }

        return [res, [], tyVarBnd, nextName];
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {

        let str = this.structureExpression.elaborate(state, tyVarBnd, nextName);
        let sig = this.signatureExpression.elaborate(state, str[2], str[3]);

        return this.restrict(sig[0], str[0], state, sig[2], sig[3]);
   }

    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined {
        let tmp = this.structureExpression.computeStructure(params, callStack, recCall);
        if (tmp === undefined) {
            return undefined;
        }
        if (tmp[0] instanceof Value) {
            return tmp;
        }
        let sig = this.signatureExpression.computeInterface(params.state);
        return [(<DynamicBasis> tmp[0]).restrict(sig), tmp[1], tmp[2]];
    }

    toString(): string {
        return this.structureExpression + ' :> ' + this.signatureExpression;
    }
}

export class FunctorApplication extends Expression implements Structure {
// funid ( strexp )
    constructor(public position: number, public functorId: IdentifierToken,
                public structureExpression: Expression & Structure) {
        super();
    }

    simplify(): FunctorApplication {
        return new FunctorApplication(this.position, this.functorId,
            <Expression & Structure> this.structureExpression.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        throw new Error('ニャ－');
    }

    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined {
        let state = params.state;
        let fun = state.getDynamicFunctor(this.functorId.getText());

        if (fun === undefined) {
            throw new EvaluationError(this.position,
                'Undefined functor "' + this.functorId.getText() + '".');
        }

        if (params.funappres === undefined) {
            let res = this.structureExpression.computeStructure(params, callStack, recCall);
            if (res === undefined) {
                return undefined;
            }

            if (res[0] instanceof Value) {
                return res;
            }
            params.funappres = res;
        }
        // braced so linter does not complain about shadowing
        {
            let res = params.funappres;

            if (params.nstate === undefined) {
                let nstate = fun.state.getNestedState(fun.state.id);
                for (let i = 0; i < res[2].length; ++i) {
                    nstate.setCell(res[2][i][0], res[2][i][1]);
                }
                nstate.setDynamicStructure(fun.paramName.getText(),
                    (<DynamicBasis> res[0]).restrict(fun.param));
                params.nstate = nstate;
            }

            // we have to fake our state for a short time, so computeStructure will add the correct recursive state
            params.state = params.nstate;
            let nres = fun.body.computeStructure(params, callStack, recCall);
            params.state = state;

            if (nres === undefined) {
                return undefined;
            }
            return [nres[0], res[1].concat(nres[1]), res[2].concat(nres[2])];
        }
    }

    toString(): string {
        return this.functorId.getText() + '( ' + this.structureExpression + ' )';
    }
}

export class LocalDeclarationStructureExpression extends Expression implements Structure {
// let strdec in exp1; ...; expn end
// A sequential expression exp1; ... ; expn is represented as such,
// despite the potentially missing parentheses
    constructor(public position: number, public declaration: Declaration,
                public expression: Expression & Structure) { super(); }

    simplify(): LocalDeclarationStructureExpression {
        return new LocalDeclarationStructureExpression(this.position, this.declaration.simplify(),
            <Expression & Structure> this.expression.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let nstate = state.getNestedState(state.id);
        tyVarBnd.forEach((val: [Type, boolean], key: string) => {
            if (key[1] === '*' && key[2] === '*') {
                nstate.setStaticValue(key.substring(3),
                    val[0].instantiate(state, tyVarBnd), IdentifierStatus.VALUE_VARIABLE);
            }
        });

        let res = this.declaration.elaborate(nstate, tyVarBnd, nextName);
        nextName = res[3];

        let nbnds = new Map<string, [Type, boolean]>();
        tyVarBnd.forEach((val: [Type, boolean], key: string) => {
            nbnds = nbnds.set(key, [val[0].instantiate(res[0], res[2]), val[1]]);
        });

        let r2 = this.expression.elaborate(res[0], res[2], nextName);
        return [r2[0], res[1].concat(r2[1]), r2[2], r2[3]];
    }

    toString(): string {
        return 'let ' + this.declaration + ' in ' + this.expression + ' end';
    }

    computeStructure(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration):
        [DynamicBasis | Value, Warning[], MemBind] | undefined {
        let state = params.state;
        if (params.ldseRes === undefined) {
            if (params.recResult === undefined) {
                let nstate = state.getNestedState(0).getNestedState(state.id);
                callStack.push({'next': recCall, 'params': params});
                callStack.push({
                    'next': this.declaration,
                    'params': {'state': nstate, 'recResult': undefined}
                });
                return undefined;
            }
            params.ldseRes = params.recResult;
            params.recResult = undefined;
        }
        let res = <EvaluationResult> params.ldseRes;
        if (res === undefined
            || res.newState === undefined) {
            throw new InternalInterpreterError(-1, 'How is this undefined?');
        }
        // braced so linter does not complain about shadowing
        {
            let nstate = <State> res.newState;
            let membnd = nstate.getMemoryChanges(0);
            if (res.hasThrown) {
                return [<Value> res.value, res.warns, membnd];
            }

            // we have to fake the state in order for the recursion to work correctly
            params.state = nstate;
            let nres = this.expression.computeStructure(params, callStack, recCall);
            params.state = state;
            if (nres === undefined) {
                return undefined;
            }

            return [nres[0], res.warns.concat(nres[1]), membnd.concat(nres[2])];
        }
    }
}


// Signature Expressions

export interface Signature {
    computeInterface(state: State): DynamicInterface;
    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string];
}

export class SignatureExpression extends Expression implements Signature {
// sig spec end
    constructor(public position: number, public specification: Specification) {
        super();
    }

    simplify(): SignatureExpression {
        return new SignatureExpression(this.position, this.specification.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        return this.specification.elaborate(state, tyVarBnd, nextName);
    }

    computeInterface(state: State): DynamicInterface {
        return this.specification.computeInterface(state);
    }

    toString(): string {
        return 'sig ' + this.specification + ' end';
    }
}

export class SignatureIdentifier extends Expression implements Signature {
// sigid
    constructor(public position: number, public identifier: Token) {
        super();
    }

    simplify(): SignatureIdentifier {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res: StaticBasis | undefined = undefined;
        if (this.identifier instanceof LongIdentifierToken) {
            let st = state.getAndResolveStaticStructure(<LongIdentifierToken> this.identifier);

            if (st !== undefined) {
                res = (<StaticBasis> st).getSignature(
                    (<LongIdentifierToken> this.identifier).id.getText());
            }
        } else {
            res = state.getStaticSignature(this.identifier.getText());
        }

        if (res === undefined) {
            throw new EvaluationError(this.position, 'Undefined signature "'
                + this.identifier.getText() + '".');
        }
        return [<StaticBasis> res, [], tyVarBnd, nextName];

    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicInterface | undefined = undefined;
        if (this.identifier instanceof LongIdentifierToken) {
            let st = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.identifier);

            if (st !== undefined) {
                res = (<DynamicBasis> st).getSignature(
                    (<LongIdentifierToken> this.identifier).id.getText());
            }
        } else {
            res = state.getDynamicSignature(this.identifier.getText());
        }

        if (res === undefined) {
            throw new EvaluationError(this.position, 'Undefined signature "'
                + this.identifier.getText() + '".');
        }
        return <DynamicInterface> res;
    }

    toString(): string {
        return this.identifier.getText();
    }
}

export class TypeRealisation extends Expression implements Signature {
// sigexp where type tyvarseq longtycon = ty
    constructor(public position: number, public signatureExpression: Expression & Signature,
                public tyvarseq: TypeVariable[], public name: Token,
                public type: Type) {
        super();
    }

    simplify(): TypeRealisation {
        return new TypeRealisation(this.position, <Expression & Signature> this.signatureExpression.simplify(),
            this.tyvarseq, this.name, this.type.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        throw new Error('ニャ－');
    }

    computeInterface(state: State): DynamicInterface {
        return this.signatureExpression.computeInterface(state);
    }

    toString(): string {
        return this.signatureExpression + ' where type <stuff> ' + this.name.getText()
            + ' = ' + this.type;
    }
}


// Module declarations and bindings

// Sutrcture declaration

export class StructureDeclaration extends Declaration {
// structure strbind
    constructor(public position: number, public structureBinding: StructureBinding[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string, isTopLevel: boolean):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        let warns: Warning[] = [];
        for (let i = 0; i < this.structureBinding.length; ++i) {
            let tmp = this.structureBinding[i].elaborate(state, tyVarBnd, nextName);
            state = tmp[0];
            warns = warns.concat(tmp[1]);
            tyVarBnd = tmp[2];
            nextName = tmp[3];
        }
        return [state, warns, tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        if (params.whichBind === undefined) {
            params.warns = [];
            params.whichBind = 0;
        }

        let warns: Warning[] = params.warns;
        let whichBind: number = params.whichBind;

        let tmp = this.structureBinding[whichBind].evaluate(params, callStack, this);
        if (tmp !== undefined) {
            if (tmp.hasThrown) {
                return tmp;
            }
            params.state = <State> tmp.newState;
            params.warns = warns.concat(tmp.warns);
            params.whichBind = params.whichBind + 1;
            params.recResult = undefined;

            if (params.whichBind === this.structureBinding.length) {
                return {
                    'newState': params.state,
                    'value': undefined,
                    'hasThrown': false,
                    'warns': params.warns,
                    'mem': undefined,
                    'ids': undefined
                };
            }

            callStack.push({'next': this, 'params': params});
        }
        return undefined;
    }

    simplify(): StructureDeclaration {
        let bnd: StructureBinding[] = [];
        for (let i = 0; i < this.structureBinding.length; ++i) {
            bnd.push(this.structureBinding[i].simplify());
        }
        return new StructureDeclaration(this.position, bnd);
    }

    toString(): string {
        let res = 'structure';
        for (let i = 0; i < this.structureBinding.length; ++i) {
            res += ' ' + this.structureBinding[i];
        }
        return res + ';';
    }
}

export class SignatureDeclaration extends Declaration {
// signature sigbind
    constructor(public position: number, public signatureBinding: SignatureBinding[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
              nextName: string = '\'*t0'): [State, Warning[], Map<string, [Type, boolean]>, string] {
        let warns: Warning[] = [];
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            let tmp = this.signatureBinding[i].elaborate(state, tyVarBnd, nextName);
            state = tmp[0];
            warns = warns.concat(tmp[1]);
            tyVarBnd = tmp[2];
            nextName = tmp[3];
        }
        return [state, warns, tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            state = this.signatureBinding[i].evaluate(state);
        }
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
            'warns': [],
            'mem': undefined,
            'ids': undefined
        };
    }

    simplify(): SignatureDeclaration {
        let bnd: SignatureBinding[] = [];
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            bnd.push(this.signatureBinding[i].simplify());
        }
        return new SignatureDeclaration(this.position, bnd);
    }

    toString(): string {
        let res = 'structure';
        for (let i = 0; i < this.signatureBinding.length; ++i) {
            res += ' ' + this.signatureBinding[i];
        }
        return res + ';';
    }
}

export class FunctorDeclaration extends Declaration {
// functor funbind
    constructor(public position: number, public functorBinding: FunctorBinding[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
              nextName: string = '\'*t0'): [State, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        return [state, [new Warning(this.position, 'Skipped elaborating functor.\n')], tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        for (let i = 0; i < this.functorBinding.length; ++i) {
            state = this.functorBinding[i].evaluate(state);
        }
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
            'warns': [],
            'mem': undefined,
            'ids': undefined
        };
    }

    simplify(): FunctorDeclaration {
        let bnd: FunctorBinding[] = [];
        for (let i = 0; i < this.functorBinding.length; ++i) {
            bnd.push(this.functorBinding[i].simplify());
        }
        return new FunctorDeclaration(this.position, bnd);
    }

    toString(): string {
        let res = 'functor';
        for (let i = 0; i < this.functorBinding.length; ++i) {
            res += ' ' + this.functorBinding[i];
        }
        return res + ';';
    }
}


export class StructureBinding {
// strid = strexp
    constructor(public position: number, public name: IdentifierToken,
                public binding: Expression & Structure) {
    }

    simplify(): StructureBinding {
        return new StructureBinding(this.position, this.name,
            <Expression & Structure> this.binding.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        let tmp = this.binding.elaborate(state, tyVarBnd, nextName);
        state.setStaticStructure(this.name.getText(), tmp[0]);
        return [state, tmp[1], tmp[2], tmp[3]];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack, recCall: Declaration): EvaluationResult {
        let tmp = this.binding.computeStructure(params, callStack, recCall);
        if (tmp === undefined) {
            return undefined;
        }
        let state = params.state;
        for (let i = 0; i < tmp[2].length; ++i) {
            state.setCell(tmp[2][i][0], tmp[2][i][1]);
        }
        if (tmp[0] instanceof Value) {
            return {
                'newState': state,
                'value': <Value> tmp[0],
                'hasThrown': true,
                'warns': tmp[1],
                'mem': undefined,
                'ids': undefined
            };
        }
        state.setDynamicStructure(this.name.getText(), <DynamicBasis> tmp[0]);
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
            'warns': tmp[1],
            'mem': undefined,
            'ids': undefined
        };
    }

    toString(): string {
        return this.name.getText() + ' = ' + this.binding;
    }
}

export class SignatureBinding {
// sigid = sigexp
    constructor(public position: number, public name: IdentifierToken,
                public binding: Expression & Signature) {
    }

    simplify(): SignatureBinding {
        return new SignatureBinding(this.position, this.name,
            <Expression & Signature> this.binding.simplify());
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        let res = this.binding.elaborate(state, tyVarBnd, nextName);
        state.setStaticSignature(this.name.getText(), res[0]);
        return [state, res[1], res[2], res[3]];
    }

    evaluate(state: State): State {
        state.setDynamicSignature(this.name.getText(), this.binding.computeInterface(state));
        return state;
    }

    toString(): string {
        return this.name.getText() + ' = ' + this.binding;
    }
}

export class FunctorBinding {
// funid ( strid : sigexp ) = strexp
    constructor(public position: number, public name: IdentifierToken,
                public signatureName: IdentifierToken,
                public signatureBinding: Expression & Signature,
                public binding: Expression & Structure) {
    }

    simplify(): FunctorBinding {
        return new FunctorBinding(this.position, this.name, this.signatureName,
            <Expression & Signature> this.signatureBinding.simplify(),
            <Expression & Structure> this.binding.simplify());
    }

    evaluate(state: State): State {
        let inter = this.signatureBinding.computeInterface(state);
        let nstate = getInitialState().getNestedState(state.id);
        nstate.dynamicBasis = state.getDynamicChanges(-1);

        state.setDynamicFunctor(this.name.getText(),
            new DynamicFunctorInformation(this.signatureName, inter, this.binding, nstate));

        return state;
    }

    toString(): string {
        return this.name.getText() + '( ' + this.signatureName + ' : ' + this.signatureBinding
            + ' ) = ' + this.binding;
    }
}



// Specifications

export abstract class Specification {
    abstract elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string];
    abstract computeInterface(state: State): DynamicInterface;

    simplify(): Specification {
        return this;
    }
}

export class ValueSpecification extends Specification {
// val valdesc
    constructor(public position: number, public valueDescription: [IdentifierToken, Type][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res = new StaticBasis({}, {}, {}, {}, {});
        for (let i = 0; i < this.valueDescription.length; ++i) {
            let tp = this.valueDescription[i][1].simplify().instantiate(state, tyVarBnd);
            let tyv = tp.getTypeVariables();

            tyv.forEach((dom: Type[], val: string) => {
                tp = new TypeVariableBind(val, tp, dom);
            });

            res.setValue(this.valueDescription[i][0].getText(), tp, IdentifierStatus.VALUE_VARIABLE);
        }
        return [res, [], tyVarBnd, nextName];
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicValueInterface = {};
        for (let i = 0; i < this.valueDescription.length; ++i) {
            res[this.valueDescription[i][0].getText()] = IdentifierStatus.VALUE_VARIABLE;
        }
        return new DynamicInterface({}, res, {});
    }
}

export class TypeSpecification extends Specification {
// type [tyvarseq tycon][]
    constructor(public position: number, public typeDescription: [TypeVariable[], IdentifierToken][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res = new StaticBasis({}, {}, {}, {}, {});
        for (let i = 0; i < this.typeDescription.length; ++i) {
            res.setType(this.typeDescription[i][1].getText(),
                new CustomType(this.typeDescription[i][1].getText(), this.typeDescription[i][0]),
                [], this.typeDescription[i][0].length);
        }
        return [res, [], tyVarBnd, nextName];
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicTypeInterface = {};
        for (let i = 0; i < this.typeDescription.length; ++i) {
            res[this.typeDescription[i][1].getText()] = [];
        }
        return new DynamicInterface(res, {}, {});
    }
}

export class EqualityTypeSpecification extends Specification {
// eqtype [tyvarseq tycon][]
    constructor(public position: number, public typeDescription: [TypeVariable[], IdentifierToken][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res = new StaticBasis({}, {}, {}, {}, {});
        for (let i = 0; i < this.typeDescription.length; ++i) {
            res.setType(this.typeDescription[i][1].getText(),
                new CustomType(this.typeDescription[i][1].getText(), this.typeDescription[i][0]),
                [], this.typeDescription[i][0].length, true);
        }
        return [res, [], tyVarBnd, nextName];
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicTypeInterface = {};
        for (let i = 0; i < this.typeDescription.length; ++i) {
            res[this.typeDescription[i][1].getText()] = [];
        }
        return new DynamicInterface(res, {}, {});
    }
}

export class DatatypeSpecification extends Specification {
// datatype [tyvarseq tycon = [vid <of ty>][]][]
    constructor(public position: number, public datatypeDescription: [TypeVariable[],
        IdentifierToken, [IdentifierToken, Type|undefined][]][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        throw new Error('ニャ－');
    }

    computeInterface(state: State): DynamicInterface {
        let vi: DynamicValueInterface = {};
        let ti: DynamicTypeInterface = {};

        for (let i = 0; i < this.datatypeDescription.length; ++i) {
            let cns: string[] = [];
            for (let j = 0; j < this.datatypeDescription[i][2].length; ++j) {
                vi[this.datatypeDescription[i][2][j][0].getText()]
                    = IdentifierStatus.VALUE_CONSTRUCTOR;
                cns.push(this.datatypeDescription[i][2][j][0].getText());
            }
            ti[this.datatypeDescription[i][1].getText()] = cns;
        }
        return new DynamicInterface(ti, vi, {});
    }
}

export class DatatypeReplicationSpecification extends Specification {
// datatype tycon = datatype longtycon
    constructor(public position: number, public name: IdentifierToken, public oldname: Token) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        throw new Error('ニャ－');
    }

    computeInterface(state: State): DynamicInterface {
        let tp: string[] | undefined = undefined;
        if (this.oldname instanceof LongIdentifierToken) {
            let tmp = state.getAndResolveDynamicStructure(this.oldname);
            if (tmp !== undefined) {
                tp = tmp.getType((<LongIdentifierToken> this.oldname).id.getText());
            }
        } else {
            tp = state.getDynamicType(this.oldname.getText());
        }

        if (tp === undefined) {
            throw new EvaluationError(this.position, 'The datatype "'
                + this.oldname.getText() + '" does not exist.');
        }

        let vi: DynamicValueInterface = {};
        for (let i = 0; i < (<string[]> tp).length; ++i) {
            vi[(<string[]> tp)[i]] = IdentifierStatus.VALUE_CONSTRUCTOR;
        }
        let ti: DynamicTypeInterface = {};
        ti[this.name.getText()] = <string[]> tp;
        return new DynamicInterface(ti, vi, {});
    }
}

export class ExceptionSpecification extends Specification {
// exception [vid <of ty>][]
    constructor(public position: number, public exceptionDescription: [IdentifierToken, Type|undefined][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        throw new Error('ニャ－');
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicValueInterface = {};
        for (let i = 0; i < this.exceptionDescription.length; ++i) {
            res[this.exceptionDescription[i][0].getText()] = IdentifierStatus.EXCEPTION_CONSTRUCTOR;
        }
        return new DynamicInterface({}, res, {});
    }
}

export class StructureSpecification extends Specification {
// structure [strid: sigexp][]
    constructor(public position: number, public structureDescription: [IdentifierToken, Expression & Signature][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        throw new Error('ニャ－');
    }

    computeInterface(state: State): DynamicInterface {
        let res: DynamicStructureInterface = {};
        for (let i = 0; i < this.structureDescription.length; ++i) {
            res[this.structureDescription[i][0].getText()] = this.structureDescription[i][1].computeInterface(state);
        }
        return new DynamicInterface({}, {}, res);
    }

    simplify(): StructureSpecification {
        let res: [IdentifierToken, Expression & Signature][] = [];
        for (let i = 0; i < this.structureDescription.length; ++i) {
            res.push([this.structureDescription[i][0],
                <Expression & Signature> this.structureDescription[i][1].simplify()]);
        }
        return new StructureSpecification(this.position, res);
    }
}

export class IncludeSpecification extends Specification {
// include sigexp
    constructor(public position: number, public expression: (Expression & Signature)[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res = new StaticBasis({}, {}, {}, {}, {});
        let warns: Warning[] = [];
        for (let i = 0; i < this.expression.length; ++i) {
            let tmp = this.expression[i].elaborate(state, tyVarBnd, nextName);
            res = res.extend(tmp[0]);
            warns = warns.concat(tmp[1]);
            tyVarBnd = tmp[2];
            nextName = tmp[3];
        }
        return [res, warns, tyVarBnd, nextName];
    }

    computeInterface(state: State): DynamicInterface {
        let res = new DynamicInterface({}, {}, {});
        for (let i = 0; i < this.expression.length; ++i) {
            res = res.extend(this.expression[i].computeInterface(state));
        }
        return res;
    }

    simplify(): IncludeSpecification {
        let res: (Expression & Signature)[] = [];
        for (let i = 0; i < this.expression.length; ++i) {
            res.push(<Expression & Signature> this.expression[i].simplify());
        }
        return new IncludeSpecification(this.position, res);
    }
}

export class EmptySpecification extends Specification {
//
    constructor(public position: number) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        return [new StaticBasis({}, {}, {}, {}, {}), [], tyVarBnd, nextName];
    }

    computeInterface(state: State): DynamicInterface {
        return new DynamicInterface({}, {}, {});
    }
}

export class SequentialSpecification extends Specification {
// spec[]
    constructor(public position: number, public specifications: Specification[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        let res = new StaticBasis({}, {}, {}, {}, {});
        let warns: Warning[] = [];
        let nstate = state;
        for (let i = 0; i < this.specifications.length; ++i) {
            let tmp = this.specifications[i].elaborate(nstate, tyVarBnd, nextName);
            res = res.extend(tmp[0]);
            warns = warns.concat(tmp[1]);
            tyVarBnd = tmp[2];
            nextName = tmp[3];
            nstate = nstate.getNestedState(nstate.id);
            nstate.staticBasis = tmp[0];
        }
        return [res, warns, tyVarBnd, nextName];
    }

    computeInterface(state: State): DynamicInterface {
        let res = new DynamicInterface({}, {}, {});
        for (let i = 0; i < this.specifications.length; ++i) {
            res = res.extend(this.specifications[i].computeInterface(state));
        }
        return res;
    }

    simplify(): SequentialSpecification {
        let res: Specification[] = [];
        for (let i = 0; i < this.specifications.length; ++i) {
            res.push(this.specifications[i].simplify());
        }
        return new SequentialSpecification(this.position, res);
    }
}

export class SharingSpecification extends Specification {
// spec sharing type longtycon = ... = longtycon
    constructor(public position: number, public specification: Specification,
                public typeNames: Token[]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        // TODO
        throw new Error('ニャ－');
    }

    computeInterface(state: State): DynamicInterface {
        return this.specification.computeInterface(state);
    }
}

// Derived forms
export class TypeAliasSpecification extends Specification {
// type tyvarseq tycon = ty and ... and tyvarseq tycon = ty
    constructor(public position: number, public alias: [TypeVariable[], IdentifierToken, Type][]) {
        super();
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string):
        [StaticBasis, Warning[], Map<string, [Type, boolean]>, string] {
        throw new InternalInterpreterError(this.position, 'And you don\'t seem to understand…');
    }

    computeInterface(state: State): DynamicInterface {
        throw new InternalInterpreterError(this.position, 'Being an interpreter is suffering.');
    }

    simplify(): Specification {
        let tpspc: [TypeVariable[], IdentifierToken][] = [];
        for (let i = 0; i < this.alias.length; ++i) {
            tpspc.push([this.alias[i][0], this.alias[i][1]]);
        }
        let sg: Expression & Signature = new SignatureExpression(-1, new TypeSpecification(-1, tpspc));

        for (let i = 0; i < this.alias.length; ++i) {
            sg = new TypeRealisation(-1, sg, this.alias[i][0], this.alias[i][1], this.alias[i][2]);
        }

        return new IncludeSpecification(-1, [sg]).simplify();
    }
}
