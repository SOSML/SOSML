import { State, StaticBasis, DynamicBasis, InfixStatus, TypeInformation,
         TypeNameInformation } from './state';
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
    0,
    undefined,
    new StaticBasis(
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
            'div':      [functionType(intType), functionType(wordType)],
            'mod':      [functionType(intType), functionType(wordType)],
            '*':        [functionType(intType), functionType(wordType), functionType(realType)],
            '/':        [functionType(realType)],
            '+':        [functionType(intType), functionType(wordType), functionType(realType)],
            '-':        [functionType(intType), functionType(wordType), functionType(realType)],
            '<':        [bfunctionType(intType), bfunctionType(wordType),
                         bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
            '<=':       [bfunctionType(intType), bfunctionType(wordType),
                         bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
            '>':        [bfunctionType(intType), bfunctionType(wordType),
                         bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
            '>=':       [bfunctionType(intType), bfunctionType(wordType),
                         bfunctionType(realType), bfunctionType(stringType), bfunctionType(charType)],
            '=':        [new FunctionType(new TupleType([eqTypeVar, eqTypeVar]), boolType)],
            // ':='
            // 'ref': new ValueIdentifier(new FunctionType(typeVar, new PrimitiveType('ref', typeVar)),
            'true':     [new PrimitiveType('bool')],
            'false':    [new PrimitiveType('bool')],
            'nil':      [new PrimitiveType('list', [typeVar])],
            '::':       [new FunctionType(
                            new TupleType([typeVar, new PrimitiveType('list', [typeVar])]),
                            new PrimitiveType('list', [typeVar]))],
            'Match':    [new PrimitiveType('exn')],
            'Bind':     [new PrimitiveType('exn')]
        }
    ),
    new DynamicBasis(
        {
            'unit':     [],
            'bool':     ['true', 'false'],
            'int':      [],
            'word':     [],
            'real':     [],
            'string':   [],
            'char':     [],
            'list':     ['nil', '::'],
            'ref':      ['ref'],
            'exn':      []
        },
        {
            'div': new PredefinedFunction('div', (val: Value) => {
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
                    'Called "div" on value of the wrong type (' + val.constructor.name + ').');
            }),
            'mod': new PredefinedFunction('mod', (val: Value) => {
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
                    'Called "mod" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '*': new PredefinedFunction('*', (val: Value) => {
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
                    'Called "*" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '/': new PredefinedFunction('/', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof Real && val2 instanceof Real) {
                        return (<Real> val1).divide(<Real> val2);
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "/" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '+': new PredefinedFunction('+', (val: Value) => {
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
                    'Called "+" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '-': new PredefinedFunction('-', (val: Value) => {
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
                    'Called "-" on value of the wrong type (' + val.constructor.name + ').');
            }),

            '<': new PredefinedFunction('<', (val: Value) => {
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
                    'Called "<" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '>': new PredefinedFunction('<', (val: Value) => {
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
                    'Called ">" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '<=': new PredefinedFunction('<', (val: Value) => {
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
                    'Called "<=" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '>=': new PredefinedFunction('<', (val: Value) => {
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
                    'Called ">=" on value of the wrong type (' + val.constructor.name + ').');
            }),
            '=': new PredefinedFunction('=', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    return new BoolValue(val1.equals(val2));
                }
                throw new InternalInterpreterError(-1,
                    'Called "=" on value of the wrong type (' + val.constructor.name + ').');
            }),
            // ':='
            // 'ref': new ValueIdentifier(new FunctionType(typeVar, new PrimitiveType('ref', typeVar)),
            'true':     new BoolValue(true),
            'false':    new BoolValue(false),
            'nil':      new ValueConstructor('nil').construct(),
            '::':       new ValueConstructor('::', 1),
            'Match':    new ExceptionConstructor('Match').construct(),
            'Bind':     new ExceptionConstructor('Bind').construct(),
            '^':        new PredefinedFunction('^', (val: Value) => {
                if (val instanceof RecordValue) {
                    let val1 = (<RecordValue> val).getValue('1');
                    let val2 = (<RecordValue> val).getValue('2');

                    if (val1 instanceof StringValue && val2 instanceof StringValue) {
                        return (<StringValue> val1).concat(val2);
                    }
                }
                throw new InternalInterpreterError(-1,
                    'Called "^" on value of the wrong type (' + val.constructor.name + ').');
            }),
            'explode':  new PredefinedFunction('explode', (val: Value) => {
                if (val instanceof StringValue) {
                    return (<StringValue> val).explode();
                }
                throw new InternalInterpreterError(-1,
                    'Called "explode" on value of the wrong type (' + val.constructor.name + ').');
            }),
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
        'exn':      new TypeNameInformation(0, false)
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
        ':=': new InfixStatus(true, 3, false),

        '^': new InfixStatus(true, 6, false),
    }
);

export function getInitialState(): State {
    initialState.setDynamicValue('print', new PredefinedFunction('print', (val: Value) => {
        if (val instanceof StringValue) {
            initialState.setDynamicValue('__stdout', val);
        } else {
            initialState.setDynamicValue('__stdout', new StringValue(val.prettyPrint()));
        }
        return new RecordValue();
    }));
    return initialState.getNestedState();
}
