import { Expression, ValueIdentifier, CaseAnalysis, Lambda, Match,
         Pattern, TypedExpression, Tuple, PatternExpression } from './expressions';
import { IdentifierToken, Token, LongIdentifierToken } from './tokens';
import { Type, TypeVariable, FunctionType, CustomType, TypeVariableBind } from './types';
import { State, IdentifierStatus, DynamicBasis, StaticBasis, TypeInformation } from './state';
import { InternalInterpreterError, ElaborationError,
         EvaluationError, FeatureDisabledError, Warning } from './errors';
import { Value, ValueConstructor, ExceptionConstructor, ExceptionValue,
         FunctionValue } from './values';
import { IdCnt, EvaluationResult, EvaluationStack, EvaluationParameters } from './evaluator';

export abstract class Declaration {
    id: number;
    elaborate(state: State,
              tyVarBnd: Map<string, [Type, boolean]> = new Map<string, [Type, boolean]>(),
              nextName: string = '\'*t0',
              paramBindings: Map<string, Type> = new Map<string, Type>(),
              isTopLevel: boolean = false,
              options: { [name: string]: any } = {}):
                [State, Warning[], Map<string, [Type, boolean]>, string] {
        throw new InternalInterpreterError( 'Not yet implemented.');
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        throw new InternalInterpreterError( 'Not yet implemented.');
    }

    toString(): string {
        throw new InternalInterpreterError( 'Not yet implemented.');
    }

    simplify(): Declaration {
        throw new InternalInterpreterError( 'Not yet implemented.');
    }

    assertUniqueBinding(state: State, conn: Set<string>): Set<string> {
        return new Set<string>();
    }
}

// Declaration subclasses
export class ValueDeclaration extends Declaration {
// val typeVariableSequence valueBinding
    constructor(public typeVariableSequence: TypeVariable[],
                public valueBinding: ValueBinding[], public id: number = 0) {
        super();
    }

    assertUniqueBinding(state: State, conn: Set<string>): Set<string> {
        for (let i = 0; i < this.valueBinding.length; ++i) {
            this.valueBinding[i].pattern.assertUniqueBinding(state, conn);
            this.valueBinding[i].expression.assertUniqueBinding(state, conn);
        }
        return new Set<string>();
    }

