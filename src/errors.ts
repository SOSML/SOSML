export interface InterpreterMessage {
    message: string;
}

// A general compiler error. Different translation phases may derive their own, more specialized error classes.
export class InterpreterError extends Error implements InterpreterMessage {
    constructor(public message: string, public name: string) {
        super(message);
        Object.setPrototypeOf(this, InterpreterError.prototype);
    }

    toString(): string {
        return this.name + ': ' + this.message;
    }
}

// Used for errors that Never Happen™. Any InternalInterpreterError occurring is a bug in the interpreter, regardless
// of how absurd the input is.
export class InternalInterpreterError extends InterpreterError {
    constructor(message: string) {
        super(message, 'You triggered Third Impact');
        Object.setPrototypeOf(this, InternalInterpreterError.prototype);
    }
}

// Used if the code may be valid SML, but uses a feature that is currently disabled in the interpreter settings.
export class FeatureDisabledError extends InterpreterError {
    constructor(message: string) {
        super(message, 'Have you ever tried doing something you were not supposed to? '
        + 'Basically that');
        Object.setPrototypeOf(this, FeatureDisabledError.prototype);
    }
}

// Used if the input is incomplete, but may be a prefix of valid SML code.
export class IncompleteError extends InterpreterError {
    constructor(message: string) {
        super(message, 'Input Incomplete');
        Object.setPrototypeOf(this, IncompleteError.prototype);
    }
}


export class LexerError extends InterpreterError {
    constructor(message: string) {
        super(message, 'Lexing failed');
        Object.setPrototypeOf(this, LexerError.prototype);
    }
}

export class ParserError extends InterpreterError {
    constructor(message: string) {
        super(message, 'Parsing failed');
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

export class ElaborationError extends InterpreterError {
    static getUnguarded(tyvars: string[]) {
        let res = '';
        if (tyvars.length > 1) {
            res += 's';
        }
        res += ' ';
        for (let i = 0; i < tyvars.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += '"' + tyvars[i] + '"';
        }
        return new ElaborationError('Unguarded type variable' + res + '.');
    }
    constructor(message: string) {
        super(message, 'Elaboration failed');
        Object.setPrototypeOf(this, ElaborationError.prototype);
    }
}

export class EvaluationError extends InterpreterError {
    constructor(message: string) {
        super(message, 'Evaluation failed');
        Object.setPrototypeOf(this, EvaluationError.prototype);
    }
}

export class PatternMatchError extends InterpreterError {
    constructor(message: string) {
        super(message, 'Checking Pattern failed');
        Object.setPrototypeOf(this, PatternMatchError.prototype);
    }
}

export class Warning extends InterpreterError {
    // type:
    // -2 - Print
    // -1 - Warning
    //  0 - Message / Not-so-important Warning
    constructor(public type: number, message: string) {
        super(message, 'Warning');
        Object.setPrototypeOf(this, Warning.prototype);
    }
}
