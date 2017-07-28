import { State, StaticBasis, DynamicBasis, InfixStatus, TypeInformation,
         TypeNameInformation, RebindStatus } from './state';
import { FunctionType, CustomType, TupleType, Type, TypeVariable } from './types';
import { CharValue, Real, Integer, StringValue, PredefinedFunction, Word, ConstructedValue,
         ValueConstructor, ExceptionConstructor, BoolValue, Value, RecordValue } from './values';
import { InternalInterpreterError } from './errors';

// Initial static basis (see SML Definition, appendix C through E)

// let intType = new CustomType('int');
let realType = new CustomType('real');
// let wordType = new CustomType('word');
let boolType = new CustomType('bool');
let stringType = new CustomType('string');
let charType = new CustomType('char');

function functionType(type: Type): Type {
    return new FunctionType(new TupleType([type, type]), type).simplify();
}
function bfunctionType(type: Type): Type {
    return new FunctionType(new TupleType([type, type]), boolType).simplify();
}

let typeVar = new TypeVariable('\'a');
let eqTypeVar = new TypeVariable('\'\'b');

let intWordType = new TypeVariable('*iw', true, 0, [new CustomType('int'), new CustomType('word')]);
let intRealType = new TypeVariable('*ir', true, 0, [new CustomType('int'), new CustomType('real')]);
let intWordRealType = new TypeVariable('*iwr', true, 0, [new CustomType('int'), new CustomType('word'),
    new CustomType('real')]);
let anyType = new TypeVariable('*any', true, 0, [new CustomType('int'), new CustomType('word'),
    new CustomType('real'), new CustomType('string'), new CustomType('char')]);