    simplify(): ValueDeclaration {
        let valBnd: ValueBinding[] = [];
        for (let i = 0; i < this.valueBinding.length; ++i) {
            valBnd.push(new ValueBinding(this.valueBinding[i].isRecursive,
                                         this.valueBinding[i].pattern.simplify(),
                                         this.valueBinding[i].expression.simplify()));
        }
        return new ValueDeclaration(this.typeVariableSequence, valBnd, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean,
              options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        let result: [string, Type][] = [];
        let result2: [string, Type][] = [];
        let r2outdeps: boolean[] = [];

        let warns: Warning[] = [];
        let bnds = tyVarBnd;
        let i = 0;
        for (; i < this.valueBinding.length; ++i) {
            if (this.valueBinding[i].isRecursive) {
                for (let j = i; j < this.valueBinding.length; ++j) {
                    let pat = this.valueBinding[j].pattern;

                    while (pat instanceof TypedExpression) {
                        pat = <Pattern & Expression> pat.expression;
                    }

                    let r = (<ValueIdentifier> pat).name.getText();
                    result.push([r, new TypeVariableBind('\'a', new TypeVariableBind('\'b',
                        new FunctionType(new TypeVariable('\'a'), new TypeVariable('\'b'))))]);
                }

                break;
            }

            let hasOuterDeps = false;
            try {
                let nnstate = state.getNestedState(state.id);
                let nbnds = new Map<string, [Type, boolean]>();
                bnds.forEach((val2: [Type, boolean], key: string) => {
                    nbnds = nbnds.set(key, val2);
                });

                this.valueBinding[i].getType(this.typeVariableSequence, nnstate, nbnds,
                                             nextName, new Map<string, Type>(), isTopLevel);
            } catch (e) {
                hasOuterDeps = true;
            }

            let val = this.valueBinding[i].getType(this.typeVariableSequence, state, bnds,
                                                   nextName, paramBindings, isTopLevel);

            warns = warns.concat(val[1]);
            bnds = val[2];
            nextName = val[3];
            state.valueIdentifierId = val[4];

            for (let j = 0; j < (<[string, Type][]> val[0]).length; ++j) {
                r2outdeps.push(hasOuterDeps);
                result2.push((<[string, Type][]> val[0])[j]);
            }
        }


        let nstate = state.getNestedState(state.id);
        for (let j = 0; j < result.length; ++j) {
            if (!options || options.allowSuccessorML !== true) {
                if (!result[j][1].isResolved()) {
                    throw new ElaborationError(
                        'Unresolved record type.');
                }
            }

            nstate.setStaticValue(result[j][0], result[j][1], IdentifierStatus.VALUE_VARIABLE);
        }

        let wcp = warns;
        let bcp = new Map<string, [Type, boolean]>();
        bnds.forEach((val: [Type, boolean], key: string) => {
            bcp = bcp.set(key, val);
        });
        let ncp = nextName;
        let ids = nstate.valueIdentifierId;
        let numit = this.valueBinding.length - i + 1;
        for (let l = 0; l < numit * numit + 1; ++l) {
            warns = wcp;
            bnds = new Map<string, [Type, boolean]>();
            bcp.forEach((val: [Type, boolean], key: string) => {
                bnds = bnds.set(key, val);
            });
            nextName = ncp;
            nstate.valueIdentifierId = ids;

            let haschange = false;

            for (let j = i; j < this.valueBinding.length; ++j) {
                let hasOuterDeps = false;
                if (!isTopLevel) {
                    // Check whether function uses things bound on a higher level
                    try {
                        let nnstate = nstate.getNestedState(state.id);
                        let nbnds = new Map<string, [Type, boolean]>();
                        bnds.forEach((val2: [Type, boolean], key: string) => {
                            nbnds = nbnds.set(key, val2);
                        });
                        this.valueBinding[j].getType(this.typeVariableSequence, nnstate, nbnds,
                                                     nextName, new Map<string, Type>(), isTopLevel);
                    } catch (e) {
                        hasOuterDeps = true;
                    }
                }

                let val = this.valueBinding[j].getType(this.typeVariableSequence, nstate, bnds,
                                                       nextName, paramBindings, isTopLevel);
                warns = warns.concat(val[1]);
                bnds = val[2];
                nextName = val[3];
                nstate.valueIdentifierId = val[4];

                for (let k = 0; k < val[0].length; ++k) {
                    let oldtp = nstate.getStaticValue(val[0][k][0]);
                    if (oldtp === undefined || !oldtp[0].normalize()[0].equals(val[0][k][1].normalize()[0])) {
                        haschange = true;
                    }

                    if (!options || options.allowSuccessorML !== true) {
                        if (!val[0][k][1].isResolved()) {
                            throw new ElaborationError(
                                'Unresolved record type.');
                        }
                    }

                    if (!hasOuterDeps) {
                        paramBindings = paramBindings.set(val[0][k][0], val[0][k][1]);
                    }
                    nstate.setStaticValue(val[0][k][0], val[0][k][1], IdentifierStatus.VALUE_VARIABLE);
                }
            }

            if (!haschange) {
                break;
            } else if (l === numit * numit) {
                throw new ElaborationError(
                    'My brain trembles; too much circularity.');
            }
        }

        for (let j = 0; j < result2.length; ++j) {
            if (!options || options.allowSuccessorML !== true) {
                if (!result2[j][1].isResolved()) {
                    throw new ElaborationError(
                        'Unresolved record type.');
                }
            }
            if (!r2outdeps[j]) {
                paramBindings = paramBindings.set(result2[j][0], result2[j][1]);
            }
            nstate.setStaticValue(result2[j][0], result2[j][1], IdentifierStatus.VALUE_VARIABLE);
        }


        return [nstate, warns, bnds, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        if (params.step === undefined) {
            params.result = [];
            params.recursives = [];
            params.isRec = false;
            params.step = -1;
        }

        let result: [string, Value][] = params.result;
        let recursives: [string, Value][] = params.recursives;

        let isRec: boolean = params.isRec;

        let step: number = params.step;

        if (step >= 0) {
            let val = params.recResult;
            if (val === undefined) {
                throw new InternalInterpreterError('How is this undefined? ' + JSON.stringify(val));
            }

            if (this.valueBinding[step].isRecursive) {
                isRec = true;
            }

            if (val.hasThrown) {
                return {
                    'newState': state,
                    'value': val.value,
                    'hasThrown': true,
                };
            }
            let matched = this.valueBinding[step].pattern.matches(state, <Value> val.value);
            if (matched === undefined) {
                return {
                    'newState': state,
                    'value': new ExceptionValue('Bind', undefined, 0, 1),
                    'hasThrown': true,
                };
            }

            for (let j = 0; j < (<[string, Value][]> matched).length; ++j) {
                if (!isRec) {
                    result.push((<[string, Value][]> matched)[j]);
                } else {
                    recursives.push((<[string, Value][]> matched)[j]);
                }
            }
        }

        ++step;
        if (step < this.valueBinding.length) {
            params.step = step;
            params.isRec = isRec;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.valueBinding[step].expression,
                'params': {'state': state, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }

        let nstate = state.getNestedState(state.id);

        for (let j = 0; j < recursives.length; ++j) {
            if (recursives[j][1] instanceof FunctionValue) {
                nstate.setDynamicValue(recursives[j][0], new FunctionValue(
                    (<FunctionValue> recursives[j][1]).state, recursives,
                    (<FunctionValue> recursives[j][1]).body), IdentifierStatus.VALUE_VARIABLE);
            } else {
                nstate.setDynamicValue(recursives[j][0], recursives[j][1], IdentifierStatus.VALUE_VARIABLE);
            }
        }

        for (let j = 0; j < result.length; ++j) {
            nstate.setDynamicValue(result[j][0], result[j][1], IdentifierStatus.VALUE_VARIABLE);
        }

        return {
            'newState': nstate,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'val <stuff>';
        for (let i = 0; i < this.valueBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.valueBinding[i];
        }
        return res += ';';
    }
}

export class TypeDeclaration extends Declaration {
// type typeBinding
    constructor(public typeBinding: TypeBinding[], public id: number = 0) {
        super();
    }

    simplify(): TypeDeclaration {
        let bnds: TypeBinding[] = [];
        for (let i = 0; i < this.typeBinding.length; ++i) {
            bnds.push(new TypeBinding(this.typeBinding[i].typeVariableSequence,
                                      this.typeBinding[i].name,
                                      this.typeBinding[i].type.simplify()));
        }
        return new TypeDeclaration(bnds, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean,
              options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        for (let i = 0; i < this.typeBinding.length; ++i) {

            let knownVars = new Set<string>();
            let badTyVars: string[] = [];
            for (let nm of this.typeBinding[i].typeVariableSequence) {
                knownVars = knownVars.add(nm.toString());
            }
            this.typeBinding[i].type.instantiate(state, tyVarBnd).getTypeVariables().forEach(
                (val: Type[], key: string) => {
                    if (!knownVars.has(key)) {
                        badTyVars.push(key);
                    }
                });
            if (badTyVars.length > 0) {
                throw ElaborationError.getUnguarded(badTyVars);
            }

            let ex = state.getStaticType(this.typeBinding[i].name.getText());
            if (ex !== undefined && ex.type instanceof CustomType) {
                throw new ElaborationError(
                    'Nnaaa~ Redefining types as aliases is not yet implemented.');
            }
            state.setStaticType(this.typeBinding[i].name.getText(),
                new FunctionType(new CustomType(this.typeBinding[i].name.getText(),
                    this.typeBinding[i].typeVariableSequence),
                    this.typeBinding[i].type.instantiate(state, tyVarBnd)), [],
                    this.typeBinding[i].typeVariableSequence.length,
                    true);
        }

        return [state, [], tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        for (let i = 0; i < this.typeBinding.length; ++i) {
            state.setDynamicType(this.typeBinding[i].name.getText(), []);
        }
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'type';
        for (let i = 0; i < this.typeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' <stuff> ' + this.typeBinding[i].name.getText();
            res += ' = ' + this.typeBinding[i].type;
        }
        return res + ';';
    }
}

export class DatatypeDeclaration extends Declaration {
// datatype datatypeBinding <withtype typeBinding>
    constructor(public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public id: number = 0,
                public givenIds: {[name: string]: number} = {}) {
        super();

        if (this.typeBinding !== undefined) {
            throw new FeatureDisabledError('Who is "withtype"?');
        }
    }

    simplify(): Declaration {
        let datbnd: DatatypeBinding[] = [];

        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let ntype: [IdentifierToken, Type|undefined][] = [];
            for (let j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    ntype.push([this.datatypeBinding[i].type[j][0],
                               (<Type> this.datatypeBinding[i].type[j][1]).simplify()]);
                } else {
                    ntype.push(this.datatypeBinding[i].type[j]);
                }
            }
            datbnd.push(new DatatypeBinding(this.datatypeBinding[i].typeVariableSequence,
                this.datatypeBinding[i].name,
                ntype));
        }
        return new DatatypeDeclaration(datbnd, undefined, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean,
              options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        // I'm assuming the withtype is empty

        let tocheck: Type[] = [];
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let res = this.datatypeBinding[i].getType(state, isTopLevel, paramBindings);

            for (let j = 0; j < res[0].length; ++j) {
                if (!State.allowsRebind(res[0][j][0])) {
                    throw new ElaborationError('You simply cannot rebind "'
                        + res[0][j][0] + '".');
                }
                state.setStaticValue(res[0][j][0], res[0][j][1], IdentifierStatus.VALUE_CONSTRUCTOR);
                tocheck.push(res[0][j][1]);
            }
            state.setStaticType(res[2][0], res[1], res[2][1],
                this.datatypeBinding[i].typeVariableSequence.length, true);
            state.incrementValueIdentifierId(res[2][0]);
        }

        for (let i = 0; i < tocheck.length; ++i) {
            tocheck[i].instantiate(state, new Map<string, [Type, boolean]>());
        }

        return [state, [], tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        let modifiable = params.modifiable;
        // I'm assuming the withtype is empty
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let res = this.datatypeBinding[i].compute(state, modifiable);

            for (let j = 0; j < res[0].length; ++j) {
                if (!State.allowsRebind(res[0][j][0])) {
                    throw new EvaluationError('You simply cannot rebind "'
                        + res[0][j][0] + '".');
                }
                state.setDynamicValue(res[0][j][0], res[0][j][1], IdentifierStatus.VALUE_CONSTRUCTOR);
            }
            state.setDynamicType(res[1][0], res[1][1]);
            if (this.givenIds[res[1][0]] === undefined) {
                modifiable.incrementValueIdentifierId(res[1][0]);
                this.givenIds[res[1][0]] = state.getValueIdentifierId(res[1][0]);
            }
        }
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'datatype';
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.datatypeBinding[i].name.getText() + ' =';
            for (let j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (j > 0) {
                    res += ' |';
                }
                res += ' ' + this.datatypeBinding[i].type[j][0].getText();
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    res += ' of ' + (<Type> this.datatypeBinding[i].type[j][1]);
                }
            }
        }
        return res + ';';
    }
}

export class DatatypeReplication extends Declaration {
// datatype name = datatype oldname
    constructor(public name: IdentifierToken,
                public oldname: Token, public id: number = 0) {
        super();
    }

    simplify(): DatatypeReplication {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean,
              options: { [name: string]: any }):
    [State, Warning[], Map<string, [Type, boolean]>, string] {
        let res: TypeInformation | undefined = undefined;

        if (this.oldname instanceof LongIdentifierToken) {
            let st = state.getAndResolveStaticStructure(<LongIdentifierToken> this.oldname);
            if (st !== undefined) {
                res = (<StaticBasis> st).getType(
                    (<LongIdentifierToken> this.oldname).id.getText());
            }
        } else {
            res = state.getStaticType(this.oldname.getText());
        }
        if (res === undefined) {
            throw new ElaborationError(
                'The datatype "' + this.oldname.getText() + '" doesn\'t exist.');
        }

        let tp = res.type.instantiate(state, tyVarBnd);

        state.setStaticType(this.name.getText(), new FunctionType(new CustomType(this.name.getText(),
            (<CustomType> tp).typeArguments, (this.oldname instanceof LongIdentifierToken)
            ? this.oldname : undefined), tp), [], res.arity, res.allowsEquality);
        return [state, [], tyVarBnd, nextName];
   }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        let tp: string[] | undefined = [];
        if (this.oldname instanceof LongIdentifierToken) {
            let st = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.oldname);
            if (st !== undefined) {
                tp = <string[]> (<DynamicBasis> st).getType(
                    (<LongIdentifierToken> this.oldname).id.getText());
            }
        } else {
            tp = <string[]> state.getDynamicType(this.oldname.getText());
        }

        if (tp === undefined) {
            throw new EvaluationError('The datatype "'
                + this.oldname.getText() + '" does not exist.');
        }

        state.setDynamicType(this.name.getText(), tp);
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        return 'datatype ' + this.name.getText() + ' = datatype ' + this.oldname.getText() + ';';
    }
}

