import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { TypeVariable, FunctionType, TupleType } from '../types';
import { PredefinedFunction, RecordValue, Value, StringValue } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, failException, intType, stringType } from '../stdlib';

function addAssertLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('assertDefined',
                  new PredefinedFunction('assertDefined',
                                         (val: Value, params: EvaluationParameters) => {
        let assertFailed: boolean = false;

        if (val instanceof RecordValue && val.entries.size === 2) {
            let variable = val.getValue('1');
            let errmsg = val.getValue('2');

            if (variable instanceof StringValue) {

                let varname: string = (variable as StringValue).value;
                let curstate = params.modifiable;
                if (curstate === undefined) {
                    assertFailed = true;
                } else {
                    let varval = curstate.getDynamicValue(varname);
                    if (varval === undefined) {
                        assertFailed = true;
                    }
                }

                if (assertFailed) {
                    return [failException.construct(errmsg), true, []];
                }
                return [new RecordValue(), false, []];
            }
        }
        throw new InternalInterpreterError('I hate ecchi people!');
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('assertDefined', new FunctionType(
        new TupleType([stringType, stringType]),
        new TupleType([])).simplify(), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('assertType',
                  new PredefinedFunction('assertType',
                                         (val: Value, params: EvaluationParameters) => {
        let assertFailed = false;
        if (val instanceof RecordValue && val.entries.size === 2) {
            let variable = val.getValue('1');
            let errmsg = val.getValue('2');

            if (variable instanceof RecordValue && val.entries.size === 2) {
                let varname = variable.getValue('1');
                let vartype = variable.getValue('2');

                if (varname instanceof StringValue && vartype instanceof StringValue) {
                    let varnm: string = (varname as StringValue).value;
                    let curstate = params.modifiable;
                    if (curstate === undefined) {
                        assertFailed = true;
                    } else {
                        let varval = curstate.getStaticValue(varnm);
                        if (varval === undefined) {
                            assertFailed = true;
                        } else {
                            let vval = varval[0];
                            if (vval === undefined
                                || vval.toString({}) !== (vartype as StringValue).value) {
                                    assertFailed = true;
                            }
                        }
                    }

                    if (assertFailed) {
                        return [failException.construct(errmsg), true, []];
                    }
                    return [new RecordValue(), false, []];
                }
            }
        }
        throw new InternalInterpreterError('In the name of the moon, I will punish you!');
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('assertType', new FunctionType(
        new TupleType([new TupleType([stringType, stringType]), stringType]),
        new TupleType([])).simplify(), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('assertValue',
                  new PredefinedFunction('assertValue',
                                         (val: Value, params: EvaluationParameters) => {
        let assertFailed = false;
        if (val instanceof RecordValue && val.entries.size === 2) {
            let variable = val.getValue('1');
            let errmsg = val.getValue('2');

            if (variable instanceof RecordValue && val.entries.size === 2) {
                let varname = variable.getValue('1');
                let vartype = variable.getValue('2');

                if (varname instanceof StringValue && vartype instanceof StringValue) {
                    let varnm: string = (varname as StringValue).value;
                    let curstate = params.modifiable;
                    if (curstate === undefined) {
                        assertFailed = true;
                    } else {
                        let varval = curstate.getDynamicValue(varnm);
                        if (varval === undefined) {
                            assertFailed = true;
                        } else {
                            let vval = varval[0];
                            if (vval === undefined
                                || vval.toString(curstate) !== (vartype as StringValue).value) {
                                    assertFailed = true;
                            }
                        }
                    }

                    if (assertFailed) {
                        return [failException.construct(errmsg), true, []];
                    }
                    return [new RecordValue(), false, []];
                }
            }
        }
        throw new InternalInterpreterError('嘘だ');
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('assertValue', new FunctionType(
        new TupleType([new TupleType([stringType, stringType]), stringType]),
        new TupleType([])).simplify(), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('assertValueEq',
                  new PredefinedFunction('assertValueEq',
                                         (val: Value, params: EvaluationParameters) => {
        let assertFailed = false;
        if (val instanceof RecordValue && val.entries.size === 2) {
            let variable = val.getValue('1');
            let errmsg = val.getValue('2');

            if (variable instanceof RecordValue && val.entries.size === 2) {
                let varname = variable.getValue('1');
                let vartype = variable.getValue('2');

                if (varname instanceof StringValue) {
                    let varnm: string = (varname as StringValue).value;
                    let curstate = params.modifiable;
                    if (curstate === undefined) {
                        assertFailed = true;
                    } else {
                        let varval = curstate.getDynamicValue(varnm);
                        if (varval === undefined) {
                            assertFailed = true;
                        } else {
                            let vval = varval[0];
                            if (vval === undefined || !vval.equals(vartype)) {
                                assertFailed = true;
                            }
                        }
                    }

                    if (assertFailed) {
                        return [failException.construct(errmsg), true, []];
                    }
                    return [new RecordValue(), false, []];
                }
            }
        }
        throw new InternalInterpreterError('Beep. Beep-Beep. Beep. Beep-Beep-Beep. Beep. Beep.');
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('assertValueEq', new FunctionType(
        new TupleType([new TupleType([stringType, new TypeVariable('\'a')]), stringType]),
        new TupleType([])).simplify(), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('countCallOccurrences',
                  new PredefinedFunction('countCallOccurrences',
                                         (val: Value, params: EvaluationParameters) => {
        return [new RecordValue(), false, []];
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('countCallOccurrences', new FunctionType(
        new TupleType([stringType, stringType]),
        intType).simplify(), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('countExpressionOccurrences',
                  new PredefinedFunction('countExpressionOccurrences',
                                         (val: Value, params: EvaluationParameters) => {
        return [new RecordValue(), false, []];
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('countExpressionOccurrences', new FunctionType(
        new TupleType([stringType, stringType]),
        intType).simplify(), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Assert', dres);
    state.setStaticStructure('Assert', sres);
    return state;
}

export let ASSERT_LIB: Module = {
    'native': addAssertLib,
    'code': `signature ASSERT = sig
        val assert : bool * string -> unit;
        val invert : ('a * string -> unit) -> 'a * string -> unit;

        (* Checks whether an identifier is defined, otherwise raises an Fail
           with the second parameter as the message *)
        (* val assertDefined : string * string -> unit; *)

        (* Checks whether an identifier has the specified type,
           otherwise raises an Fail with the second parameter as the message *)
        (* val assertType : (string * string) * string -> unit; *)

        (* Checks whether an identifier is equal to the given value,
           otherwise raises an Fail with the second parameter as the message *)
        (* val assertValueEq : (string * ''a) * string -> unit; *)

        (* val assertValue : (string * string) * string -> unit; *)

        (* Counts how often the second identifier occurs in the definition of the first identifier
           (after resolving simplifications). *)
        (* val countCallOccurrences : string * string -> int; *)

        (* Counts how often the second parameter (ExpressionType) occurs in the definition of the
           first identifier. *)
        (* val countExpressionOccurrences : string * string -> int; *)
    end;

    structure Assert :> ASSERT = struct
        open Assert;

        fun assert (true, _) = ()
          | assert (false, msg) = raise Fail(msg);

        fun invert assertion (exp, msg) = let
          val thrown = (assertion (exp, ""); false) handle Fail e => true;
        in
          if thrown then () else raise Fail(msg)
        end;
    end;`,
    'requires': []
};
