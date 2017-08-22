import { Expression, ValueIdentifier, CaseAnalysis, Lambda, Match,
         Pattern, TypedExpression, Tuple, PatternExpression } from './expressions';
import { IdentifierToken, Token } from './tokens';
import { Type, TypeVariable, FunctionType, CustomType, TypeVariableBind } from './types';
import { State, IdentifierStatus } from './state';
import { InternalInterpreterError, ElaborationError,
         EvaluationError, FeatureDisabledError, Warning } from './errors';
import { Value, ValueConstructor, ExceptionConstructor, ExceptionValue,
         FunctionValue } from './values';

export abstract class Declaration {
    id: number;
    elaborate(state: State, tyVarBnd: Map<string, Type> = new Map<string, Type>(), nextName: string = '\'t0'): [State, Warning[], Map<string, Type>, string] {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }

    // Returns [computed state, has Error occured, Exception]
    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }

    toString(indentation: number, oneLine: boolean): string {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }

    simplify(): Declaration {
        throw new InternalInterpreterError( -1, 'Not yet implemented.');
    }
}

// Declaration subclasses
export class ValueDeclaration extends Declaration {
// val typeVariableSequence valueBinding
    constructor(public position: number, public typeVariableSequence: TypeVariable[],
                public valueBinding: ValueBinding[], public id: number = 0) {
        super();
    }