export class ExceptionDeclaration extends Declaration {
    constructor(public bindings: ExceptionBinding[],
                public id: number = 0) {
        super();
    }

    simplify(): ExceptionDeclaration {
        return this;
    }

    toString(): string {
        return 'exception <stuff>;';
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean,
              options: { [name: string]: any }):
    [State, Warning[], Map<string, [Type, boolean]>, string] {
        let knownTypeVars = new Set<string>();

        tyVarBnd.forEach((val: [Type, boolean], key: string) => {
            if (key.includes('!')) {
                knownTypeVars = knownTypeVars.add(key.substring(1));
            }
        });

        for (let i = 0; i < this.bindings.length; ++i) {
            state = this.bindings[i].elaborate(state, isTopLevel, knownTypeVars, options);
        }
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        for (let i = 0; i < this.bindings.length; ++i) {
            this.bindings[i].evaluate(state, params.modifiable);
        }
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }
}

export class LocalDeclaration extends Declaration {
// local declaration in body end
    constructor(public declaration: Declaration,
                public body: Declaration, public id: number = 0) {
        super();
    }

    assertUniqueBinding(state: State, conn: Set<string>): Set<string> {
        this.declaration.assertUniqueBinding(state, conn);
        this.body.assertUniqueBinding(state, conn);
        return new Set<string>();
    }

