
export interface CompilerMessage {
    message: string;
    position: number;
}

// A general compiler error. Different translation phases may derive their own, more specialized error classes.
export class CompilerError extends Error implements CompilerMessage {
    constructor(message: string, public position: number) {
        super('error:' + position + ': ' + message);
    }
}

// Used for errors that Never Happen™. Any InternalCompilerError occurring is a bug in the interpreter, regardless
// of how absurd the input is.
export class InternalCompilerError extends CompilerError {
    constructor(position: number, message: string = 'internal compiler error') { super(message, position); }
}

// Used if the code may be valid SML, but uses a feature that this interpreter does not implement, e.g. references.
export class FeatureNotImplementedError extends CompilerError {
    constructor(message: string, position: number) { super(message, position); }
}

// Used if the code may be valid SML, but uses a feature that is currently disabled in the interpreter settings.
export class FeatureDisabledError extends CompilerError {
    constructor(message: string, position: number) { super(message, position); }
}
