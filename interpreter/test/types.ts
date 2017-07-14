import {
    FunctionType, PrimitiveType, PrimitiveTypes, RecordType, TupleType, Type, TypeUnificationError,
    TypeVariable
} from '../src/types';
import { State } from '../src/state';

const diff = require('jest-diff');
const chalk = require('chalk');

const NO_DIFF_MESSAGE = chalk.dim(
    'Compared values have no visual difference.',
);

expect.extend({
    toEqualWithType(received, expected) {
        // we assume that diff prints the types as well, so if there is no diff, we assume that recieved == expected
        const diffString = diff(expected, received, {
            expand: this.expand,
        });

        const pass = diffString == NO_DIFF_MESSAGE;

        const message = pass
            ? () => this.utils.matcherHint('.not.toEqualWithType') + '\n\n' +
            `Expected value to not equal with type:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}`
            : () => {
                return this.utils.matcherHint('.toEqualWithType') + '\n\n' +
                    `Expected value to equal with type:\n` +
                    `  ${this.utils.printExpected(expected)}\n` +
                    `Received:\n` +
                    `  ${this.utils.printReceived(received)}` +
                    (diffString ? `\n\nDifference:\n\n${diffString}` : '');
            };

        return {actual: received, message, pass};
    },
});

let state: State = undefined as State; // TODO

function check(a: Type, b: Type, result: Type): void {
    // unify is symmetrical
    expect(a.unify(b, state)).toEqualWithType(result);
    expect(b.unify(a, state)).toEqualWithType(result);

    // unify is reflexive
    expect(a.unify(a, state)).toEqualWithType(a);
    expect(b.unify(b, state)).toEqualWithType(b);

    if (b !== result) {
        check(a, result, result);
        check(b, result, result);
    }
}

function checkThrow(a: Type, b: Type): void {
    expect(() => { a.unify(b, state); }).toThrow(TypeUnificationError);
    expect(() => { b.unify(a, state); }).toThrow(TypeUnificationError);
}

it("very basic test", () => {

    let int = new PrimitiveType(PrimitiveTypes.int);
    let bool = new PrimitiveType(PrimitiveTypes.bool);
    let a = new TypeVariable("'a", false);
    let b = new TypeVariable("'b", false);
    let int_int = new FunctionType(int, int);
    let empty_record = new RecordType(new Map<string, Type>(), true);
    let incomplete_record = new RecordType(new Map<string, Type>(), false);
    let int_record = new TupleType([int, int]).simplify();
    let a_a = new FunctionType(a, a);
    let int_bool = new FunctionType(int, bool);

    check(int, a, int);
    check(int_int, a, int_int);
    check(incomplete_record, empty_record, empty_record);
    check(a_a, int_int, int_int);

    checkThrow(int_bool, a_a);
});