    simplify(): LocalDeclaration {
        return new LocalDeclaration(this.declaration.simplify(), this.body.simplify(), this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean,
              options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        let nstate: [State, Warning[], Map<string, [Type, boolean]>, string]
            = [state.getNestedState(0).getNestedState(state.id), [], tyVarBnd, nextName];

        let nparbnd = new Map<string, Type>();
        paramBindings.forEach((val: Type, key: string) => {
            nparbnd = nparbnd.set(key, val);
        });

        let res = this.declaration.elaborate(nstate[0], tyVarBnd, nextName, nparbnd,
                                             false, options);
        state.valueIdentifierId = res[0].getIdChanges(0);
        let input = res[0].getNestedState(state.id);
        nstate = this.body.elaborate(input, res[2], res[3], nparbnd, isTopLevel, options);
        // Forget all local definitions
        input.parent = state;
        return [nstate[0], res[1].concat(nstate[1]), nstate[2], nstate[3]];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        let modifiable = params.modifiable;
        if (params.step === undefined) {
            params.step = -1;
        }

        let step: number = params.step;

        if (step === -1) {
            let parent = state.getNestedState(0);
            let nstate = parent.getNestedState(state.id);
            if (!parent.insideLocalDeclBody) {
                parent.localDeclStart = true;
            }
            params.nstate = nstate;
            params.step = step + 1;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.declaration,
                'params': {'state': nstate, 'modifiable': modifiable, 'recResult': undefined}
            });
            return;
        }
        if (step === 0) {
            let res = params.recResult;
            if (res === undefined
                || res.newState === undefined) {
                throw new InternalInterpreterError('How is this undefined?');
            }
            let nnstate = <State> res.newState;

            if (res.hasThrown) {
                // Something came flying in our direction. So hide we were here and let it flow.
                return {
                    'newState': state,
                    'value': res.value,
                    'hasThrown': true,
                };
            }
            let nstate = nnstate.getNestedState(state.id);
            nstate.insideLocalDeclBody = true;

            params.nstate = nstate;
            params.res = res;
            params.step = step + 1;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.body,
                'params': {'state': nstate, 'modifiable': modifiable, 'recResult': undefined}
            });
            return;
        }
        // braced, so linter does not complain about nstate being shadowed
        {
            let nres = params.recResult;
            let nstate = <State> params.nstate;
            let res = <EvaluationResult> params.res;
            if (nres === undefined
                || res === undefined) {
                throw new InternalInterpreterError('How is this undefined?');
            }

            // Forget all local definitions
            nstate.parent = state;
            if (nres.newState !== undefined) {
                (nres.newState.insideLocalDeclBody) = state.insideLocalDeclBody;
            }
            return nres;
        }
    }

    toString(): string {
        let res = 'local ' + this.declaration;
        res += ' in ' + this.body;
        res += ' end;';
        return res;
    }
}

export class OpenDeclaration extends Declaration {
// open name_1 ... name_n
    constructor(public names: Token[], public id: number = 0) {
        super();
    }

    simplify(): OpenDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean, options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        for (let i = 0; i < this.names.length; ++i) {
            let tmp: StaticBasis | undefined = undefined;
            if (this.names[i] instanceof LongIdentifierToken) {
                tmp = state.getAndResolveStaticStructure(<LongIdentifierToken> this.names[i]);
                if (tmp !== undefined) {
                    tmp = tmp.getStructure((<LongIdentifierToken> this.names[i]).id.getText());
                }
            } else {
                tmp = state.getStaticStructure(this.names[i].getText());
            }
            if (tmp === undefined) {
                throw new EvaluationError(
                    'Undefined module "' + this.names[i].getText() + '".');
            }

            state.staticBasis.extend(<StaticBasis> tmp);
        }
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        for (let i = 0; i < this.names.length; ++i) {
            let tmp: DynamicBasis | undefined;
            if (this.names[i] instanceof LongIdentifierToken) {
                tmp = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.names[i]);
                if (tmp !== undefined) {
                    tmp = tmp.getStructure((<LongIdentifierToken> this.names[i]).id.getText());
                }
            } else {
                tmp = state.getDynamicStructure(this.names[i].getText());
            }
            if (tmp === undefined) {
                throw new EvaluationError(
                    'Undefined module "' + this.names[i].getText() + '".');
            }
            state.dynamicBasis.extend(<DynamicBasis> tmp);
        }
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'open';
        for (let i = 0; i < this.names.length; ++i) {
            res += ' ' + this.names[i].getText();
        }
        return res + ';';
    }
}

