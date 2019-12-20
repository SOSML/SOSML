import * as API from '../src/main';

import * as diff from 'jest-diff';

const NO_DIFF_MESSAGE = diff('', '');

declare global {
    namespace jest {
        interface Matchers {
            toEqualWithType: (received: any) => any;
        }
    }
}

export function init(): void {
    expect.extend({
        toEqualWithType(received, expected) {
            // we assume that diff prints the types as well, so if there is no diff, we assume that recieved == expected
            const diffString = diff(expected, received);

            const pass = diffString === NO_DIFF_MESSAGE;

            const message = pass ? () => this.utils.matcherHint('.not.toEqualWithType') + '\n\n'
                + `Expected value or type to differ (${this.utils.printExpected(expected + '')}`
                + ` vs ${this.utils.printReceived(received + '')})\n`
                + `Expected anything but:\n`
                + `  ${this.utils.printExpected(expected)}\n`
                + `Received:\n`
                + `  ${this.utils.printReceived(received)}`
            : () => {
                return this.utils.matcherHint('.toEqualWithType') + '\n\n'
                    + `Expected value and type to be equal (${this.utils.printExpected(expected + '')}`
                    + ` vs ${this.utils.printReceived(received + '')})\n`
                    + `Expected:\n`
                    + `  ${this.utils.printExpected(expected)}\n`
                    + `Received:\n`
                    + `  ${this.utils.printReceived(received)}`
                    + (diffString ? `\n\nDifference:\n\n${diffString}` : '');
            };

            return {actual: received, message, pass};
        },
    });
}

let opts: API.InterpreterOptions = {
    'allowSuccessorML': true,
    'disableElaboration': false,
    'disableEvaluation': false,
    'allowUnicode': false,
    'allowUnicodeTypeVariables': false,
    'strictMode': true,
    'realEquality': false
};

let printOpt: API.PrintOptions = {
    'showTypeVariablesAsUnicode': true,
    'fullSymbol': '>',
    'emptySymbol': ' ',
    'boldText': ((text: string) => '\x1b[1m' + text + '\x1b[0m'),
    'italicText': ((text: string) => '\x1b[3m' + text + '\x1b[0m')
}

export function run (stuff: string, moreStuff: string[ ] = [ ], stdLib: boolean = true) {
    it(stuff, ( ) => {
        let out = stuff + '\n';
        try {
            opts.noModules = !stdLib;
            let state = API.getFirstState(API.getAvailableModules(),  opts);
            let res = API.interpret(stuff, state, opts);
            let i = 0;
            let st = state.id + 1;
            do {
                if (res.evaluationErrored) {
                    out += '\x1b[30;47;1mUncaught exception: '
                    + res.error + '\x1b[39;49;0m';
                    break;
                } else {
                    if (opts.disableEvaluation) {
                        out += res.state.printBasis(undefined,
                                                    res.state.getStaticChanges( st - 1 ), printOpt);

                    } else {
                        out += res.state.printBasis(res.state.getDynamicChanges( st - 1 ),
                                                    res.state.getStaticChanges( st - 1 ), printOpt );
                    }
                }
                if (res.warnings !== undefined && res.warnings.length > 0) {
                    for (let j = 0; j < res.warnings.length; ++j) {
                        if (res.warnings[j].type >= -1) {
                            out += 'WARN: ' + res.warnings[j].message;
                        } else {
                            out += 'Printed: ' + res.warnings[j].message;
                        }
                    }
                } else {
                    out += 'No warnings or warnings undefined.\n';
                }
                if (i < moreStuff.length) {
                    st = res.state.id + 1;
                    out += '\n' + moreStuff[i] + '\n';
                    res = API.interpret(moreStuff[i], res.state, opts);
                } else {
                    break;
                }
                ++i;
            } while(true);
        } catch (e) {
            out += '\x1b[31;40;1m' + e + '\x1b[39;49;0m\n';
            console.log(out);
            throw e;
        }
        console.log(out);
    });
}

test.skip('skip', () => {})
