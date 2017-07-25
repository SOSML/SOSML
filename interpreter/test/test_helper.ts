/* TODO: tests
*/

const API = require("../src/lexer");
const Errors = require("../src/errors");

const diff = require('jest-diff');
const chalk = require('chalk');

const NO_DIFF_MESSAGE = chalk.dim(
  'Compared values have no visual difference.',
);

export function init(): void {
    expect.extend({
      toEqualWithTypeNoPosition(received, expected) {
        
        // we assume that diff prints the types as well, so if there is no diff, we assume that recieved == expected
        const diffString = diff(expected, received, {
          expand: this.expand
        });

        const pass = diffString == NO_DIFF_MESSAGE;

        const message = pass
          ? () => this.utils.matcherHint('.not.toEqualWithTypeNoPosition') + '\n\n' +
            `Expected value to not equal with type:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}`
          : () => {
            return this.utils.matcherHint('.toEqualWithTypeNoPosition') + '\n\n' +
            `Expected value to equal with type:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}` +
            (diffString ? `\n\nDifference:\n\n${diffString}` : '');
          };

        return {actual: received, message, pass};
      },
    });

    expect.extend({
      toEqualWithType(received, expected) {
        // we assume that diff prints the types as well, so if there is no diff, we assume that recieved == expected
        const diffString = diff(expected, received, {
          expand: this.expand
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

    expect.extend({
      toEqualPretty(received, expected) {
        const pretty = received.prettyPrint();
        const pass = received == expected;

        const message = pass
          ? () => this.utils.matcherHint('.not.toEqualWithType') + '\n\n' +
            `Expected value to not equal pretty:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}`
          : () => {
            return this.utils.matcherHint('.toEqualWithType') + '\n\n' +
            `Expected value to equal pretty:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}` +
            (diffString ? `\n\nDifference:\n\n${diffString}` : '');
          };

        return {actual: received, message, pass};
      },
    });
}


it();
