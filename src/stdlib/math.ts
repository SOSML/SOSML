import { State, IdentifierStatus, DynamicBasis, StaticBasis } from '../state';
import { FunctionType, TupleType } from '../types';
import { Real, PredefinedFunction, Value, RecordValue } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, domainException, realType } from '../stdlib';

function addMathLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('sqrt', new PredefinedFunction('sqrt', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            if (value < 0) {
                return [domainException.construct(), true, []];
            }
            return [new Real(Math.sqrt(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sqrt', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sin', new PredefinedFunction('sin', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sin(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sin', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('cos', new PredefinedFunction('cos', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cos(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('cos', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('tan', new PredefinedFunction('tan', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.tan(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('tan', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('asin', new PredefinedFunction('asin', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.asin(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('asin', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('acos', new PredefinedFunction('acos', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.acos(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('acos', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('atan', new PredefinedFunction('atan', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.atan(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('atan', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('atan2', new PredefinedFunction('atan2', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue) {
            let val1 = (<RecordValue> val).getValue('1');
            let val2 = (<RecordValue> val).getValue('2');
            if (val1 instanceof Real && val2 instanceof Real) {
                let value1 = (<Real> val1).value;
                let value2 = (<Real> val2).value;
                return [new Real(Math.atan2(value1, value2)), false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('atan2', new FunctionType(new TupleType([realType, realType]), realType).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('exp', new PredefinedFunction('exp', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.exp(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('exp', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('pow', new PredefinedFunction('pow', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue) {
            let val1 = (<RecordValue> val).getValue('1');
            let val2 = (<RecordValue> val).getValue('2');
            if (val1 instanceof Real && val2 instanceof Real) {
                let value1 = (<Real> val1).value;
                let value2 = (<Real> val2).value;
                return [new Real(Math.pow(value1, value2)), false, []];
            } else {
                throw new InternalInterpreterError('std type mismatch');
            }
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('pow', new FunctionType(new TupleType([realType, realType]), realType).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('ln', new PredefinedFunction('ln', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('ln', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('log10', new PredefinedFunction('log10', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log10(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('log10', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sinh', new PredefinedFunction('sinh', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sinh(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sinh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('cosh', new PredefinedFunction('cosh', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cosh(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('cosh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('tanh', new PredefinedFunction('tanh', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.tanh(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('tanh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('pi', new Real(3.14159265359), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('pi', realType, IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('e', new Real(2.71828182846), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('e', realType, IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Math', dres);
    state.setStaticStructure('Math', sres);

    return state;
}

export let MATH_LIB: Module = {
    'native': addMathLib,
    'code': undefined,
    'requires': undefined
};