export class EmptyDeclaration extends Declaration {
// exactly what it says on the tin.
    constructor(public id: number = 0) {
        super();
    }

    simplify(): EmptyDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean, options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        return {
            'newState': params.state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        return ' ;';
    }
}

export class SequentialDeclaration extends Declaration {
// declaration1 <;> declaration2
    constructor(public declarations: Declaration[], public id: number = 0) {
        super();
    }

    assertUniqueBinding(state: State, conn: Set<string>): Set<string> {
        for (let i = 0; i < this.declarations.length; ++i) {
            this.declarations[i].assertUniqueBinding(state, conn);
        }
        return new Set<string>();
    }

    simplify(): SequentialDeclaration {
        let decls: Declaration[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].simplify());
        }
        return new SequentialDeclaration(decls, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>, isTopLevel: boolean, options: { [name: string]: any }):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        let warns: Warning[] = [];
        let bnds = tyVarBnd;
        let str = nextName;
        for (let i = 0; i < this.declarations.length; ++i) {
            if (isTopLevel) {
                bnds = new Map<string, [Type, boolean]>();
                state.getTypeVariableBinds()[1].forEach((val: [Type, boolean], key: string) => {
                    bnds = bnds.set(key, val);
                });
            }
            let res = this.declarations[i].elaborate(
                state.getNestedState(this.declarations[i].id),
                bnds, str, paramBindings, isTopLevel, options);
            state = res[0];
            warns = warns.concat(res[1]);
            bnds = res[2];

            let nbnds = new Map<string, [Type, boolean]>();
            if (isTopLevel) {
                nbnds = tyVarBnd;
            }

            res[2].forEach((val: [Type, boolean], key: string) => {
                if (key[1] === '~' ) {
                    // Only free type variables are to be kept
                    let ntp = val[0].instantiate(state, res[2]).normalize(
                        state.freeTypeVariables[0], options);
                    if (!(<State> state.parent).getTypeVariableBinds()[1].has(key)) {
                        warns.push(new Warning(0, 'The free type variable "'
                            + key + '" has been instantiated to "' + ntp[0] + '".\n'));
                    }
                    nbnds = nbnds.set(key, [ntp[0], true]);
                } else if (!isTopLevel) {
                    nbnds = nbnds.set(key, [val[0].instantiate(state, res[2]), false]);
                }
            });
            bnds = nbnds;
            if (isTopLevel) {
                state.freeTypeVariables[1] = nbnds;
                for (let v in state.staticBasis.valueEnvironment) {
                    if (state.staticBasis.valueEnvironment.hasOwnProperty(v)) {
                        let tp = <[Type, IdentifierStatus]> state.staticBasis.valueEnvironment[v];
                        let norm = tp[0].normalize(state.freeTypeVariables[0], options);
                        state.freeTypeVariables[0] = norm[1];
                        state.setStaticValue(v, norm[0], tp[1]);
                    }
                }
            }
            str = res[3];
        }
        if (!isTopLevel) {
            // Put together record pieces
            let nbnds = new Map<string, [Type, boolean]>();
            let bnds2 = new Map<string, [Type, boolean]>();
            let skip = new Set<string>();
            bnds.forEach((val: [Type, boolean], nm: string) => {
                bnds2 = nbnds.set(nm, val);
            });
            bnds.forEach((val: [Type, boolean], nm: string) => {
                if (!skip.has(nm)) {
                    nbnds = nbnds.set(nm, val);
                    if (nm.startsWith('@')) {
                        let nname = nm.substr(1);
                        skip = skip.add(nname);
                        if (!bnds2.has(nname)) {
                            nbnds = nbnds.set(nname, val);
                        } else {
                            let mg = <[Type, boolean]> bnds2.get(nname);
                            try {
                                let rmg = mg[0].merge(state, bnds2, val[0]);
                                nbnds = nbnds.set(nname, [rmg[0], mg[1] || val[1]]);
                            } catch (e) {
                                if (!(e instanceof Array)) {
                                    throw e;
                                }
                                throw new ElaborationError('Cannot merge "' + mg[0].normalize()[0]
                                                           + '" and "' + val[0].normalize()[0]
                                                           + '" :' + e[0] + '.');
                            }
                        }
                    }
                }
            });
            bnds = nbnds;
        }
        return [state, warns, bnds, str];
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        if (params.step === undefined) {
            params.step = -1;
        }

        let step: number = params.step;

        if (step >= 0) {
            let val = params.recResult;
            if (val === undefined
                || val.newState === undefined) {
                throw new InternalInterpreterError('How is this undefined?');
            }

            if (val.hasThrown) {
                // Something blew up, so let someone else handle the mess
                return {
                    'newState': val.newState,
                    'value': val.value,
                    'hasThrown': true,
                };
            }
            state = <State> val.newState;
        }
        ++step;
        if (step < this.declarations.length) {
            let nstate = state.getNestedState(this.declarations[step].id);
            params.step = step;
            params.state = state;
            callStack.push({'next': this, 'params': params});
            callStack.push({
                'next': this.declarations[step],
                'params': {'state': nstate, 'modifiable': params.modifiable, 'recResult': undefined}
            });
            return;
        }

        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = '';
        for (let i = 0; i < this.declarations.length; ++i) {
            if (i > 0) {
                res += ' ';
            }
            res += this.declarations[i];
        }
        return res;
    }
}

// Derived Forms and semantically irrelevant stuff

export class FunctionDeclaration extends Declaration {
// fun typeVariableSequence functionValueBinding
    constructor(public typeVariableSequence: TypeVariable[],
                public functionValueBinding: FunctionValueBinding[], public id: number = 0) {
        super();
    }

    simplify(): ValueDeclaration {
        let valbnd: ValueBinding[] = [];
        for (let i = 0; i < this.functionValueBinding.length; ++i) {
            valbnd.push(this.functionValueBinding[i].simplify());
        }
        return new ValueDeclaration(this.typeVariableSequence, valbnd, this.id);
    }
}