    simplify(): ValueDeclaration {
        let valBnd: ValueBinding[] = [];
        for (let i = 0; i < this.valueBinding.length; ++i) {
            valBnd.push(new ValueBinding(this.valueBinding[i].position,
                                         this.valueBinding[i].isRecursive,
                                         this.valueBinding[i].pattern.simplify(),
                                         this.valueBinding[i].expression.simplify()));
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valBnd, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        let result: [string, Type][] = [];

        let isRec = false;
        let warns: Warning[] = [];
        let bnds = tyVarBnd;
        let i = 0;
        for (; i < this.valueBinding.length; ++i) {
            if (this.valueBinding[i].isRecursive) {
                isRec = true;

                for (let j = i; j < this.valueBinding.length; ++j) {
                    let r = (<ValueIdentifier> this.valueBinding[j].pattern).name.getText();
                    result.push([r, new TypeVariableBind('\'a', new TypeVariableBind('\'b',
                        new FunctionType(new TypeVariable('\'a'), new TypeVariable('\'b'))))]);
                }

                break;
            }
            let val = this.valueBinding[i].getType(this.typeVariableSequence, state, bnds, nextName);

            warns = warns.concat(val[1]);
            bnds = val[2];
            nextName = val[3];

            for (let j = 0; j < (<[string, Type][]> val[0]).length; ++j) {
                result.push((<[string, Type][]> val[0])[j]);
            }
        }

        for (let j = 0; j < result.length; ++j) {
            state.setStaticValue(result[j][0], result[j][1]/*.normalize()*/, IdentifierStatus.VALUE_VARIABLE);
        }

        for (let j = i; j < this.valueBinding.length; ++j) {
            let val = this.valueBinding[i].getType(this.typeVariableSequence, state, bnds, nextName);
            warns = warns.concat(val[1]);
            bnds = val[2];
            nextName = val[3];
            for (let k = 0; k < val[0].length; ++k) {
                state.setStaticValue(val[0][k][0], val[0][k][1]/*.normalize()*/, IdentifierStatus.VALUE_VARIABLE);
            }
        }

        return [state, warns, bnds, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        let result: [string, Value][] = [];
        let recursives: [string, Value][] = [];

        let isRec = false;
        let warns: Warning[] = [];
        for (let i = 0; i < this.valueBinding.length; ++i) {
            if (this.valueBinding[i].isRecursive) {
                isRec = true;
            }
            let val = this.valueBinding[i].compute(state);
            warns = warns.concat(val[2]);
            for (let j = 0; j < val[3].length; ++j) {
                state.setCell(val[3][j][0], val[3][j][1]);
            }

            if (val[1] !== undefined) {
                return [state, true, val[1], warns];
            }
            if (val[0] === undefined) {
                return [state, true, new ExceptionValue('Bind'), warns];
            }

            for (let j = 0; j < (<[string, Value][]> val[0]).length; ++j) {
                if (!isRec) {
                    result.push((<[string, Value][]> val[0])[j]);
                } else {
                    recursives.push((<[string, Value][]> val[0])[j]);
                }
            }
        }

        for (let j = 0; j < result.length; ++j) {
            state.setDynamicValue(result[j][0], result[j][1], IdentifierStatus.VALUE_VARIABLE);
        }

        for (let j = 0; j < recursives.length; ++j) {
            if (recursives[j][1] instanceof FunctionValue) {
                state.setDynamicValue(recursives[j][0], new FunctionValue(
                    (<FunctionValue> recursives[j][1]).state, recursives,
                    (<FunctionValue> recursives[j][1]).body), IdentifierStatus.VALUE_VARIABLE);
            } else {
                state.setDynamicValue(recursives[j][0], recursives[j][1], IdentifierStatus.VALUE_VARIABLE);
            }
        }

        return [state, false, undefined, warns];
    }

    toString(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'val <stuff>';
        for (let i = 0; i < this.valueBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.valueBinding[i].toString(indentation, oneLine);
        }
        return res += ';';
    }
}

export class TypeDeclaration extends Declaration {
// type typeBinding
    constructor(public position: number, public typeBinding: TypeBinding[], public id: number = 0) {
        super();
    }

    simplify(): TypeDeclaration {
        let bnds: TypeBinding[] = [];
        for (let i = 0; i < this.typeBinding.length; ++i) {
            bnds.push(new TypeBinding(this.typeBinding[i].position,
                                      this.typeBinding[i].typeVariableSequence,
                                      this.typeBinding[i].name,
                                      this.typeBinding[i].type.simplify()));
        }
        return new TypeDeclaration(this.position, bnds, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        for (let i = 0; i < this.typeBinding.length; ++i) {
            state.setStaticType(this.typeBinding[i].name.getText(),
                new FunctionType(new CustomType(this.typeBinding[i].name.getText(),
                    this.typeBinding[i].typeVariableSequence),
                    this.typeBinding[i].type), [],
                this.typeBinding[i].typeVariableSequence.length);
        }

        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        for (let i = 0; i < this.typeBinding.length; ++i) {
            state.setDynamicType(this.typeBinding[i].name.getText(), []);
        }
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
        // TODO
        let res = 'type';
        for (let i = 0; i < this.typeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' <stuff> ' + this.typeBinding[i].name.getText();
            res += ' = ' + this.typeBinding[i].type.toString();
        }
        return res + ';';
    }
}

export class DatatypeDeclaration extends Declaration {
// datatype datatypeBinding <withtype typeBinding>
    constructor(public position: number, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public id: number = 0) {
        super();

        if (this.typeBinding !== undefined) {
            throw new FeatureDisabledError(this.position, 'Don\'t use "withtype". It is evil.');
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
            datbnd.push(new DatatypeBinding(this.datatypeBinding[i].position,
                this.datatypeBinding[i].typeVariableSequence,
                this.datatypeBinding[i].name,
                ntype));
        }

        // TODO Correctly implement the withtype ~> type transition or clean up this mess
        /*
        if (this.typeBinding) {
            return new SequentialDeclaration(this.position, [
                new DatatypeDeclaration(this.position, datbnd, undefined),
                new TypeDeclaration(this.position, this.typeBinding).simplify()]);
        } else { */
        return new DatatypeDeclaration(this.position, datbnd, undefined, this.id);
        /* } */
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        // I'm assuming the withtype is empty
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let res = this.datatypeBinding[i].getType(state);

            for (let j = 0; j < res[0].length; ++j) {
                if (!State.allowsRebind(res[0][j][0])) {
                    throw new ElaborationError(this.position, 'You simply cannot rebind "'
                        + res[0][j][0] + '".');
                }
                state.setStaticValue(res[0][j][0], res[0][j][1].normalize(), IdentifierStatus.VALUE_CONSTRUCTOR);
            }
            // TODO id
            state.setStaticType(res[2][0], res[1], res[2][1], this.datatypeBinding[i].typeVariableSequence.length);
        }

        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        // I'm assuming the withtype is empty
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            let res = this.datatypeBinding[i].compute(state);

            for (let j = 0; j < res[0].length; ++j) {
                if (!State.allowsRebind(res[0][j][0])) {
                    throw new EvaluationError(this.position, 'You simply cannot rebind "'
                        + res[0][j][0] + '".');
                }
                state.setDynamicValue(res[0][j][0], res[0][j][1], IdentifierStatus.VALUE_CONSTRUCTOR);
            }
            // TODO id
            state.setDynamicType(res[1][0], res[1][1]);
        }
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
        let res = 'datatype';
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.datatypeBinding[i].name.getText() + ' =';
            for (let j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (j > 0) {
                    res += ' | ';
                }
                res += ' ' + this.datatypeBinding[i].type[j][0].getText();
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    res += ' of ' + (<Type> this.datatypeBinding[i].type[j][1]).toString();
                }
            }
        }
        return res;
    }
}

