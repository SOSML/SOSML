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

test.skip('skip', () => {})