let initialState: State = new State(
    0,
    undefined,
    new StaticBasis(
        {
            'unit':     [new TypeInformation(
                new FunctionType(new TupleType([]), new TupleType([])).simplify(), []), false],
            'bool':     [new TypeInformation(new CustomType('bool'),  ['true', 'false']), false],
            'int':      [new TypeInformation(new CustomType('int'),   []), false],
            'word':     [new TypeInformation(new CustomType('word'),  []), false],
            'real':     [new TypeInformation(new CustomType('real'),  []), false],
            'string':   [new TypeInformation(new CustomType('string'), []), false],
            'char':     [new TypeInformation(new CustomType('char'),  []), false],
            'list':     [new TypeInformation(new CustomType('list', [typeVar]), ['nil', '::']), false],
            'ref':      [new TypeInformation(new CustomType('ref', [typeVar]), ['ref']), false],
            'exn':      [new TypeInformation(new CustomType('exn'), []), false]
        },
        {
            'div':      [functionType(intWordType), false],
            'mod':      [functionType(intWordType), false],
            '*':        [functionType(intWordRealType), false],
            '/':        [functionType(realType), false],
            '+':        [functionType(intWordRealType), false],
            '-':        [functionType(intWordRealType), false],
            '<':        [bfunctionType(anyType), false],
            '<=':       [bfunctionType(anyType), false],
            '>':        [bfunctionType(anyType), false],
            '>=':       [bfunctionType(anyType), false],
            '=':        [new FunctionType(new TupleType([eqTypeVar, eqTypeVar]), boolType).simplify(), false],
            '<>':       [new FunctionType(new TupleType([eqTypeVar, eqTypeVar]), boolType).simplify(), false],
            // ':='
            // 'ref': new ValueIdentifier(new FunctionType(typeVar, new CustomType('ref', typeVar)),
            'true':     [new CustomType('bool'), false],
            'false':    [new CustomType('bool'), false],
            'nil':      [new CustomType('list', [typeVar]), false],
            '::':       [new FunctionType(
                            new TupleType([typeVar, new CustomType('list', [typeVar])]),
                            new CustomType('list', [typeVar])).simplify(), false],
            'Match':    [new CustomType('exn'), false],
            'Bind':     [new CustomType('exn'), false],
            'Div':      [new CustomType('exn'), false],
            'Overflow': [new CustomType('exn'), false],
            '^':        [functionType(stringType), false],
            'explode':  [new FunctionType(stringType, new CustomType('list', [charType])).simplify(), false],
            'implode':  [new FunctionType(new CustomType('list', [charType]), stringType).simplify(), false],
            '~':        [new FunctionType(intRealType, intRealType), false],
            'abs':      [new FunctionType(intRealType, intRealType), false],
        }
    ),
    new DynamicBasis(
        {
            'unit':     [[], false],
            'bool':     [['true', 'false'], false],
            'int':      [[], false],
            'word':     [[], false],
            'real':     [[], false],
            'string':   [[], false],
            'char':     [[], false],
            'list':     [['nil', '::'], false],
            'ref':      [['ref'], false],
            'exn':      [[], false],
        },
        {
            'div':      [new PredefinedFunction('div', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        if ((<Integer> val2).value === 0) {
                            return [new ExceptionConstructor('Div').construct(), true];
                        }
                        return [(<Integer> val1).divide(<Integer> val2), false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        if ((<Word> val2).value === 0) {
                            return [new ExceptionConstructor('Div').construct(), true];
                        }
                        return [(<Word> val1).divide(<Word> val2), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "div" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            'mod':      [new PredefinedFunction('mod', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        if ((<Integer> val2).value === 0) {
                            return [new ExceptionConstructor('Div').construct(), true];
                        }
                        return [(<Integer> val1).modulo(<Integer> val2), false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        if ((<Word> val2).value === 0) {
                            return [new ExceptionConstructor('Div').construct(), true];
                        }
                        return [(<Word> val1).modulo(<Word> val2), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "mod" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '*':        [new PredefinedFunction('*', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        let result = (<Integer> val1).multiply(<Integer> val2);
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        let result = (<Word> val1).multiply(<Word> val2);
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        let result = (<Real> val1).multiply(<Real> val2);
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "*" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '/':        [new PredefinedFunction('/', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Real && val2 instanceof Real) {
                        if ((<Real> val2).value === 0) {
                            return [new ExceptionConstructor('Div').construct(), true];
                        }
                        return [(<Real> val1).divide(<Real> val2), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "/" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '+':        [new PredefinedFunction('+', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        let result = (<Integer> val1).add(<Integer> val2);
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        let result = (<Word> val1).add(<Word> val2);
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        let result = (<Real> val1).add(<Real> val2);
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "+" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '-':        [new PredefinedFunction('-', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        let result = (<Integer> val1).add((<Integer> val2).negate());
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        let result = (<Word> val1).add((<Word> val2).negate());
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        let result = (<Real> val1).add((<Real> val2).negate());
                        if (result.hasOverflow()) {
                            return [new ExceptionConstructor('Overflow').construct(), true];
                        }
                        return [result, false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "-" on value of the wrong type (' + val.constructor.name + ').');
            }), false],

            '<':        [new PredefinedFunction('<', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        return [new BoolValue((<Integer> val1).compareTo(<Integer> val2) < 0), false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        return [new BoolValue((<Word> val1).compareTo(<Word> val2) < 0), false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        return [new BoolValue((<Real> val1).compareTo(<Real> val2) < 0), false];
                    } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                        return [new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) < 0), false];
                    } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                        return [new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) < 0), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "<" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '>':        [new PredefinedFunction('<', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        return [new BoolValue((<Integer> val1).compareTo(<Integer> val2) > 0), false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        return [new BoolValue((<Word> val1).compareTo(<Word> val2) > 0), false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        return [new BoolValue((<Real> val1).compareTo(<Real> val2) > 0), false];
                    } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                        return [new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) > 0), false];
                    } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                        return [new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) > 0), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called ">" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '<=':       [new PredefinedFunction('<', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        return [new BoolValue((<Integer> val1).compareTo(<Integer> val2) <= 0), false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        return [new BoolValue((<Word> val1).compareTo(<Word> val2) <= 0), false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        return [new BoolValue((<Real> val1).compareTo(<Real> val2) <= 0), false];
                    } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                        return [new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) <= 0), false];
                    } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                        return [new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) <= 0), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "<=" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '>=':       [new PredefinedFunction('<', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Integer && val2 instanceof Integer) {
                        return [new BoolValue((<Integer> val1).compareTo(<Integer> val2) >= 0), false];
                    } else if (val1 instanceof Word && val2 instanceof Word) {
                        return [new BoolValue((<Word> val1).compareTo(<Word> val2) >= 0), false];
                    } else if (val1 instanceof Real && val2 instanceof Real) {
                        return [new BoolValue((<Real> val1).compareTo(<Real> val2) >= 0), false];
                    } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                        return [new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) >= 0), false];
                    } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                        return [new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) >= 0), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called ">=" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '=':        [new PredefinedFunction('=', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    return [new BoolValue(val1.equals(val2)), false];
                }
                throw new InternalInterpreterError(-1,
                    'Called "=" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '<>':       [new PredefinedFunction('=', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    return [new BoolValue(!val1.equals(val2)), false];
                }
                throw new InternalInterpreterError(-1,
                    'Called "<>" on value of the wrong type (' + val.constructor.name + ').');
            }), false],

            // ':='
            // 'ref': new ValueIdentifier(new FunctionType(typeVar, new CustomType('ref', typeVar)),
            'true':     [new BoolValue(true), false],
            'false':    [new BoolValue(false), false],
            'nil':      [new ValueConstructor('nil').construct(), false],
            '::':       [new ValueConstructor('::', 1), false],
            'Match':    [new ExceptionConstructor('Match').construct(), false],
            'Bind':     [new ExceptionConstructor('Bind').construct(), false],
            'Div':      [new ExceptionConstructor('Div').construct(), false],
            'Overflow': [new ExceptionConstructor('Overflow').construct(), false],
            '^':        [new PredefinedFunction('^', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof StringValue && val2 instanceof StringValue) {
                        return [(<StringValue> val1).concat(val2), false];
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "^" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            'explode':  [new PredefinedFunction('explode', (val: Value) => {
                if (val instanceof StringValue) {
                    return [(<StringValue> val).explode(), false];
                }
                throw new InternalInterpreterError(-1,
                    'Called "explode" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            'implode':  [new PredefinedFunction('implode', (val: Value) => {
                if (val instanceof ConstructedValue) {
                    return [StringValue.implode(val), false];
                }
                throw new InternalInterpreterError(-1,
                    'Called "explode" on value of the wrong type (' + val.constructor.name + ').');
            }), false],
            '~':        [new PredefinedFunction('~', (val: Value) => {
                if (val instanceof Integer) {
                    let result = (<Integer> val).negate();
                    if (result.hasOverflow()) {
                        return [new ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                } else if (val instanceof Real) {
                    let result = (<Real> val).negate();
                    if (result.hasOverflow()) {
                        return [new ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                throw new InternalInterpreterError(-1,
                    'Called "~" on something weird.');
            }), false],
            'abs':        [new PredefinedFunction('~', (val: Value) => {
                if (val instanceof Integer) {
                    if ((<Integer> val).value >= 0) {
                        return [val, false];
                    }
                    let result = (<Integer> val).negate();
                    if (result.hasOverflow()) {
                        return [new ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                } else if (val instanceof Real) {
                    if ((<Real> val).value >= 0) {
                        return [val, false];
                    }
                    let result = (<Real> val).negate();
                    if (result.hasOverflow()) {
                        return [new ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                throw new InternalInterpreterError(-1,
                    'Called "~" on something weird.');
            }), false],
        }
    ),
    {
        'bool':     new TypeNameInformation(0, true),
        'int':      new TypeNameInformation(0, true),
        'real':     new TypeNameInformation(0, false),
        'string':   new TypeNameInformation(0, true),
        'char':     new TypeNameInformation(0, true),
        'word':     new TypeNameInformation(0, true),
        'list':     new TypeNameInformation(1, true),
        'ref':      new TypeNameInformation(1, true),
        'exn':      new TypeNameInformation(0, false),
    },
    {
        'div': new InfixStatus(true, 7, false),
        'mod': new InfixStatus(true, 7, false),
        '*': new InfixStatus(true, 7, false),
        '/': new InfixStatus(true, 7, false),

        '+': new InfixStatus(true, 6, false),
        '-': new InfixStatus(true, 6, false),

        '<': new InfixStatus(true, 4, false),
        '>': new InfixStatus(true, 4, false),
        '<=': new InfixStatus(true, 4, false),
        '>=': new InfixStatus(true, 4, false),

        '::': new InfixStatus(true, 5, true),
        '=': new InfixStatus(true, 4, false),
        '<>': new InfixStatus(true, 4, false),
        ':=': new InfixStatus(true, 3, false),

        '^': new InfixStatus(true, 6, false),
    },
    {
        '=':        RebindStatus.Never,

        'true':     RebindStatus.Never,
        'false':    RebindStatus.Never,
        'nil':      RebindStatus.Never,
        '::':       RebindStatus.Never,

        'print':    RebindStatus.Never,

        'Match':    RebindStatus.Half,
        'Bind':     RebindStatus.Half,
        'Div':      RebindStatus.Half,
        'Overflow': RebindStatus.Half,
    },
    {
        'nil':      1,
        '::':       1,
        'Match':    1,
        'Bind':     1,
        'Div':      1,
        'Overflow': 1
    }
);

export function getInitialState(): State {
    return initialState.getNestedState();
}