export class DatatypeReplication extends Declaration {
// datatype name = datatype oldname
    constructor(public position: number, public name: IdentifierToken,
                public oldname: Token, public id: number = 0) {
        super();
    }

    simplify(): DatatypeReplication {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        let res = state.getStaticType(this.oldname.getText());
        if (res === undefined) {
            throw new ElaborationError(this.position,
                'The datatype "' + this.oldname.getText() + '" doesn\'t exist.');
        }
        state.setStaticType(this.name.getText(), res.type, res.constructors, res.arity);
        return [state, [], tyVarBnd, nextName];
   }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        let res = state.getDynamicType(this.oldname.getText());
        if (res === undefined) {
            throw new EvaluationError(this.position,
                'The datatype "' + this.oldname.getText() + '" doesn\'t exist.');
        }
        state.setDynamicType(this.name.getText(), res);
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
        return 'datatype ' + this.name.getText() + ' = datatype ' + this.oldname.getText() + ';';
    }
}

export class ExceptionDeclaration extends Declaration {
    constructor(public position: number, public bindings: ExceptionBinding[],
                public id: number = 0) {
        super();
    }

    simplify(): ExceptionDeclaration {
        return this;
    }

    toString(indentation: number, oneLine: boolean): string {
        // TODO
        throw new InternalInterpreterError(-1, 'Not yet implemented.');
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        for (let i = 0; i < this.bindings.length; ++i) {
            state = this.bindings[i].elaborate(state);
        }
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        for (let i = 0; i < this.bindings.length; ++i) {
            let res = this.bindings[i].evaluate(state);
            if (res[1]) {
                return [res[0], res[1], res[2], []];
            }
            state = res[0];
        }
        return [state, false, undefined, []];
    }
}

export class LocalDeclaration extends Declaration {
// local declaration in body end
    constructor(public position: number, public declaration: Declaration,
                public body: Declaration, public id: number = 0) {
        super();
    }

    simplify(): LocalDeclaration {
        return new LocalDeclaration(this.position, this.declaration.simplify(), this.body.simplify(), this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        let nstate: [State, Warning[], Map<string, Type>, string]
            = [state.getNestedState(state.id), [], tyVarBnd, nextName];
        // TODO Warnings
        let res = this.declaration.elaborate(nstate[0], tyVarBnd, nextName);
        let input = res[0].getNestedState(state.id);
        nstate = this.body.elaborate(input, res[2], res[3]);
        // Forget all local definitions
        input.parent = state;
        return [nstate[0], res[1].concat(nstate[1]), nstate[2], nstate[3]];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        let nstate = state.getNestedState(0).getNestedState(state.id);
        let res = this.declaration.evaluate(nstate);
        let membnd = res[0].getMemoryChanges(0);

        for (let i = 0; i < membnd.length; ++i) {
            state.setCell(membnd[i][0], membnd[i][1]);
        }

        if (res[1]) {
            // Something came flying in our direction. So hide we were here and let it flow.
            return [state, true, res[2], res[3]];
        }
        nstate = res[0].getNestedState(state.id);
        let nres = this.body.evaluate(nstate);

        // Forget all local definitions
        nstate.parent = state;
        nres[3] = res[3].concat(nres[3]);
        return nres;
    }

    toString(indentation: number, oneLine: boolean): string {
        let res = 'local ' + this.declaration.toString(indentation, oneLine);
        res += ' in ' + this.body.toString(indentation, oneLine);
        res += ' end;';
        return res;
    }
}

export class OpenDeclaration extends Declaration {
// open name_1 ... name_n
    constructor(public position: number, public names: Token[], public id: number = 0) {
        super();
    }

