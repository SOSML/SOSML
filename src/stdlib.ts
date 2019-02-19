import { State, IdentifierStatus, DynamicBasis, StaticBasis } from './state';
import { TypeVariable, TypeVariableBind, FunctionType, CustomType, TupleType } from './types';
import { CharValue, Real, Integer, PredefinedFunction,  StringValue, Value, RecordValue,
    ExceptionConstructor, MAXINT, MININT, ValueConstructor, VectorValue,
    ConstructedValue, ArrayValue } from './values';
import { InternalInterpreterError, Warning } from './errors';
import * as Interpreter from './main';
import { COMMIT_HASH, BRANCH_NAME, BUILD_DATE, COMMIT_MESSAGE, VERSION } from './version';
import { EvaluationStack, EvaluationParameters, EvaluationResult } from './evaluator';
import * as Lexer from './lexer';
import * as Parser from './parser';
import { Declaration } from './declarations';
import { ValueIdentifier, Record } from './expressions';

let intType = new CustomType('int');
let realType = new CustomType('real');
// let wordType = new CustomType('word');
// let boolType = new CustomType('bool');
let stringType = new CustomType('string');
let charType = new CustomType('char');

let overflowException = new ExceptionConstructor('Overflow', 0, 0, 3);
let domainException = new ExceptionConstructor('Domain', 0, 0, 4);
let sizeException = new ExceptionConstructor('Size', 0, 0, 5);
let chrException = new ExceptionConstructor('Chr', 0, 0, 6);
let subscriptException = new ExceptionConstructor('Subscript', 0, 0, 7);

function addArrayLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    let arrayType = new CustomType('array', [new TypeVariable('\'a')]);
    let listType = new CustomType('list', [new TypeVariable('\'a')]);

    sres.setType('array', arrayType, [], 1, true);
    dres.setType('array', []);

    dres.setValue('array', new PredefinedFunction('array', (val: Value, params: EvaluationParameters) => {

        if (val instanceof RecordValue && val.entries.size === 2) {
            let cnt = val.getValue('1');
            let value = val.getValue('2');

            if (cnt instanceof Integer) {
                let c = cnt.value;
                if (c < 0) {
                    return [sizeException.construct(), true, []];
                }

                let arr = new ArrayValue(params.modifiable.memory[0] + 1, c);
                // we need to waste one cell so that no two arrays can be the same
                params.modifiable.setNewCell(arr);

                for (let i = 0; i < c; ++i) {
                    params.modifiable.setNewCell(value);
                }

                return [arr, false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('array',
        new FunctionType(new TupleType([intType, new TypeVariable('\'a')]).simplify(), arrayType),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('fromList', new PredefinedFunction('fromList', (val: Value, params: EvaluationParameters) => {
        let arr = new ArrayValue(params.modifiable.memory[0] + 1, 0);
        params.modifiable.setNewCell(arr); // we need to waste one cell so that no two arrays can be the same

        if (val instanceof ConstructedValue) {
            let list: ConstructedValue = val;
            while (list.constructorName !== 'nil') {
                if (list.constructorName !== '::') {
                    throw new InternalInterpreterError(-1, 'std type mismatch');
                }
                let arg = list.argument;
                if (arg instanceof RecordValue && arg.entries.size === 2) {
                    let a1 = arg.getValue('1');
                    let a2 = arg.getValue('2');
                    if (a1 instanceof Value && a2 instanceof ConstructedValue) {
                        params.modifiable.setNewCell(a1);
                        arr.length++;
                        list = a2;
                    } else {
                        throw new InternalInterpreterError(-1, 'std type mismatch');
                    }
                } else {
                    throw new InternalInterpreterError(-1, 'std type mismatch');
                }
            }

            return [arr, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromList', new FunctionType(listType, arrayType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sub', new PredefinedFunction('sub', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 2) {
            let arr = val.getValue('1');
            let index = val.getValue('2');

            if (arr instanceof ArrayValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= arr.length) {
                    return [subscriptException.construct(), true, []];
                }

                return [(<Value> params.modifiable.getCell(arr.address + ind)), false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sub',
        new FunctionType(new TupleType([arrayType, intType]).simplify(), new TypeVariable('\'a')),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('update', new PredefinedFunction('update', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 3) {
            let arr = val.getValue('1');
            let index = val.getValue('2');
            let value = val.getValue('3');

            if (arr instanceof ArrayValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= arr.length) {
                    return [subscriptException.construct(), true, []];
                }

                params.modifiable.setCell(arr.address + ind, value);
                return [new RecordValue(), false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('update',
        new FunctionType(new TupleType([arrayType, intType, new TypeVariable('\'a')]), new TupleType([])).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('length', new PredefinedFunction('length', (val: Value, params: EvaluationParameters) => {
        if (val instanceof ArrayValue) {
            let res = new Integer(val.length);
            return [res, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('length', new FunctionType(arrayType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Array', dres);
    state.setStaticStructure('Array', sres);
    return state;
}

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
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sqrt', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sin', new PredefinedFunction('sin', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sin(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sin', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('cos', new PredefinedFunction('cos', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cos(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('cos', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('tan', new PredefinedFunction('tan', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.tan(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('tan', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('asin', new PredefinedFunction('asin', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.asin(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('asin', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('acos', new PredefinedFunction('acos', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.acos(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('acos', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('atan', new PredefinedFunction('atan', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.atan(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
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
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('atan2', new FunctionType(new TupleType([realType, realType]), realType).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('exp', new PredefinedFunction('exp', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.exp(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
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
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('pow', new FunctionType(new TupleType([realType, realType]), realType).simplify(),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('ln', new PredefinedFunction('ln', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('ln', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('log10', new PredefinedFunction('log10', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.log10(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('log10', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sinh', new PredefinedFunction('sinh', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.sinh(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sinh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('cosh', new PredefinedFunction('cosh', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.cosh(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('cosh', new FunctionType(realType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('tanh', new PredefinedFunction('tanh', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            return [new Real(Math.tanh(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
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

function addCharLib(state: State): State {
    state.setDynamicValue('ord', new PredefinedFunction('ord', (val: Value, params: EvaluationParameters) => {
        if (val instanceof CharValue) {
            let value = (<CharValue> val).value;
            return [new Integer(value.charCodeAt(0)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    state.setStaticValue('ord', new FunctionType(charType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicValue('chr', new PredefinedFunction('chr', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            if (value < 0 || value > 255) {
                return [chrException.construct(), true, []];
            }
            return [new CharValue(String.fromCharCode(value)), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    state.setStaticValue('chr', new FunctionType(intType, charType), IdentifierStatus.VALUE_VARIABLE);

    return state;
}

function addRealLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('fromInt', new PredefinedFunction('fromInt', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            return [new Real(value), false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromInt', new FunctionType(intType, realType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('round', new PredefinedFunction('round', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [overflowException.construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('round', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('floor', new PredefinedFunction('floor', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.floor(value));
            if (integer.hasOverflow()) {
                return [overflowException.construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('floor', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('ceil', new PredefinedFunction('ceil', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let value = (<Real> val).value;
            let integer = new Integer(Math.ceil(value));
            if (integer.hasOverflow()) {
                return [overflowException.construct(), true, []];
            }
            return [integer, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('ceil', new FunctionType(realType, intType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('toString', new PredefinedFunction('toString', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Real) {
            let str = new StringValue((<Real> val).toString(undefined));
            return [str, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('toString', new FunctionType(realType, stringType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Real', dres);
    state.setStaticStructure('Real', sres);

    return state;
}

function addIntLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    dres.setValue('toString', new PredefinedFunction('toString', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Integer) {
            let str = new StringValue((<Integer> val).toString(undefined));
            return [str, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('toString', new FunctionType(intType, stringType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Int', dres);
    state.setStaticStructure('Int', sres);

    return state;
}

function addListLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    sres.setType('list', new CustomType('list', [new TypeVariable('\'a')]), ['nil', '::'], 1, true);
    sres.setValue('nil', new TypeVariableBind('\'a',
        new CustomType('list', [new TypeVariable('\'a')])), IdentifierStatus.VALUE_CONSTRUCTOR);
    sres.setValue('::', new TypeVariableBind('\'a', new FunctionType(
        new TupleType([new TypeVariable('\'a'),
            new CustomType('list', [new TypeVariable('\'a')])]),
        new CustomType('list', [new TypeVariable('\'a')]))).simplify(),
        IdentifierStatus.VALUE_CONSTRUCTOR);

    dres.setType('list', ['nil', '::']);
    dres.setValue('nil', new ValueConstructor('nil'), IdentifierStatus.VALUE_CONSTRUCTOR);
    dres.setValue('::', new ValueConstructor('::', 1), IdentifierStatus.VALUE_CONSTRUCTOR);

    state.setDynamicStructure('List', dres);
    state.setStaticStructure('List', sres);
    return state;
}

function addStringLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    sres.setType('string', new CustomType('string', []), [], 0, true);
    dres.setType('string', []);
    sres.setType('char', new CustomType('char', []), [], 0, true);
    dres.setType('char', []);

    state.setDynamicStructure('String', dres);
    state.setStaticStructure('String', sres);
    return state;
}

function addVectorLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});

    let vectorType = new CustomType('vector', [new TypeVariable('\'a')]);
    let listType = new CustomType('list', [new TypeVariable('\'a')]);

    sres.setType('vector', vectorType, [], 1, true);
    dres.setType('vector', []);

    dres.setValue('fromList', new PredefinedFunction('fromList', (val: Value, params: EvaluationParameters) => {
        let vec = new VectorValue([]);

        if (val instanceof ConstructedValue) {
            let list: ConstructedValue = val;
            while (list.constructorName !== 'nil') {
                if (list.constructorName !== '::') {
                    throw new InternalInterpreterError(-1, 'std type mismatch');
                }
                let arg = list.argument;
                if (arg instanceof RecordValue && arg.entries.size === 2) {
                    let a1 = arg.getValue('1');
                    let a2 = arg.getValue('2');
                    if (a1 instanceof Value && a2 instanceof ConstructedValue) {
                        vec.entries.push(a1);
                        list = a2;
                    } else {
                        throw new InternalInterpreterError(-1, 'std type mismatch');
                    }
                } else {
                    throw new InternalInterpreterError(-1, 'std type mismatch');
                }
            }

            return [vec, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('fromList', new FunctionType(listType, vectorType), IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('sub', new PredefinedFunction('sub', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 2) {
            let vec = val.getValue('1');
            let index = val.getValue('2');

            if (vec instanceof VectorValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= vec.entries.length) {
                    return [subscriptException.construct(), true, []];
                }

                return [vec.entries[ind], false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('sub',
        new FunctionType(new TupleType([vectorType, intType]).simplify(), new TypeVariable('\'a')),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('update', new PredefinedFunction('update', (val: Value, params: EvaluationParameters) => {
        if (val instanceof RecordValue && val.entries.size === 3) {
            let vec = val.getValue('1');
            let index = val.getValue('2');
            let value = val.getValue('3');

            if (vec instanceof VectorValue && index instanceof Integer) {
                let ind = index.value;
                if (ind < 0 || ind >= vec.entries.length) {
                    return [subscriptException.construct(), true, []];
                }

                let res = new VectorValue(vec.entries.slice());
                res.entries[ind] = value;
                return [res, false, []];
            } else {
                throw new InternalInterpreterError(-1, 'std type mismatch');
            }
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('update',
        new FunctionType(new TupleType([vectorType, intType, new TypeVariable('\'a')]).simplify(), vectorType),
        IdentifierStatus.VALUE_VARIABLE);

    dres.setValue('length', new PredefinedFunction('length', (val: Value, params: EvaluationParameters) => {
        if (val instanceof VectorValue) {
            let res = new Integer(val.entries.length);
            return [res, false, []];
        } else {
            throw new InternalInterpreterError(-1, 'std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    sres.setValue('length', new FunctionType(vectorType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Vector', dres);
    state.setStaticStructure('Vector', sres);
    return state;
}

function addEvalLib(state: State): State {
    let dres = new DynamicBasis({}, {}, {}, {}, {});
    let sres = new StaticBasis({}, {}, {}, {}, {});



    // Evaluates a given program and returns the result
    dres.setValue('evalExp', new PredefinedFunction('symbolic_eval', (val:Value,
        params: EvaluationParameters) => {
        if (val instanceof StringValue) {
            let str = (<StringValue> val).value;

            try {
                let tkn = Lexer.lex(str + ';', {});
                let p = new Parser.Parser(tkn, params.state, params.state.id, {});
                let ast = p.parseExpression();

                ast = ast.simplify();
                let callStack: EvaluationStack = [];
                callStack.push({'next': ast, 'params': {'state': params.state.getNestedState(),
                    'modifiable': params.state.getNestedState(),
                    'recResult': undefined}});

                let lastResult: EvaluationResult | undefined = undefined;
                let debug = '';

                let repl = new Map<string, string>();

                while (callStack.length > 0) {
                    let next = callStack.pop();
                    if (next === undefined) {
                        throw new InternalInterpreterError(-1, 'バトル、バトルしたい！');
                    }
                    let target = next.next;
                    let params = next.params;
                    params.recResult = lastResult;
                    if (target instanceof Declaration) {
                        lastResult = target.evaluate(params, callStack);
                    } else {
                        lastResult = target.compute(params, callStack);
                    }

                    let str = next.next.toString();
                    if (params.step === 1 && !str.includes('__arg')) {

                        if (lastResult && lastResult.value) {
                            debug += str + ' → ' + lastResult.value.toString(params.state) + '\n';
                        } else {
                            let nrepl = new Map<string, string>();
                            repl.forEach((value: string, key: string) => {
                                if (str.includes(key)) {
                                    str = str.replace(key, value);
                                } else {
                                    nrepl.set(key, value);
                                }
                            });
                            repl = nrepl;

                            debug += str + '\n';
                        }
                    }
                    if (lastResult && lastResult.value
                        && lastResult.value.toString(params.state) !== 'fn') {
                        if (!(next.next instanceof ValueIdentifier
                            || next.next instanceof Record)) {
                            repl.set(next.next.toString(), lastResult.value.toString(params.state));
                        }
                    }
                }
                if (lastResult !== undefined && lastResult.value !== undefined) {
                    debug += lastResult.value.toString(undefined) + '\n';
                }
                return [new RecordValue(), false, [
                    new Warning(-2, debug)
                ]];
            } catch (e) {
                return [new RecordValue(), false, [new Warning(e.position, e.message)]];
            }
        } else {
            throw new InternalInterpreterError(-1, 'This std type mismatch reigns supreme!');
        }
        }), IdentifierStatus.VALUE_VARIABLE);

    sres.setValue('evalExp', new FunctionType(stringType,
        new TupleType([])).simplify(), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicStructure('Eval', dres);
    state.setStaticStructure('Eval', sres);
    return state;
}

export let STDLIB: {
    [name: string]: {
        'native': ((state: State) => State) | undefined, /* callback for native parts */
        'code': string | undefined,
        'requires': string[] | undefined /* names of modules required for this module (excluding __Base) */
    }
} = {
    '__Base': {
        'native': undefined,
        'code': `fun o (f,g) x = f (g x);
            infix 3 o;
            datatype order = LESS | EQUAL | GREATER;

            exception Domain;
            exception Size;
            exception Chr;
            exception Subscript;

            fun not true = false | not false = true;

            (* fun ! (a : \'A ref): \'A = ! a;
            fun op := ((a, b) : (\'A ref * \'A)): unit = a := b;
            fun ref (a : \'A): \'A ref = ref a; *)`,
        'requires': undefined },
    'Array': {
        'native': addArrayLib,
        'code': `structure Array :> sig
            (* eqtype 'a array = 'a array *)
            (* type 'a vector = 'a Vector.vector *)
            (* val maxLen : int *)
            val array : int * 'a -> 'a array
            val fromList : 'a list -> 'a array
            val tabulate : int * (int -> 'a) -> 'a array
            val length : 'a array -> int
            val sub : 'a array * int -> 'a
            val update : 'a array * int * 'a -> unit
            val vector : 'a array -> 'a vector
            (* val copy    : {src : 'a array, dst : 'a array, di : int} -> unit *)
            (* val copyVec : {src : 'a vector, dst : 'a array, di : int} -> unit *)
            (* val appi : (int * 'a -> unit) -> 'a array -> unit *)
            (* val app  : ('a -> unit) -> 'a array -> unit *)
            (* val modifyi : (int * 'a -> 'a) -> 'a array -> unit *)
            (* val modify  : ('a -> 'a) -> 'a array -> unit *)
            val foldli : (int * 'a * 'b -> 'b) -> 'b -> 'a array -> 'b
            val foldri : (int * 'a * 'b -> 'b) -> 'b -> 'a array -> 'b
            val foldl  : ('a * 'b -> 'b) -> 'b -> 'a array -> 'b
            val foldr  : ('a * 'b -> 'b) -> 'b -> 'a array -> 'b
            (* val findi : (int * 'a -> bool) -> 'a array -> (int * 'a) option *)
            (* val find  : ('a -> bool) -> 'a array -> 'a option *)
            (* val exists : ('a -> bool) -> 'a array -> bool *)
            (* val all : ('a -> bool) -> 'a array -> bool *)
            (* val collate : ('a * 'a -> order) -> 'a array * 'a array -> order *)
        end = struct
            open Array;
            fun tabulate (n, f) = fromList (List.tabulate (n, f));

            fun vector arr = Vector.tabulate (length arr, fn i => sub (arr, i));

            fun foldli f init arr = let
                val len = length arr
                fun loop (i, b) =
                    if i = len then b
                    else loop (i + 1, f (i, sub (arr, i), b))
                in
                    loop (0, init)
                end;
            fun foldri f init arr = let
                val len = length arr
                fun loop (i, b) =
                    if i = ~1 then b
                    else loop (i - 1, f (i, sub (arr, i), b))
                in
                    loop (len - 1, init)
                end;
            fun foldl f init arr = foldli (fn (_, a, x) => f(a, x)) init arr;
            fun foldr f init arr = foldri (fn (_, a, x) => f(a, x)) init arr;

        end;`,
        'requires': ['Option', 'List', 'Vector']
    },
    'Char': {
        'native': addCharLib,
        'code':  `structure Char = struct
                fun isLower c  = #"a" <= c andalso c <= #"z"
                fun isUpper c  = #"A" <= c andalso c <= #"Z"
                fun isDigit c  = #"0" <= c andalso c <= #"9"
                fun isAlpha c  = isLower c orelse isUpper c
                fun isHexDigit c = #"0" <= c andalso c <= #"9"
                               orelse #"a" <= c andalso c <= #"f"
                               orelse #"A" <= c andalso c <= #"F"
                fun isAlphaNum c = isAlpha c orelse isDigit c
                fun isPrint c  = c >= #" " andalso c < #"\\127"
                fun isSpace c  = c = #" " orelse #"\\009" <= c andalso c <= #"\\013"
                fun isGraph c  = isPrint c andalso not (isSpace c)
                fun isPunct c  = isGraph c andalso not (isAlphaNum c)
                fun isAscii c  = c <= #"\\127"
                fun isCntrl c  = c < #" " orelse c >= #"\\127"

                fun toLower c =
                    if #"A" <= c andalso c <= #"Z" then chr (ord c + 32)
                    else c;
                fun toUpper c =
                    if #"a" <= c andalso c <= #"z" then chr (ord c - 32)
                    else c;

                fun compare (a, b) = Int.compare(ord a, ord b);
                fun op< (a, b) = Int.compare(ord a, ord b) = LESS;
                fun op> (a, b) = Int.compare(ord a, ord b) = GREATER;
                fun op<= (a, b) = Int.compare(ord a, ord b) <> GREATER;
                fun op>= (a, b) = Int.compare(ord a, ord b) <> LESS;

                val ord = ord;
                val chr = chr;
            end;`,
        'requires': ['Int'] },
    'Eval': {
        'native': addEvalLib,
        'code': undefined,
        'requires': undefined },
    'Int': {
        'native': addIntLib,
        'code': `structure Int = struct
                open Int;
                fun compare (x, y: int) = if x < y then LESS else if x > y then GREATER else EQUAL;

                val minInt = SOME ~` + -MININT + `;
                val maxInt = SOME ` + MAXINT + `;
                fun max (x, y) = if x < y then y else x : int;
                fun min (x, y) = if x > y then y else x : int;
            end;`,
        'requires': ['Option'] },
    'List': { /* complete */
        'native': addListLib,
        'code': `structure List : sig
                datatype 'a list = nil | :: of 'a * 'a list;
                val rev: 'a list -> 'a list;
            end  = struct
                open List;
                fun rev' nil ys     = ys
                  | rev' (x::xs) ys = rev' xs (x::ys)
                fun rev xs = rev' xs nil;
            end;

            structure List = struct
                exception Empty;
                open List;

                fun hd nil = raise Empty
                  | hd (x::xr) = x;

                fun tl nil = raise Empty
                  | tl (x::xr) = xr;

                fun null nil = true
                  | null (x::xr) = false;

                fun map f nil = nil
                  | map f (x::xr) = (f x) :: (map f xr);

                infixr 5 @;
                fun [] @ ys = ys
                  | (x::xr) @ ys = x :: (xr @ ys);

                fun length nil = 0
                  | length (x::xr) = 1 + length xr;

                fun foldr f e []      = e
                  | foldr f e (x::xr) = f(x, foldr f e xr);

                fun foldl f e []      = e
                  | foldl f e (x::xr) = foldl f (f(x, e)) xr;
            end;
            open List;
            infixr 5 @;

            structure List = struct
                open List;

                fun concat nil = nil
                  | concat (x::xr) = x @ concat xr;

                fun tabulate (n, f) = let
                    fun h i = if i < n then f i :: h (i + 1) else []
                in
                    if n < 0 then raise Size else h 0
                end;

                fun exists p []      = false
                  | exists p (x::xr) = p x orelse exists p xr;

                fun all p []      = true
                  | all p (x::xr) = p x andalso all p xr;

                fun filter p []      = []
                  | filter p (x::xr) = if p x then x :: filter p xr else filter p xr;

                fun collate (compare : 'a * 'a -> order) p = case p of
                    (nil, _::_)     => LESS
                  | (nil, nil)      => EQUAL
                  | (_::_, nil)     => GREATER
                  | (x::xr, y::yr)  => case compare (x, y) of
                         EQUAL  => collate compare (xr, yr)
                       | s      => s;

                fun nth ([], _)    = raise Subscript
                  | nth (x::xs, 0) = x
                  | nth (x::xs, n) = nth (xs, n - 1);

                fun last [x] = x
                  | last (x::xs) = last xs
                  | last [] = raise Empty;

                fun getItem [] = NONE
                  | getItem x = SOME (hd x, tl x);

                fun take (x, 0) = []
                  | take ([], _) = raise Subscript
                  | take (x::xs, n) = x :: take (xs, n - 1);

                fun drop (x, 0) = x
                  | drop ([], _) = raise Subscript
                  | drop (x::xs, n) = drop (xs, n - 1);

                fun revAppend (l1, l2) = (rev l1) @ l2;

                fun app f [] = ()
                  | app f (x::xs) = (f x; app f xs);

                fun mapPartial f l
                    = ((map valOf) o (filter isSome) o (map f)) l;

                fun find f [] = NONE
                  | find f (x::xs) = if f x then SOME x else find f xs;

                fun partition f [] = ([], [])
                  | partition f (x::xs) = let
                    val tmp = partition f xs
                in
                    if f x then (x :: #1 tmp, #2 tmp)
                    else (#1 tmp, x :: #2 tmp)
                end;
            end;`,
        'requires': ['Option'] },
    'Listsort': { /* complete */
        'native': undefined,
        'code': `structure Listsort : sig
                val sort: ('a * 'a -> order) -> 'a list -> 'a list;
                val sorted: ('a * 'a -> order) -> 'a list -> bool;
                val mergeUniq: ('a * 'a -> order) -> 'a list * 'a list -> 'a list;
                val merge: ('a * 'a -> order) -> 'a list * 'a list -> 'a list;
                val eqclasses: ('a * 'a -> order) -> 'a list -> 'a list list;
            end = struct
              fun take ordr x1 xr []       = x1 :: xr
                | take ordr x1 xr (y1::yr) = (case ordr(x1, y1) of
                    LESS    => x1 :: take ordr y1 yr xr
                  | _       => y1 :: take ordr x1 xr yr);

              fun takeUniq ordr x1 xr []       = x1 :: xr
                | takeUniq ordr x1 xr (y1::yr) = (case ordr(x1, y1) of
                    LESS    => x1 :: takeUniq ordr y1 yr xr
                  | GREATER => y1 :: takeUniq ordr x1 xr yr
                  | EQUAL   => takeUniq ordr x1 xr yr);

              fun merge ordr ([],     ys) = ys
                | merge ordr (x1::xr, ys) = take ordr x1 xr ys;

              fun mergeUniq ordr ([],     ys) = ys
                | mergeUniq ordr (x1::xr, ys) = takeUniq ordr x1 xr ys;

              fun mergepairs ordr l1  [] k              = [l1]
                | mergepairs ordr l1 (ls as (l2::lr)) k =
                  if k mod 2 = 1 then l1::ls
                  else mergepairs ordr (merge ordr (l1, l2)) lr (k div 2);

              fun nextrun ordr run []      = (run, [])
                | nextrun ordr run (xs as (x::xr)) =
                  if ordr(x, List.hd run) = LESS then (run, xs)
                  else nextrun ordr (x::run) xr;

              fun sorting ordr []      ls r = List.hd(mergepairs ordr [] ls 0)
                | sorting ordr (x::xs) ls r = let
                    val (revrun, tail) = nextrun ordr [x] xs
                  in
                    sorting ordr tail (mergepairs ordr (List.rev revrun) ls (r+1)) (r+1)
                  end;

              fun group ordr last rest cs1 css = case rest of
                  []     => cs1 :: css
                | r1::rr => if ordr(r1, last) = EQUAL then group ordr r1 rr (r1 :: cs1) css
                            else group ordr r1 rr [r1] (cs1 :: css);

              fun sort ordr []               = []
                | sort ordr (xs as [_])      = xs
                | sort ordr (xs as [x1, x2]) = (case ordr(x1, x2) of
                    GREATER => [x2, x1]
                  | _       => xs)
                | sort ordr xs = sorting ordr xs [] 0;

              fun sorted ordr []           = true
                | sorted ordr [x]          = true
                | sorted ordr (x1::x2::xr) =
                  ordr(x1, x2) <> GREATER andalso sorted ordr (x2::xr);


              fun eqclasses ordr xs = let
                  val xs = List.rev (sort ordr xs)
                in
                  case xs of
                      []     => []
                    | x1::xr => group ordr x1 xr [x1] []
                  end;
            end;
            structure List = struct
                open List;
                open Listsort;
            end;`,
        'requires': ['List'] },
    'Math': { /* Complete */
        'native': addMathLib,
        'code': undefined,
        'requires': undefined },
    'Option': { /* Complete */
        'native': undefined,
        'code': `structure Option = struct
                exception Option;

                datatype 'a option = NONE | SOME of 'a;

                fun getOpt (NONE, a) = a
                  | getOpt (SOME x, a) = x;

                fun isSome NONE = false
                  | isSome (SOME _) = true;

                fun valOf (SOME x) = x
                  | valOf NONE = raise Option;

                fun filter f x = if f x then SOME x else NONE;

                fun join NONE = NONE
                  | join (SOME (SOME x)) = SOME x;

                fun app f (SOME v) = f v
                  | app f NONE = ();

                fun map f NONE = NONE
                  | map f (SOME v) = SOME(f v);

                fun mapPartial f NONE = NONE
                  | mapPartial f (SOME v) = f v;

                fun compose (f, g) a = case g a of
                      NONE => NONE
                    | SOME v => SOME (f v);

                fun compose (f, g) a = case g a of
                      NONE => NONE
                    | SOME v => (f v);
            end;
            open Option;`,
        'requires': undefined },
    'Real': {
        'native': addRealLib,
        'code': `structure Real = struct
                open Real;
                fun compare (x, y: real) = if x < y then LESS else if x > y then GREATER else EQUAL;
            end;`,
        'requires': undefined },
    'String': { /* Complete % useless stuff */
        'native': addStringLib,
        'code': `structure String : sig
                eqtype string
                eqtype char
                val size : string -> int
                val sub : string * int -> char
                val extract   : string * int * int option -> string
                val substring : string * int * int -> string
                val ^ : string * string -> string
                val concat : string list -> string
                val concatWith : string -> string list -> string
                val str : char -> string
                val implode : char list -> string
                val explode : string -> char list
                val map : (char -> char) -> string -> string
                val translate : (char -> string) -> string -> string
                val tokens : (char -> bool) -> string -> string list
                val fields : (char -> bool) -> string -> string list
                val isPrefix    : string -> string -> bool
                val isSubstring : string -> string -> bool
                val isSuffix    : string -> string -> bool
                val compare : string * string -> order
                val collate : (char * char -> order)
                                -> string * string -> order
                val <  : string * string -> bool
                val <= : string * string -> bool
                val >  : string * string -> bool
                val >= : string * string -> bool
            end = struct
                open String;

                fun size s = List.length (explode s);
                fun sub (s,i) = List.nth (explode s, i);
                fun extract (s, i, NONE) = implode (List.drop (explode s, i))
                  | extract (s, i, SOME j) = implode (List.take (List.drop (explode s, i), j));
                fun substring (s, i, j) = extract (s, i, SOME j);
                val op^ = op^;

                fun cc2 b ([], y) = y
                  | cc2 b (x::xs, y) = cc2 b (xs, y^b^x);
                fun concat a = cc2 "" (a, "");
                fun concatWith b [] = ""
                  | concatWith b (a::c) = a ^ (cc2 b (c, ""));

                fun str c = implode [c];
                val implode = implode;
                val explode = explode;
                fun map f s = implode(List.map f (explode s));
                fun translate f s = concat(List.map f (explode s));


                fun cmp f ([], []) = EQUAL
                  | cmp f ([], _) = LESS
                  | cmp f (_, []) = GREATER
                  | cmp f (x::xs, y::ys) = let
                        val tmp = f (x, y);
                    in
                        if tmp <> EQUAL then tmp else cmp f (xs, ys)
                    end;

                fun matchPrefix ([], _) = true
                  | matchPrefix (_, []) = false
                  | matchPrefix (x::xs, y::ys) = if x <> y then false else matchPrefix (xs, ys);

                fun matchSubstring ([], _) = true
                  | matchSubstring (_, []) = false
                  | matchSubstring (x, y as _::ys) = if matchPrefix (x, y) then true
                    else matchSubstring (x, ys);

                fun getFields (f, [], tmp, x) = (implode tmp) :: x
                  | getFields (f, (r::rs), tmp, x) = if f r then
                        getFields (f, rs, [], (implode tmp)::x)
                    else
                        getFields (f, rs, r::tmp, x);

                fun tokens f s = List.filter (fn t => t <> "") (getFields (f, rev (explode s), [], []));
                fun fields f s = getFields (f, rev (explode s), [], []);

                fun isPrefix a b = matchPrefix (explode a, explode b);
                fun isSubstring a b = matchSubstring (explode a, explode b);
                fun isSuffix a b = matchPrefix (rev (explode a), rev (explode b));

                fun compare (a, b) = cmp Char.compare (explode a, explode b);
                fun collate f (a, b) = cmp f (explode a, explode b);

                fun op< (a, b) = compare (a, b) = LESS;
                fun op> (a, b) = compare (a, b) = GREATER;
                fun op<= (a, b) = compare (a, b) <> GREATER;
                fun op>= (a, b) = compare (a, b) <> LESS;
            end;`,
        'requires': ['Char', 'List']
    },
    'Vector': {
        'native': addVectorLib,
        'code': `structure Vector :> sig
            (* eqtype 'a vector = 'a vector *)
            (* val maxLen : int *)
            val fromList : 'a list -> 'a vector
            val tabulate : int * (int -> 'a) -> 'a vector
            val length : 'a vector -> int
            val sub : 'a vector * int -> 'a
            val update : 'a vector * int * 'a -> 'a vector
            val concat : 'a vector list -> 'a vector
            val appi : (int * 'a -> unit) -> 'a vector -> unit
            val app  : ('a -> unit) -> 'a vector -> unit
            val mapi : (int * 'a -> 'b) -> 'a vector -> 'b vector
            val map  : ('a -> 'b) -> 'a vector -> 'b vector
            val foldli : (int * 'a * 'b -> 'b) -> 'b -> 'a vector -> 'b
            val foldri : (int * 'a * 'b -> 'b) -> 'b -> 'a vector -> 'b
            val foldl  : ('a * 'b -> 'b) -> 'b -> 'a vector -> 'b
            val foldr  : ('a * 'b -> 'b) -> 'b -> 'a vector -> 'b
            (* val findi : (int * 'a -> bool) -> 'a vector -> (int * 'a) option *)
            (* val find  : ('a -> bool) -> 'a vector -> 'a option *)
            (* val exists : ('a -> bool) -> 'a vector -> bool *)
            (* val all : ('a -> bool) -> 'a vector -> bool *)
            (* val collate : ('a * 'a -> order) -> 'a vector * 'a vector -> order *)
        end = struct
            open Vector;
            fun tabulate (n, f) = fromList (List.tabulate (n, f));

            fun foldli f init vec = let
                val len = length vec
                fun loop (i, b) =
                    if i = len then b
                    else loop (i + 1, f (i, sub (vec, i), b))
                in
                    loop (0, init)
                end;
            fun foldri f init vec = let
                val len = length vec
                fun loop (i, b) =
                    if i = ~1 then b
                    else loop (i - 1, f (i, sub (vec, i), b))
                in
                    loop (len - 1, init)
                end;
            fun foldl f init vec = foldli (fn (_, a, x) => f(a, x)) init vec;
            fun foldr f init vec = foldri (fn (_, a, x) => f(a, x)) init vec;

            fun concat l = fromList (List.concat (List.map (foldr (fn (a, b) => (a::b)) []) l));

            fun appi f vec = List.app f (foldri (fn (i,a,l) => (i,a)::l) [] vec);
            fun app  f vec = List.app f (foldr (fn (a,l) => a::l) [] vec);
            fun mapi f vec = fromList (List.map f (foldri (fn (i,a,l) => (i,a)::l) [] vec));
            fun map  f vec = fromList (List.map f (foldr (fn (a,l) => a::l) [] vec));

        end; `,
        'requires': ['Option', 'List']
    },
    'Version': {
        'native': undefined,
        'code': `structure Version = struct
            val version     = "` + VERSION + `";
            val branch      = "` + BRANCH_NAME + `";
            val commit      = "` + COMMIT_HASH + `";
            val buildDate   = "` + BUILD_DATE + `";
            val message     = "` + COMMIT_MESSAGE + `";
        end;`,
        'requires': undefined
    }
};

export function loadModule(state: State, name: string, options: {[name: string]: any }): State {
    if (!STDLIB.hasOwnProperty(name)) {
        throw new InternalInterpreterError(-1, 'The module "' + name + '" does not exist. Auuuu~');
    }
    if (state.hasModule(name)) {
        return state;
    }

    let mod = STDLIB[name];
    if (mod.requires !== undefined ) {
        for (let i of mod.requires) {
            if (!state.hasModule(i)) {
                state = loadModule(state, i, options);
            }
        }
    }
    if (mod.native !== undefined) {
        state = mod.native(state);
    }
    if (mod.code !== undefined) {
        state = Interpreter.interpret(mod.code, state, options).state;
    }
    state.registerModule(name);
    return state;
}