export class Evaluation extends Declaration {
// do exp
    constructor(public expression: Expression) {
        super();
    }

    simplify(): ValueDeclaration {
        return new ValueDeclaration([],
            [new ValueBinding(false, new Tuple([]), this.expression)]).simplify();
    }
}

export class AbstypeDeclaration extends Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    constructor(public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public declaration: Declaration,
                public id: number = 0) {
        super();

        if (this.typeBinding !== undefined) {
            throw new FeatureDisabledError('Who is "withtype"?');
        }
    }

    simplify(): LocalDeclaration {
        let dat = new DatatypeDeclaration(this.datatypeBinding, undefined, this.id);
        let tpbnd: TypeBinding[] = [];
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            tpbnd.push(new TypeBinding(this.datatypeBinding[i].typeVariableSequence,
                this.datatypeBinding[i].name,
                new CustomType(this.datatypeBinding[i].name.getText(),
                    this.datatypeBinding[i].typeVariableSequence)));
        }
        let tp = new TypeDeclaration(tpbnd, this.id);
        return new LocalDeclaration(
            dat, new SequentialDeclaration([tp, this.declaration],
                this.id), this.id).simplify();
    }
}


export class InfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public operators: IdentifierToken[],
                public precedence: number = 0, public id: number = 0) {
        super();
    }

    simplify(): InfixDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    setInfixStatus(state: State): void {
        for (let i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], this.precedence, false, true);
        }
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        this.setInfixStatus(state);
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'infix';
        res += ' ' + this.precedence;
        for (let i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    }
}

export class InfixRDeclaration extends Declaration {
// infixr <d> vid1 .. vidn
    constructor(public operators: IdentifierToken[],
                public precedence: number = 0, public id: number = 0) {
        super();
    }

    simplify(): InfixRDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    setInfixStatus(state: State): void {
        for (let i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], this.precedence, true, true);
        }
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        this.setInfixStatus(state);
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'infixr';
        res += ' ' + this.precedence;
        for (let i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    }
}

export class NonfixDeclaration extends Declaration {
// nonfix <d> vid1 .. vidn
    constructor(public operators: IdentifierToken[],
                public id: number = 0) {
        super();
    }

    simplify(): NonfixDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, [Type, boolean]>, nextName: string,
              paramBindings: Map<string, Type>):
        [State, Warning[], Map<string, [Type, boolean]>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    setInfixStatus(state: State): void {
        for (let i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], 0, false, false);
        }
    }

    evaluate(params: EvaluationParameters, callStack: EvaluationStack): EvaluationResult {
        let state = params.state;
        this.setInfixStatus(state);
        return {
            'newState': state,
            'value': undefined,
            'hasThrown': false,
        };
    }

    toString(): string {
        let res = 'nonfix';
        for (let i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    }
}

// Value Bundings

export class ValueBinding {
// <rec> pattern = expression
    constructor(public isRecursive: boolean,
                public pattern: Pattern, public expression: Expression) {
    }

    toString(): string {
        let res = '';
        if (this.isRecursive) {
            res += 'rec ';
        }
        res += this.pattern;
        res += ' = ';
        return res + this.expression;
    }

    getType(tyVarSeq: TypeVariable[], state: State, tyVarBnd: Map<string, [Type, boolean]>,
            nextName: string, paramBindings: Map<string, Type>, isTopLevel: boolean):
            [[string, Type][], Warning[], Map<string, [Type, boolean]>, string, IdCnt] {
        let nstate = state.getNestedState(state.id);
        let newBnds = tyVarBnd;

        let tp = this.expression.getType(nstate, newBnds, nextName, new Set<string>(),
                                         false, paramBindings);
        let res = this.pattern.matchType(nstate, tp[4], tp[0]);

        let noBind = new Set<string>();

        if (res === undefined) {
            throw new ElaborationError(
                'Type clash. An expression of type "' + tp[0]
                + '" cannot be assigned to "' + res[1] + '".');
        }

        let ntys: TypeVariable[] = [];
        let seennames: Set<string> = new Set<string>();
        for (let i = 0; i < tyVarSeq.length; ++i) {
            if (seennames.has(tyVarSeq[i].name)) {
                throw new ElaborationError(
                    'I will not let a duplicate type variable name "' + tyVarSeq[i].name
                    + '" disturb my Happy Sugar Life.');
            }
            seennames = seennames.add(tyVarSeq[i].name);

            let nt = tyVarSeq[i].instantiate(state, res[2]);
            if (!(nt instanceof TypeVariable) || (<TypeVariable> nt).domain.length > 0
                || tyVarSeq[i].admitsEquality(state) !== nt.admitsEquality(state)) {
                throw new ElaborationError(
                    'Type clash. An expression of explicit type "' + tyVarSeq[i]
                    + '" cannot have type "' + nt.normalize()[0] + '".');
            }
            ntys.push(<TypeVariable> nt);
        }
        this.expression.getExplicitTypeVariables().forEach((val: TypeVariable) => {
            let nt = val.instantiate(state, res[2]);
            if (!(nt instanceof TypeVariable) || (<TypeVariable> nt).domain.length > 0
                || val.admitsEquality(state) !== nt.admitsEquality(state)) {
                throw new ElaborationError(
                    'Type clash. An expression of explicit type "' + val
                    + '" cannot have type "' + nt.normalize()[0] + '".');
            }
        });

        let valuePoly = !this.isRecursive && !this.expression.isSafe(state);
        let hasFree = false;

        for (let i = 0; i < res[0].length; ++i) {
            res[0][i][1] = res[0][i][1].instantiate(state, res[2]);
            if (!isTopLevel) {
                paramBindings = paramBindings.set(res[0][i][0], res[0][i][1]);
            }
            let tv = res[0][i][1].getTypeVariables();
            let free = res[0][i][1].getTypeVariables(true);
            let done = new Set<string>();
            for (let j = ntys.length - 1; j >= 0; --j) {
                if (tv.has(ntys[j].name)) {
                    let dm = <Type[]> tv.get(ntys[j].name);
                    if (res[2].has('$' + ntys[j].name)) {
                        dm = TypeVariable.mergeDomain(dm,
                            (<[TypeVariable, boolean]> res[2].get('$' + ntys[j].name))[0].domain);
                    }
                    res[0][i][1] = new TypeVariableBind(ntys[j].name, res[0][i][1], dm);
                    (<TypeVariableBind> res[0][i][1]).isFree =
                        (<TypeVariableBind> res[0][i][1]).domain.length === 0 && (valuePoly || free.has(ntys[j].name));
                    hasFree = hasFree || (<TypeVariableBind> res[0][i][1]).isFree;

                    done.add(ntys[j].name);
                }
            }
            ntys = [];
            res[0][i][1].getTypeVariables().forEach((dom: Type[], val: string) => {
                if ((isTopLevel || !noBind.has(val)) && !done.has(val)) {
                    let dm = dom;
                    if (res[2].has('$' + val)) {
                        dm = TypeVariable.mergeDomain(dm,
                            (<[TypeVariable, boolean]> res[2].get('$' + val))[0].domain);
                    }
                    ntys.push(new TypeVariable(val, dm));
                }
            });
            for (let j = ntys.length - 1; j >= 0; --j) {
                res[0][i][1] = new TypeVariableBind(ntys[j].name, res[0][i][1], ntys[j].domain);
                (<TypeVariableBind> res[0][i][1]).isFree =
                    (<TypeVariableBind> res[0][i][1]).domain.length === 0 && (valuePoly || free.has(ntys[j].name));

                hasFree = hasFree || (<TypeVariableBind> res[0][i][1]).isFree;
            }
        }

        if (hasFree && isTopLevel) {
            tp[1].push(new Warning(0, 'Free type variables at top level.\n'));
        }

        return [res[0], tp[1], res[2], tp[2], tp[5]];
    }
}

