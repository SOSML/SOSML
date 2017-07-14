
// currently this is the index of a character in the input string
// TODO: maybe change this to line and column number
export type Position = number;

export interface InterpreterMessage {
    message: string;
    position: Position;
}

// A general compiler error. Different translation phases may derive their own, more specialized error classes.
export class InterpreterError extends Error implements InterpreterMessage {
    constructor(message: string, public position: Position) {
        super('error:' + position + ': ' + message);
        Object.setPrototypeOf(this, InterpreterError.prototype);
    }
}

// Used for errors that Never Happen™. Any InternalInterpreterError occurring is a bug in the interpreter, regardless
// of how absurd the input is.
export class InternalInterpreterError extends InterpreterError {
    constructor(position: Position, message: string = 'internal compiler error') {
        super(message, position);
        Object.setPrototypeOf(this, InternalInterpreterError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that this interpreter does not implement, e.g. references.
export class FeatureNotImplementedError extends InterpreterError {
    constructor(message: string, position: Position) {
        super(message, position);
        Object.setPrototypeOf(this, FeatureNotImplementedError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that is currently disabled in the interpreter settings.
export class FeatureDisabledError extends InterpreterError {
    constructor(message: string, position: Position) {
        super(message, position);
        Object.setPrototypeOf(this, FeatureDisabledError.prototype);
    }
}

// Used if the input is incomplete, but may be a prefix of valid SML code.
export class IncompleteError extends InterpreterError {
    constructor(position: Position, message: string = 'unexpected end of input') {
        super(message, position);
        Object.setPrototypeOf(this, IncompleteError.prototype);
    }
}

export class SemanticError extends InterpreterError {
    constructor(message: string, position: Position) {
        super(message, position);
        Object.setPrototypeOf(this, SemanticError.prototype);
    }
}
