import { State, Environment, TypeInformation, ValueInformation, InfixStatus } from './state';
import { FunctionType, PrimitiveType, TupleType, Type, TypeVariable } from './types';
import { CharValue, Real, Integer, StringValue, PredefinedFunction, Word,
         ValueConstructor, ExceptionConstructor, BoolValue, Value, RecordValue } from './values';
import { InternalInterpreterError } from './errors';

// Initial static basis (see SML Definition, appendix C through E)

let intType = new PrimitiveType('int');
let realType = new PrimitiveType('real');
let wordType = new PrimitiveType('word');
let boolType = new PrimitiveType('bool');
let stringType = new PrimitiveType('string');
let charType = new PrimitiveType('char');

function functionType(type: Type): Type {
    return new FunctionType(new TupleType([type, type]), type);
}
function bfunctionType(type: Type): Type {
    return new FunctionType(new TupleType([type, type]), boolType);
}

let typeVar = new TypeVariable('\'a');
let eqTypeVar = new TypeVariable('\'\'b');

let initialState: State = new State(
    undefined,
    {
        'bool':     [0, true],
        'int':      [0, true],
        'real':     [0, false],
        'string':   [0, true],
        'char':     [0, true],
        'word':     [0, true],
        'list':     [1, true],
        'ref':      [1, true],
        'exn':      [0, false]
    },
    undefined,
    undefined,
    new Environment(
        undefined,
        {
            'unit':     new TypeInformation(
                new FunctionType(new TupleType([]), new TupleType([])).simplify(), []),
            'bool':     new TypeInformation(new PrimitiveType('bool'),  ['true', 'false']),
            'int':      new TypeInformation(new PrimitiveType('int'),   []),
            'word':     new TypeInformation(new PrimitiveType('word'),  []),
            'real':     new TypeInformation(new PrimitiveType('real'),  []),
            'string':   new TypeInformation(new PrimitiveType('string'), []),
            'char':     new TypeInformation(new PrimitiveType('char'),  []),
            'list':     new TypeInformation(new PrimitiveType('list', [typeVar]), ['nil', '::']),
            'ref':      new TypeInformation(new PrimitiveType('ref', [typeVar]), ['ref']),
            'exn':      new TypeInformation(new PrimitiveType('exn'), [])
        },
        {
            'div': new ValueInformation([functionType(intType), functionType(wordType)],
                new PredefinedFunction('div', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return (<Integer> val1).divide(<Integer> val2);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return (<Word> val1).divide(<Word> val2);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "div" on value of the wrong type.');
                })),
            'mod': new ValueInformation([functionType(intType), functionType(wordType)],
                new PredefinedFunction('mod', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return (<Integer> val1).modulo(<Integer> val2);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return (<Word> val1).modulo(<Word> val2);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "mod" on value of the wrong type.');
                })),
            '*': new ValueInformation([functionType(intType), functionType(wordType),
                functionType(realType)],
                new PredefinedFunction('*', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return (<Integer> val1).multiply(<Integer> val2);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return (<Word> val1).multiply(<Word> val2);
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return (<Real> val1).multiply(<Real> val2);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "*" on value of the wrong type.');
                })),
            '/': new ValueInformation([functionType(realType)],
                new PredefinedFunction('/', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Real && val2 instanceof Real) {
                            return (<Real> val1).divide(<Real> val2);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "/" on value of the wrong type.');
                })),

            '+': new ValueInformation([functionType(intType), functionType(wordType),
                functionType(realType)],
                new PredefinedFunction('+', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return (<Integer> val1).add(<Integer> val2);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return (<Word> val1).add(<Word> val2);
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return (<Real> val1).add(<Real> val2);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "+" on value of the wrong type.');
                })),
            '-': new ValueInformation([functionType(intType), functionType(wordType),
                functionType(realType)],
                new PredefinedFunction('-', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return (<Integer> val1).add((<Integer> val2).negate());
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return (<Word> val1).add((<Word> val2).negate());
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return (<Real> val1).add((<Real> val2).negate());
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "-" on value of the wrong type.');
                })),

            '<': new ValueInformation([bfunctionType(intType), bfunctionType(wordType),
                bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
                new PredefinedFunction('<', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return new BoolValue((<Integer> val1).compareTo(<Integer> val2) < 0);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return new BoolValue((<Word> val1).compareTo(<Word> val2) < 0);
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return new BoolValue((<Real> val1).compareTo(<Real> val2) < 0);
                        } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                            return new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) < 0);
                        } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                            return new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) < 0);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "<" on value of the wrong type.');
                })),
            '>': new ValueInformation([bfunctionType(intType), bfunctionType(wordType),
                bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
                new PredefinedFunction('<', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return new BoolValue((<Integer> val1).compareTo(<Integer> val2) > 0);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return new BoolValue((<Word> val1).compareTo(<Word> val2) > 0);
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return new BoolValue((<Real> val1).compareTo(<Real> val2) > 0);
                        } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                            return new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) > 0);
                        } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                            return new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) > 0);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called ">" on value of the wrong type.');
                })),
            '<=': new ValueInformation([bfunctionType(intType), bfunctionType(wordType),
                bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
                new PredefinedFunction('<', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return new BoolValue((<Integer> val1).compareTo(<Integer> val2) <= 0);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return new BoolValue((<Word> val1).compareTo(<Word> val2) <= 0);
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return new BoolValue((<Real> val1).compareTo(<Real> val2) <= 0);
                        } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                            return new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) <= 0);
                        } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                            return new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) <= 0);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "<=" on value of the wrong type.');
                })),
            '>=': new ValueInformation([bfunctionType(intType), bfunctionType(wordType),
                bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
                new PredefinedFunction('<', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return new BoolValue((<Integer> val1).compareTo(<Integer> val2) >= 0);
                        } else if (val1 instanceof Word && val2 instanceof Word) {
                            return new BoolValue((<Word> val1).compareTo(<Word> val2) >= 0);
                        } else if (val1 instanceof Real && val2 instanceof Real) {
                            return new BoolValue((<Real> val1).compareTo(<Real> val2) >= 0);
                        } else if (val1 instanceof StringValue && val2 instanceof StringValue) {
                            return new BoolValue((<StringValue> val1).compareTo(<StringValue> val2) >= 0);
                        } else if (val1 instanceof CharValue && val2 instanceof CharValue) {
                            return new BoolValue((<CharValue> val1).compareTo(<CharValue> val2) >= 0);
                        }
                    }
                    throw new InternalInterpreterError(-1,
                        'Called ">=" on value of the wrong type.');
                })),
            '=': new ValueInformation([new FunctionType(new TupleType([eqTypeVar, eqTypeVar]), boolType)],
                new PredefinedFunction('=', (val: Value) => {
                    if (val instanceof RecordValue) {
                        let val1 = (<RecordValue> val).getValue('1');
                        let val2 = (<RecordValue> val).getValue('2');

                        return new BoolValue(val1.equals(val2));
                    }
                    throw new InternalInterpreterError(-1,
                        'Called "=" on value of the wrong type.');
                })),
            // ':='
            // 'ref': new ValueIdentifier(new FunctionType(typeVar, new PrimitiveType('ref', typeVar)),
            'true': new ValueInformation([new PrimitiveType('bool')],
                new BoolValue(true)),
            'false': new ValueInformation([new PrimitiveType('bool')],
                new BoolValue(false)),
            'nil': new ValueInformation([new PrimitiveType('list', [typeVar])],
                new ValueConstructor('nil').construct()),
            '::': new ValueInformation([new FunctionType(
                new TupleType([typeVar, new PrimitiveType('list', [typeVar])]),
                new PrimitiveType('list', [typeVar]))],
                new ValueConstructor('::')),
            'Match': new ValueInformation([new PrimitiveType('exn')],
                new ExceptionConstructor('Match').construct()),
            'Bind': new ValueInformation([new PrimitiveType('exn')],
                new ExceptionConstructor('Bind').construct())
        }
    ),
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
        ':=': new InfixStatus(true, 3, false),
    }
);

export function _getInitialState(): State {
    return initialState.getNestedState();
}