    simplify(): OpenDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        // TODO Yeah, if we had structs, we could actually implement this
        throw new InternalInterpreterError(-1,
            'Yeah, you better wait a little before trying this again.');
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        // TODO Yeah, if we had structs, we could actually implement this
        throw new InternalInterpreterError(-1,
            'Yeah, you better wait a little before trying this again.');
    }

    toString(indentation: number, oneLine: boolean): string {
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

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]]  {
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
        return ' ;';
    }
}

export class SequentialDeclaration extends Declaration {
// declaration1 <;> declaration2
    constructor(public position: number, public declarations: Declaration[], public id: number = 0) {
        super();
    }

    simplify(): SequentialDeclaration {
        let decls: Declaration[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].simplify());
        }
        return new SequentialDeclaration(this.position, decls, this.id);
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        let warns: Warning[] = [];
        let bnds = tyVarBnd;
        let str = nextName;
        for (let i = 0; i < this.declarations.length; ++i) {
            let res = this.declarations[i].elaborate(
                state.getNestedState(this.declarations[i].id), tyVarBnd, str);
            state = res[0];
            warns = warns.concat(res[1]);
            bnds = res[2];
            str = res[3];
        }
        return [state, warns, bnds, str];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]] {
        let warns: Warning[] = [];
        for (let i = 0; i < this.declarations.length; ++i) {
            let nstate = state.getNestedState(this.declarations[i].id);
            let res = this.declarations[i].evaluate(nstate);
            warns = warns.concat(res[3]);
            if (res[1]) {
                // Something blew up, so let someone else handle the mess
                return [res[0], res[1], res[2], warns];
            }
            state = res[0];
        }
        return [state, false, undefined, warns];
    }

    toString(indentation: number, oneLine: boolean): string {
        let res = '';
        for (let i = 0; i < this.declarations.length; ++i) {
            if (i > 0) {
                res += ' ';
            }
            res += this.declarations[i].toString(indentation, oneLine);
        }
        return res;
    }
}

// Derived Forms and semantically irrelevant stuff

export class FunctionDeclaration extends Declaration {
// fun typeVariableSequence functionValueBinding
    constructor(public position: number, public typeVariableSequence: TypeVariable[],
                public functionValueBinding: FunctionValueBinding[], public id: number = 0) {
        super();
    }

    simplify(): ValueDeclaration {
        let valbnd: ValueBinding[] = [];
        for (let i = 0; i < this.functionValueBinding.length; ++i) {
            valbnd.push(this.functionValueBinding[i].simplify());
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valbnd, this.id);
    }
}

export class AbstypeDeclaration extends Declaration {
// abstype datatypeBinding <withtype typeBinding> with declaration end
    constructor(public position: number, public datatypeBinding: DatatypeBinding[],
                public typeBinding: (TypeBinding[]) | undefined, public declaration: Declaration,
                public id: number = 0) {
        super();

        if (this.typeBinding !== undefined) {
            throw new FeatureDisabledError(this.position, 'Don\'t use "withtype". It is evil.');
        }
    }

