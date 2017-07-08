import { State } from './state';
import { Position } from './errors';

export abstract class ASTNode {
    position: Position;
    abstract checkStaticSemantics(state: State): void;
    abstract evaluate(state: State): void;
    abstract prettyPrint(indentation: number, oneLine: boolean): string;
    abstract simplify(): ASTNode;
    abstract reParse(state: State): ASTNode;
}