export class FunctionValueBinding {
    constructor(public parameters: [PatternExpression[], Type|undefined, Expression][],
                public name: ValueIdentifier) {
    }

    simplify(): ValueBinding {
        if (this.name === undefined) {
            throw new InternalInterpreterError(
                'This function isn\'t ready to be simplified yet.');
        }

        // Build the case analysis, starting with the (vid1,...,vidn)
        let arr: ValueIdentifier[] = [];
        let matches: [PatternExpression, Expression][] = [];
        for (let i = 0; i < this.parameters[0][0].length; ++i) {
            arr.push(new ValueIdentifier(new IdentifierToken('__arg' + i)));
        }
        for (let i = 0; i < this.parameters.length; ++i) {
            let pat2: PatternExpression;
            if (this.parameters[i][0].length === 1) {
                pat2 = this.parameters[i][0][0];
            } else {
                pat2 = new Tuple(this.parameters[i][0]);
            }

            if (this.parameters[i][1] === undefined) {
                matches.push([pat2, this.parameters[i][2]]);
            } else {
                matches.push([pat2,
                    new TypedExpression(this.parameters[i][2], <Type> this.parameters[i][1])]);
            }
        }
        let pat: PatternExpression;
        if (arr.length !== 1) {
            pat = new Tuple(arr).simplify();
        } else {
            pat = arr[0];
        }
        let mat = new Match(matches);
        let exp: Expression;
        //        if (arr.length === 1) {
        //    exp = new Lambda(mat);
        // } else {
        exp = new CaseAnalysis(pat, mat);

        // Now build the lambdas around
        for (let i = this.parameters[0][0].length - 1; i >= 0; --i) {
            exp = new Lambda(new Match([[
                new ValueIdentifier(new IdentifierToken('__arg' + i)),
                exp]]));
        }
        // }

        return new ValueBinding(true, this.name, exp.simplify());
    }

    toString(): string {
        let res = '';
        for (let i = 0; i < this.parameters.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.name.name.getText();
            for (let j = 0; j < this.parameters[i][0].length; ++j) {
                res += ' ' + this.parameters[i][0][j];
            }
            if (this.parameters[i][1] !== undefined) {
                res += ': ' + (<Type> this.parameters[i][1]);
            }
            res += ' = ' + this.parameters[i][2];
        }
        return res;
    }
}

// Type Bindings

export class TypeBinding {
// typeVariableSequence name = type
    constructor(public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: Type) {
    }
}

// Datatype Bindings

export class DatatypeBinding {
// typeVariableSequence name = <op> constructor <of type>
    // type: [constructorName, <type>]
    constructor(public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: [IdentifierToken, Type | undefined][],
                public givenIds: {[name: string]: number} = {}) {
    }

    getType(state: State, isTopLevel: boolean, paramBindings: Map<string, Type>):
        [[string, Type][], Type, [string, string[]]] {
        let connames: string[] = [];
        let ve: [string, Type][] = [];
        let nstate = state.getNestedState(state.id);

        let id = state.getValueIdentifierId(this.name.getText());
        nstate.incrementValueIdentifierId(this.name.getText());

        let idlesstp = new CustomType(this.name.getText(), this.typeVariableSequence,
            undefined, false, 0);
        let restp = new CustomType(this.name.getText(), this.typeVariableSequence,
            undefined, false, id);
        nstate.setStaticType(this.name.getText(), restp, [], this.typeVariableSequence.length,
            true);
        for (let i = 0; i < this.type.length; ++i) {
            let tp: Type = restp;
            if (this.type[i][1] !== undefined) {
                let curtp = (<Type> this.type[i][1]).replace(idlesstp, restp);
                tp = new FunctionType(curtp, tp);
            }

            let tvs = new Set<string>();
            for (let j = 0; j < this.typeVariableSequence.length; ++j) {
                if (tvs.has(this.typeVariableSequence[j].name)) {
                    throw new ElaborationError(
                        'I\'m not interested in duplicate type variable names such as "'
                        + this.typeVariableSequence[j] + '".');
                }
                tvs = tvs.add(this.typeVariableSequence[j].name);
            }
            let ungar: string[] = [];

            tp.getTypeVariables().forEach((val: Type[], key: string) => {
                if (!tvs.has(key)) {
                    ungar.push(key);
                } else {
                    tp = new TypeVariableBind(key, tp, val);
                }
            });

            if (ungar.length > 0) {
                throw ElaborationError.getUnguarded(ungar);
            }

            ve.push([this.type[i][0].getText(), tp]);
            connames.push(this.type[i][0].getText());
        }
        return [ve, restp, [this.name.getText(), connames]];
    }