    simplify(): LocalDeclaration {
        let dat = new DatatypeDeclaration(this.position, this.datatypeBinding, undefined, this.id);
        let tpbnd: TypeBinding[] = [];
        for (let i = 0; i < this.datatypeBinding.length; ++i) {
            tpbnd.push(new TypeBinding(this.datatypeBinding[i].position,
                this.datatypeBinding[i].typeVariableSequence,
                this.datatypeBinding[i].name,
                new CustomType(this.datatypeBinding[i].name.getText(),
                    this.datatypeBinding[i].typeVariableSequence)));
        }
        let tp = new TypeDeclaration(this.position, tpbnd, this.id);
        return new LocalDeclaration(this.position,
            dat, new SequentialDeclaration(this.position, [tp, this.declaration],
                this.id), this.id).simplify();
    }
}


export class InfixDeclaration extends Declaration {
// infix <d> vid1 .. vidn
    constructor(public position: number, public operators: IdentifierToken[],
                public precedence: number = 0, public id: number = 0) {
        super();
    }

    simplify(): InfixDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]]  {
        for (let i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], this.precedence, false, true);
        }
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
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
    constructor(public position: number, public operators: IdentifierToken[],
                public precedence: number = 0, public id: number = 0) {
        super();
    }

    simplify(): InfixRDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]]  {
        for (let i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], this.precedence, true, true);
        }
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
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
    constructor(public position: number, public operators: IdentifierToken[],
                public id: number = 0) {
        super();
    }

    simplify(): NonfixDeclaration {
        return this;
    }

    elaborate(state: State, tyVarBnd: Map<string, Type>, nextName: string): [State, Warning[], Map<string, Type>, string] {
        return [state, [], tyVarBnd, nextName];
    }

    evaluate(state: State): [State, boolean, Value|undefined, Warning[]]  {
        for (let i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], 0, false, false);
        }
        return [state, false, undefined, []];
    }

    toString(indentation: number, oneLine: boolean): string {
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
    constructor(public position: number, public isRecursive: boolean,
                public pattern: Pattern, public expression: Expression) {
    }

    toString(indentation: number, oneLine: boolean): string {
        let res = '';
        if (this.isRecursive) {
            res += 'rec ';
        }
        res += this.pattern.toString(indentation, oneLine);
        res += ' = ';
        return res + this.expression.toString(indentation, oneLine);
    }

    getType(tyVarSeq: TypeVariable[], state: State, tyVarBnd: Map<string, Type>, nextName: string): [[string, Type][], Warning[], Map<string, Type>, string] {
        let nstate = state.getNestedState(state.id);
        let tp = this.expression.getType(nstate, tyVarBnd, nextName);
        let res = this.pattern.matchType(nstate, tp[4], tp[0]);

        if (res === undefined) {
            throw new ElaborationError(this.position,
                'Type clash. An expression of type "' + tp[0].toString()
                + '" cannot be assigned to "' + res[1].toString() + '".');
        }

        let ntys: TypeVariable[] = [];
        for (let i = 0; i < tyVarSeq.length; ++i) {
            let nt = tyVarSeq[i].instantiate(state, res[2]);
            if (!(nt instanceof TypeVariable)) {
                throw new ElaborationError(this.position,
                    'Type clash. An expression of explicit type "' + tyVarSeq[i]
                    + '" cannot have type "' + nt + '".');
            }
            ntys.push(<TypeVariable> nt);
        }


        for (let i = 0; i < res[0].length; ++i) {
            res[0][i][1] = res[0][i][1].instantiate(state, res[2]);
            let tv = res[0][i][1].getTypeVariables();
            for (let j = ntys.length - 1; j >= 0; --j) {
                if (tv.has(ntys[j].name)) {
                    res[0][i][1] = new TypeVariableBind(ntys[j].name, res[0][i][1]);
                }
            }
            if (tyVarBnd === undefined || tyVarBnd.size === 0) {
                // Toplevel so bind all remaining tyvars
                ntys = [];
                res[0][i][1].getTypeVariables().forEach((val: string) => {
                    ntys.push(new TypeVariable(val));
                });
                for (let j = ntys.length - 1; j >= 0; --j) {
                    res[0][i][1] = new TypeVariableBind(ntys[j].name, res[0][i][1]);
                }
            }
        }


        return [res[0], tp[1], res[2], tp[2]];
    }

    // Returns [ VE | undef, Excep | undef, Warning[]]
    compute(state: State): [[string, Value][] | undefined, Value | undefined, Warning[], [number, Value][]] {
        let v = this.expression.compute(state);
        if (v[1]) {
            return [undefined, v[0], v[2], v[3]];
        }
        return [this.pattern.matches(state, v[0]), undefined, v[2], v[3]];
    }
}

