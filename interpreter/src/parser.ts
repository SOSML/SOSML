import { ASTNode } from './ast';
import { InternalCompilerError } from './errors';
import { Token } from './lexer';

export class Parser {
    private position: number = 0; // position of the next not yet parsed token

    constructor(private tokens: Token[]) {}

    parse(): ASTNode {
        throw new InternalCompilerError(0, 'not yet implemented');
    }

    finished(): boolean {
        return this.position === this.tokens.length;
    }
}

export function parse(tokens: Token[]): ASTNode[] {
    let p: Parser = new Parser(tokens);
    let result: ASTNode[] = [];
    while (!p.finished()) {
        result.push(p.parse());
    }
    return result;
}
