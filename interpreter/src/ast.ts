// import { Position } from './errors';
// import { Type } from './types';

export interface ASTNode {
    // TODO: position: Position;
    // TODO: evalStaticSemantics():
    // TODO: prettyPrint(indentation: number): void;
}

export interface Declaration extends ASTNode {
}

export class Function implements Declaration {
}

export class Structure implements Declaration {
}