export class FunctionValueBinding {
    constructor(public position: number,
                public parameters: [PatternExpression[], Type|undefined, Expression][],
                public name: ValueIdentifier) {
    }

    simplify(): ValueBinding {
        if (this.name === undefined) {
            throw new InternalInterpreterError(this.position,
                'This function isn\'t ready to be simplified yet.');
        }

        // Build the case analysis, starting with the (vid1,...,vidn)
        let arr: ValueIdentifier[] = [];
        let matches: [PatternExpression, Expression][] = [];
        for (let i = 0; i < this.parameters[0][0].length; ++i) {
            arr.push(new ValueIdentifier(-1, new IdentifierToken('__arg' + i, -1)));
        }
        for (let i = 0; i < this.parameters.length; ++i) {
            let pat2: PatternExpression;
            if (this.parameters[i][0].length === 1) {
                pat2 = this.parameters[i][0][0];
            } else {
                pat2 = new Tuple(-1, this.parameters[i][0]);
            }

            if (this.parameters[i][1] === undefined) {
                matches.push([pat2, this.parameters[i][2]]);
            } else {
                matches.push([pat2,
                    new TypedExpression(-1, this.parameters[i][2], <Type> this.parameters[i][1])]);
            }
        }
        let pat: PatternExpression;
        if (arr.length !== 1) {
            pat = new Tuple(-1, arr).simplify();
        } else {
            pat = arr[0];
        }
        let mat = new Match(-1, matches);
        let exp: Expression;
        //        if (arr.length === 1) {
        //    exp = new Lambda(-1, mat);
        // } else {
        exp = new CaseAnalysis(-1, pat, mat);

        // Now build the lambdas around
        for (let i = this.parameters[0][0].length - 1; i >= 0; --i) {
            exp = new Lambda(-1, new Match(-1, [[
                new ValueIdentifier(-1, new IdentifierToken('__arg' + i, -1)),
                exp]]));
        }
        // }

        return new ValueBinding(this.position, true, this.name, exp.simplify());
    }

    toString(indentation: number, oneLine: boolean): string {
        let res = '';
        for (let i = 0; i < this.parameters.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.name.name.getText();
            for (let j = 0; j < this.parameters[i][0].length; ++j) {
                res += ' ' + this.parameters[i][0][j].toString(indentation, oneLine);
            }
            if (this.parameters[i][1] !== undefined) {
                res += ': ' + (<Type> this.parameters[i][1]).toString();
            }
            res += ' = ' + this.parameters[i][2].toString(indentation, oneLine);
        }
        return res;
    }
}

// Type Bindings

export class TypeBinding {
// typeVariableSequence name = type
    constructor(public position: number, public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: Type) {
    }
}

// Datatype Bindings

export class DatatypeBinding {
// typeVariableSequence name = <op> constructor <of type>
    // type: [constructorName, <type>]
    constructor(public position: number, public typeVariableSequence: TypeVariable[],
                public name: IdentifierToken, public type: [IdentifierToken, Type | undefined][]) {
    }

    getType(state: State): [[string, Type][], Type, [string, string[]]] {
        let connames: string[] = [];
        let ve: [string, Type][] = [];
        let nstate = state.getNestedState(state.id);
        let restp = new CustomType(this.name.getText(), this.typeVariableSequence);
        nstate.setStaticType(this.name.getText(), restp, [], this.typeVariableSequence.length);
        for (let i = 0; i < this.type.length; ++i) {
            let numArg: number = 0;
            let tp: Type = restp;
            if (this.type[i][1] !== undefined) {
                numArg = 1;
                tp = new FunctionType((<Type> this.type[i][1]).instantiate(
                    nstate, new Map<string, Type>()), tp);
            }
            // TODO ID
            // let id = state.getValueIdentifierId(this.type[i][0].getText());
            // state.incrementValueIdentifierId(this.type[i][0].getText());
            ve.push([this.type[i][0].getText(), tp]);
            connames.push(this.type[i][0].getText());
        }
        return [ve, restp, [this.name.getText(), connames]];
    }