    compute(state: State, modifiable: State): [[string, Value][], [string, string[]]] {
        let connames: string[] = [];
        let ve: [string, Value][] = [];
        for (let i = 0; i < this.type.length; ++i) {
            let numArg: number = 0;
            if (this.type[i][1] !== undefined) {
                numArg = 1;
            }
            let id = -1;
            if (this.givenIds[this.type[i][0].getText()] === undefined) {
                id = modifiable.getValueIdentifierId(this.type[i][0].getText());
                modifiable.incrementValueIdentifierId(this.type[i][0].getText());
                this.givenIds[this.type[i][0].getText()] = id;
            } else {
                id = this.givenIds[this.type[i][0].getText()];
            }
            ve.push([this.type[i][0].getText(), new ValueConstructor(this.type[i][0].getText(), numArg, id)]);
            connames.push(this.type[i][0].getText());
        }
        return [ve, [this.name.getText(), connames]];
    }
}

// Exception Bindings

export interface ExceptionBinding {
    evaluate(state: State, modifiable: State): void;
    elaborate(state: State, isTopLevel: boolean, knownTypeVars: Set<string>,
              options: { [name: string]: any }): State;
}

export class DirectExceptionBinding implements ExceptionBinding {
// <op> name <of type>
    constructor(public name: IdentifierToken,
                public type: Type | undefined) {
    }

    elaborate(state: State, isTopLevel: boolean, knownTypeVars: Set<string>,
              options: { [name: string]: any }): State {
        if (this.type !== undefined) {
            let tp = this.type.simplify().instantiate(state, new Map<string, [Type, boolean]>());
            let tyvars: string[] = [];
            tp.getTypeVariables().forEach((dom: Type[], val: string) => {
                //                if (!knownTypeVars.has(val)) {
                    tyvars.push(val);
                // }
            });
            if (isTopLevel && tyvars.length > 0) {
                throw ElaborationError.getUnguarded(tyvars);
            }

            state.setStaticValue(this.name.getText(),
                new FunctionType(tp.makeFree(), new CustomType('exn')),
                IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        } else {
            state.setStaticValue(this.name.getText(), new CustomType('exn'),
                IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        }
        return state;
    }

    evaluate(state: State, modifiable: State): void {
        let numArg = 0;
        if (this.type !== undefined) {
            numArg = 1;
        }
        let id = state.getValueIdentifierId(this.name.getText());
        state.incrementValueIdentifierId(this.name.getText());
        let evalId = modifiable.getNextExceptionEvalId();

        if (!State.allowsRebind(this.name.getText())) {
            throw new EvaluationError('You simply cannot rebind "'
                + this.name.getText() + '".');
        }

        state.setDynamicValue(this.name.getText(),
            new ExceptionConstructor(this.name.getText(), numArg, id, evalId), IdentifierStatus.EXCEPTION_CONSTRUCTOR);
    }
}

export class ExceptionAlias implements ExceptionBinding {
// <op> name = <op> oldname
    constructor(public name: IdentifierToken, public oldname: Token) {
    }

    elaborate(state: State, isTopLevel: boolean, options: { [name: string]: any }): State {
        let res: [Type, IdentifierStatus] | undefined = undefined;
        if (this.oldname instanceof LongIdentifierToken) {
            let st = state.getAndResolveStaticStructure(<LongIdentifierToken> this.oldname);
            if (st !== undefined) {
                res = st.getValue((<LongIdentifierToken> this.oldname).id.getText());
            }
        } else {
            res = state.getStaticValue(this.oldname.getText());
        }
        if (res === undefined) {
            throw new ElaborationError('Unbound value identifier "'
                + this.oldname.getText() + '".');
        } else if (res[1] !== IdentifierStatus.EXCEPTION_CONSTRUCTOR) {
            throw new ElaborationError('You cannot transform "'
                + res[0] + '" into an exception.');
        }
        state.setStaticValue(this.name.getText(), res[0].normalize()[0], IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        return state;
    }

    evaluate(state: State, modifiable: State): void {
        let res: [Value, IdentifierStatus] | undefined = undefined;
        if (this.oldname instanceof LongIdentifierToken) {
            let st = state.getAndResolveDynamicStructure(<LongIdentifierToken> this.oldname);
            if (st !== undefined) {
                res = st.getValue((<LongIdentifierToken> this.oldname).id.getText());
            }
        } else {
            res = state.getDynamicValue(this.oldname.getText());
        }
        if (res === undefined) {
            throw new EvaluationError('Unbound value identifier "'
                + this.oldname.getText() + '".');
        } else if (res[1] !== IdentifierStatus.EXCEPTION_CONSTRUCTOR) {
            throw new EvaluationError('You cannot transform "'
                + res[0].toString(state, 40) + '" into an exception.');
        }
        state.setDynamicValue(this.name.getText(), res[0], IdentifierStatus.EXCEPTION_CONSTRUCTOR);
    }
}