    compute(state: State): [[string, Value][], [string, string[]]] {
        let connames: string[] = [];
        let ve: [string, Value][] = [];
        for (let i = 0; i < this.type.length; ++i) {
            let numArg: number = 0;
            if (this.type[i][1] !== undefined) {
                numArg = 1;
            }
            let id = state.getValueIdentifierId(this.type[i][0].getText());
            state.incrementValueIdentifierId(this.type[i][0].getText());
            ve.push([this.type[i][0].getText(), new ValueConstructor(this.type[i][0].getText(), numArg, id)]);
            connames.push(this.type[i][0].getText());
        }
        return [ve, [this.name.getText(), connames]];
    }
}

// Exception Bindings

export interface ExceptionBinding {
    evaluate(state: State): [State, boolean, Value|undefined];
    elaborate(state: State): State;
}

export class DirectExceptionBinding implements ExceptionBinding {
// <op> name <of type>
    constructor(public position: number,
                public name: IdentifierToken,
                public type: Type | undefined) {
    }

    elaborate(state: State): State {
        if (this.type !== undefined) {
            let tp = this.type.simplify().instantiate(state, new Map<string, Type>());
            let tyvars: string[] = [];
            tp.getTypeVariables().forEach((val: string) => {
                tyvars.push(val);
            });
            // TODO Only do this if we're at top level
            // if (tyvars.length > 0) {
            //    throw ElaborationError.getUnguarded(this.position, tyvars);
            // }

            state.setStaticValue(this.name.getText(),
                new FunctionType(tp, new CustomType('exn')).normalize(),
                IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        } else {
            state.setStaticValue(this.name.getText(), new CustomType('exn').normalize(),
                IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        }
        return state;
    }

    evaluate(state: State): [State, boolean, Value|undefined] {
        let numArg = 0;
        if (this.type !== undefined) {
            numArg = 1;
        }
        let id = state.getValueIdentifierId(this.name.getText());
        state.incrementValueIdentifierId(this.name.getText());

        if (!State.allowsRebind(this.name.getText())) {
            throw new EvaluationError(this.position, 'You simply cannot rebind "'
                + this.name.getText() + '".');
        }

        state.setDynamicValue(this.name.getText(),
            new ExceptionConstructor(this.name.getText(), numArg, id), IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        return [state, false, undefined];
    }
}

export class ExceptionAlias implements ExceptionBinding {
// <op> name = <op> oldname
    constructor(public position: number, public name: IdentifierToken, public oldname: Token) {
    }

    elaborate(state: State): State {
        let res = state.getStaticValue(this.oldname.getText());
        if (res === undefined) {
            throw new ElaborationError(this.position, 'Unbound value identifier "'
                + this.oldname.getText() + '".');
        } else if (res[1] !== IdentifierStatus.EXCEPTION_CONSTRUCTOR) {
            throw new ElaborationError(this.position, 'You cannot transform "'
                + res[0].toString() + '" into an exception.');
        }
        state.setStaticValue(this.name.getText(), res[0].normalize(), IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        return state;

    }

    evaluate(state: State): [State, boolean, Value|undefined] {
        let res = state.getDynamicValue(this.oldname.getText());
        if (res === undefined) {
            throw new EvaluationError(this.position, 'Unbound value identifier "'
                + this.oldname.getText() + '".');
        } else if (res[1] !== IdentifierStatus.EXCEPTION_CONSTRUCTOR) {
            throw new EvaluationError(this.position, 'You cannot transform "'
                + res[0].toString(state) + '" into an exception.');
        }
        state.setDynamicValue(this.name.getText(), res[0], IdentifierStatus.EXCEPTION_CONSTRUCTOR);
        return [state, false, undefined];
    }
}

