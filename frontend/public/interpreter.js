var Interpreter =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// A general compiler error. Different translation phases may derive their own, more specialized error classes.
var InterpreterError = (function (_super) {
    __extends(InterpreterError, _super);
    function InterpreterError(position, message) {
        var _this = _super.call(this, message) || this;
        _this.position = position;
        Object.setPrototypeOf(_this, InterpreterError.prototype);
        return _this;
    }
    return InterpreterError;
}(Error));
exports.InterpreterError = InterpreterError;
// Used for errors that Never Happen™. Any InternalInterpreterError occurring is a bug in the interpreter, regardless
// of how absurd the input is.
var InternalInterpreterError = (function (_super) {
    __extends(InternalInterpreterError, _super);
    function InternalInterpreterError(position, message) {
        if (message === void 0) { message = 'internal compiler error'; }
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, InternalInterpreterError.prototype);
        return _this;
    }
    return InternalInterpreterError;
}(InterpreterError));
exports.InternalInterpreterError = InternalInterpreterError;
// Used if the code may be valid SML, but uses a feature that this interpreter does not implement, e.g. references.
var FeatureNotImplementedError = (function (_super) {
    __extends(FeatureNotImplementedError, _super);
    function FeatureNotImplementedError(position, message) {
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, FeatureNotImplementedError.prototype);
        return _this;
    }
    return FeatureNotImplementedError;
}(InterpreterError));
exports.FeatureNotImplementedError = FeatureNotImplementedError;
// Used if the code may be valid SML, but uses a feature that is currently disabled in the interpreter settings.
var FeatureDisabledError = (function (_super) {
    __extends(FeatureDisabledError, _super);
    function FeatureDisabledError(position, message) {
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, FeatureDisabledError.prototype);
        return _this;
    }
    return FeatureDisabledError;
}(InterpreterError));
exports.FeatureDisabledError = FeatureDisabledError;
// Used if the input is incomplete, but may be a prefix of valid SML code.
var IncompleteError = (function (_super) {
    __extends(IncompleteError, _super);
    function IncompleteError(position, message) {
        if (message === void 0) { message = 'unexpected end of input'; }
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, IncompleteError.prototype);
        return _this;
    }
    return IncompleteError;
}(InterpreterError));
exports.IncompleteError = IncompleteError;
var LexerError = (function (_super) {
    __extends(LexerError, _super);
    function LexerError(position, message) {
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, LexerError.prototype);
        return _this;
    }
    return LexerError;
}(InterpreterError));
exports.LexerError = LexerError;
var ElaborationError = (function (_super) {
    __extends(ElaborationError, _super);
    function ElaborationError(position, message) {
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, ElaborationError.prototype);
        return _this;
    }
    ElaborationError.getUnguarded = function (position, tyvars) {
        var res = '';
        if (tyvars.length > 1) {
            res += 's';
        }
        res += ' ';
        for (var i = 0; i < tyvars.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += '"' + tyvars[i].name + '"';
        }
        return new ElaborationError(position, 'Unguarded type variable' + res + '.');
    };
    return ElaborationError;
}(InterpreterError));
exports.ElaborationError = ElaborationError;
var EvaluationError = (function (_super) {
    __extends(EvaluationError, _super);
    function EvaluationError(position, message) {
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, EvaluationError.prototype);
        return _this;
    }
    return EvaluationError;
}(InterpreterError));
exports.EvaluationError = EvaluationError;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * TODO: Documentation for the lexer
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = __webpack_require__(0);
var KeywordToken = (function () {
    function KeywordToken(text, position) {
        this.text = text;
        this.position = position;
    }
    KeywordToken.prototype.getText = function () {
        return this.text;
    };
    KeywordToken.prototype.isValidRecordLabel = function () { return false; };
    KeywordToken.prototype.isVid = function () { return false; };
    return KeywordToken;
}());
exports.KeywordToken = KeywordToken;
var ConstantToken = (function () {
    function ConstantToken() {
    }
    ConstantToken.prototype.isVid = function () { return false; };
    return ConstantToken;
}());
exports.ConstantToken = ConstantToken;
var IntegerConstantToken = (function (_super) {
    __extends(IntegerConstantToken, _super);
    function IntegerConstantToken(text, position, value) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.position = position;
        _this.value = value;
        return _this;
    }
    IntegerConstantToken.prototype.getText = function () {
        return '' + this.value;
    };
    IntegerConstantToken.prototype.isValidRecordLabel = function () { return false; };
    return IntegerConstantToken;
}(ConstantToken));
exports.IntegerConstantToken = IntegerConstantToken;
var RealConstantToken = (function (_super) {
    __extends(RealConstantToken, _super);
    function RealConstantToken(text, position, value) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.position = position;
        _this.value = value;
        return _this;
    }
    RealConstantToken.prototype.getText = function () {
        return '' + this.value;
    };
    RealConstantToken.prototype.isValidRecordLabel = function () { return false; };
    return RealConstantToken;
}(ConstantToken));
exports.RealConstantToken = RealConstantToken;
var WordConstantToken = (function (_super) {
    __extends(WordConstantToken, _super);
    function WordConstantToken(text, position, value) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.position = position;
        _this.value = value;
        return _this;
    }
    WordConstantToken.prototype.getText = function () {
        return '' + this.value;
    };
    WordConstantToken.prototype.isValidRecordLabel = function () { return false; };
    return WordConstantToken;
}(ConstantToken));
exports.WordConstantToken = WordConstantToken;
var CharacterConstantToken = (function (_super) {
    __extends(CharacterConstantToken, _super);
    function CharacterConstantToken(text, position, value) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.position = position;
        _this.value = value;
        return _this;
    }
    CharacterConstantToken.prototype.getText = function () {
        return '' + this.text;
    };
    CharacterConstantToken.prototype.isValidRecordLabel = function () { return false; };
    return CharacterConstantToken;
}(ConstantToken));
exports.CharacterConstantToken = CharacterConstantToken;
var StringConstantToken = (function (_super) {
    __extends(StringConstantToken, _super);
    function StringConstantToken(text, position, value) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.position = position;
        _this.value = value;
        return _this;
    }
    StringConstantToken.prototype.getText = function () {
        return '' + this.text;
    };
    StringConstantToken.prototype.isValidRecordLabel = function () { return false; };
    return StringConstantToken;
}(ConstantToken));
exports.StringConstantToken = StringConstantToken;
// Any identifier not starting with a prime (')
// May represent value identifiers, type constructors and record labels
var IdentifierToken = (function () {
    function IdentifierToken(text, position) {
        this.text = text;
        this.position = position;
        this.opPrefixed = false;
    }
    IdentifierToken.prototype.getText = function () {
        return this.text;
    };
    IdentifierToken.prototype.isValidRecordLabel = function () { return true; };
    IdentifierToken.prototype.isVid = function () { return true; };
    return IdentifierToken;
}());
exports.IdentifierToken = IdentifierToken;
// Alphanumeric identifiers not starting with a prime may represent structure identifiers, signature identifiers
// and functor identifiers
var AlphanumericIdentifierToken = (function (_super) {
    __extends(AlphanumericIdentifierToken, _super);
    function AlphanumericIdentifierToken(text, position) {
        return _super.call(this, text, position) || this;
    }
    AlphanumericIdentifierToken.prototype.getText = function () {
        return this.text;
    };
    AlphanumericIdentifierToken.prototype.isValidRecordLabel = function () { return true; };
    return AlphanumericIdentifierToken;
}(IdentifierToken));
exports.AlphanumericIdentifierToken = AlphanumericIdentifierToken;
// An alphanumeric identifier that starts with a prime
var TypeVariableToken = (function () {
    function TypeVariableToken(text, position) {
        this.text = text;
        this.position = position;
    }
    TypeVariableToken.prototype.getText = function () {
        return this.text;
    };
    TypeVariableToken.prototype.isValidRecordLabel = function () { return false; };
    TypeVariableToken.prototype.isVid = function () { return false; };
    return TypeVariableToken;
}());
exports.TypeVariableToken = TypeVariableToken;
// An alphanumeric identifier that starts with two primes
var EqualityTypeVariableToken = (function (_super) {
    __extends(EqualityTypeVariableToken, _super);
    function EqualityTypeVariableToken(text, position) {
        return _super.call(this, text, position) || this;
    }
    EqualityTypeVariableToken.prototype.getText = function () {
        return this.text;
    };
    EqualityTypeVariableToken.prototype.isValidRecordLabel = function () { return false; };
    EqualityTypeVariableToken.prototype.isVid = function () { return false; };
    return EqualityTypeVariableToken;
}(TypeVariableToken));
exports.EqualityTypeVariableToken = EqualityTypeVariableToken;
// A star (*) can be used as value identifier or record label, but not as a type constructor and thus must be separated.
// See SML definition, chapter 2.4 Identifiers
var StarToken = (function (_super) {
    __extends(StarToken, _super);
    function StarToken(position) {
        var _this = _super.call(this, '*', position) || this;
        _this.position = position;
        _this.opPrefixed = false;
        return _this;
    }
    StarToken.prototype.getText = function () {
        return this.text;
    };
    StarToken.prototype.isValidRecordLabel = function () { return true; };
    StarToken.prototype.isVid = function () { return true; };
    return StarToken;
}(KeywordToken));
exports.StarToken = StarToken;
// Reserved words are generally not allowed as identifiers. "The only exception to this rule is that the symbol = ,
// which is a reserved word, is also allowed as an identifier to stand for the equality predicate.
// The identifier = may not be re-bound; this precludes any syntactic ambiguity." (Definition of SML, page 5)
var EqualsToken = (function (_super) {
    __extends(EqualsToken, _super);
    function EqualsToken(position) {
        var _this = _super.call(this, '=', position) || this;
        _this.position = position;
        return _this;
    }
    EqualsToken.prototype.getText = function () {
        return this.text;
    };
    EqualsToken.prototype.isValidRecordLabel = function () { return false; };
    EqualsToken.prototype.isVid = function () { return true; };
    return EqualsToken;
}(KeywordToken));
exports.EqualsToken = EqualsToken;
// A numeric token (a positive, decimal integer not starting with '0') can be used either as an integer constant or as
// a record label.
var NumericToken = (function (_super) {
    __extends(NumericToken, _super);
    function NumericToken(text, position, value) {
        return _super.call(this, text, position, value) || this;
    }
    NumericToken.prototype.getText = function () {
        return this.text;
    };
    NumericToken.prototype.isValidRecordLabel = function () { return true; };
    NumericToken.prototype.isVid = function () { return false; };
    return NumericToken;
}(IntegerConstantToken));
exports.NumericToken = NumericToken;
// A long identifier is a sequence str_1.str_2. … .str_n.id of n > 0 structure identifiers and one Identifier
// separated by '.'s. The identifier may a value identifier, type constructor or structure identifier
var LongIdentifierToken = (function () {
    function LongIdentifierToken(text, position, qualifiers, id) {
        this.text = text;
        this.position = position;
        this.qualifiers = qualifiers;
        this.id = id;
        this.opPrefixed = false;
    }
    LongIdentifierToken.prototype.getText = function () {
        var res = '';
        for (var i = 0; i < this.qualifiers.length; ++i) {
            if (i > 0) {
                res += '.';
            }
            res += this.qualifiers[i].getText();
        }
        return res + '.' + this.id.getText();
    };
    LongIdentifierToken.prototype.isValidRecordLabel = function () { return false; };
    LongIdentifierToken.prototype.isVid = function () { return false; };
    return LongIdentifierToken;
}());
exports.LongIdentifierToken = LongIdentifierToken;
// TODO: maybe these should be static class members
var reservedWords = new Set([
    'abstype', 'and', 'andalso', 'as', 'case', 'datatype', 'do', 'else', 'end', 'exception', 'fn', 'fun', 'handle',
    'if', 'in', 'infix', 'infixr', 'let', 'local', 'nonfix', 'of', 'op', 'open', 'orelse', 'raise', 'rec', 'then',
    'type', 'val', 'with', 'withtype', 'while',
    '(', ')', '[', ']', '{', '}', ',', ':', ';', '...', '_', '|', '=', '=>', '->', '#',
    'eqtype', 'functor', 'signature', 'struct', 'include', 'sharing', 'structure', 'where', 'sig', ':>'
]);
var symbolicCharacters = new Set([
    '!', '%', '&', '$', '#', '+', '-', '/', ':', '<', '=', '>', '?', '@', '\\', '~', '`', '^', '|', '*'
]);
var Lexer = (function () {
    function Lexer(input) {
        this.position = 0;
        this.input = input;
        this.skipWhitespaceAndComments();
    }
    Lexer.isAlphanumeric = function (c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '\'' || c === '_';
    };
    Lexer.isSymbolic = function (c) {
        return symbolicCharacters.has(c);
    };
    Lexer.isWhitespace = function (c) {
        return c === ' ' || c === '\t' || c === '\n' || c === '\f';
    };
    Lexer.isNumber = function (c, hexadecimal) {
        return (c >= '0' && c <= '9') || (hexadecimal && ((c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')));
    };
    Lexer.prototype.consumeChar = function (errorMessageOnEOF, errorPositionOnEOF) {
        if (errorMessageOnEOF === void 0) { errorMessageOnEOF = ''; }
        if (errorPositionOnEOF === void 0) { errorPositionOnEOF = this.input.length - 1; }
        if (this.position >= this.input.length) {
            if (errorMessageOnEOF === '') {
                throw new errors_1.IncompleteError(errorPositionOnEOF);
            }
            else {
                throw new errors_1.IncompleteError(errorPositionOnEOF, errorMessageOnEOF);
            }
        }
        ++this.position;
        return this.input.charAt(this.position - 1);
    };
    Lexer.prototype.getChar = function (offset) {
        if (offset === void 0) { offset = 0; }
        if (this.position + offset >= this.input.length) {
            // This must be any character that has no syntactic meaning in SML. It may not be counted as whitespace.
            return '\x04'; // End of Transmission character
        }
        else {
            return this.input.charAt(this.position + offset);
        }
    };
    Lexer.prototype.skipWhitespace = function () {
        while (Lexer.isWhitespace(this.getChar())) {
            ++this.position;
        }
    };
    Lexer.prototype.skipWhitespaceAndComments = function () {
        var oldPosition;
        do {
            oldPosition = this.position;
            this.skipWhitespace();
            while (this.position + 1 < this.input.length && this.input.substr(this.position, 2) === '(*') {
                var commentStart = this.position;
                this.position += 2;
                var openComments = 1;
                while (openComments > 0) {
                    if (this.position > this.input.length - 2) {
                        throw new errors_1.IncompleteError(commentStart, 'unclosed comment');
                    }
                    var s = this.input.substr(this.position, 2);
                    if (s === '(*') {
                        ++openComments;
                        ++this.position;
                    }
                    else if (s === '*)') {
                        --openComments;
                        ++this.position;
                    }
                    ++this.position;
                }
            }
        } while (this.position !== oldPosition);
        this.tokenStart = this.position;
    };
    /* Reads a sequence of digits. Sign, exponent etc. are handled by lexNumber. Accepts leading zeros.
     */
    Lexer.prototype.readNumeric = function (hexadecimal, maxLength) {
        if (maxLength === void 0) { maxLength = -1; }
        var result = '';
        while (Lexer.isNumber(this.getChar(), hexadecimal) && result.length !== maxLength) {
            result += this.consumeChar();
        }
        return result;
    };
    Lexer.prototype.makeNumberToken = function (value, real, word, hexadecimal) {
        if (real === void 0) { real = false; }
        if (word === void 0) { word = false; }
        if (hexadecimal === void 0) { hexadecimal = false; }
        if (real && word) {
            throw new errors_1.InternalInterpreterError(this.position);
        }
        var token = this.input.substring(this.tokenStart, this.position);
        if (real) {
            return new RealConstantToken(token, this.tokenStart, parseFloat(value));
        }
        var v = parseInt(value, hexadecimal ? 16 : 10);
        if (word) {
            return new WordConstantToken(token, this.tokenStart, v);
        }
        else {
            var firstChar = token.charAt(0);
            if (Lexer.isNumber(firstChar, false) && firstChar !== '0') {
                // firstChar !== 0 also implies that the number is not hexadecimal
                return new NumericToken(token, this.tokenStart, v);
            }
            else {
                return new IntegerConstantToken(token, this.tokenStart, v);
            }
        }
    };
    Lexer.prototype.lexNumber = function () {
        var value = '';
        var hexadecimal = false;
        var word = false;
        var real = false;
        var negative = false;
        if (this.getChar() === '~') {
            ++this.position;
            negative = true;
            value += '-';
        }
        if (this.getChar() === '0' && (this.getChar(1) === 'w' || this.getChar(1) === 'x')) {
            ++this.position;
            if (this.getChar() === 'w') {
                word = true;
            }
            if (this.getChar(word ? 1 : 0) === 'x') {
                hexadecimal = true;
            }
            var nextDigitOffset = (word && hexadecimal) ? 2 : 1;
            if ((negative && word) || !Lexer.isNumber(this.getChar(nextDigitOffset), hexadecimal)) {
                // The 'w' or 'x' is not part of the number
                value += '0';
                return this.makeNumberToken(value, false, false, false);
            }
            this.position += nextDigitOffset;
        }
        value += this.readNumeric(hexadecimal);
        if (hexadecimal || word) {
            return this.makeNumberToken(value, false, word, hexadecimal);
        }
        if (this.getChar() === '.') {
            if (Lexer.isNumber(this.getChar(1), false)) {
                value += this.consumeChar();
                value += this.readNumeric(false);
            }
            else {
                return this.makeNumberToken(value);
            }
            real = true;
        }
        if (this.getChar() === 'e' || this.getChar() === 'E') {
            if (Lexer.isNumber(this.getChar(1), false)) {
                value += 'e';
                ++this.position;
                value += this.readNumeric(false);
            }
            else if (this.getChar(1) === '~' && Lexer.isNumber(this.getChar(2), false)) {
                value += 'e-';
                this.position += 2;
                value += this.readNumeric(false);
            }
            else {
                return this.makeNumberToken(value, real);
            }
            real = true;
        }
        return this.makeNumberToken(value, real);
    };
    Lexer.prototype.lexString = function () {
        var startPosition = this.position;
        if (this.consumeChar() !== '"') {
            throw new errors_1.InternalInterpreterError(this.position);
        }
        var value = '';
        while (this.getChar() !== '"') {
            if (this.getChar() === '\\') {
                ++this.position;
                if (Lexer.isWhitespace(this.getChar())) {
                    this.skipWhitespace();
                    if (this.consumeChar('unterminated whitespace escape sequence') !== '\\') {
                        throw new errors_1.LexerError(this.position - 1, 'only whitespace is allowed in whitespace escape sequence');
                    }
                }
                else {
                    var c = this.consumeChar();
                    switch (c) {
                        case 'a':
                            value += '\x07';
                            break;
                        case 'b':
                            value += '\b';
                            break;
                        case 't':
                            value += '\t';
                            break;
                        case 'n':
                            value += '\n';
                            break;
                        case 'v':
                            value += '\v';
                            break;
                        case 'f':
                            value += '\f';
                            break;
                        case 'r':
                            value += '\r';
                            break;
                        case '"':
                            value += '"';
                            break;
                        case '\\':
                            value += '\\';
                            break;
                        case '^': {
                            var cc = this.consumeChar().charCodeAt(0);
                            if (cc < 64 || cc > 95) {
                                throw new errors_1.LexerError(this.position - 1, '"' + String.fromCharCode(cc) +
                                    '" does not represent a valid control character');
                            }
                            value += String.fromCharCode(cc - 64);
                            break;
                        }
                        case 'u': {
                            var s = this.readNumeric(true, 4);
                            if (s.length !== 4) {
                                throw new errors_1.LexerError(this.position - s.length - 1, 'unicode escape sequence must have four digits');
                            }
                            var v = parseInt(s, 16);
                            if (v >= 256) {
                                throw new errors_1.LexerError(this.position - s.length - 1, 'character code ' + s + ' is too large, only 00 to ff is allowed');
                            } // TODO: remove?
                            value += String.fromCharCode(v);
                            break;
                        }
                        default: {
                            if (!Lexer.isNumber(c, false)) {
                                throw new errors_1.LexerError(this.position - 1, 'invalid escape sequence');
                            }
                            --this.position; // 'un-consume' the first character of the number
                            var s = this.readNumeric(false, 3);
                            if (s.length !== 3) {
                                throw new errors_1.LexerError(this.position - s.length - 1, 'numeric escape sequence must have three digits');
                            }
                            var v = parseInt(s, 10);
                            if (v >= 256) {
                                throw new errors_1.LexerError(this.position - s.length - 1, 'character code ' + s + ' is too large, only 000 to 255 is allowed');
                            } // TODO: remove?
                            value += String.fromCharCode(v);
                            break;
                        }
                    }
                }
            }
            else {
                var c = this.consumeChar('unterminated string', this.tokenStart).charCodeAt(0);
                // Only printable characters (33 to 126) and spaces are allowed (SML definition, chapter 2.2)
                // We however also allow all non-ASCII characters (>128), since MosML and SML/NJ seem to do so as well.
                if ((c < 33 || c > 126) && c !== 32 /*space*/ && c < 128) {
                    // invalid characters are not printable, so we should print its code rather than the character
                    throw new errors_1.LexerError(this.position - 1, 'invalid character with code ' + c + ' in string');
                }
                value += String.fromCharCode(c);
            }
        }
        if (this.consumeChar() !== '"') {
            throw new errors_1.InternalInterpreterError(this.position);
        }
        return new StringConstantToken(this.input.substring(startPosition, this.position), this.tokenStart, value);
    };
    Lexer.prototype.lexCharacter = function () {
        if (this.consumeChar() !== '#') {
            throw new errors_1.InternalInterpreterError(this.position);
        }
        var t = this.lexString();
        if (t.value.length !== 1) {
            throw new errors_1.LexerError(this.tokenStart, 'character constant must have length 1, not ' + t.value.length);
        }
        return new CharacterConstantToken('#' + t.text, this.tokenStart, t.value);
    };
    Lexer.prototype.lexIdentifierOrKeyword = function () {
        // Both identifiers and keywords can be either symbolic (consisting only of the characters
        // ! % & $ # + - / : < = > ? @ \ ~ ‘ ^ | *
        // or alphanumeric (consisting only of letters, digits, ' or _).
        // We first need to figure out which of these types the token belongs to, then find the longest possible token
        // of that type at this position and lastly check whether it is a reserved word.
        var token = '';
        var charChecker;
        var firstChar = this.getChar();
        if (Lexer.isSymbolic(firstChar)) {
            charChecker = Lexer.isSymbolic;
        }
        else if (Lexer.isAlphanumeric(firstChar) && !Lexer.isNumber(firstChar, false) && firstChar !== '_') {
            // alphanumeric identifiers may not start with a number
            charChecker = Lexer.isAlphanumeric;
        }
        else if (reservedWords.has(firstChar)) {
            return new KeywordToken(this.consumeChar(), this.tokenStart);
        }
        else if (firstChar === '.' && this.getChar(1) === '.' && this.getChar(2) === '.') {
            this.position += 3;
            return new KeywordToken('...', this.tokenStart);
        }
        else {
            if (firstChar.charCodeAt(0) < 32) {
                throw new errors_1.LexerError(this.position, 'invalid character with ascii code ' + firstChar.charCodeAt(0));
            }
            else {
                throw new errors_1.LexerError(this.position, 'invalid token: ' + firstChar);
            }
        }
        do {
            token += this.consumeChar();
        } while (charChecker(this.getChar()));
        if (token === '*') {
            return new StarToken(this.tokenStart);
        }
        else if (token === '=') {
            return new EqualsToken(this.tokenStart);
        }
        else if (reservedWords.has(token)) {
            return new KeywordToken(token, this.tokenStart);
        }
        else if (firstChar === '\'') {
            if (token.charAt(1) === '\'') {
                return new EqualityTypeVariableToken(token, this.tokenStart);
            }
            else {
                return new TypeVariableToken(token, this.tokenStart);
            }
        }
        else if (Lexer.isAlphanumeric(firstChar)) {
            return new AlphanumericIdentifierToken(token, this.tokenStart);
        }
        else {
            return new IdentifierToken(token, this.tokenStart);
        }
    };
    Lexer.prototype.lexLongIdentifierOrKeyword = function () {
        var tokenStart = this.tokenStart;
        var t = this.lexIdentifierOrKeyword();
        if (this.getChar() !== '.') {
            return t;
        }
        var qualifiers = [];
        do {
            this.consumeChar();
            if (!(t instanceof AlphanumericIdentifierToken)) {
                throw new errors_1.LexerError(t.position, 'expected structure name before "."');
            }
            qualifiers.push(t);
            this.tokenStart = this.position;
            t = this.lexIdentifierOrKeyword();
        } while (this.getChar() === '.');
        // Only value identifiers, type constructors and structure identifiers are allowed here.
        // EqualsToken is not allowed because it cannot be re-bound.
        if ((!(t instanceof IdentifierToken || t instanceof StarToken)) || t instanceof TypeVariableToken) {
            throw new errors_1.LexerError(t.position, t.text + ' is not allowed in a long identifier');
        }
        return new LongIdentifierToken(this.input.substring(tokenStart, this.position), tokenStart, qualifiers, t);
    };
    Lexer.prototype.nextToken = function () {
        var token;
        this.tokenStart = this.position;
        if (Lexer.isNumber(this.getChar(), false)
            || (this.getChar() === '~' && Lexer.isNumber(this.getChar(1), false))) {
            token = this.lexNumber();
        }
        else if (this.getChar() === '"') {
            token = this.lexString();
        }
        else if (this.getChar() === '#' && this.getChar(1) === '"') {
            token = this.lexCharacter();
        }
        else {
            token = this.lexLongIdentifierOrKeyword();
        }
        this.skipWhitespaceAndComments();
        return token;
    };
    Lexer.prototype.finished = function () {
        return this.position >= this.input.length;
    };
    return Lexer;
}());
function lex(s) {
    var l = new Lexer(s);
    var result = [];
    while (!l.finished()) {
        result.push(l.nextToken());
    }
    return result;
}
exports.lex = lex;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = __webpack_require__(0);
var Type = (function () {
    function Type() {
    }
    // Constructs types with type variables instantiated as much as possible
    Type.prototype.instantiate = function (state) {
        return this.simplify().instantiate(state);
    };
    // Return all (free) type variables
    Type.prototype.getTypeVariables = function (free) {
        return this.simplify().getTypeVariables(free);
    };
    // Checks if two types are unifyable; returns all required type variable bindings
    Type.prototype.matches = function (state, type) {
        return this.simplify().matches(state, type);
    };
    Type.prototype.simplify = function () {
        return this;
    };
    Type.prototype.admitsEquality = function (state) {
        return false;
    };
    return Type;
}());
exports.Type = Type;
var TypeVariable = (function (_super) {
    __extends(TypeVariable, _super);
    function TypeVariable(name, isFree, position, domain) {
        if (isFree === void 0) { isFree = true; }
        if (position === void 0) { position = 0; }
        if (domain === void 0) { domain = []; }
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.isFree = isFree;
        _this.position = position;
        _this.domain = domain;
        return _this;
    }
    TypeVariable.prototype.kill = function () {
        if (this.domain.length === 0) {
            // Real type vars won't die so easily
            return this;
        }
        return this.domain[0];
    };
    TypeVariable.prototype.prettyPrint = function () {
        return this.name;
    };
    TypeVariable.prototype.instantiate = function (state) {
        var res = state.getStaticValue(this.name);
        if (!this.isFree || res === undefined || res.equals(this)) {
            return this;
        }
        if (this.domain.length === 0) {
            return res;
        }
        if (res instanceof TypeVariable && res.domain.length !== 0) {
            var resty = [];
            for (var i = 0; i < this.domain.length; ++i) {
                for (var j = 0; j < res.domain.length; ++j) {
                    if (this.domain[i].equals(res.domain[j])) {
                        resty.push(this.domain[i]);
                    }
                }
            }
            if (resty.length > 0) {
                return new TypeVariable(res.name, res.isFree, res.position, resty);
            }
        }
        else {
            for (var i = 0; i < this.domain.length; ++i) {
                if (this.domain[i].equals(res)) {
                    return res;
                }
            }
        }
        throw new errors_1.ElaborationError(this.position, 'Cannot instanciate "'
            + this.prettyPrint() + '" with "' + res.prettyPrint() + '".');
    };
    TypeVariable.prototype.getTypeVariables = function (free) {
        var res = new Set();
        if (free === this.isFree) {
            res.add(this);
        }
        return res;
    };
    TypeVariable.prototype.matches = function (state, type) {
        // TODO
        throw new Error('ニャ－');
    };
    TypeVariable.prototype.admitsEquality = function (state) {
        for (var i = 0; i < this.domain.length; ++i) {
            if (!this.domain[i].admitsEquality(state)) {
                return false;
            }
        }
        if (this.domain.length === 0) {
            return this.name[1] === '\'';
        }
        else {
            return true;
        }
    };
    TypeVariable.prototype.equals = function (other) {
        if (!(other instanceof TypeVariable && this.name === other.name)) {
            return false;
        }
        if (this.domain.length !== other.domain.length) {
            return false;
        }
        for (var i = 0; i < this.domain.length; ++i) {
            if (!this.domain[i].equals(other.domain[i])) {
                return false;
            }
        }
        return true;
    };
    return TypeVariable;
}(Type));
exports.TypeVariable = TypeVariable;
var RecordType = (function (_super) {
    __extends(RecordType, _super);
    function RecordType(elements, complete, position) {
        if (complete === void 0) { complete = true; }
        if (position === void 0) { position = 0; }
        var _this = _super.call(this) || this;
        _this.elements = elements;
        _this.complete = complete;
        _this.position = position;
        return _this;
    }
    RecordType.prototype.instantiate = function (state) {
        var newElements = new Map();
        this.elements.forEach(function (type, key) {
            newElements.set(key, type.instantiate(state));
        });
        return new RecordType(newElements, this.complete);
    };
    RecordType.prototype.getTypeVariables = function (free) {
        var res = new Set();
        this.elements.forEach(function (val) {
            val.getTypeVariables(free).forEach(function (id) {
                res.add(id);
            });
        });
        return res;
    };
    RecordType.prototype.matches = function (state, type) {
        // TODO
        throw new Error('ニャ－');
    };
    RecordType.prototype.admitsEquality = function (state) {
        var res = true;
        this.elements.forEach(function (type, key) {
            if (!type.admitsEquality(state)) {
                res = false;
            }
        });
        return res;
    };
    RecordType.prototype.prettyPrint = function () {
        var isTuple = true;
        for (var i = 1; i <= this.elements.size; ++i) {
            if (!this.elements.has('' + i)) {
                isTuple = false;
            }
        }
        if (isTuple) {
            var res = '(';
            for (var i = 1; i <= this.elements.size; ++i) {
                if (i > 1) {
                    res += ' * ';
                }
                var sub = this.elements.get('' + i);
                if (sub !== undefined) {
                    res += sub.prettyPrint();
                }
                else {
                    throw new errors_1.InternalInterpreterError(-1, 'How did we loose this value? It was there before. I promise…');
                }
            }
            return res + ')';
        }
        // TODO: print as Tuple if possible
        var result = '{';
        var first = true;
        this.elements.forEach(function (type, key) {
            if (!first) {
                result += ', ';
            }
            else {
                first = false;
            }
            result += key + ' : ' + type.prettyPrint();
        });
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    };
    RecordType.prototype.simplify = function () {
        var newElements = new Map();
        this.elements.forEach(function (type, key) {
            newElements.set(key, type.simplify());
        });
        return new RecordType(newElements, this.complete);
    };
    RecordType.prototype.equals = function (other) {
        if (!(other instanceof RecordType) || this.complete !== other.complete) {
            return false;
        }
        else {
            if (other === this) {
                return true;
            }
            for (var name_1 in this.elements) {
                if (!this.elements.hasOwnProperty(name_1)) {
                    if (!this.elements.get(name_1).equals(other.elements.get(name_1))) {
                        return false;
                    }
                }
            }
            for (var name_2 in other.elements) {
                if (!other.elements.hasOwnProperty(name_2)) {
                    if (!other.elements.get(name_2).equals(this.elements.get(name_2))) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
    return RecordType;
}(Type));
exports.RecordType = RecordType;
var FunctionType = (function (_super) {
    __extends(FunctionType, _super);
    function FunctionType(parameterType, returnType, position) {
        if (position === void 0) { position = 0; }
        var _this = _super.call(this) || this;
        _this.parameterType = parameterType;
        _this.returnType = returnType;
        _this.position = position;
        return _this;
    }
    FunctionType.prototype.instantiate = function (state) {
        return new FunctionType(this.parameterType.instantiate(state), this.returnType.instantiate(state), this.position);
    };
    FunctionType.prototype.getTypeVariables = function (free) {
        var res = new Set();
        this.parameterType.getTypeVariables(free).forEach(function (value) {
            res.add(value);
        });
        this.returnType.getTypeVariables(free).forEach(function (value) {
            res.add(value);
        });
        return res;
    };
    FunctionType.prototype.matches = function (state, type) {
        // TODO
        throw new Error('ニャ－');
    };
    FunctionType.prototype.admitsEquality = function (state) {
        return this.parameterType.admitsEquality(state) && this.returnType.admitsEquality(state);
    };
    FunctionType.prototype.prettyPrint = function () {
        return '(' + this.parameterType.prettyPrint()
            + ' -> ' + this.returnType.prettyPrint() + ')';
    };
    FunctionType.prototype.simplify = function () {
        return new FunctionType(this.parameterType.simplify(), this.returnType.simplify(), this.position);
    };
    FunctionType.prototype.equals = function (other) {
        return other instanceof FunctionType && this.parameterType.equals(other.parameterType)
            && this.returnType.equals(other.returnType);
    };
    return FunctionType;
}(Type));
exports.FunctionType = FunctionType;
// A custom defined type similar to "list" or "option".
// May have a type argument.
var CustomType = (function (_super) {
    __extends(CustomType, _super);
    function CustomType(name, typeArguments, position) {
        if (typeArguments === void 0) { typeArguments = []; }
        if (position === void 0) { position = 0; }
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.typeArguments = typeArguments;
        _this.position = position;
        return _this;
    }
    CustomType.prototype.instantiate = function (state) {
        var res = [];
        for (var i = 0; i < this.typeArguments.length; ++i) {
            res.push(this.typeArguments[i].instantiate(state));
        }
        return new CustomType(this.name, res, this.position);
    };
    CustomType.prototype.getTypeVariables = function (free) {
        var res = new Set();
        if (this.typeArguments.length > 0) {
            for (var i = 0; i < this.typeArguments.length; ++i) {
                this.typeArguments[i].getTypeVariables(free).forEach(function (val) {
                    res.add(val);
                });
            }
        }
        return res;
    };
    CustomType.prototype.matches = function (state, type) {
        // TODO
        throw new Error('ニャ－');
    };
    CustomType.prototype.admitsEquality = function (state) {
        for (var i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].admitsEquality(state)) {
                return false;
            }
        }
        return true;
    };
    CustomType.prototype.prettyPrint = function () {
        var result = '';
        if (this.typeArguments.length > 1) {
            result += '(';
        }
        for (var i = 0; i < this.typeArguments.length; ++i) {
            if (i > 0) {
                result += ', ';
            }
            result += this.typeArguments[i].prettyPrint();
        }
        if (this.typeArguments.length > 1) {
            result += ')';
        }
        if (this.typeArguments.length > 0) {
            result += ' ';
        }
        result += this.name;
        return result;
    };
    CustomType.prototype.simplify = function () {
        var args = [];
        for (var i = 0; i < this.typeArguments.length; ++i) {
            args.push(this.typeArguments[i].simplify());
        }
        return new CustomType(this.name, args);
    };
    CustomType.prototype.equals = function (other) {
        if (!(other instanceof CustomType) || this.name !== other.name) {
            return false;
        }
        for (var i = 0; i < this.typeArguments.length; ++i) {
            if (!this.typeArguments[i].equals(other.typeArguments[i])) {
                return false;
            }
        }
        return true;
    };
    return CustomType;
}(Type));
exports.CustomType = CustomType;
// Derived Types
var TupleType = (function (_super) {
    __extends(TupleType, _super);
    function TupleType(elements, position) {
        if (position === void 0) { position = 0; }
        var _this = _super.call(this) || this;
        _this.elements = elements;
        _this.position = position;
        return _this;
    }
    TupleType.prototype.prettyPrint = function () {
        var result = '(';
        for (var i = 0; i < this.elements.length; ++i) {
            if (i > 0) {
                result += ' * ';
            }
            result += this.elements[i].prettyPrint();
        }
        return result + ')';
    };
    TupleType.prototype.simplify = function () {
        var entries = new Map();
        for (var i = 0; i < this.elements.length; ++i) {
            entries.set(String(i + 1), this.elements[i].simplify());
        }
        return new RecordType(entries, true);
    };
    TupleType.prototype.equals = function (other) {
        return this.simplify().equals(other);
    };
    return TupleType;
}(Type));
exports.TupleType = TupleType;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Contains classes to represent SML values, e.g. int, string, functions, …
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = __webpack_require__(0);
var lexer_1 = __webpack_require__(1);
var Value = (function () {
    function Value() {
    }
    Value.prototype.equals = function (other) {
        throw new errors_1.InternalInterpreterError(-1, 'Tried comparing incomparable things.');
    };
    Value.prototype.isSimpleValue = function () { return true; };
    Value.prototype.isConstructedValue = function () { return false; };
    return Value;
}());
exports.Value = Value;
var BoolValue = (function (_super) {
    __extends(BoolValue, _super);
    function BoolValue(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    BoolValue.prototype.equals = function (other) {
        return this.value === other.value;
    };
    BoolValue.prototype.prettyPrint = function (state) {
        if (this.value) {
            return 'true';
        }
        else {
            return 'false';
        }
    };
    BoolValue.prototype.isConstructedValue = function () { return true; };
    return BoolValue;
}(Value));
exports.BoolValue = BoolValue;
var CharValue = (function (_super) {
    __extends(CharValue, _super);
    function CharValue(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    CharValue.prototype.prettyPrint = function (state) {
        return '#' + new StringValue(this.value).prettyPrint(state);
    };
    CharValue.prototype.compareTo = function (other) {
        if (this.value < other.value) {
            return -1;
        }
        else if (this.value > other.value) {
            return 1;
        }
        else {
            return 0;
        }
    };
    CharValue.prototype.equals = function (other) {
        return this.value === other.value;
    };
    return CharValue;
}(Value));
exports.CharValue = CharValue;
var StringValue = (function (_super) {
    __extends(StringValue, _super);
    function StringValue(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    // at the beginning because of linter…
    StringValue.implode = function (list) {
        var str = '';
        while (list.constructorName !== 'nil') {
            if (list.constructorName !== '::') {
                throw new errors_1.InternalInterpreterError(-1, 'Is this a char list? I can\'t implode "' + list.constructorName + '".');
            }
            var arg = list.argument;
            if (arg instanceof RecordValue) {
                var a1 = arg.getValue('1');
                var a2 = arg.getValue('2');
                if (a1 instanceof CharValue && a2 instanceof ConstructedValue) {
                    str += a1.value;
                    list = a2;
                }
                else {
                    throw new errors_1.InternalInterpreterError(-1, 'Is this a char list? I can\'t implode "' + list.constructorName + '".');
                }
            }
            else {
                throw new errors_1.InternalInterpreterError(-1, 'Is this a char list? I can\'t implode "' + list.constructorName + '".');
            }
        }
        return new StringValue(str);
    };
    StringValue.prototype.prettyPrint = function (state) {
        var pretty = '';
        for (var _i = 0, _a = this.value; _i < _a.length; _i++) {
            var chr = _a[_i];
            switch (chr) {
                case '\n':
                    pretty += '\\n';
                    break;
                case '\t':
                    pretty += '\\t';
                    break;
                case '\r':
                    pretty += '\\r';
                    break;
                case '\x07':
                    pretty += '\\a';
                    break;
                case '\b':
                    pretty += '\\b';
                    break;
                case '\v':
                    pretty += '\\v';
                    break;
                case '\f':
                    pretty += '\\f';
                    break;
                case '\x7F':
                    pretty += '\\127';
                    break;
                case '\xFF':
                    pretty += '\\255';
                    break;
                default:
                    if (chr.charCodeAt(0) < 32) {
                        pretty += '\\^' + String.fromCharCode(chr.charCodeAt(0) + 64);
                    }
                    else {
                        pretty += chr;
                    }
                    break;
            }
        }
        return '"' + pretty + '"';
    };
    StringValue.prototype.equals = function (other) {
        return this.value === other.value;
    };
    StringValue.prototype.compareTo = function (other) {
        if (this.value < other.value) {
            return -1;
        }
        else if (this.value > other.value) {
            return 1;
        }
        else {
            return 0;
        }
    };
    StringValue.prototype.concat = function (other) {
        return new StringValue(this.value + other.value);
    };
    StringValue.prototype.explode = function () {
        var ret = new ConstructedValue('nil');
        for (var i = this.value.length - 1; i >= 0; --i) {
            ret = new ConstructedValue('::', new RecordValue(new Map([
                ['1', new CharValue(this.value[i])],
                ['2', ret]
            ])));
        }
        return ret;
    };
    return StringValue;
}(Value));
exports.StringValue = StringValue;
var Word = (function (_super) {
    __extends(Word, _super);
    function Word(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Word.prototype.prettyPrint = function (state) {
        return '' + this.value;
    };
    Word.prototype.compareTo = function (val) {
        if (val instanceof Word) {
            var other = val.value;
            if (this.value < other) {
                return -1;
            }
            else if (this.value > other) {
                return 1;
            }
            else {
                return 0;
            }
        }
        return 2;
    };
    Word.prototype.negate = function () { return new Word(-this.value); };
    Word.prototype.equals = function (value) { return this.compareTo(value) === 0; };
    Word.prototype.add = function (other) { return new Word(this.value + other.value); };
    Word.prototype.multiply = function (other) { return new Word(this.value * other.value); };
    Word.prototype.divide = function (other) { return new Word(Math.floor(this.value / other.value)); };
    Word.prototype.modulo = function (other) { return new Word(this.value % other.value); };
    Word.prototype.toReal = function () { return new Real(this.value); };
    Word.prototype.hasOverflow = function () { return this.value > 1073741823 || this.value < -1073741824; };
    return Word;
}(Value));
exports.Word = Word;
var Integer = (function (_super) {
    __extends(Integer, _super);
    function Integer(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Integer.prototype.prettyPrint = function (state) {
        return '' + this.value;
    };
    Integer.prototype.compareTo = function (val) {
        if (val instanceof Integer) {
            var other = val.value;
            if (this.value < other) {
                return -1;
            }
            else if (this.value > other) {
                return 1;
            }
            else {
                return 0;
            }
        }
        return false;
    };
    Integer.prototype.equals = function (value) {
        return this.compareTo(value) === 0;
    };
    Integer.prototype.negate = function () { return new Integer(-this.value); };
    Integer.prototype.add = function (other) { return new Integer(this.value + other.value); };
    Integer.prototype.multiply = function (other) { return new Integer(this.value * other.value); };
    Integer.prototype.divide = function (other) { return new Integer(Math.floor(this.value / other.value)); };
    Integer.prototype.modulo = function (other) { return new Integer(this.value % other.value); };
    Integer.prototype.toReal = function () { return new Real(this.value); };
    Integer.prototype.hasOverflow = function () { return this.value > 1073741823 || this.value < -1073741824; };
    return Integer;
}(Value));
exports.Integer = Integer;
var Real = (function (_super) {
    __extends(Real, _super);
    function Real(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Real.prototype.prettyPrint = function (state) {
        var str = '' + this.value;
        if (str.search(/\./) === -1) {
            str += '.0';
        }
        return str;
    };
    Real.prototype.compareTo = function (val) {
        if (val instanceof Real) {
            var other = val.value;
            if (this.value < other) {
                return -1;
            }
            else if (this.value > other) {
                return 1;
            }
            else {
                return 0;
            }
        }
        return false;
    };
    Real.prototype.equals = function (value) {
        return this.compareTo(value) === 0;
    };
    Real.prototype.negate = function () {
        return new Real(-this.value);
    };
    Real.prototype.add = function (other) {
        return new Real(this.value + other.value);
    };
    Real.prototype.multiply = function (other) {
        return new Real(this.value * other.value);
    };
    Real.prototype.divide = function (other) {
        return new Real(this.value / other.value);
    };
    Real.prototype.toInteger = function () {
        return new Integer(Math.floor(this.value));
    };
    Real.prototype.hasOverflow = function () {
        // TODO how do we implement Overflow for reals?
        return false;
    };
    return Real;
}(Value));
exports.Real = Real;
var RecordValue = (function (_super) {
    __extends(RecordValue, _super);
    function RecordValue(entries) {
        if (entries === void 0) { entries = new Map(); }
        var _this = _super.call(this) || this;
        _this.entries = entries;
        return _this;
    }
    RecordValue.prototype.prettyPrint = function (state) {
        var isTuple = true;
        for (var i = 1; i <= this.entries.size; ++i) {
            if (!this.entries.has('' + i)) {
                isTuple = false;
            }
        }
        if (isTuple) {
            var res = '(';
            for (var i = 1; i <= this.entries.size; ++i) {
                if (i > 1) {
                    res += ', ';
                }
                var sub = this.entries.get('' + i);
                if (sub !== undefined) {
                    res += sub.prettyPrint(state);
                }
                else {
                    throw new errors_1.InternalInterpreterError(-1, 'How did we loose this value? It was there before. I promise…');
                }
            }
            return res + ')';
        }
        var result = '{ ';
        var first = true;
        this.entries.forEach(function (value, key) {
            if (!first) {
                result += ', ';
            }
            else {
                first = false;
            }
            result += key + ' = ' + value.prettyPrint(state);
        });
        return result + ' }';
    };
    RecordValue.prototype.getValue = function (name) {
        if (!this.entries.has(name)) {
            throw new errors_1.EvaluationError(0, 'Tried accessing non-existing record part.');
        }
        return this.entries.get(name);
    };
    RecordValue.prototype.hasValue = function (name) {
        return this.entries.has(name);
    };
    RecordValue.prototype.equals = function (other) {
        var _this = this;
        if (!(other instanceof RecordValue)) {
            return false;
        }
        var fail = false;
        this.entries.forEach(function (j, i) {
            if (!other.entries.has(i)) {
                fail = true;
            }
            if (!j.equals(other.entries.get(i))) {
                fail = true;
            }
        });
        if (fail) {
            return false;
        }
        other.entries.forEach(function (j, i) {
            if (!_this.entries.has(i)) {
                fail = true;
            }
            if (!j.equals(other.entries.get(i))) {
                fail = true;
            }
        });
        if (fail) {
            return false;
        }
        return true;
    };
    return RecordValue;
}(Value));
exports.RecordValue = RecordValue;
var FunctionValue = (function (_super) {
    __extends(FunctionValue, _super);
    function FunctionValue(state, recursives, body) {
        var _this = _super.call(this) || this;
        _this.state = state;
        _this.recursives = recursives;
        _this.body = body;
        return _this;
    }
    FunctionValue.prototype.prettyPrint = function (state) {
        return 'fn';
    };
    // Computes the function on the given argument,
    // returns [result, is thrown]
    FunctionValue.prototype.compute = function (argument) {
        // adjoin the bindings in this.state into the state
        var nstate = this.state.getNestedState(false, this.state.id);
        for (var i = 0; i < this.recursives.length; ++i) {
            if (this.recursives[i][1] instanceof FunctionValue) {
                nstate.setDynamicValue(this.recursives[i][0], new FunctionValue(this.state, this.recursives, this.recursives[i][1].body), true);
            }
            else {
                nstate.setDynamicValue(this.recursives[i][0], this.recursives[i][1], true);
            }
        }
        return this.body.compute(nstate, argument);
    };
    FunctionValue.prototype.equals = function (other) {
        throw new errors_1.InternalInterpreterError(-1, 'You simply cannot compare "' + this.prettyPrint(undefined)
            + '" and "' + other.prettyPrint(undefined) + '".');
    };
    return FunctionValue;
}(Value));
exports.FunctionValue = FunctionValue;
// Values that were constructed from type constructors
var ConstructedValue = (function (_super) {
    __extends(ConstructedValue, _super);
    function ConstructedValue(constructorName, argument, id) {
        if (argument === void 0) { argument = undefined; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.constructorName = constructorName;
        _this.argument = argument;
        _this.id = id;
        return _this;
    }
    ConstructedValue.prototype.prettyPrint = function (state) {
        if (this.constructorName === '::') {
            var res = '[';
            var list = this;
            while (list.constructorName !== 'nil') {
                if (list.constructorName !== '::') {
                    throw new errors_1.InternalInterpreterError(-1, 'Is this even a list? 1 "' + list.constructorName + '".');
                }
                var arg = list.argument;
                if (arg instanceof RecordValue && arg.entries.size === 2) {
                    var a1 = arg.getValue('1');
                    var a2 = arg.getValue('2');
                    if (a1 instanceof Value && a2 instanceof ConstructedValue) {
                        if (list !== this) {
                            res += ', ';
                        }
                        res += a1.prettyPrint(state);
                        list = a2;
                    }
                    else {
                        throw new errors_1.InternalInterpreterError(-1, 'Is this even a list? 2 "' + list.constructorName + '".');
                    }
                }
                else {
                    throw new errors_1.InternalInterpreterError(-1, 'Is this even a list? 3 "' + list.constructorName + '".');
                }
            }
            return res + ']';
        }
        else if (this.constructorName === 'nil') {
            return '[]';
        }
        if (state !== undefined) {
            var infix = state.getInfixStatus(new lexer_1.IdentifierToken(this.constructorName, -1));
            if (infix !== undefined
                && infix.infix
                && this.argument instanceof RecordValue && this.argument.entries.size === 2) {
                var left = this.argument.getValue('1');
                var right = this.argument.getValue('1');
                if (left instanceof Value && right instanceof Value) {
                    var res = '(' + left.prettyPrint(state);
                    res += ' ' + this.constructorName;
                    if (this.id > 0) {
                        res += '/' + this.id;
                    }
                    res += ' ' + right.prettyPrint(state);
                    return res + ')';
                }
            }
        }
        var result = this.constructorName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        if (this.argument) {
            result += ' ' + this.argument.prettyPrint(state);
        }
        return result;
    };
    ConstructedValue.prototype.equals = function (other) {
        if (other instanceof ValueConstructor) {
            other = other.construct();
        }
        if (!(other instanceof ConstructedValue)) {
            return false;
        }
        if (this.constructorName !== other.constructorName
            || this.id !== other.id) {
            return false;
        }
        if (this.argument !== undefined) {
            if (other.argument === undefined) {
                return true;
            }
            else {
                return this.argument.equals(other.argument);
            }
        }
        else {
            return other.argument === undefined;
        }
    };
    ConstructedValue.prototype.isConstructedValue = function () { return true; };
    return ConstructedValue;
}(Value));
exports.ConstructedValue = ConstructedValue;
var ExceptionValue = (function (_super) {
    __extends(ExceptionValue, _super);
    function ExceptionValue(constructorName, argument, id) {
        if (argument === void 0) { argument = undefined; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.constructorName = constructorName;
        _this.argument = argument;
        _this.id = id;
        return _this;
    }
    ExceptionValue.prototype.prettyPrint = function (state) {
        var result = this.constructorName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        if (this.argument) {
            result += ' ' + this.argument.prettyPrint(state);
        }
        return result;
    };
    ExceptionValue.prototype.equals = function (other) {
        if (other instanceof ExceptionConstructor) {
            other = other.construct();
        }
        if (!(other instanceof ExceptionValue)) {
            return false;
        }
        if (this.constructorName !== other.constructorName
            || this.id !== other.id) {
            return false;
        }
        if (this.argument !== undefined) {
            if (other.argument === undefined) {
                return true;
            }
            else {
                return this.argument.equals(other.argument);
            }
        }
        else {
            return other.argument === undefined;
        }
    };
    ExceptionValue.prototype.isConstructedValue = function () { return true; };
    return ExceptionValue;
}(Value));
exports.ExceptionValue = ExceptionValue;
var PredefinedFunction = (function (_super) {
    __extends(PredefinedFunction, _super);
    function PredefinedFunction(name, apply) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.apply = apply;
        return _this;
    }
    PredefinedFunction.prototype.prettyPrint = function (state) {
        return 'fn';
    };
    PredefinedFunction.prototype.equals = function (other) {
        if (!(other instanceof PredefinedFunction)) {
            return false;
        }
        return this.name === other.name;
    };
    PredefinedFunction.prototype.isSimpleValue = function () {
        return false;
    };
    return PredefinedFunction;
}(Value));
exports.PredefinedFunction = PredefinedFunction;
var ValueConstructor = (function (_super) {
    __extends(ValueConstructor, _super);
    function ValueConstructor(constructorName, numArgs, id) {
        if (numArgs === void 0) { numArgs = 0; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.constructorName = constructorName;
        _this.numArgs = numArgs;
        _this.id = id;
        return _this;
    }
    ValueConstructor.prototype.equals = function (other) {
        if (!(other instanceof ValueConstructor)) {
            return false;
        }
        return this.constructorName === other.constructorName
            && this.id === other.id;
    };
    ValueConstructor.prototype.construct = function (parameter) {
        if (parameter === void 0) { parameter = undefined; }
        return new ConstructedValue(this.constructorName, parameter, this.id);
    };
    ValueConstructor.prototype.prettyPrint = function (state) {
        var result = this.constructorName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        return result;
    };
    ValueConstructor.prototype.isSimpleValue = function () {
        return false;
    };
    return ValueConstructor;
}(Value));
exports.ValueConstructor = ValueConstructor;
var ExceptionConstructor = (function (_super) {
    __extends(ExceptionConstructor, _super);
    function ExceptionConstructor(exceptionName, numArgs, id) {
        if (numArgs === void 0) { numArgs = 0; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.exceptionName = exceptionName;
        _this.numArgs = numArgs;
        _this.id = id;
        return _this;
    }
    ExceptionConstructor.prototype.equals = function (other) {
        if (!(other instanceof ExceptionConstructor)) {
            return false;
        }
        return this.exceptionName === other.exceptionName
            && this.id === other.id;
    };
    ExceptionConstructor.prototype.construct = function (parameter) {
        if (parameter === void 0) { parameter = undefined; }
        return new ExceptionValue(this.exceptionName, parameter, this.id);
    };
    ExceptionConstructor.prototype.prettyPrint = function (state) {
        var result = this.exceptionName;
        if (this.id > 0) {
            result += '/' + this.id;
        }
        return result;
    };
    ExceptionConstructor.prototype.isSimpleValue = function () {
        return false;
    };
    return ExceptionConstructor;
}(Value));
exports.ExceptionConstructor = ExceptionConstructor;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(2);
var values_1 = __webpack_require__(3);
var lexer_1 = __webpack_require__(1);
var errors_1 = __webpack_require__(0);
var TypeInformation = (function () {
    // Every constructor also appears in the value environment,
    // thus it suffices to record their names here.
    function TypeInformation(type, constructors) {
        this.type = type;
        this.constructors = constructors;
    }
    return TypeInformation;
}());
exports.TypeInformation = TypeInformation;
var TypeNameInformation = (function () {
    function TypeNameInformation(arity, allowsEquality) {
        this.arity = arity;
        this.allowsEquality = allowsEquality;
    }
    return TypeNameInformation;
}());
exports.TypeNameInformation = TypeNameInformation;
var InfixStatus = (function () {
    function InfixStatus(infix, precedence, rightAssociative) {
        if (precedence === void 0) { precedence = 0; }
        if (rightAssociative === void 0) { rightAssociative = false; }
        this.infix = infix;
        this.precedence = precedence;
        this.rightAssociative = rightAssociative;
    }
    return InfixStatus;
}());
exports.InfixStatus = InfixStatus;
// Maps id to whether that id can be rebound
var RebindStatus;
(function (RebindStatus) {
    RebindStatus[RebindStatus["Never"] = 0] = "Never";
    RebindStatus[RebindStatus["Half"] = 1] = "Half";
    RebindStatus[RebindStatus["Allowed"] = 2] = "Allowed";
})(RebindStatus = exports.RebindStatus || (exports.RebindStatus = {}));
var DynamicBasis = (function () {
    function DynamicBasis(typeEnvironment, valueEnvironment) {
        this.typeEnvironment = typeEnvironment;
        this.valueEnvironment = valueEnvironment;
    }
    DynamicBasis.prototype.getValue = function (name) {
        return this.valueEnvironment[name];
    };
    DynamicBasis.prototype.getType = function (name) {
        return this.typeEnvironment[name];
    };
    DynamicBasis.prototype.setValue = function (name, value, intermediate) {
        this.valueEnvironment[name] = [value, intermediate];
    };
    DynamicBasis.prototype.setType = function (name, type, intermediate) {
        if (intermediate === void 0) { intermediate = false; }
        this.typeEnvironment[name] = [type, intermediate];
    };
    return DynamicBasis;
}());
exports.DynamicBasis = DynamicBasis;
var StaticBasis = (function () {
    function StaticBasis(typeEnvironment, valueEnvironment) {
        this.typeEnvironment = typeEnvironment;
        this.valueEnvironment = valueEnvironment;
    }
    StaticBasis.prototype.getValue = function (name) {
        return this.valueEnvironment[name];
    };
    StaticBasis.prototype.getType = function (name) {
        return this.typeEnvironment[name];
    };
    StaticBasis.prototype.setValue = function (name, value, intermediate) {
        this.valueEnvironment[name] = [value, intermediate];
    };
    StaticBasis.prototype.setType = function (name, type, constructors, intermediate) {
        if (intermediate === void 0) { intermediate = false; }
        this.typeEnvironment[name] = [new TypeInformation(type, constructors),
            intermediate];
    };
    return StaticBasis;
}());
exports.StaticBasis = StaticBasis;
var State = (function () {
    // The states' ids are non-decreasing; a single declaration uses the same ids
    function State(id, parent, staticBasis, dynamicBasis, typeNames, infixEnvironment, rebindEnvironment, valueIdentifierId, declaredIdentifiers, stdfiles) {
        if (valueIdentifierId === void 0) { valueIdentifierId = {}; }
        if (declaredIdentifiers === void 0) { declaredIdentifiers = new Set(); }
        if (stdfiles === void 0) { stdfiles = {
            '__stdout': [new values_1.StringValue(''), true],
            '__stdin': [new values_1.StringValue(''), true],
            '__stderr': [new values_1.StringValue(''), true]
        }; }
        this.id = id;
        this.parent = parent;
        this.staticBasis = staticBasis;
        this.dynamicBasis = dynamicBasis;
        this.typeNames = typeNames;
        this.infixEnvironment = infixEnvironment;
        this.rebindEnvironment = rebindEnvironment;
        this.valueIdentifierId = valueIdentifierId;
        this.declaredIdentifiers = declaredIdentifiers;
        this.stdfiles = stdfiles;
    }
    State.prototype.getDefinedIdentifiers = function (idLimit) {
        if (idLimit === void 0) { idLimit = 0; }
        var rec = new Set();
        if (this.parent !== undefined && this.parent.id >= idLimit) {
            rec = this.parent.getDefinedIdentifiers();
        }
        this.declaredIdentifiers.forEach(function (val) {
            rec.add(val);
        });
        return rec;
    };
    State.prototype.getNestedState = function (redefinePrint, newId) {
        if (redefinePrint === void 0) { redefinePrint = false; }
        if (newId === void 0) { newId = undefined; }
        if (newId === undefined) {
            newId = this.id + 1;
        }
        var res = new State(newId, this, new StaticBasis({}, {}), new DynamicBasis({}, {}), {}, {}, {});
        if (redefinePrint) {
            res.setDynamicValue('print', new values_1.PredefinedFunction('print', function (val) {
                if (val instanceof values_1.StringValue) {
                    res.setDynamicValue('__stdout', val);
                }
                else {
                    res.setDynamicValue('__stdout', new values_1.StringValue(val.prettyPrint(res)));
                }
                return [new values_1.RecordValue(), false];
            }), true);
            res.setStaticValue('print', new types_1.FunctionType(new types_1.TypeVariable('\'a'), new types_1.RecordType(new Map())), true);
        }
        return res;
    };
    State.prototype.getRebindStatus = function (name) {
        if (this.rebindEnvironment[name] !== undefined) {
            return this.rebindEnvironment[name];
        }
        else if (this.parent === undefined) {
            return RebindStatus.Allowed;
        }
        else if (this.rebindEnvironment[name] === undefined) {
            return this.parent.getRebindStatus(name);
        }
        return RebindStatus.Half;
    };
    // Gets an identifier's type. The value  intermediate  determines whether to return intermediate results
    State.prototype.getStaticValue = function (name, intermediate, idLimit) {
        if (intermediate === void 0) { intermediate = undefined; }
        if (idLimit === void 0) { idLimit = 0; }
        if (this.stdfiles[name] !== undefined) {
            return new types_1.CustomType('string');
        }
        var result = this.staticBasis.getValue(name);
        if ((result !== undefined && (intermediate === undefined || intermediate === result[1]))
            || !this.parent || this.parent.id < idLimit) {
            if (result === undefined) {
                return undefined;
            }
            return result[0];
        }
        else {
            return this.parent.getStaticValue(name, intermediate, idLimit);
        }
    };
    State.prototype.getStaticType = function (name, intermediate, idLimit) {
        if (intermediate === void 0) { intermediate = undefined; }
        if (idLimit === void 0) { idLimit = 0; }
        var result = this.staticBasis.getType(name);
        if ((result !== undefined && (intermediate === undefined || intermediate === result[1]))
            || !this.parent || this.parent.id < idLimit) {
            if (result === undefined) {
                return undefined;
            }
            return result[0];
        }
        else {
            return this.parent.getStaticType(name, intermediate, idLimit);
        }
    };
    State.prototype.getDynamicValue = function (name, intermediate, idLimit) {
        if (intermediate === void 0) { intermediate = undefined; }
        if (idLimit === void 0) { idLimit = 0; }
        if (this.stdfiles[name] !== undefined
            && this.stdfiles[name][0].value !== '') {
            return this.stdfiles[name][0];
        }
        var result = this.dynamicBasis.getValue(name);
        if ((result !== undefined && (intermediate === undefined || intermediate === result[1]))
            || !this.parent || this.parent.id < idLimit) {
            if (result === undefined) {
                return undefined;
            }
            return result[0];
        }
        else {
            return this.parent.getDynamicValue(name, intermediate, idLimit);
        }
    };
    State.prototype.getDynamicType = function (name, intermediate, idLimit) {
        if (intermediate === void 0) { intermediate = undefined; }
        if (idLimit === void 0) { idLimit = 0; }
        var result = this.dynamicBasis.getType(name);
        if ((result !== undefined && (intermediate === undefined || intermediate === result[2]))
            || !this.parent || this.parent.id < idLimit) {
            if (result === undefined) {
                return undefined;
            }
            return result[0];
        }
        else {
            return this.parent.getDynamicType(name, intermediate, idLimit);
        }
    };
    State.prototype.getInfixStatus = function (id, idLimit) {
        if (idLimit === void 0) { idLimit = 0; }
        if (id.isVid() || id instanceof lexer_1.LongIdentifierToken) {
            if (this.infixEnvironment.hasOwnProperty(id.getText()) || !this.parent
                || this.parent.id < idLimit) {
                return this.infixEnvironment[id.getText()];
            }
            else {
                return this.parent.getInfixStatus(id, idLimit);
            }
        }
        else {
            throw new errors_1.InternalInterpreterError(id.position, 'You gave me some "' + id.getText() + '" (' + id.constructor.name
                + ') but I only want (Long)IdentifierToken.');
        }
    };
    State.prototype.getCustomType = function (name, idLimit) {
        if (idLimit === void 0) { idLimit = 0; }
        if (this.typeNames.hasOwnProperty(name) || !this.parent || this.parent.id < idLimit) {
            return this.typeNames[name];
        }
        else {
            return this.parent.getCustomType(name, idLimit);
        }
    };
    State.prototype.getValueIdentifierId = function (name, idLimit) {
        if (idLimit === void 0) { idLimit = 0; }
        if (this.valueIdentifierId.hasOwnProperty(name)) {
            return this.valueIdentifierId[name];
        }
        else if (!this.parent || this.parent.id < idLimit) {
            return 0;
        }
        else {
            return this.parent.getValueIdentifierId(name, idLimit);
        }
    };
    State.prototype.incrementValueIdentifierId = function (name, idLimit) {
        if (idLimit === void 0) { idLimit = 0; }
        this.valueIdentifierId[name] = this.getValueIdentifierId(name, idLimit) + 1;
    };
    State.prototype.setStaticValue = function (name, type, intermediate, atId) {
        if (intermediate === void 0) { intermediate = false; }
        if (atId === void 0) { atId = undefined; }
        if (this.stdfiles[name] !== undefined) {
            return;
        }
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setValue(name, type, intermediate);
        }
        else if (atId > this.id || this.parent === undefined) {
            throw new errors_1.InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        }
        else {
            this.parent.setStaticValue(name, type, intermediate, atId);
        }
    };
    State.prototype.setStaticType = function (name, type, constructors, intermediate, atId) {
        if (intermediate === void 0) { intermediate = false; }
        if (atId === void 0) { atId = undefined; }
        if (atId === undefined || atId === this.id) {
            this.staticBasis.setType(name, type, constructors, intermediate);
        }
        else if (atId > this.id || this.parent === undefined) {
            throw new errors_1.InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        }
        else {
            this.parent.setStaticType(name, type, constructors, intermediate, atId);
        }
    };
    State.prototype.setDynamicValue = function (name, value, intermediate, atId) {
        if (intermediate === void 0) { intermediate = false; }
        if (atId === void 0) { atId = undefined; }
        if (atId === undefined || atId === this.id) {
            if (this.stdfiles[name] !== undefined) {
                if (value instanceof values_1.StringValue) {
                    this.stdfiles[name] = [this.stdfiles[name][0].concat(value), true];
                    return;
                }
                else {
                    throw new errors_1.InternalInterpreterError(-1, 'Wrong type.');
                }
            }
            if (this.rebindEnvironment[name] === RebindStatus.Never) {
                throw new errors_1.EvaluationError(-1, 'How could you ever want to redefine "' + name + '".');
            }
            this.dynamicBasis.setValue(name, value, intermediate);
            this.declaredIdentifiers.add(name);
            if (value instanceof values_1.ValueConstructor || value instanceof values_1.ExceptionConstructor) {
                this.rebindEnvironment[name] = RebindStatus.Half;
            }
            else {
                this.rebindEnvironment[name] = RebindStatus.Allowed;
            }
        }
        else if (atId > this.id || this.parent === undefined) {
            throw new errors_1.InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        }
        else {
            this.parent.setDynamicValue(name, value, intermediate, atId);
        }
    };
    State.prototype.setDynamicType = function (name, constructors, intermediate, atId) {
        if (intermediate === void 0) { intermediate = false; }
        if (atId === void 0) { atId = undefined; }
        if (atId === undefined || atId === this.id) {
            this.dynamicBasis.setType(name, constructors, intermediate);
            this.declaredIdentifiers.add(name);
        }
        else if (atId > this.id || this.parent === undefined) {
            throw new errors_1.InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        }
        else {
            this.parent.setDynamicType(name, constructors, intermediate, atId);
        }
    };
    State.prototype.setInfixStatus = function (id, precedence, rightAssociative, infix, atId) {
        if (atId === void 0) { atId = undefined; }
        if (atId === undefined || atId === this.id) {
            if (id.isVid() || id instanceof lexer_1.LongIdentifierToken) {
                this.infixEnvironment[id.getText()]
                    = new InfixStatus(infix, precedence, rightAssociative);
            }
        }
        else if (atId > this.id || this.parent === undefined) {
            throw new errors_1.InternalInterpreterError(-1, 'State with id "' + atId + '" does not exist.');
        }
        else {
            this.parent.setInfixStatus(id, precedence, rightAssociative, infix, atId);
        }
    };
    return State;
}());
exports.State = State;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var expressions_1 = __webpack_require__(7);
var types_1 = __webpack_require__(2);
var errors_1 = __webpack_require__(0);
var lexer_1 = __webpack_require__(1);
var declarations_1 = __webpack_require__(6);
var ParserError = (function (_super) {
    __extends(ParserError, _super);
    function ParserError(message, position) {
        var _this = _super.call(this, position, message) || this;
        Object.setPrototypeOf(_this, ParserError.prototype);
        return _this;
    }
    return ParserError;
}(errors_1.InterpreterError));
exports.ParserError = ParserError;
var Parser = (function () {
    function Parser(tokens, state, currentId) {
        this.tokens = tokens;
        this.state = state;
        this.currentId = currentId;
        this.position = 0; // position of the next not yet parsed token
        if (this.state === undefined) {
            throw new errors_1.InternalInterpreterError(-1, 'What are you, stupid? Hurry up and give me ' +
                'a state already!');
        }
    }
    Parser.prototype.assertKeywordToken = function (tok, text) {
        if (text === void 0) { text = undefined; }
        if (!(tok instanceof lexer_1.KeywordToken)) {
            throw new ParserError('Expected a reserved word, got "' + tok.getText()
                + '" (' + tok.constructor.name + ').', tok.position);
        }
        if (text !== undefined && tok.text !== text) {
            throw new ParserError('Expected "' + text + '" but got "' + tok.text + '".', tok.position);
        }
    };
    Parser.prototype.assertVidToken = function (tok) {
        if (!tok.isVid()) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    };
    Parser.prototype.assertIdentifierToken = function (tok) {
        if (!(tok instanceof lexer_1.IdentifierToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    };
    Parser.prototype.assertVidOrLongToken = function (tok) {
        if (!tok.isVid() && !(tok instanceof lexer_1.LongIdentifierToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    };
    Parser.prototype.assertIdentifierOrLongToken = function (tok) {
        if (!(tok instanceof lexer_1.IdentifierToken)
            && !(tok instanceof lexer_1.LongIdentifierToken)) {
            throw new ParserError('Expected an identifier, got \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    };
    Parser.prototype.assertRecordLabelToken = function (tok) {
        if (!tok.isValidRecordLabel()) {
            throw new ParserError('Expected a record label \"'
                + tok.getText() + '\" ('
                + tok.constructor.name + ').', tok.position);
        }
    };
    Parser.prototype.checkVidOrLongToken = function (tok) {
        return (tok.isVid() || (tok instanceof lexer_1.LongIdentifierToken));
    };
    Parser.prototype.checkIdentifierOrLongToken = function (tok) {
        return ((tok instanceof lexer_1.IdentifierToken)
            || (tok instanceof lexer_1.LongIdentifierToken));
    };
    Parser.prototype.checkKeywordToken = function (tok, text) {
        if (text === void 0) { text = undefined; }
        if (!(tok instanceof lexer_1.KeywordToken)) {
            return false;
        }
        if (text !== undefined && tok.text !== text) {
            return false;
        }
        return true;
    };
    Parser.prototype.parseOpIdentifierToken = function (allowLong) {
        if (allowLong === void 0) { allowLong = false; }
        var curTok = this.currentToken();
        var opPrefixed = this.checkKeywordToken(curTok, 'op');
        if (opPrefixed) {
            ++this.position;
        }
        if (allowLong) {
            this.assertIdentifierOrLongToken(this.currentToken());
        }
        else {
            this.assertIdentifierToken(this.currentToken());
        }
        var name = this.currentToken();
        name.opPrefixed = opPrefixed;
        ++this.position;
        return name;
    };
    Parser.prototype.parseAtomicExpression = function () {
        /*
         * atexp ::= scon                           Constant(position, token)
         *              ConstantToken
         *           [op] longvid                   ValueIdentifier(position, name:Token)
         *              [KeywordToken] IdentifierToken
         *           { [exprow] }
         *           #lab                           RecordSelector(pos, label:Token)
         *              KeywordToken IdentifierToken
         *           ()                             Tuple(pos, [])
         *              KeywordToken KeywordToken
         *           (exp1, …, expn)                Tuple(pos, exps: (Pattern|Exp)[])
         *              KeywordToken exp [KeywordToken exp]* KeywordToken
         *           [exp1, …, expn]                List(pos, exps: (Pattern|Exp)[])
         *              KeywordToken exp [KeywordToken exp]* KeywordToken
         *           (exp1; …; expn)                Sequence(pos, exps:Exp[])
         *              KeywordToken exp [KeywordToken exp]* KeywordToken
         *           let dec in exp1, …, expn end   LocalDeclarationExpression(pos, decl:Decl, exp)
         *              KeywordToken dec KeywordToken exp [KeywordToken exp]* KeywordToken
         *           ( exp )                        Expression
         *              KeywordToken exp KeywordToken
         */
        var curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'op')) {
            ++this.position;
            var nextCurTok = this.currentToken();
            this.assertVidOrLongToken(nextCurTok);
            nextCurTok.opPrefixed = true;
            ++this.position;
            return new expressions_1.ValueIdentifier(curTok.position, nextCurTok);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            // Record expression
            ++this.position;
            return this.parseExpressionRow();
        }
        if (this.checkKeywordToken(curTok, '(')) {
            // Tuple expression
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ')')) {
                ++this.position;
                return new expressions_1.Tuple(curTok.position, []);
            }
            var results = [this.parseExpression()];
            var isSequence = false;
            var isTuple = false;
            while (true) {
                var nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',') && !isSequence) {
                    ++this.position;
                    isTuple = true;
                }
                else if (this.checkKeywordToken(nextCurTok, ';') && !isTuple) {
                    ++this.position;
                    isSequence = true;
                }
                else if (this.checkKeywordToken(nextCurTok, ')')) {
                    ++this.position;
                    if (results.length === 1) {
                        return results[0];
                    }
                    else {
                        if (isTuple) {
                            return new expressions_1.Tuple(curTok.position, results);
                        }
                        else if (isSequence) {
                            return new expressions_1.Sequence(curTok.position, results);
                        }
                    }
                }
                else {
                    throw new ParserError('Expected ",", ";" or ")" but got \"' +
                        nextCurTok.getText() + '\".', nextCurTok.position);
                }
                results.push(this.parseExpression());
            }
        }
        if (this.checkKeywordToken(curTok, '[')) {
            // List expression
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ']')) {
                ++this.position;
                return new expressions_1.List(curTok.position, []);
            }
            var results = [this.parseExpression()];
            while (true) {
                var nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',')) {
                    ++this.position;
                }
                else if (this.checkKeywordToken(nextCurTok, ']')) {
                    ++this.position;
                    return new expressions_1.List(curTok.position, results);
                }
                else {
                    throw new ParserError('Expected "," or "]" but found "' +
                        nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parseExpression());
            }
        }
        if (this.checkKeywordToken(curTok, '#')) {
            ++this.position;
            var nextTok = this.currentToken();
            this.assertRecordLabelToken(nextTok);
            ++this.position;
            return new expressions_1.RecordSelector(curTok.position, nextTok);
        }
        if (this.checkKeywordToken(curTok, 'let')) {
            ++this.position;
            var nstate = this.state;
            this.state = this.state.getNestedState();
            var dec = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            var res = [this.parseExpression()];
            var newTok = this.currentToken();
            var tpos = newTok.position;
            while (this.checkKeywordToken(newTok, ';')) {
                ++this.position;
                res.push(this.parseExpression());
                newTok = this.currentToken();
            }
            this.assertKeywordToken(newTok, 'end');
            ++this.position;
            this.state = nstate;
            if (res.length >= 2) {
                return new expressions_1.LocalDeclarationExpression(curTok.position, dec, new expressions_1.Sequence(tpos, res));
            }
            else {
                return new expressions_1.LocalDeclarationExpression(curTok.position, dec, res[0]);
            }
        }
        else if (curTok instanceof lexer_1.ConstantToken) {
            ++this.position;
            return new expressions_1.Constant(curTok.position, curTok);
        }
        else if (curTok.isVid() || curTok instanceof lexer_1.LongIdentifierToken) {
            ++this.position;
            if (this.state.getInfixStatus(curTok) !== undefined
                && this.state.getInfixStatus(curTok).infix) {
                throw new ParserError('Infix operator "' + curTok.getText()
                    + '" appeared in non-infix context without "op".', curTok.position);
            }
            return new expressions_1.ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic expression, "' +
            curTok.getText() + '" found.', curTok.position);
    };
    Parser.prototype.parseExpressionRow = function () {
        /*
         * Parses Record expression, munches closing }
         * exprow ::= lab = exp [, exprow]  Record(position, complete: boolean,
         *                                         entries: [string, (Pattern|Expression)][])
         *              IdentifierToken KeywordToken exp [KeywordToken exp]*
         */
        var curTok = this.currentToken();
        var res = [];
        var firstIt = true;
        while (true) {
            var newTok = this.currentToken();
            if (this.checkKeywordToken(newTok, '}')) {
                ++this.position;
                return new expressions_1.Record(curTok.position, true, res);
            }
            if (!firstIt && this.checkKeywordToken(newTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;
            if (newTok.isValidRecordLabel()) {
                ++this.position;
                var nextTok = this.currentToken();
                this.assertKeywordToken(nextTok, '=');
                ++this.position;
                res.push([newTok.getText(), this.parseExpression()]);
                continue;
            }
            throw new ParserError('Expected "}", or identifier, got "'
                + newTok.getText() + '".', newTok.position);
        }
    };
    Parser.prototype.parseApplicationExpression = function () {
        /* appexp ::= atexp
         *            appexp atexp      FunctionApplication(position, func:exp, arg:exp)
         *              exp exp
         */
        var curTok = this.currentToken();
        var res = this.parseAtomicExpression();
        while (true) {
            var oldPos = this.position;
            var nextTok = this.currentToken();
            if (this.checkVidOrLongToken(nextTok)
                && this.state.getInfixStatus(nextTok) !== undefined
                && this.state.getInfixStatus(nextTok).infix) {
                break;
            }
            try {
                var newExp = this.parseAtomicExpression();
                res = new expressions_1.FunctionApplication(curTok.position, res, newExp);
            }
            catch (e) {
                this.position = oldPos;
                break;
            }
        }
        return res;
    };
    Parser.prototype.parseInfixExpression = function () {
        /*
         * infexp ::= appexp
         *            infexp1 vid infexp2   FunctionApplication(pos, ValueIdentifier, (exp1,exp2))
         *              exp IdentifierToken exp
         */
        var exps = [];
        var ops = [];
        var cnt = 0;
        while (true) {
            exps.push(this.parseApplicationExpression());
            var curTok = this.currentToken();
            if (this.checkVidOrLongToken(curTok)
                && this.state.getInfixStatus(curTok) !== undefined
                && this.state.getInfixStatus(curTok).infix) {
                // We don't know anything about identifiers yet, so just assume they are infix
                ++this.position;
                ops.push([curTok, cnt++]);
            }
            else {
                break;
            }
        }
        if (cnt === 0) {
            return exps[0];
        }
        return new expressions_1.InfixExpression(exps, ops).reParse(this.state);
    };
    Parser.prototype.parseAppendedExpression = function () {
        /*
         * exp ::= infexp
         *         exp : ty                         TypedExpression(position, exp, type)
         *          exp KeywordToken type
         *         exp handle match                 HandleException(position, exp, match)
         *          exp KeywordToken exp
         *         raise exp                        RaiseException(position, exp)
         *          KeywordToken exp
         *         if exp1 then exp2 else exp3      Conditional(pos, exp1, exp2, exp3)
         *          KeywordToken exp KeywordToken exp KeywordToken exp
         *         case exp of match                CaseAnalysis(pos, exp, match)
         *          KeywordToken exp KeywordToken match
         *         while exp do exp                 While(pos, exp, exp)
         *          KeywordToken exp KeywordToken exp
         *         fn match                         Lambda(position, match)
         *          KeywordToken match
         */
        var curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'raise')) {
            ++this.position;
            return new expressions_1.RaiseException(curTok.position, this.parseExpression());
        }
        else if (this.checkKeywordToken(curTok, 'if')) {
            ++this.position;
            var cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'then');
            ++this.position;
            var cons = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'else');
            ++this.position;
            return new expressions_1.Conditional(curTok.position, cond, cons, this.parseExpression());
        }
        else if (this.checkKeywordToken(curTok, 'case')) {
            ++this.position;
            var cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'of');
            ++this.position;
            return new expressions_1.CaseAnalysis(curTok.position, cond, this.parseMatch());
        }
        else if (this.checkKeywordToken(curTok, 'while')) {
            ++this.position;
            var cond = this.parseExpression();
            this.assertKeywordToken(this.currentToken(), 'do');
            ++this.position;
            return new expressions_1.While(curTok.position, cond, this.parseExpression());
        }
        else if (this.checkKeywordToken(curTok, 'fn')) {
            ++this.position;
            return new expressions_1.Lambda(curTok.position, this.parseMatch());
        }
        var exp = this.parseInfixExpression();
        var nextTok = this.currentToken();
        while (this.checkKeywordToken(nextTok, ':')) {
            ++this.position;
            exp = new expressions_1.TypedExpression(curTok.position, exp, this.parseType());
            nextTok = this.currentToken();
        }
        return exp;
    };
    Parser.prototype.parseExpression = function () {
        /*
         * exp ::= exp1 andalso exp2                Conjunction(pos, exp1, exp2)
         *          exp KeywordToken exp
         *         exp1 orelse exp2                 Disjunction(pos, exp1, exp2)
         *          exp KeywordToken exp
         */
        var exp = this.parseAppendedExpression();
        var nextTok = this.currentToken();
        var curTok = nextTok;
        if (this.checkKeywordToken(nextTok, 'andalso')
            || this.checkKeywordToken(nextTok, 'orelse')) {
            var exps = [[exp, [0]]];
            var ops = [];
            var cnt = 0;
            while (true) {
                if (this.checkKeywordToken(nextTok, 'orelse')) {
                    ops.push([1, cnt++]);
                    ++this.position;
                }
                else if (this.checkKeywordToken(nextTok, 'andalso')) {
                    ops.push([0, cnt++]);
                    ++this.position;
                }
                else {
                    break;
                }
                exps.push([this.parseAppendedExpression(), [cnt]]);
                nextTok = this.currentToken();
            }
            ops.sort();
            for (var i = 0; i < ops.length; ++i) {
                // Using pointers or something similar could speed up this stuff here
                // and achieve linear running time
                var left = exps[ops[i][1]][0];
                var right = exps[ops[i][1] + 1][0];
                var res = void 0;
                if (ops[i][0] === 0) {
                    res = new expressions_1.Conjunction(left.position, left, right);
                }
                else {
                    res = new expressions_1.Disjunction(left.position, left, right);
                }
                var npos = exps[ops[i][1]][1];
                for (var _i = 0, _a = exps[ops[i][1] + 1][1]; _i < _a.length; _i++) {
                    var j = _a[_i];
                    npos.push(j);
                }
                for (var _b = 0, npos_1 = npos; _b < npos_1.length; _b++) {
                    var j = npos_1[_b];
                    exps[j] = [res, npos];
                }
            }
            exp = exps[0][0];
        }
        nextTok = this.currentToken();
        while (this.checkKeywordToken(nextTok, 'handle')) {
            ++this.position;
            exp = new expressions_1.HandleException(curTok.position, exp, this.parseMatch());
            nextTok = this.currentToken();
        }
        return exp;
    };
    Parser.prototype.parseMatch = function () {
        /*
         * match ::= pat => exp [| match]       Match(pos, [Pattern, Expression][])
         */
        var curTok = this.currentToken();
        var res = [];
        while (true) {
            var pat = this.parsePattern();
            this.assertKeywordToken(this.currentToken(), '=>');
            ++this.position;
            var exp = this.parseExpression();
            res.push([pat, exp]);
            if (!this.checkKeywordToken(this.currentToken(), '|')) {
                break;
            }
            ++this.position;
        }
        return new expressions_1.Match(curTok.position, res);
    };
    Parser.prototype.parsePatternRow = function () {
        /*
         * Parses Record patterns, munches closing }
         * patrow ::= ...
         *              KeywordToken
         *            lab = pat [, patrow]
         *              IdentifierToken KeywordToken pat
         *            vid [:ty] [as pat] [, patrow]
         *              IdentifierToken [KeywordToken type] [KeywordToken pat]
         */
        var curTok = this.currentToken();
        var res = [];
        var firstIt = true;
        var complete = true;
        while (true) {
            var newTok = this.currentToken();
            if (this.checkKeywordToken(newTok, '}')) {
                ++this.position;
                return new expressions_1.Record(curTok.position, complete, res);
            }
            if (!complete) {
                throw new ParserError('Record wildcard must appear as last element of the record.', newTok.position);
            }
            if (!firstIt && this.checkKeywordToken(newTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;
            if (this.checkKeywordToken(newTok, '...')) {
                // A wildcard may only occur as the last entry of a record.
                complete = false;
                ++this.position;
                continue;
            }
            if (newTok.isValidRecordLabel()) {
                ++this.position;
                var nextTok = this.currentToken();
                if (!(nextTok instanceof lexer_1.KeywordToken)) {
                    throw new ParserError('Expected ":", "as", ",", or "=", got ' +
                        nextTok.getText() + '".', nextTok.position);
                }
                if (nextTok.text === '=') {
                    // lab = pat
                    ++this.position;
                    res.push([newTok.getText(), this.parsePattern()]);
                    continue;
                }
                var tp = undefined;
                var pat = new expressions_1.ValueIdentifier(newTok.position, newTok);
                if (nextTok.text === ':') {
                    ++this.position;
                    tp = this.parseType();
                    nextTok = this.currentToken();
                }
                if (nextTok.text === 'as') {
                    ++this.position;
                    pat = new expressions_1.LayeredPattern(pat.position, pat.name, tp, this.parsePattern());
                    nextTok = this.currentToken();
                }
                res.push([newTok.getText(), pat]);
                continue;
            }
            throw new ParserError('Expected "}", "...", or identifier.', newTok.position);
        }
    };
    Parser.prototype.parseAtomicPattern = function () {
        /*
         * atpat ::= _                      Wildcard(pos)
         *           scon                   Constant(pos, token)
         *           [op] longvid           ValueIdentifier(pos, name:Taken)
         *           [op] vid [:ty] as pat  LayeredPattern(pos, IdentifierToken, type, pattern)
         *           { [patrow] }
         *           ()                     Tuple(pos, [])
         *           ( pat1, …, patn )      Tuple(pos, (Pattern|Exp)[])
         *           [ pat1, …, patn ]      List(pos, (Pattern|Exp)[])
         *           ( pat )
         */
        if (this.position >= this.tokens.length) {
            throw new ParserError('Unexpected end of token stream', -1);
        }
        var curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'op')) {
            ++this.position;
            var nextCurTok = this.currentToken();
            this.assertIdentifierOrLongToken(nextCurTok);
            nextCurTok.opPrefixed = true;
            ++this.position;
            var newOldPos = this.position;
            try {
                if (!(nextCurTok instanceof lexer_1.LongIdentifierToken)) {
                    var newTok = this.currentToken();
                    var tp = void 0;
                    if (this.checkKeywordToken(newTok, ':')) {
                        ++this.position;
                        tp = this.parseType();
                        newTok = this.currentToken();
                    }
                    this.assertKeywordToken(newTok, 'as');
                    ++this.position;
                    return new expressions_1.LayeredPattern(curTok.position, nextCurTok, tp, this.parsePattern());
                }
            }
            catch (f) {
                this.position = newOldPos;
            }
            return new expressions_1.ValueIdentifier(curTok.position, nextCurTok);
        }
        if (this.checkKeywordToken(curTok, '_')) {
            // Wildcard pattern
            ++this.position;
            return new expressions_1.Wildcard(curTok.position);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            // Record pattern
            ++this.position;
            var result = this.parsePatternRow();
            return result;
        }
        if (this.checkKeywordToken(curTok, '(')) {
            // Tuple pattern
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ')')) {
                ++this.position;
                return new expressions_1.Tuple(curTok.position, []);
            }
            var results = [this.parsePattern()];
            while (true) {
                var nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',')) {
                    ++this.position;
                }
                else if (this.checkKeywordToken(nextCurTok, ')')) {
                    ++this.position;
                    if (results.length === 1) {
                        return results[0];
                    }
                    else {
                        return new expressions_1.Tuple(curTok.position, results);
                    }
                }
                else {
                    throw new ParserError('Expected "," or ")", but got "'
                        + nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parsePattern());
            }
        }
        if (this.checkKeywordToken(curTok, '[')) {
            // List pattern
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ']')) {
                ++this.position;
                return new expressions_1.List(curTok.position, []);
            }
            var results = [this.parsePattern()];
            while (true) {
                var nextCurTok = this.currentToken();
                if (this.checkKeywordToken(nextCurTok, ',')) {
                    ++this.position;
                }
                else if (this.checkKeywordToken(nextCurTok, ']')) {
                    ++this.position;
                    return new expressions_1.List(curTok.position, results);
                }
                else {
                    throw new ParserError('Expected "," or "]" but found "' +
                        nextCurTok.getText() + '".', nextCurTok.position);
                }
                results.push(this.parsePattern());
            }
        }
        else if (curTok instanceof lexer_1.ConstantToken) {
            ++this.position;
            return new expressions_1.Constant(curTok.position, curTok);
        }
        else if (curTok instanceof lexer_1.IdentifierToken
            || curTok instanceof lexer_1.LongIdentifierToken) {
            ++this.position;
            var newOldPos = this.position;
            try {
                if (!(curTok instanceof lexer_1.LongIdentifierToken)) {
                    var newTok = this.currentToken();
                    var tp = void 0;
                    if (this.checkKeywordToken(newTok, ':')) {
                        ++this.position;
                        tp = this.parseType();
                        newTok = this.currentToken();
                    }
                    this.assertKeywordToken(newTok, 'as');
                    ++this.position;
                    return new expressions_1.LayeredPattern(curTok.position, curTok, tp, this.parsePattern());
                }
            }
            catch (f) {
                this.position = newOldPos;
            }
            return new expressions_1.ValueIdentifier(curTok.position, curTok);
        }
        throw new ParserError('Expected atomic pattern but got "'
            + curTok.getText() + '".', curTok.position);
    };
    Parser.prototype.parseApplicationPattern = function () {
        /*
         *  pat ::= atpat
         *          [op] longvid atpat      FunctionApplication(pos, func, argument)
         */
        var curTok = this.currentToken();
        var res = this.parseAtomicPattern();
        while (true) {
            var oldPos = this.position;
            var nextTok = this.currentToken();
            if (this.checkVidOrLongToken(nextTok)
                && this.state.getInfixStatus(nextTok) !== undefined
                && this.state.getInfixStatus(nextTok).infix) {
                break;
            }
            try {
                var newExp = this.parseAtomicPattern();
                res = new expressions_1.FunctionApplication(curTok.position, res, newExp);
            }
            catch (e) {
                this.position = oldPos;
                break;
            }
        }
        return res;
    };
    Parser.prototype.parseInfixPattern = function () {
        /*
         * pat ::= pat1 vid pat2            FunctionApplication(pos, vid, (pat1, pat2))
         */
        var pats = [];
        var ops = [];
        var cnt = 0;
        while (true) {
            pats.push(this.parseApplicationPattern());
            var curTok = this.currentToken();
            if (this.checkIdentifierOrLongToken(curTok)
                && this.state.getInfixStatus(curTok) !== undefined
                && this.state.getInfixStatus(curTok).infix) {
                ++this.position;
                ops.push([curTok, cnt++]);
            }
            else {
                break;
            }
        }
        if (cnt === 0) {
            return pats[0];
        }
        return new expressions_1.InfixExpression(pats, ops).reParse(this.state);
    };
    Parser.prototype.parsePattern = function () {
        /*
         *          pat : ty                TypedExpression(pos, exp, type)
         */
        var curTok = this.currentToken();
        var pat = this.parseInfixPattern();
        while (this.checkKeywordToken(this.currentToken(), ':')) {
            ++this.position;
            pat = new expressions_1.TypedExpression(curTok.position, pat, this.parseType());
        }
        return pat;
    };
    Parser.prototype.parseTypeRow = function () {
        /*
         * Parses Record type, munches closing }
         * tyrow ::= lab : ty [, tyrow]     Record(comp:boolean, entries: [string, Type])
         */
        var firstTok = this.currentToken();
        var elements = new Map();
        var firstIt = true;
        while (true) {
            var curTok = this.currentToken();
            if (this.checkKeywordToken(curTok, '}')) {
                ++this.position;
                return new types_1.RecordType(elements, true, firstTok.position);
            }
            if (!firstIt && this.checkKeywordToken(curTok, ',')) {
                ++this.position;
                continue;
            }
            firstIt = false;
            if (curTok.isValidRecordLabel()) {
                ++this.position;
                var nextTok = this.currentToken();
                if (!(nextTok instanceof lexer_1.KeywordToken)) {
                    throw new ParserError('Expected ":".', nextTok.position);
                }
                if (nextTok.text === ':') {
                    // lab: type
                    ++this.position;
                    if (elements.has(curTok.getText())) {
                        throw new ParserError('Duplicate record label "' + curTok.getText()
                            + '".', curTok.position);
                    }
                    elements.set(curTok.getText(), this.parseType());
                    continue;
                }
                throw new ParserError('Expected ":".', nextTok.position);
            }
            throw new ParserError('Expected "}", or an identifier, got "' +
                curTok.getText() + '".', curTok.position);
        }
    };
    Parser.prototype.parseSimpleType = function () {
        /*
         * ty ::= tyvar                     TypeVariable(name:string)
         *        longtycon                 CustomType
         *        (ty1,..., tyn) longtycon  CustomType
         *        { [tyrow] }
         *        ( ty )
         */
        var curTok = this.currentToken();
        if (curTok instanceof lexer_1.TypeVariableToken) {
            ++this.position;
            return new types_1.TypeVariable(curTok.getText(), true, curTok.position);
        }
        if (this.checkIdentifierOrLongToken(curTok)) {
            ++this.position;
            return new types_1.CustomType(curTok.getText(), [], curTok.position);
        }
        if (this.checkKeywordToken(curTok, '{')) {
            ++this.position;
            return this.parseTypeRow();
        }
        if (this.checkKeywordToken(curTok, '(')) {
            ++this.position;
            if (this.checkKeywordToken(this.currentToken(), ')')) {
                throw new ParserError('Use "{}" or "unit" to denote the unit type.', this.currentToken().position);
            }
            var res = [this.parseType()];
            while (true) {
                var nextTok = this.currentToken();
                if (this.checkKeywordToken(nextTok, ',')) {
                    ++this.position;
                    res.push(this.parseType());
                    continue;
                }
                if (this.checkKeywordToken(nextTok, ')')) {
                    ++this.position;
                    if (res.length === 1) {
                        return res[0];
                    }
                    this.assertIdentifierOrLongToken(this.currentToken());
                    var name_1 = this.currentToken();
                    ++this.position;
                    return new types_1.CustomType(name_1.getText(), res, curTok.position);
                }
                throw new ParserError('Expected "," or ")", got "' +
                    nextTok.getText() + '".', nextTok.position);
            }
        }
        throw new ParserError('Expected either "(" or "{" got \"'
            + curTok.getText() + '\".', curTok.position);
    };
    Parser.prototype.parseType = function () {
        /*
         * ty ::= ty1 -> ty2        Function(param:Type, return:Type)
         */
        var curTy = this.parseTupleType();
        var curTok = this.currentToken();
        if (!this.checkKeywordToken(curTok, '->')) {
            return curTy;
        }
        ++this.position;
        var tgTy = this.parseType();
        return new types_1.FunctionType(curTy, tgTy, curTok.position);
    };
    Parser.prototype.parseTupleType = function () {
        /*
         * ty ::= ty1 * … * tyn     TupleType(types:Type[])
         */
        var curTy = [this.parseCustomType()];
        var curTok = this.currentToken();
        var pos = curTok.position;
        while (this.checkKeywordToken(this.currentToken(), '*')) {
            ++this.position;
            curTy.push(this.parseCustomType());
        }
        if (curTy.length === 1) {
            return curTy[0];
        }
        return new types_1.TupleType(curTy, pos);
    };
    Parser.prototype.parseCustomType = function () {
        /*
         * ty ::= ty longtycon    CustomType(fullName:String, tyArg:Type[])
         */
        var curTok = this.currentToken();
        var ty = this.parseSimpleType();
        while (this.position < this.tokens.length) {
            var nextTok = this.currentToken();
            if (!this.checkIdentifierOrLongToken(nextTok)) {
                return ty;
            }
            if (this.state.getCustomType(nextTok.getText()) !== undefined) {
                if (this.state.getCustomType(nextTok.getText()).arity === 0) {
                    return ty;
                }
            }
            ++this.position;
            ty = new types_1.CustomType(nextTok.getText(), [ty], curTok.position);
            continue;
        }
        return ty;
    };
    Parser.prototype.parseValueBinding = function () {
        /*
         *  valbind ::= pat = exp       ValueBinding(pos, isRec, pat, exp)
         *              rec valbind     isRecursive = true
         */
        var curTok = this.currentToken();
        if (this.checkKeywordToken(curTok, 'rec')) {
            ++this.position;
            var res = this.parseValueBinding();
            res.position = curTok.position;
            res.isRecursive = true;
            return res;
        }
        var pat = this.parsePattern();
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        return new declarations_1.ValueBinding(curTok.position, false, pat, this.parseExpression());
    };
    Parser.prototype.parseFunctionValueBinding = function () {
        var curTok = this.currentToken();
        var result = [];
        var argcnt = -1;
        var name = undefined;
        while (true) {
            var args = [];
            var ty = undefined;
            var nm = void 0;
            if (this.checkKeywordToken(this.currentToken(), '(')) {
                var pat = this.parsePattern();
                if ((!(pat instanceof expressions_1.FunctionApplication))
                    || (!(pat.argument.simplify() instanceof expressions_1.Record))
                    || ((pat.argument.simplify()).entries.length !== 2)
                    || (!(pat.func instanceof expressions_1.ValueIdentifier))) {
                    throw new ParserError('If you start a function declaration with a "(",'
                        + ' some infix expression should follow. But you gave me "'
                        + pat.prettyPrint() + '" (' + pat.constructor.name + ').', pat.position);
                }
                nm = pat.func;
                args.push(pat.argument);
            }
            else {
                var oldPos = this.position;
                var throwError = false;
                var throwIfError = false;
                try {
                    var tok = this.parseOpIdentifierToken();
                    nm = new expressions_1.ValueIdentifier(tok.position, tok);
                    if (this.state.getInfixStatus(nm.name) !== undefined
                        && this.state.getInfixStatus(nm.name).infix
                        && !nm.name.opPrefixed) {
                        throwError = true;
                        throw new ParserError('Missing "op".', nm.name.position);
                    }
                    while (true) {
                        if (this.checkKeywordToken(this.currentToken(), '=')
                            || this.checkKeywordToken(this.currentToken(), ':')) {
                            break;
                        }
                        var pat = this.parseAtomicPattern();
                        if (pat instanceof expressions_1.ValueIdentifier
                            && this.state.getInfixStatus(pat.name) !== undefined
                            && this.state.getInfixStatus(pat.name).infix) {
                            throwIfError = true;
                            throw new ParserError('Cute little infix identifiers such as "' +
                                pat.prettyPrint() + '" sure should play somewhere else.', pat.position);
                        }
                        args.push(pat);
                    }
                }
                catch (e) {
                    if (throwError) {
                        throw e;
                    }
                    throwError = false;
                    try {
                        // Again infix
                        this.position = oldPos;
                        var left = this.parseAtomicPattern();
                        this.assertIdentifierOrLongToken(this.currentToken());
                        nm = new expressions_1.ValueIdentifier(this.currentToken().position, this.currentToken());
                        if (this.state.getInfixStatus(this.currentToken()) === undefined
                            || !this.state.getInfixStatus(this.currentToken()).infix) {
                            if (throwIfError) {
                                throwError = true;
                                throw e;
                            }
                            throw new ParserError('"' + this.currentToken().getText()
                                + '" does not have infix status.', this.currentToken().position);
                        }
                        ++this.position;
                        var right = this.parseAtomicPattern();
                        args.push(new expressions_1.Tuple(-1, [left, right]));
                    }
                    catch (f) {
                        // It wasn't infix at all, but simply wrong.
                        throw e;
                    }
                }
            }
            if (this.checkKeywordToken(this.currentToken(), ':')) {
                ++this.position;
                ty = this.parseType();
            }
            this.assertKeywordToken(this.currentToken(), '=');
            ++this.position;
            if (argcnt === -1) {
                argcnt = args.length;
            }
            else if (argcnt !== 2 && argcnt !== 3 && argcnt !== args.length) {
                throw new ParserError('Different number of arguments.', curTok.position);
            }
            if (name === undefined) {
                name = nm;
            }
            else if (nm.name.getText() !== name.name.getText()) {
                throw new ParserError('Different function names in different cases ("' + nm.name.getText()
                    + '" vs. "' + name.name.getText() + '")', curTok.position);
            }
            result.push([args, ty, this.parseExpression()]);
            if (this.checkKeywordToken(this.currentToken(), '|')) {
                ++this.position;
                continue;
            }
            break;
        }
        return new declarations_1.FunctionValueBinding(curTok.position, result, name);
    };
    Parser.prototype.parseTypeBinding = function () {
        /*
         * tybind ::= tyvarseq tycon = ty       TypeBinding(pos, TypeVariable[], IdentifierToken, Type)
         */
        var curTok = this.currentToken();
        var tyvar = this.parseTypeVarSequence();
        this.assertIdentifierToken(this.currentToken());
        var vid = this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        return new declarations_1.TypeBinding(curTok.position, tyvar, vid, this.parseType());
    };
    Parser.prototype.parseTypeBindingSeq = function () {
        var tybinds = [];
        while (true) {
            tybinds.push(this.parseTypeBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            }
            else {
                break;
            }
        }
        return tybinds;
    };
    Parser.prototype.parseExceptionBinding = function () {
        var curTok = this.currentToken();
        var name = this.parseOpIdentifierToken();
        if (this.checkKeywordToken(this.currentToken(), 'of')) {
            ++this.position;
            var ty = this.parseType();
            return new declarations_1.DirectExceptionBinding(curTok.position, name, ty);
        }
        if (this.checkKeywordToken(this.currentToken(), '=')) {
            ++this.position;
            var oldname = this.parseOpIdentifierToken(true);
            return new declarations_1.ExceptionAlias(curTok.position, name, oldname);
        }
        return new declarations_1.DirectExceptionBinding(curTok.position, name, undefined);
    };
    Parser.prototype.parseDatatypeBinding = function () {
        var curTok = this.currentToken();
        var tyvars = this.parseTypeVarSequence();
        this.assertIdentifierToken(this.currentToken());
        var tycon = this.currentToken();
        ++this.position;
        this.assertKeywordToken(this.currentToken(), '=');
        ++this.position;
        var constrs = [];
        while (true) {
            var name_2 = this.parseOpIdentifierToken();
            if (this.checkKeywordToken(this.currentToken(), 'of')) {
                ++this.position;
                var ty = this.parseType();
                constrs.push([name_2, ty]);
            }
            else {
                constrs.push([name_2, undefined]);
            }
            if (this.checkKeywordToken(this.currentToken(), '|')) {
                ++this.position;
            }
            else {
                break;
            }
        }
        return new declarations_1.DatatypeBinding(curTok.position, tyvars, tycon, constrs);
    };
    Parser.prototype.parseDatatypeBindingSeq = function () {
        var datbinds = [];
        while (true) {
            datbinds.push(this.parseDatatypeBinding());
            if (this.checkKeywordToken(this.currentToken(), 'and')) {
                ++this.position;
            }
            else {
                break;
            }
        }
        return datbinds;
    };
    Parser.prototype.parseTypeVarSequence = function (allowFail) {
        if (allowFail === void 0) { allowFail = false; }
        /*
         * ε                    []
         * tyvar                [TypeVariable]
         * (tyvar1,…,tyvarn)    TypeVariable[]
         */
        var curTok = this.currentToken();
        var res = [];
        if (curTok instanceof lexer_1.TypeVariableToken) {
            res.push(new types_1.TypeVariable(curTok.text, false, curTok.position));
            ++this.position;
            return res;
        }
        if (this.checkKeywordToken(curTok, '(')) {
            ++this.position;
            while (true) {
                curTok = this.currentToken();
                if (!(curTok instanceof lexer_1.TypeVariableToken)) {
                    if (allowFail) {
                        return undefined;
                    }
                    throw new ParserError('Expected a type varible.', curTok.position);
                }
                res.push(new types_1.TypeVariable(curTok.text, false, curTok.position));
                ++this.position;
                curTok = this.currentToken();
                if (this.checkKeywordToken(curTok, ',')) {
                    ++this.position;
                    continue;
                }
                else if (this.checkKeywordToken(curTok, ')')) {
                    ++this.position;
                    break;
                }
                throw new ParserError('Expected "," or ")" but got "'
                    + curTok.getText() + '".', curTok.position);
            }
        }
        return res;
    };
    Parser.prototype.parseDeclaration = function (topLevel) {
        if (topLevel === void 0) { topLevel = false; }
        /*
         * dec ::= dec [;] dec                          SequentialDeclaration(pos, Declaration[])
         */
        var res = [];
        var curTok = this.currentToken();
        var curId = this.currentId++;
        while (this.position < this.tokens.length) {
            var cur = this.parseSimpleDeclaration(topLevel);
            if (cur instanceof declarations_1.EmptyDeclaration) {
                if (this.position >= this.tokens.length
                    || this.checkKeywordToken(this.currentToken(), 'in')
                    || this.checkKeywordToken(this.currentToken(), 'end')) {
                    break;
                }
                continue;
            }
            res.push(cur);
            if (this.checkKeywordToken(this.currentToken(), ';')) {
                ++this.position;
            }
        }
        return new declarations_1.SequentialDeclaration(curTok.position, res, curId);
    };
    Parser.prototype.parseSimpleDeclaration = function (topLevel) {
        if (topLevel === void 0) { topLevel = false; }
        /*
         * dec ::= val tyvarseq valbind                 ValueDeclaration(pos, tyvarseq, ValueBinding[])
         *         fun tyvarseq fvalbind                FunctionDeclaration(pos, tyvarseq, FunctionValueBinding[])
         *         type typbind                         TypeDeclaration(pos, TypeBinding[])
         *         datatype datbind [withtype typbind]  DatatypeDeclaration(pos, DTBind[], TypeBind[]|undefined)
         *         datatype tycon = datatype ltycon   DatatypeReplication(pos, IdentifierToken, oldname: Token)
         *         abstype datbind [withtype typbind]
         *              with dec end                    AbstypeDeclaration(pos, DTBind[], TypeBing[]|undef, Decl)
         *         exception exbind                     ExceptionDeclaration(pos, ExceptionBinding[])
         *         local dec1 in dec2 end               LocalDeclaration(pos, Declaration, body:Declaration)
         *         open longstrid1 … longstr1dn         OpenDeclaration(pos, names: Token[])
         *         infix [d] vid1 … vidn                InfixDeclaration(pos, ValueIdentifier[], d=0)
         *         infixr [d] vid1 … vidn               InfixRDeclaration(pos, ValueIdentifier[], d=0)
         *         nonfix vid1 … vidn                   NonfixDeclaration(pos, ValueIdentifier[])
         *         (empty)                              EmptyDeclaration()
         *         exp                                  val it = exp
         */
        var curTok = this.currentToken();
        var curId = this.currentId++;
        if (this.checkKeywordToken(curTok, 'val')) {
            ++this.position;
            var tyvar = this.parseTypeVarSequence(true);
            if (tyvar === undefined) {
                --this.position;
                tyvar = [];
            }
            var valbinds = [];
            var isRec = false;
            while (true) {
                var curbnd = this.parseValueBinding();
                if (curbnd.isRecursive) {
                    isRec = true;
                    if (!(curbnd.expression instanceof expressions_1.Lambda)) {
                        throw new ParserError('Using "rec" requires binding a lambda.', curbnd.position);
                    }
                    if (!(curbnd.pattern instanceof expressions_1.ValueIdentifier)
                        && !(curbnd.pattern instanceof expressions_1.Wildcard)) {
                        throw new ParserError('Using "rec" requires binding to a single identifier'
                            + ' and not "' + curbnd.pattern.prettyPrint(0, true) + '".', curbnd.position);
                    }
                }
                curbnd.isRecursive = isRec;
                valbinds.push(curbnd);
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                }
                else {
                    break;
                }
            }
            return new declarations_1.ValueDeclaration(curTok.position, tyvar, valbinds, curId);
        }
        else if (this.checkKeywordToken(curTok, 'fun')) {
            ++this.position;
            var tyvar = this.parseTypeVarSequence(true);
            if (tyvar === undefined) {
                --this.position;
                tyvar = [];
            }
            var fvalbinds = [];
            while (true) {
                fvalbinds.push(this.parseFunctionValueBinding());
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                }
                else {
                    break;
                }
            }
            return new declarations_1.FunctionDeclaration(curTok.position, tyvar, fvalbinds, curId);
        }
        else if (this.checkKeywordToken(curTok, 'type')) {
            ++this.position;
            return new declarations_1.TypeDeclaration(curTok.position, this.parseTypeBindingSeq(), curId);
        }
        else if (this.checkKeywordToken(curTok, 'datatype')) {
            if (this.position + 3 < this.tokens.length &&
                this.checkKeywordToken(this.tokens[this.position + 3], 'datatype')) {
                ++this.position;
                var nw = this.currentToken();
                this.assertIdentifierToken(nw);
                this.position += 2;
                var old = this.currentToken();
                this.assertIdentifierOrLongToken(old);
                return new declarations_1.DatatypeReplication(curTok.position, nw, old, curId);
            }
            else {
                ++this.position;
                var datbind = this.parseDatatypeBindingSeq();
                if (this.checkKeywordToken(this.currentToken(), 'withtype')) {
                    ++this.position;
                    var tp = this.parseTypeBindingSeq();
                    return new declarations_1.DatatypeDeclaration(curTok.position, datbind, tp, curId);
                }
                return new declarations_1.DatatypeDeclaration(curTok.position, datbind, undefined, curId);
            }
        }
        else if (this.checkKeywordToken(curTok, 'abstype')) {
            ++this.position;
            var nstate = this.state;
            this.state = this.state.getNestedState();
            var datbind = this.parseDatatypeBindingSeq();
            var tybind = undefined;
            if (this.checkKeywordToken(this.currentToken(), 'withtype')) {
                ++this.position;
                tybind = this.parseTypeBindingSeq();
            }
            this.assertKeywordToken(this.currentToken(), 'with');
            ++this.position;
            var dec = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;
            this.state = nstate;
            return new declarations_1.AbstypeDeclaration(curTok.position, datbind, tybind, dec, curId);
        }
        else if (this.checkKeywordToken(curTok, 'exception')) {
            ++this.position;
            var bnds = [];
            while (true) {
                bnds.push(this.parseExceptionBinding());
                if (this.checkKeywordToken(this.currentToken(), 'and')) {
                    ++this.position;
                }
                else {
                    break;
                }
            }
            return new declarations_1.ExceptionDeclaration(curTok.position, bnds, curId);
        }
        else if (this.checkKeywordToken(curTok, 'local')) {
            ++this.position;
            var nstate = this.state;
            this.state = this.state.getNestedState();
            var dec = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'in');
            ++this.position;
            var dec2 = this.parseDeclaration();
            this.assertKeywordToken(this.currentToken(), 'end');
            ++this.position;
            this.state = nstate;
            return new declarations_1.LocalDeclaration(curTok.position, dec, dec2, curId);
        }
        else if (this.checkKeywordToken(curTok, 'open')) {
            ++this.position;
            var res = [];
            while (this.checkIdentifierOrLongToken(this.currentToken())) {
                res.push(this.currentToken());
                ++this.position;
            }
            if (res.length === 0) {
                throw new ParserError('Empty "open" declaration.', this.currentToken().position);
            }
            return new declarations_1.OpenDeclaration(curTok.position, res, curId);
        }
        else if (this.checkKeywordToken(curTok, 'infix')) {
            ++this.position;
            var precedence = 0;
            if (this.currentToken() instanceof lexer_1.IntegerConstantToken) {
                if (this.currentToken().text.length !== 1) {
                    throw new ParserError('Precedences may only be single digits.', this.currentToken().position);
                }
                precedence = this.currentToken().value;
                ++this.position;
            }
            var res = [];
            while (this.currentToken().isVid()) {
                res.push(this.currentToken());
                ++this.position;
            }
            if (res.length === 0) {
                throw new ParserError('Empty "infix" declaration.', this.currentToken().position);
            }
            var resdec = new declarations_1.InfixDeclaration(curTok.position, res, precedence, curId);
            this.state = resdec.evaluate(this.state)[0];
            return resdec;
        }
        else if (this.checkKeywordToken(curTok, 'infixr')) {
            ++this.position;
            var precedence = 0;
            if (this.currentToken() instanceof lexer_1.IntegerConstantToken) {
                if (this.currentToken().text.length !== 1) {
                    throw new ParserError('Precedences may only be single digits.', this.currentToken().position);
                }
                precedence = this.currentToken().value;
                ++this.position;
            }
            var res = [];
            while (this.currentToken().isVid()) {
                res.push(this.currentToken());
                ++this.position;
            }
            if (res.length === 0) {
                throw new ParserError('Empty "infixr" declaration.', this.currentToken().position);
            }
            var resdec = new declarations_1.InfixRDeclaration(curTok.position, res, precedence, curId);
            this.state = resdec.evaluate(this.state)[0];
            return resdec;
        }
        else if (this.checkKeywordToken(curTok, 'nonfix')) {
            ++this.position;
            var res = [];
            while (this.currentToken().isVid()) {
                res.push(this.currentToken());
                ++this.position;
            }
            if (res.length === 0) {
                throw new ParserError('Empty "nonfix" declaration.', this.currentToken().position);
            }
            var resdec = new declarations_1.NonfixDeclaration(curTok.position, res, curId);
            this.state = resdec.evaluate(this.state)[0];
            return resdec;
        }
        if (this.checkKeywordToken(curTok, ';')) {
            ++this.position;
            return new declarations_1.EmptyDeclaration(curId);
        }
        else if (this.checkKeywordToken(curTok, 'in')
            || this.checkKeywordToken(curTok, 'end')) {
            return new declarations_1.EmptyDeclaration(curId);
        }
        if (topLevel) {
            var exp = this.parseExpression();
            var valbnd = new declarations_1.ValueBinding(curTok.position, false, new expressions_1.ValueIdentifier(-1, new lexer_1.AlphanumericIdentifierToken('it', -1)), exp);
            this.assertKeywordToken(this.currentToken(), ';');
            return new declarations_1.ValueDeclaration(curTok.position, [], [valbnd], curId);
        }
        throw new ParserError('Expected a declaration.', curTok.position);
    };
    Parser.prototype.currentToken = function () {
        if (this.position >= this.tokens.length) {
            throw new errors_1.IncompleteError(-1, 'More input, I\'m starving. ~nyan.');
        }
        return this.tokens[this.position];
    };
    return Parser;
}());
exports.Parser = Parser;
function parse(tokens, state) {
    var p = new Parser(tokens, state, state.id);
    return p.parseDeclaration(true);
}
exports.parse = parse;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var expressions_1 = __webpack_require__(7);
var lexer_1 = __webpack_require__(1);
var types_1 = __webpack_require__(2);
var state_1 = __webpack_require__(4);
var errors_1 = __webpack_require__(0);
var values_1 = __webpack_require__(3);
var Declaration = (function () {
    function Declaration() {
    }
    Declaration.prototype.elaborate = function (state) {
        throw new errors_1.InternalInterpreterError(-1, 'Not yet implemented.');
    };
    // Returns [computed state, has Error occured, Exception]
    Declaration.prototype.evaluate = function (state) {
        throw new errors_1.InternalInterpreterError(-1, 'Not yet implemented.');
    };
    Declaration.prototype.prettyPrint = function (indentation, oneLine) {
        throw new errors_1.InternalInterpreterError(-1, 'Not yet implemented.');
    };
    Declaration.prototype.simplify = function () {
        throw new errors_1.InternalInterpreterError(-1, 'Not yet implemented.');
    };
    return Declaration;
}());
exports.Declaration = Declaration;
// Declaration subclasses
var ValueDeclaration = (function (_super) {
    __extends(ValueDeclaration, _super);
    // val typeVariableSequence valueBinding
    function ValueDeclaration(position, typeVariableSequence, valueBinding, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.typeVariableSequence = typeVariableSequence;
        _this.valueBinding = valueBinding;
        _this.id = id;
        return _this;
    }
    ValueDeclaration.prototype.simplify = function () {
        var valBnd = [];
        for (var i = 0; i < this.valueBinding.length; ++i) {
            valBnd.push(new ValueBinding(this.valueBinding[i].position, this.valueBinding[i].isRecursive, this.valueBinding[i].pattern.simplify(), this.valueBinding[i].expression.simplify()));
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valBnd, this.id);
    };
    ValueDeclaration.prototype.elaborate = function (state) {
        // TODO
        return state;
    };
    ValueDeclaration.prototype.evaluate = function (state) {
        var result = [];
        var recursives = [];
        var isRec = false;
        for (var i = 0; i < this.valueBinding.length; ++i) {
            if (this.valueBinding[i].isRecursive) {
                isRec = true;
            }
            var val = this.valueBinding[i].compute(state);
            if (val[1] !== undefined) {
                return [state, true, val[1]];
            }
            if (val[0] === undefined) {
                return [state, true, new values_1.ExceptionValue('Bind')];
            }
            for (var j = 0; j < val[0].length; ++j) {
                if (!isRec) {
                    result.push(val[0][j]);
                }
                else {
                    recursives.push(val[0][j]);
                }
            }
        }
        for (var j = 0; j < result.length; ++j) {
            state.setDynamicValue(result[j][0], result[j][1]);
        }
        for (var j = 0; j < recursives.length; ++j) {
            if (recursives[j][1] instanceof values_1.FunctionValue) {
                state.setDynamicValue(recursives[j][0], new values_1.FunctionValue(recursives[j][1].state, recursives, recursives[j][1].body));
            }
            else {
                state.setDynamicValue(recursives[j][0], recursives[j][1]);
            }
        }
        return [state, false, undefined];
    };
    ValueDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        // TODO
        var res = 'val <stuff>';
        for (var i = 0; i < this.valueBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.valueBinding[i].prettyPrint(indentation, oneLine);
        }
        return res += ';';
    };
    return ValueDeclaration;
}(Declaration));
exports.ValueDeclaration = ValueDeclaration;
var TypeDeclaration = (function (_super) {
    __extends(TypeDeclaration, _super);
    // type typeBinding
    function TypeDeclaration(position, typeBinding, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.typeBinding = typeBinding;
        _this.id = id;
        return _this;
    }
    TypeDeclaration.prototype.simplify = function () {
        var bnds = [];
        for (var i = 0; i < this.typeBinding.length; ++i) {
            bnds.push(new TypeBinding(this.typeBinding[i].position, this.typeBinding[i].typeVariableSequence, this.typeBinding[i].name, this.typeBinding[i].type.simplify()));
        }
        return new TypeDeclaration(this.position, bnds, this.id);
    };
    TypeDeclaration.prototype.elaborate = function (state) {
        for (var i = 0; i < this.typeBinding.length; ++i) {
            // TODO
            // Make tyvars from seq as unfree
            // instantiate
            // return all resulting types without free type vars
        }
        return state;
    };
    TypeDeclaration.prototype.evaluate = function (state) {
        for (var i = 0; i < this.typeBinding.length; ++i) {
            state.setDynamicType(this.typeBinding[i].name.getText(), []);
        }
        return [state, false, undefined];
    };
    TypeDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        // TODO
        var res = 'type';
        for (var i = 0; i < this.typeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' <stuff> ' + this.typeBinding[i].name.getText();
            res += ' = ' + this.typeBinding[i].type.prettyPrint();
        }
        return res + ';';
    };
    return TypeDeclaration;
}(Declaration));
exports.TypeDeclaration = TypeDeclaration;
var DatatypeDeclaration = (function (_super) {
    __extends(DatatypeDeclaration, _super);
    // datatype datatypeBinding <withtype typeBinding>
    function DatatypeDeclaration(position, datatypeBinding, typeBinding, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.datatypeBinding = datatypeBinding;
        _this.typeBinding = typeBinding;
        _this.id = id;
        if (_this.typeBinding !== undefined) {
            throw new errors_1.FeatureDisabledError(_this.position, 'Don\'t use "withtype". It is evil.');
        }
        return _this;
    }
    DatatypeDeclaration.prototype.simplify = function () {
        var datbnd = [];
        for (var i = 0; i < this.datatypeBinding.length; ++i) {
            var ntype = [];
            for (var j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    ntype.push([this.datatypeBinding[i].type[j][0],
                        this.datatypeBinding[i].type[j][1].simplify()]);
                }
                else {
                    ntype.push(this.datatypeBinding[i].type[j]);
                }
            }
            datbnd.push(new DatatypeBinding(this.datatypeBinding[i].position, this.datatypeBinding[i].typeVariableSequence, this.datatypeBinding[i].name, ntype));
        }
        // TODO Correctly implement the withtype ~> type transition or clean up this mess
        /*
        if (this.typeBinding) {
            return new SequentialDeclaration(this.position, [
                new DatatypeDeclaration(this.position, datbnd, undefined),
                new TypeDeclaration(this.position, this.typeBinding).simplify()]);
        } else { */
        return new DatatypeDeclaration(this.position, datbnd, undefined, this.id);
        /* } */
    };
    DatatypeDeclaration.prototype.elaborate = function (state) {
        // TODO
        return state;
    };
    DatatypeDeclaration.prototype.evaluate = function (state) {
        // I'm assuming the withtype is empty
        for (var i = 0; i < this.datatypeBinding.length; ++i) {
            var res = this.datatypeBinding[i].compute(state);
            for (var j = 0; j < res[0].length; ++j) {
                if (state.getRebindStatus(res[0][j][0]) === state_1.RebindStatus.Never) {
                    throw new errors_1.EvaluationError(this.position, 'You simply cannot rebind "'
                        + res[0][j][0] + '".');
                }
                state.setDynamicValue(res[0][j][0], res[0][j][1]);
            }
            // TODO id
            state.setDynamicType(res[1][0], res[1][1]);
        }
        return [state, false, undefined];
    };
    DatatypeDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = 'datatype';
        for (var i = 0; i < this.datatypeBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            // TODO Replace <stuff> with something proper
            res += ' <stuff> ' + this.datatypeBinding[i].name.getText() + ' =';
            for (var j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (j > 0) {
                    res += ' | ';
                }
                res += ' ' + this.datatypeBinding[i].type[j][0].getText();
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    res += ' of ' + this.datatypeBinding[i].type[j][1].prettyPrint();
                }
            }
        }
        return res;
    };
    return DatatypeDeclaration;
}(Declaration));
exports.DatatypeDeclaration = DatatypeDeclaration;
var DatatypeReplication = (function (_super) {
    __extends(DatatypeReplication, _super);
    // datatype name = datatype oldname
    function DatatypeReplication(position, name, oldname, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.name = name;
        _this.oldname = oldname;
        _this.id = id;
        return _this;
    }
    DatatypeReplication.prototype.simplify = function () {
        return this;
    };
    DatatypeReplication.prototype.elaborate = function (state) {
        var res = state.getStaticType(this.oldname.getText());
        if (res === undefined) {
            throw new errors_1.ElaborationError(this.position, 'The datatype "' + this.oldname.getText() + '" doesn\'t exist.');
        }
        state.setStaticType(this.name.getText(), res.type, res.constructors);
        return state;
    };
    DatatypeReplication.prototype.evaluate = function (state) {
        var res = state.getDynamicType(this.oldname.getText());
        if (res === undefined) {
            throw new errors_1.EvaluationError(this.position, 'The datatype "' + this.oldname.getText() + '" doesn\'t exist.');
        }
        state.setDynamicType(this.name.getText(), res);
        return [state, false, undefined];
    };
    DatatypeReplication.prototype.prettyPrint = function (indentation, oneLine) {
        return 'datatype ' + this.name.getText() + ' = datatype ' + this.oldname.getText() + ';';
    };
    return DatatypeReplication;
}(Declaration));
exports.DatatypeReplication = DatatypeReplication;
var AbstypeDeclaration = (function (_super) {
    __extends(AbstypeDeclaration, _super);
    // abstype datatypeBinding <withtype typeBinding> with declaration end
    function AbstypeDeclaration(position, datatypeBinding, typeBinding, declaration, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.datatypeBinding = datatypeBinding;
        _this.typeBinding = typeBinding;
        _this.declaration = declaration;
        _this.id = id;
        if (_this.typeBinding !== undefined) {
            throw new errors_1.FeatureDisabledError(_this.position, 'Don\'t use "withtype". It is evil.');
        }
        return _this;
    }
    AbstypeDeclaration.prototype.simplify = function () {
        var datbnd = [];
        for (var i = 0; i < this.datatypeBinding.length; ++i) {
            var ntype = [];
            for (var j = 0; j < this.datatypeBinding[i].type.length; ++j) {
                if (this.datatypeBinding[i].type[j][1] !== undefined) {
                    ntype.push([this.datatypeBinding[i].type[j][0],
                        this.datatypeBinding[i].type[j][1].simplify()]);
                }
                else {
                    ntype.push(this.datatypeBinding[i].type[j]);
                }
            }
            datbnd.push(new DatatypeBinding(this.datatypeBinding[i].position, this.datatypeBinding[i].typeVariableSequence, this.datatypeBinding[i].name, ntype));
        }
        // TODO Correctly implement the withtype ~> type transition or clean up this mess
        /* if (this.typeBinding) {
            return new AbstypeDeclaration(this.position, datbnd, undefined,
                new SequentialDeclaration(this.position, [
                    new TypeDeclaration(this.position, this.typeBinding).simplify(),
                    this.declaration.simplify()]));
        } else { */
        return new AbstypeDeclaration(this.position, datbnd, this.typeBinding, this.declaration.simplify(), this.id);
        /* } */
    };
    AbstypeDeclaration.prototype.elaborate = function (state) {
        // TODO
        return state;
    };
    AbstypeDeclaration.prototype.evaluate = function (state) {
        // I'm assuming the withtype is empty
        for (var i = 0; i < this.datatypeBinding.length; ++i) {
            var res = this.datatypeBinding[i].compute(state);
            for (var j = 0; j < res[0].length; ++j) {
                state.setDynamicValue(res[0][j][0], res[0][j][1]);
            }
        }
        return this.declaration.evaluate(state);
    };
    AbstypeDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        // TODO
        throw new errors_1.InternalInterpreterError(-1, 'Not yet implemented.');
    };
    return AbstypeDeclaration;
}(Declaration));
exports.AbstypeDeclaration = AbstypeDeclaration;
var ExceptionDeclaration = (function (_super) {
    __extends(ExceptionDeclaration, _super);
    function ExceptionDeclaration(position, bindings, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.bindings = bindings;
        _this.id = id;
        return _this;
    }
    ExceptionDeclaration.prototype.simplify = function () {
        return this;
    };
    ExceptionDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        // TODO
        throw new errors_1.InternalInterpreterError(-1, 'Not yet implemented.');
    };
    ExceptionDeclaration.prototype.elaborate = function (state) {
        for (var i = 0; i < this.bindings.length; ++i) {
            state = this.bindings[i].elaborate(state);
        }
        return state;
    };
    ExceptionDeclaration.prototype.evaluate = function (state) {
        for (var i = 0; i < this.bindings.length; ++i) {
            var res = this.bindings[i].evaluate(state);
            if (res[1]) {
                return res;
            }
            state = res[0];
        }
        return [state, false, undefined];
    };
    return ExceptionDeclaration;
}(Declaration));
exports.ExceptionDeclaration = ExceptionDeclaration;
var LocalDeclaration = (function (_super) {
    __extends(LocalDeclaration, _super);
    // local declaration in body end
    function LocalDeclaration(position, declaration, body, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.declaration = declaration;
        _this.body = body;
        _this.id = id;
        return _this;
    }
    LocalDeclaration.prototype.simplify = function () {
        return new LocalDeclaration(this.position, this.declaration.simplify(), this.body.simplify(), this.id);
    };
    LocalDeclaration.prototype.elaborate = function (state) {
        var nstate = state.getNestedState(false, state.id);
        nstate = this.declaration.elaborate(nstate).getNestedState(false, state.id);
        nstate = this.body.elaborate(nstate);
        // Forget all local definitions
        nstate.parent = state;
        return nstate;
    };
    LocalDeclaration.prototype.evaluate = function (state) {
        var nstate = state.getNestedState(false, state.id);
        var res = this.declaration.evaluate(nstate);
        if (res[1]) {
            // Something came flying in our direction. So hide we were here and let it flow.
            return [state, true, res[2]];
        }
        nstate = res[0].getNestedState(false, state.id);
        res = this.body.evaluate(nstate);
        // Forget all local definitions
        res[0].parent = state;
        return res;
    };
    LocalDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = 'local ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.body.prettyPrint(indentation, oneLine);
        res += ' end;';
        return res;
    };
    return LocalDeclaration;
}(Declaration));
exports.LocalDeclaration = LocalDeclaration;
var OpenDeclaration = (function (_super) {
    __extends(OpenDeclaration, _super);
    // open name_1 ... name_n
    function OpenDeclaration(position, names, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.names = names;
        _this.id = id;
        return _this;
    }
    OpenDeclaration.prototype.simplify = function () {
        return this;
    };
    OpenDeclaration.prototype.elaborate = function (state) {
        // TODO Yeah, if we had structs, we could actually implement this
        throw new errors_1.InternalInterpreterError(-1, 'Yeah, you better wait a little before trying this again.');
    };
    OpenDeclaration.prototype.evaluate = function (state) {
        // TODO Yeah, if we had structs, we could actually implement this
        throw new errors_1.InternalInterpreterError(-1, 'Yeah, you better wait a little before trying this again.');
    };
    OpenDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = 'open';
        for (var i = 0; i < this.names.length; ++i) {
            res += ' ' + this.names[i].getText();
        }
        return res + ';';
    };
    return OpenDeclaration;
}(Declaration));
exports.OpenDeclaration = OpenDeclaration;
var EmptyDeclaration = (function (_super) {
    __extends(EmptyDeclaration, _super);
    // exactly what it says on the tin.
    function EmptyDeclaration(id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.id = id;
        return _this;
    }
    EmptyDeclaration.prototype.simplify = function () {
        return this;
    };
    EmptyDeclaration.prototype.elaborate = function (state) {
        return state;
    };
    EmptyDeclaration.prototype.evaluate = function (state) {
        return [state, false, undefined];
    };
    EmptyDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        return ' ;';
    };
    return EmptyDeclaration;
}(Declaration));
exports.EmptyDeclaration = EmptyDeclaration;
var SequentialDeclaration = (function (_super) {
    __extends(SequentialDeclaration, _super);
    // declaration1 <;> declaration2
    function SequentialDeclaration(position, declarations, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.declarations = declarations;
        _this.id = id;
        return _this;
    }
    SequentialDeclaration.prototype.simplify = function () {
        var decls = [];
        for (var i = 0; i < this.declarations.length; ++i) {
            decls.push(this.declarations[i].simplify());
        }
        return new SequentialDeclaration(this.position, decls, this.id);
    };
    SequentialDeclaration.prototype.elaborate = function (state) {
        for (var i = 0; i < this.declarations.length; ++i) {
            state = this.declarations[i].elaborate(state.getNestedState(false, this.declarations[i].id));
        }
        return state;
    };
    SequentialDeclaration.prototype.evaluate = function (state) {
        for (var i = 0; i < this.declarations.length; ++i) {
            var nstate = state.getNestedState(true, this.declarations[i].id);
            var res = this.declarations[i].evaluate(nstate);
            if (res[1]) {
                // Something blew up, so let someone else handle the mess
                return res;
            }
            state = res[0];
        }
        return [state, false, undefined];
    };
    SequentialDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = '';
        for (var i = 0; i < this.declarations.length; ++i) {
            if (i > 0) {
                res += ' ';
            }
            res += this.declarations[i].prettyPrint(indentation, oneLine);
        }
        return res;
    };
    return SequentialDeclaration;
}(Declaration));
exports.SequentialDeclaration = SequentialDeclaration;
// Derived Forms and semantically irrelevant stuff
var FunctionDeclaration = (function (_super) {
    __extends(FunctionDeclaration, _super);
    // fun typeVariableSequence functionValueBinding
    function FunctionDeclaration(position, typeVariableSequence, functionValueBinding, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.typeVariableSequence = typeVariableSequence;
        _this.functionValueBinding = functionValueBinding;
        _this.id = id;
        return _this;
    }
    FunctionDeclaration.prototype.simplify = function () {
        var valbnd = [];
        for (var i = 0; i < this.functionValueBinding.length; ++i) {
            valbnd.push(this.functionValueBinding[i].simplify());
        }
        return new ValueDeclaration(this.position, this.typeVariableSequence, valbnd, this.id);
    };
    FunctionDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        // TODO
        var res = 'fun <stuff>';
        for (var i = 0; i < this.functionValueBinding.length; ++i) {
            if (i > 0) {
                res += ' and';
            }
            res += ' ' + this.functionValueBinding[i].prettyPrint(indentation, oneLine);
        }
        return res + ';';
    };
    return FunctionDeclaration;
}(Declaration));
exports.FunctionDeclaration = FunctionDeclaration;
var InfixDeclaration = (function (_super) {
    __extends(InfixDeclaration, _super);
    // infix <d> vid1 .. vidn
    function InfixDeclaration(position, operators, precedence, id) {
        if (precedence === void 0) { precedence = 0; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.operators = operators;
        _this.precedence = precedence;
        _this.id = id;
        return _this;
    }
    InfixDeclaration.prototype.simplify = function () {
        return this;
    };
    InfixDeclaration.prototype.elaborate = function (state) {
        return state;
    };
    InfixDeclaration.prototype.evaluate = function (state) {
        for (var i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], this.precedence, false, true);
        }
        return [state, false, undefined];
    };
    InfixDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = 'infix';
        res += ' ' + this.precedence;
        for (var i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    };
    return InfixDeclaration;
}(Declaration));
exports.InfixDeclaration = InfixDeclaration;
var InfixRDeclaration = (function (_super) {
    __extends(InfixRDeclaration, _super);
    // infixr <d> vid1 .. vidn
    function InfixRDeclaration(position, operators, precedence, id) {
        if (precedence === void 0) { precedence = 0; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.operators = operators;
        _this.precedence = precedence;
        _this.id = id;
        return _this;
    }
    InfixRDeclaration.prototype.simplify = function () {
        return this;
    };
    InfixRDeclaration.prototype.elaborate = function (state) {
        return state;
    };
    InfixRDeclaration.prototype.evaluate = function (state) {
        for (var i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], this.precedence, true, true);
        }
        return [state, false, undefined];
    };
    InfixRDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = 'infixr';
        res += ' ' + this.precedence;
        for (var i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    };
    return InfixRDeclaration;
}(Declaration));
exports.InfixRDeclaration = InfixRDeclaration;
var NonfixDeclaration = (function (_super) {
    __extends(NonfixDeclaration, _super);
    // nonfix <d> vid1 .. vidn
    function NonfixDeclaration(position, operators, id) {
        if (id === void 0) { id = 0; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.operators = operators;
        _this.id = id;
        return _this;
    }
    NonfixDeclaration.prototype.simplify = function () {
        return this;
    };
    NonfixDeclaration.prototype.elaborate = function (state) {
        return state;
    };
    NonfixDeclaration.prototype.evaluate = function (state) {
        for (var i = 0; i < this.operators.length; ++i) {
            state.setInfixStatus(this.operators[i], 0, false, false);
        }
        return [state, false, undefined];
    };
    NonfixDeclaration.prototype.prettyPrint = function (indentation, oneLine) {
        var res = 'nonfix';
        for (var i = 0; i < this.operators.length; ++i) {
            res += ' ' + this.operators[i].getText();
        }
        return res + ';';
    };
    return NonfixDeclaration;
}(Declaration));
exports.NonfixDeclaration = NonfixDeclaration;
// Value Bundings
var ValueBinding = (function () {
    // <rec> pattern = expression
    function ValueBinding(position, isRecursive, pattern, expression) {
        this.position = position;
        this.isRecursive = isRecursive;
        this.pattern = pattern;
        this.expression = expression;
    }
    ValueBinding.prototype.prettyPrint = function (indentation, oneLine) {
        var res = '';
        if (this.isRecursive) {
            res += 'rec ';
        }
        res += this.pattern.prettyPrint(indentation, oneLine);
        res += ' = ';
        return res + this.expression.prettyPrint(indentation, oneLine);
    };
    // Returns [ VE | undef, Excep | undef]
    ValueBinding.prototype.compute = function (state) {
        var v = this.expression.compute(state);
        if (v[1]) {
            return [undefined, v[0]];
        }
        return [this.pattern.matches(state, v[0]), undefined];
    };
    return ValueBinding;
}());
exports.ValueBinding = ValueBinding;
var FunctionValueBinding = (function () {
    function FunctionValueBinding(position, parameters, name) {
        this.position = position;
        this.parameters = parameters;
        this.name = name;
    }
    FunctionValueBinding.prototype.simplify = function () {
        if (this.name === undefined) {
            throw new errors_1.InternalInterpreterError(this.position, 'This function isn\'t ready to be simplified yet.');
        }
        // Build the case analysis, starting with the (vid1,...,vidn)
        var arr = [];
        var matches = [];
        for (var i = 0; i < this.parameters[0][0].length; ++i) {
            arr.push(new expressions_1.ValueIdentifier(-1, new lexer_1.IdentifierToken('__arg' + i, -1)));
        }
        for (var i = 0; i < this.parameters.length; ++i) {
            var pat2 = void 0;
            if (this.parameters[i][0].length === 1) {
                pat2 = this.parameters[i][0][0];
            }
            else {
                pat2 = new expressions_1.Tuple(-1, this.parameters[i][0]);
            }
            if (this.parameters[i][1] === undefined) {
                matches.push([pat2, this.parameters[i][2]]);
            }
            else {
                matches.push([pat2,
                    new expressions_1.TypedExpression(-1, this.parameters[i][2], this.parameters[i][1])]);
            }
        }
        var pat;
        if (arr.length !== 1) {
            pat = new expressions_1.Tuple(-1, arr).simplify();
        }
        else {
            pat = arr[0];
        }
        var mat = new expressions_1.Match(-1, matches);
        var exp;
        //        if (arr.length === 1) {
        //    exp = new Lambda(-1, mat);
        // } else {
        exp = new expressions_1.CaseAnalysis(-1, pat, mat);
        // Now build the lambdas around
        for (var i = this.parameters[0][0].length - 1; i >= 0; --i) {
            exp = new expressions_1.Lambda(-1, new expressions_1.Match(-1, [[
                    new expressions_1.ValueIdentifier(-1, new lexer_1.IdentifierToken('__arg' + i, -1)),
                    exp
                ]]));
        }
        // }
        return new ValueBinding(this.position, true, this.name, exp.simplify());
    };
    FunctionValueBinding.prototype.prettyPrint = function (indentation, oneLine) {
        var res = '';
        for (var i = 0; i < this.parameters.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.name.name.getText();
            for (var j = 0; j < this.parameters[i][0].length; ++j) {
                res += ' ' + this.parameters[i][0][j].prettyPrint(indentation, oneLine);
            }
            if (this.parameters[i][1] !== undefined) {
                res += ': ' + this.parameters[i][1].prettyPrint();
            }
            res += ' = ' + this.parameters[i][2].prettyPrint(indentation, oneLine);
        }
        return res;
    };
    return FunctionValueBinding;
}());
exports.FunctionValueBinding = FunctionValueBinding;
// Type Bindings
var TypeBinding = (function () {
    // typeVariableSequence name = type
    function TypeBinding(position, typeVariableSequence, name, type) {
        this.position = position;
        this.typeVariableSequence = typeVariableSequence;
        this.name = name;
        this.type = type;
    }
    return TypeBinding;
}());
exports.TypeBinding = TypeBinding;
// Datatype Bindings
var DatatypeBinding = (function () {
    // typeVariableSequence name = <op> constructor <of type>
    // type: [constructorName, <type>]
    function DatatypeBinding(position, typeVariableSequence, name, type) {
        this.position = position;
        this.typeVariableSequence = typeVariableSequence;
        this.name = name;
        this.type = type;
    }
    DatatypeBinding.prototype.compute = function (state) {
        var connames = [];
        var ve = [];
        for (var i = 0; i < this.type.length; ++i) {
            var numArg = 0;
            if (this.type[i][1] !== undefined) {
                numArg = 1;
            }
            var id = state.getValueIdentifierId(this.type[i][0].getText());
            state.incrementValueIdentifierId(this.type[i][0].getText());
            ve.push([this.type[i][0].getText(), new values_1.ValueConstructor(this.type[i][0].getText(), numArg, id)]);
            connames.push(this.type[i][0].getText());
        }
        return [ve, [this.name.getText(), connames]];
    };
    return DatatypeBinding;
}());
exports.DatatypeBinding = DatatypeBinding;
var DirectExceptionBinding = (function () {
    // <op> name <of type>
    function DirectExceptionBinding(position, name, type) {
        this.position = position;
        this.name = name;
        this.type = type;
    }
    DirectExceptionBinding.prototype.elaborate = function (state) {
        if (this.type !== undefined) {
            var tyvars_1 = [];
            this.type.getTypeVariables(true).forEach(function (val) {
                if (val.kill() instanceof types_1.TypeVariable) {
                    tyvars_1.push(val);
                }
            });
            if (tyvars_1.length > 0) {
                throw errors_1.ElaborationError.getUnguarded(this.position, tyvars_1);
            }
            state.setStaticValue(this.name.getText(), new types_1.FunctionType(this.type.simplify(), new types_1.CustomType('exn')));
        }
        else {
            state.setStaticValue(this.name.getText(), new types_1.CustomType('exn'));
        }
        return state;
    };
    DirectExceptionBinding.prototype.evaluate = function (state) {
        var numArg = 0;
        if (this.type !== undefined) {
            numArg = 1;
        }
        var id = state.getValueIdentifierId(this.name.getText());
        state.incrementValueIdentifierId(this.name.getText());
        if (state.getRebindStatus(this.name.getText()) === state_1.RebindStatus.Never) {
            throw new errors_1.EvaluationError(this.position, 'You simply cannot rebind "'
                + this.name.getText() + '".');
        }
        state.setDynamicValue(this.name.getText(), new values_1.ExceptionConstructor(this.name.getText(), numArg, id));
        return [state, false, undefined];
    };
    return DirectExceptionBinding;
}());
exports.DirectExceptionBinding = DirectExceptionBinding;
var ExceptionAlias = (function () {
    // <op> name = <op> oldname
    function ExceptionAlias(position, name, oldname) {
        this.position = position;
        this.name = name;
        this.oldname = oldname;
    }
    ExceptionAlias.prototype.elaborate = function (state) {
        var res = state.getStaticValue(this.oldname.getText());
        if (res === undefined) {
            throw new errors_1.ElaborationError(this.position, 'Unbound value identifier "'
                + this.oldname.getText() + '".');
        }
        state.setStaticValue(this.name.getText(), res);
        return state;
    };
    ExceptionAlias.prototype.evaluate = function (state) {
        var res = state.getDynamicValue(this.oldname.getText());
        if (res === undefined) {
            throw new errors_1.EvaluationError(this.position, 'Unbound value identifier "'
                + this.oldname.getText() + '".');
        }
        state.setDynamicValue(this.name.getText(), res);
        return [state, false, undefined];
    };
    return ExceptionAlias;
}());
exports.ExceptionAlias = ExceptionAlias;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(2);
var declarations_1 = __webpack_require__(6);
var lexer_1 = __webpack_require__(1);
var state_1 = __webpack_require__(4);
var errors_1 = __webpack_require__(0);
var values_1 = __webpack_require__(3);
var parser_1 = __webpack_require__(5);
var Expression = (function () {
    function Expression() {
    }
    Expression.prototype.getType = function (state) {
        throw new errors_1.InternalInterpreterError(this.position, 'Called "getType" on a derived form.');
    };
    // Computes the value of an expression, returns [computed value, is thrown exception]
    Expression.prototype.compute = function (state) {
        throw new errors_1.InternalInterpreterError(this.position, 'Called "getValue" on a derived form.');
    };
    Expression.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        throw new errors_1.InternalInterpreterError(this.position, 'I don\'t want to be printed.');
    };
    return Expression;
}());
exports.Expression = Expression;
var Constant = (function (_super) {
    __extends(Constant, _super);
    function Constant(position, token) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.token = token;
        return _this;
    }
    Constant.prototype.matches = function (state, v) {
        if (this.compute(state)[0].equals(v)) {
            return [];
        }
        else {
            return undefined;
        }
    };
    Constant.prototype.getType = function (state) {
        if (this.token instanceof lexer_1.IntegerConstantToken || this.token instanceof lexer_1.NumericToken) {
            return [new types_1.CustomType('int')];
        }
        else if (this.token instanceof lexer_1.RealConstantToken) {
            return [new types_1.CustomType('real')];
        }
        else if (this.token instanceof lexer_1.WordConstantToken) {
            return [new types_1.CustomType('word')];
        }
        else if (this.token instanceof lexer_1.CharacterConstantToken) {
            return [new types_1.CustomType('char')];
        }
        else if (this.token instanceof lexer_1.StringConstantToken) {
            return [new types_1.CustomType('string')];
        }
        else {
            throw new errors_1.InternalInterpreterError(this.token.position, '"' + this.prettyPrint() + '" does not seem to be a valid constant.');
        }
    };
    Constant.prototype.simplify = function () { return this; };
    Constant.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return this.token.getText();
    };
    Constant.prototype.compute = function (state) {
        if (this.token instanceof lexer_1.IntegerConstantToken || this.token instanceof lexer_1.NumericToken) {
            return [new values_1.Integer(this.token.value), false];
        }
        else if (this.token instanceof lexer_1.RealConstantToken) {
            return [new values_1.Real(this.token.value), false];
        }
        else if (this.token instanceof lexer_1.WordConstantToken) {
            return [new values_1.Word(this.token.value), false];
        }
        else if (this.token instanceof lexer_1.CharacterConstantToken) {
            return [new values_1.CharValue(this.token.value), false];
        }
        else if (this.token instanceof lexer_1.StringConstantToken) {
            return [new values_1.StringValue(this.token.value), false];
        }
        throw new errors_1.EvaluationError(this.token.position, 'You sure that this is a constant?');
    };
    return Constant;
}(Expression));
exports.Constant = Constant;
var ValueIdentifier = (function (_super) {
    __extends(ValueIdentifier, _super);
    // op longvid or longvid
    function ValueIdentifier(position, name) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.name = name;
        return _this;
    }
    ValueIdentifier.prototype.matches = function (state, v) {
        var res = state.getDynamicValue(this.name.getText());
        if (res === undefined || state.getRebindStatus(this.name.getText()) === state_1.RebindStatus.Allowed) {
            return [[this.name.getText(), v]];
        }
        if (v.equals(res)) {
            return [];
        }
        return undefined;
    };
    ValueIdentifier.prototype.simplify = function () { return this; };
    ValueIdentifier.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        // TODO
        return this.name.getText();
    };
    ValueIdentifier.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    ValueIdentifier.prototype.compute = function (state) {
        var res = state.getDynamicValue(this.name.getText());
        if (res === undefined) {
            throw new errors_1.EvaluationError(this.position, 'Unbound value identifier "'
                + this.name.getText() + '".');
        }
        if (res instanceof values_1.ValueConstructor
            && res.numArgs === 0) {
            res = res.construct();
        }
        if (res instanceof values_1.ExceptionConstructor
            && res.numArgs === 0) {
            res = res.construct();
        }
        return [res, false];
    };
    return ValueIdentifier;
}(Expression));
exports.ValueIdentifier = ValueIdentifier;
var Record = (function (_super) {
    __extends(Record, _super);
    // { lab = exp, ... } or { }
    // a record(pattern) is incomplete if it ends with '...'
    function Record(position, complete, entries) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.complete = complete;
        _this.entries = entries;
        _this.entries.sort();
        for (var i = 1; i < _this.entries.length; ++i) {
            if (_this.entries[i][0] === _this.entries[i - 1][0]) {
                throw new errors_1.ElaborationError(_this.position, 'Label "' + _this.entries[i][0] + '" occurs more than once in the same record.');
            }
        }
        return _this;
    }
    Record.prototype.matches = function (state, v) {
        if (!(v instanceof values_1.RecordValue)) {
            return undefined;
        }
        if (this.complete && this.entries.length !== v.entries.size) {
            return undefined;
        }
        var res = [];
        for (var i = 0; i < this.entries.length; ++i) {
            if (!v.hasValue(this.entries[i][0])) {
                return undefined;
            }
            var cur = this.entries[i][1].matches(state, v.getValue(this.entries[i][0]));
            if (cur === undefined) {
                return cur;
            }
            for (var j = 0; j < cur.length; ++j) {
                res.push(cur[j]);
            }
        }
        return res;
    };
    Record.prototype.getType = function (state) {
        throw new Error('nyian');
        /* let e: Map<string, Type> = new Map<string, Type>();
        for (let i: number = 0; i < this.entries.length; ++i) {
            let name: string = this.entries[i][0];
            let exp: Expression = this.entries[i][1];
            if (e.has(name)) {
                throw new ElaborationError(this.position,
                    'Label "' + name + '" occurs more than once in the same record.');
            }
            e.set(name, exp.getType(state));
        }
        return [new RecordType(e, this.complete)]; */
    };
    Record.prototype.simplify = function () {
        var newEntries = [];
        for (var i = 0; i < this.entries.length; ++i) {
            var e = this.entries[i];
            newEntries.push([e[0], e[1].simplify()]);
        }
        return new Record(this.position, this.complete, newEntries);
    };
    Record.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var result = '{';
        var first = true;
        for (var i = 0; i < this.entries.length; ++i) {
            if (!first) {
                result += ', ';
            }
            first = false;
            result += this.entries[i][0] + ' = '
                + this.entries[i][1].prettyPrint(indentation, oneLine);
        }
        if (!this.complete) {
            if (!first) {
                result += ', ';
            }
            result += '...';
        }
        return result + '}';
    };
    Record.prototype.compute = function (state) {
        var nentr = new Map();
        for (var i = 0; i < this.entries.length; ++i) {
            var res = this.entries[i][1].compute(state);
            if (res[1]) {
                // Computing some expression failed
                return res;
            }
            nentr = nentr.set(this.entries[i][0], res[0]);
        }
        return [new values_1.RecordValue(nentr), false];
    };
    return Record;
}(Expression));
exports.Record = Record;
var LocalDeclarationExpression = (function (_super) {
    __extends(LocalDeclarationExpression, _super);
    // let dec in exp1; ...; expn end
    // A sequential expression exp1; ... ; expn is represented as such,
    // despite the potentially missing parentheses
    function LocalDeclarationExpression(position, declaration, expression) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.declaration = declaration;
        _this.expression = expression;
        return _this;
    }
    LocalDeclarationExpression.prototype.simplify = function () {
        return new LocalDeclarationExpression(this.position, this.declaration.simplify(), this.expression.simplify());
    };
    LocalDeclarationExpression.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = 'let ' + this.declaration.prettyPrint(indentation, oneLine);
        res += ' in ' + this.expression.prettyPrint(indentation, oneLine) + ' end';
        return res;
    };
    LocalDeclarationExpression.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    LocalDeclarationExpression.prototype.compute = function (state) {
        var nstate = state.getNestedState(false, state.id);
        var res = this.declaration.evaluate(nstate);
        if (res[1]) {
            return [res[2], true];
        }
        return this.expression.compute(res[0]);
    };
    return LocalDeclarationExpression;
}(Expression));
exports.LocalDeclarationExpression = LocalDeclarationExpression;
var TypedExpression = (function (_super) {
    __extends(TypedExpression, _super);
    // expression: type (L)
    function TypedExpression(position, expression, typeAnnotation) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expression = expression;
        _this.typeAnnotation = typeAnnotation;
        return _this;
    }
    TypedExpression.prototype.matches = function (state, v) {
        return this.expression.matches(state, v);
    };
    TypedExpression.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    TypedExpression.prototype.simplify = function () {
        return new TypedExpression(this.position, this.expression.simplify(), this.typeAnnotation.simplify());
    };
    TypedExpression.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '( ' + this.expression.prettyPrint(indentation, oneLine);
        res += ': ' + this.typeAnnotation.prettyPrint();
        return res + ' )';
    };
    TypedExpression.prototype.compute = function (state) {
        return this.expression.compute(state);
    };
    return TypedExpression;
}(Expression));
exports.TypedExpression = TypedExpression;
// May represent either a function application or a constructor with an argument
var FunctionApplication = (function (_super) {
    __extends(FunctionApplication, _super);
    // function argument
    function FunctionApplication(position, func, argument) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.func = func;
        _this.argument = argument;
        return _this;
    }
    FunctionApplication.prototype.matches = function (state, v) {
        if (v instanceof values_1.FunctionValue) {
            throw new errors_1.EvaluationError(this.position, 'You simply cannot match function values.');
        }
        else if (v instanceof values_1.ConstructedValue) {
            if (this.func instanceof ValueIdentifier
                && this.func.name.getText()
                    === v.constructorName) {
                if (v.argument !== undefined) {
                    return this.argument.matches(state, v.argument);
                }
                return [];
            }
            return undefined;
        }
        else if (v instanceof values_1.ExceptionValue) {
            if (this.func instanceof ValueIdentifier
                && this.func.name.getText()
                    === v.constructorName) {
                if (v.argument !== undefined) {
                    return this.argument.matches(state, v.argument);
                }
                return [];
            }
            return undefined;
        }
        else if (v instanceof values_1.PredefinedFunction) {
            throw new errors_1.EvaluationError(this.position, 'You simply cannot match predefined functions.');
        }
        throw new errors_1.EvaluationError(this.position, 'Help me, I\'m broken. ('
            + v.constructor.name + ').');
    };
    FunctionApplication.prototype.getType = function (state) {
        /* let f: Type = this.func.getType(state);
        let arg: Type = this.argument.getType(state);
        if (f instanceof FunctionType) {
            f.parameterType.unify(arg, state, this.argument.position);
            return f.returnType;
        } else { */
        throw new errors_1.ElaborationError(this.func.position, this.func.prettyPrint() + ' is not a function.');
        // }
    };
    FunctionApplication.prototype.simplify = function () {
        return new FunctionApplication(this.position, this.func.simplify(), this.argument.simplify());
    };
    FunctionApplication.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '( ' + this.func.prettyPrint(indentation, oneLine);
        res += ' ' + this.argument.prettyPrint(indentation, oneLine);
        return res + ' )';
    };
    FunctionApplication.prototype.compute = function (state) {
        var funcVal = this.func.compute(state);
        if (funcVal[1]) {
            // computing the function failed
            return funcVal;
        }
        var argVal = this.argument.compute(state);
        if (argVal[1]) {
            return argVal;
        }
        if (funcVal[0] instanceof values_1.FunctionValue) {
            return funcVal[0].compute(argVal[0]);
        }
        else if (funcVal[0] instanceof values_1.ValueConstructor) {
            return [funcVal[0].construct(argVal[0]), false];
        }
        else if (funcVal[0] instanceof values_1.ExceptionConstructor) {
            return [funcVal[0].construct(argVal[0]), false];
        }
        else if (funcVal[0] instanceof values_1.PredefinedFunction) {
            return funcVal[0].apply(argVal[0]);
        }
        throw new errors_1.EvaluationError(this.position, 'Cannot evaluate the function "'
            + this.func.prettyPrint() + '" (' + funcVal[0].constructor.name + ').');
    };
    return FunctionApplication;
}(Expression));
exports.FunctionApplication = FunctionApplication;
var HandleException = (function (_super) {
    __extends(HandleException, _super);
    // expression handle match
    function HandleException(position, expression, match) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expression = expression;
        _this.match = match;
        return _this;
    }
    HandleException.prototype.simplify = function () {
        return new HandleException(this.position, this.expression.simplify(), this.match.simplify());
    };
    HandleException.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '( ( ' + this.expression.prettyPrint(indentation, oneLine) + ' )';
        res += ' handle ' + this.match.prettyPrint(indentation, oneLine) + ' )';
        return res;
    };
    HandleException.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    HandleException.prototype.compute = function (state) {
        var res = this.expression.compute(state);
        if (res[1]) {
            var next = this.match.compute(state, res[0]);
            if (!next[1] || !next[0].equals(new values_1.ExceptionValue('Match', undefined, 0))) {
                // Exception got handled
                return next;
            }
        }
        return res;
    };
    return HandleException;
}(Expression));
exports.HandleException = HandleException;
var RaiseException = (function (_super) {
    __extends(RaiseException, _super);
    // raise expression
    function RaiseException(position, expression) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expression = expression;
        return _this;
    }
    RaiseException.prototype.simplify = function () {
        return new RaiseException(this.position, this.expression.simplify());
    };
    RaiseException.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return 'raise ' + this.expression.prettyPrint(indentation, oneLine);
    };
    RaiseException.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    RaiseException.prototype.compute = function (state) {
        var res = this.expression.compute(state);
        if (!(res[0] instanceof values_1.ExceptionValue)) {
            throw new errors_1.EvaluationError(this.position, 'Cannot "raise" value of type "' + res.constructor.name
                + '" (type must be "exn").');
        }
        return [res[0], true];
    };
    return RaiseException;
}(Expression));
exports.RaiseException = RaiseException;
var Lambda = (function (_super) {
    __extends(Lambda, _super);
    // fn match
    function Lambda(position, match) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.match = match;
        return _this;
    }
    Lambda.prototype.simplify = function () {
        return new Lambda(this.position, this.match.simplify());
    };
    Lambda.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        // TODO
        return '( fn ' + this.match.prettyPrint(indentation, oneLine) + ' )';
    };
    Lambda.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    Lambda.prototype.compute = function (state) {
        // TODO thoroughly test that not nesting here suffices
        // let nstate = state.getNestedState(true, state.id);
        return [new values_1.FunctionValue(state, [], this.match), false];
    };
    return Lambda;
}(Expression));
exports.Lambda = Lambda;
// Matches
var Match = (function () {
    // pat => exp or pat => exp | match
    function Match(position, matches) {
        this.position = position;
        this.matches = matches;
    }
    Match.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '';
        for (var i = 0; i < this.matches.length; ++i) {
            if (i > 0) {
                res += ' | ';
            }
            res += this.matches[i][0].prettyPrint(indentation, oneLine);
            res += ' => ' + this.matches[i][1].prettyPrint(indentation, oneLine);
        }
        return res;
    };
    Match.prototype.compute = function (state, value) {
        for (var i = 0; i < this.matches.length; ++i) {
            var nstate = state.getNestedState(false, state.id);
            var res = this.matches[i][0].matches(nstate, value);
            if (res !== undefined) {
                for (var j = 0; j < res.length; ++j) {
                    nstate.setDynamicValue(res[j][0], res[j][1], true);
                }
                return this.matches[i][1].compute(nstate);
            }
        }
        return [new values_1.ExceptionValue('Match', undefined, 0), true];
    };
    Match.prototype.getType = function (state) {
        // TODO
        throw new errors_1.InternalInterpreterError(this.position, 'nyi\'an :3');
    };
    Match.prototype.simplify = function () {
        var newMatches = [];
        for (var i = 0; i < this.matches.length; ++i) {
            var m = this.matches[i];
            newMatches.push([m[0].simplify(), m[1].simplify()]);
        }
        return new Match(this.position, newMatches);
    };
    return Match;
}());
exports.Match = Match;
// Pure Patterns
var Wildcard = (function (_super) {
    __extends(Wildcard, _super);
    function Wildcard(position) {
        var _this = _super.call(this) || this;
        _this.position = position;
        return _this;
    }
    Wildcard.prototype.getType = function (state) {
        return [new types_1.TypeVariable('\'\'__wc'), new types_1.TypeVariable('\'__wc')];
    };
    Wildcard.prototype.compute = function (state) {
        throw new errors_1.InternalInterpreterError(this.position, 'Wildcards are far too wild to have a value.');
    };
    Wildcard.prototype.matches = function (state, v) {
        return [];
    };
    Wildcard.prototype.simplify = function () {
        return this;
    };
    Wildcard.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return '_';
    };
    return Wildcard;
}(Expression));
exports.Wildcard = Wildcard;
var LayeredPattern = (function (_super) {
    __extends(LayeredPattern, _super);
    // <op> identifier <:type> as pattern
    function LayeredPattern(position, identifier, typeAnnotation, pattern) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.identifier = identifier;
        _this.typeAnnotation = typeAnnotation;
        _this.pattern = pattern;
        return _this;
    }
    LayeredPattern.prototype.compute = function (state) {
        throw new errors_1.InternalInterpreterError(this.position, 'Layered patterns are far too layered to have a value.');
    };
    LayeredPattern.prototype.getType = function (state) {
        throw new Error('nyian');
    };
    LayeredPattern.prototype.matches = function (state, v) {
        var res = this.pattern.matches(state, v);
        if (res === undefined) {
            return res;
        }
        var result = [[this.identifier.getText(), v]];
        for (var i = 0; i < res.length; ++i) {
            result.push(res[i]);
        }
        return result;
    };
    LayeredPattern.prototype.simplify = function () {
        if (this.typeAnnotation) {
            return new LayeredPattern(this.position, this.identifier, this.typeAnnotation.simplify(), this.pattern.simplify());
        }
        else {
            return new LayeredPattern(this.position, this.identifier, undefined, this.pattern.simplify());
        }
    };
    LayeredPattern.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return this.identifier.getText() + ' as ' + this.pattern.prettyPrint(indentation, oneLine);
    };
    return LayeredPattern;
}(Expression));
exports.LayeredPattern = LayeredPattern;
// The following classes are derived forms.
// They will not be present in the simplified AST and do not implement elaborate/getType
var InfixExpression = (function (_super) {
    __extends(InfixExpression, _super);
    // operators: (op, idx), to simplify simplify
    function InfixExpression(expressions, operators) {
        var _this = _super.call(this) || this;
        _this.expressions = expressions;
        _this.operators = operators;
        return _this;
    }
    InfixExpression.prototype.matches = function (state, v) {
        return this.reParse(state).matches(state, v);
    };
    InfixExpression.prototype.simplify = function () {
        throw new errors_1.InternalInterpreterError(this.position, 'Ouch, I\'m not fully parsed.');
    };
    InfixExpression.prototype.reParse = function (state) {
        var ops = this.operators;
        var exps = this.expressions;
        var poses = [];
        for (var i = 0; i < exps.length; ++i) {
            poses.push([i]);
        }
        ops.sort(function (_a, _b) {
            var a = _a[0], p1 = _a[1];
            var b = _b[0], p2 = _b[1];
            var sta = state.getInfixStatus(a);
            var stb = state.getInfixStatus(b);
            if (sta.precedence > stb.precedence) {
                return -1;
            }
            if (sta.precedence < stb.precedence) {
                return 1;
            }
            if (sta.rightAssociative) {
                if (p1 > p2) {
                    return -1;
                }
                if (p1 < p2) {
                    return 1;
                }
            }
            else {
                if (p1 > p2) {
                    return 1;
                }
                if (p1 < p2) {
                    return -1;
                }
            }
            return 0;
        });
        // Using copy by reference to make this work whithout shrinking the array
        for (var i = 0; i < ops.length; ++i) {
            if (i > 0) {
                var info1 = state.getInfixStatus(ops[i][0]);
                var info2 = state.getInfixStatus(ops[i - 1][0]);
                if (info1.precedence === info2.precedence
                    && info1.rightAssociative !== info2.rightAssociative
                    && (poses[ops[i - 1][1] + 1] === poses[ops[i][1]]
                        || poses[ops[i - 1][1]] === poses[ops[i][1] + 1])) {
                    throw new parser_1.ParserError('Could you ever imagine left associatives '
                        + 'and right associatives living together in peace?', ops[i][0].position);
                }
            }
            var left = exps[ops[i][1]];
            var right = exps[ops[i][1] + 1];
            var com = new FunctionApplication(ops[i][0].position, new ValueIdentifier(ops[i][0].position, ops[i][0]), new Tuple(ops[i][0].position, [left, right]));
            var npos = poses[ops[i][1]];
            for (var _i = 0, _a = poses[ops[i][1] + 1]; _i < _a.length; _i++) {
                var j = _a[_i];
                npos.push(j);
            }
            for (var _b = 0, npos_1 = npos; _b < npos_1.length; _b++) {
                var j = npos_1[_b];
                poses[j] = npos;
                exps[j] = com;
            }
        }
        return exps[0];
    };
    return InfixExpression;
}(Expression));
exports.InfixExpression = InfixExpression;
var falseConstant = new ValueIdentifier(0, new lexer_1.IdentifierToken('false', 0));
var trueConstant = new ValueIdentifier(0, new lexer_1.IdentifierToken('true', 0));
var nilConstant = new ValueIdentifier(0, new lexer_1.IdentifierToken('nil', 0));
var consConstant = new ValueIdentifier(0, new lexer_1.IdentifierToken('::', 0));
var Conjunction = (function (_super) {
    __extends(Conjunction, _super);
    // leftOperand andalso rightOperand
    function Conjunction(position, leftOperand, rightOperand) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.leftOperand = leftOperand;
        _this.rightOperand = rightOperand;
        return _this;
    }
    Conjunction.prototype.simplify = function () {
        return new Conditional(this.position, this.leftOperand, this.rightOperand, falseConstant).simplify();
    };
    Conjunction.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return '( ' + this.leftOperand.prettyPrint(indentation, oneLine) + ' andalso '
            + this.rightOperand.prettyPrint(indentation, oneLine) + ' )';
    };
    return Conjunction;
}(Expression));
exports.Conjunction = Conjunction;
var Disjunction = (function (_super) {
    __extends(Disjunction, _super);
    // leftOperand orelse rightOperand
    function Disjunction(position, leftOperand, rightOperand) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.leftOperand = leftOperand;
        _this.rightOperand = rightOperand;
        return _this;
    }
    Disjunction.prototype.simplify = function () {
        return new Conditional(this.position, this.leftOperand, trueConstant, this.rightOperand).simplify();
    };
    Disjunction.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return '( ' + this.leftOperand.prettyPrint(indentation, oneLine) + ' orelse '
            + this.rightOperand.prettyPrint(indentation, oneLine) + ' )';
    };
    return Disjunction;
}(Expression));
exports.Disjunction = Disjunction;
var Tuple = (function (_super) {
    __extends(Tuple, _super);
    // (exp1, ..., expn), n > 1
    function Tuple(position, expressions) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expressions = expressions;
        return _this;
    }
    Tuple.prototype.matches = function (state, v) {
        return this.simplify().matches(state, v);
    };
    Tuple.prototype.simplify = function () {
        var entries = [];
        for (var i = 0; i < this.expressions.length; ++i) {
            entries.push(['' + (i + 1), this.expressions[i].simplify()]);
        }
        return new Record(this.position, true, entries);
    };
    Tuple.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '( ';
        for (var i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' )';
    };
    return Tuple;
}(Expression));
exports.Tuple = Tuple;
var List = (function (_super) {
    __extends(List, _super);
    // [exp1, ..., expn]
    function List(position, expressions) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expressions = expressions;
        return _this;
    }
    List.prototype.matches = function (state, v) {
        return this.simplify().matches(state, v);
    };
    List.prototype.simplify = function () {
        var res = nilConstant;
        for (var i = this.expressions.length - 1; i >= 0; --i) {
            var pair = new Tuple(-1, [this.expressions[i], res]).simplify();
            res = new FunctionApplication(-1, consConstant, pair);
        }
        return res;
    };
    List.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '[ ';
        for (var i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += ', ';
            }
            res += this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' ]';
    };
    return List;
}(Expression));
exports.List = List;
var Sequence = (function (_super) {
    __extends(Sequence, _super);
    // (exp1; ...; expn), n >= 2
    function Sequence(position, expressions) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expressions = expressions;
        return _this;
    }
    Sequence.prototype.simplify = function () {
        var pos = this.expressions.length - 1;
        var match = new Match(-1, [[new Wildcard(0), this.expressions[pos]]]);
        var res = new CaseAnalysis(-1, this.expressions[pos - 1], match);
        for (var i = pos - 2; i >= 0; --i) {
            match = new Match(-1, [[new Wildcard(0), res]]);
            res = new CaseAnalysis(-1, this.expressions[i], match);
        }
        return res.simplify();
    };
    Sequence.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = '( ';
        for (var i = 0; i < this.expressions.length; ++i) {
            if (i > 0) {
                res += '; ';
            }
            res += this.expressions[i].prettyPrint(indentation, oneLine);
        }
        return res + ' )';
    };
    return Sequence;
}(Expression));
exports.Sequence = Sequence;
var RecordSelector = (function (_super) {
    __extends(RecordSelector, _super);
    // #label record
    function RecordSelector(position, label) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.label = label;
        return _this;
    }
    RecordSelector.prototype.simplify = function () {
        return new Lambda(this.position, new Match(-1, [[
                new Record(-1, false, [[this.label.text, new ValueIdentifier(-1, new lexer_1.IdentifierToken('__rs', -1))]]),
                new ValueIdentifier(-1, new lexer_1.IdentifierToken('__rs', -1))
            ]]));
    };
    RecordSelector.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return '#' + this.label.getText();
    };
    return RecordSelector;
}(Expression));
exports.RecordSelector = RecordSelector;
var CaseAnalysis = (function (_super) {
    __extends(CaseAnalysis, _super);
    // case expression of match
    function CaseAnalysis(position, expression, match) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.expression = expression;
        _this.match = match;
        return _this;
    }
    CaseAnalysis.prototype.simplify = function () {
        return new FunctionApplication(this.position, new Lambda(this.position, this.match.simplify()), this.expression.simplify());
    };
    CaseAnalysis.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = 'case ' + this.expression.prettyPrint(indentation, oneLine);
        res += ' of ' + this.match.prettyPrint(indentation, oneLine);
        return res;
    };
    return CaseAnalysis;
}(Expression));
exports.CaseAnalysis = CaseAnalysis;
var Conditional = (function (_super) {
    __extends(Conditional, _super);
    // if condition then consequence else alternative
    function Conditional(position, condition, consequence, alternative) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.condition = condition;
        _this.consequence = consequence;
        _this.alternative = alternative;
        return _this;
    }
    Conditional.prototype.simplify = function () {
        var match = new Match(this.position, [[trueConstant, this.consequence],
            [falseConstant, this.alternative]]);
        return new CaseAnalysis(this.position, this.condition, match).simplify();
    };
    Conditional.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        var res = 'if ' + this.condition.prettyPrint(indentation, oneLine);
        res += ' then ' + this.consequence.prettyPrint(indentation, oneLine);
        res += ' else ' + this.alternative.prettyPrint(indentation, oneLine);
        return res;
    };
    return Conditional;
}(Expression));
exports.Conditional = Conditional;
var While = (function (_super) {
    __extends(While, _super);
    // while exp do exp
    function While(position, condition, body) {
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.condition = condition;
        _this.body = body;
        return _this;
    }
    While.prototype.simplify = function () {
        var nm = new ValueIdentifier(this.position, new lexer_1.IdentifierToken('__whl', this.position));
        var fapp = new FunctionApplication(this.position, nm, new Tuple(this.position, []));
        var cond = new Conditional(this.position, this.condition, new Sequence(this.position, [this.body, fapp]), new Tuple(this.position, []));
        var valbnd = new declarations_1.ValueBinding(this.position, true, nm, new Lambda(this.position, new Match(this.position, [[new Tuple(this.position, []), cond]])));
        var dec = new declarations_1.ValueDeclaration(this.position, [], [valbnd]);
        return new LocalDeclarationExpression(this.position, dec, fapp).simplify();
    };
    While.prototype.prettyPrint = function (indentation, oneLine) {
        if (indentation === void 0) { indentation = 0; }
        if (oneLine === void 0) { oneLine = true; }
        return '( while ' + this.condition.prettyPrint(indentation, oneLine)
            + ' do ' + this.body.prettyPrint(indentation, oneLine) + ' )';
    };
    return While;
}(Expression));
exports.While = While;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*

This file is the main entry point for the interpreter.
It should only contain logic required to provide the API to the frontend (backend).
All required modules should be included at the top, for example if the main interpreter class
is located in the file interpreter.ts:

import Interpreter = require("./interpreter");
// Do stuff with Interpreter
let instance = new Interpreter();
let AST = instance.lexParse(..code..);
...

*/
Object.defineProperty(exports, "__esModule", { value: true });
var initialState_1 = __webpack_require__(9);
var stdlib_1 = __webpack_require__(10);
var Lexer = __webpack_require__(1);
var Parser = __webpack_require__(5);
var Interpreter = (function () {
    function Interpreter(settings) {
        this.settings = settings;
    }
    /* Think of some additional flags n stuff etc */
    Interpreter.interpret = function (nextInstruction, oldState, allowLongFunctionNames) {
        if (oldState === void 0) { oldState = initialState_1.getInitialState(); }
        if (allowLongFunctionNames === void 0) { allowLongFunctionNames = false; }
        var state = oldState.getNestedState();
        var tkn = Lexer.lex(nextInstruction);
        if (allowLongFunctionNames) {
            // this is only a replacement until we have the module language,
            // so we can implement all testcases from the book
            // TODO remove
            var newTkn = [];
            for (var _i = 0, tkn_1 = tkn; _i < tkn_1.length; _i++) {
                var t = tkn_1[_i];
                if (t instanceof Lexer.LongIdentifierToken) {
                    newTkn.push(new Lexer.IdentifierToken(t.getText(), t.position));
                }
                else {
                    newTkn.push(t);
                }
            }
            tkn = newTkn;
        }
        var ast = Parser.parse(tkn, state);
        state = oldState.getNestedState();
        ast = ast.simplify();
        state = ast.elaborate(state);
        // Use a fresh state to be able to piece types and values together
        var res = ast.evaluate(oldState.getNestedState());
        if (res[1]) {
            return res;
        }
        var curState = res[0];
        while (curState.id > oldState.id) {
            if (curState.dynamicBasis !== undefined) {
                // For every new bound value, try to find its type
                for (var i in curState.dynamicBasis.valueEnvironment) {
                    if (Object.prototype.hasOwnProperty.call(curState.dynamicBasis.valueEnvironment, i)) {
                        var tp = state.getStaticValue(i, undefined, curState.id);
                        if (tp !== undefined) {
                            curState.setStaticValue(i, tp);
                        }
                    }
                }
                // For every new bound type, try to find its type
                for (var i in curState.dynamicBasis.typeEnvironment) {
                    if (Object.prototype.hasOwnProperty.call(curState.dynamicBasis.typeEnvironment, i)) {
                        var tp = state.getStaticType(i, undefined, curState.id);
                        if (tp !== undefined) {
                            curState.setStaticType(i, tp.type, tp.constructors);
                        }
                    }
                }
            }
            if (state.parent === undefined) {
                break;
            }
            curState = curState.parent;
            while (state.id > curState.id && state.parent !== undefined) {
                state = state.parent;
            }
        }
        return res;
    };
    Interpreter.getFirstState = function (withStdLib) {
        if (withStdLib) {
            return stdlib_1.addStdLib(initialState_1.getInitialState());
        }
        return initialState_1.getInitialState();
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var state_1 = __webpack_require__(4);
var types_1 = __webpack_require__(2);
var values_1 = __webpack_require__(3);
var errors_1 = __webpack_require__(0);
// Initial static basis (see SML Definition, appendix C through E)
// let intType = new CustomType('int');
var realType = new types_1.CustomType('real');
// let wordType = new CustomType('word');
var boolType = new types_1.CustomType('bool');
var stringType = new types_1.CustomType('string');
var charType = new types_1.CustomType('char');
function functionType(type) {
    return new types_1.FunctionType(new types_1.TupleType([type, type]), type).simplify();
}
function bfunctionType(type) {
    return new types_1.FunctionType(new types_1.TupleType([type, type]), boolType).simplify();
}
var typeVar = new types_1.TypeVariable('\'a');
var eqTypeVar = new types_1.TypeVariable('\'\'b');
var intWordType = new types_1.TypeVariable('*iw', true, 0, [new types_1.CustomType('int'), new types_1.CustomType('word')]);
var intRealType = new types_1.TypeVariable('*ir', true, 0, [new types_1.CustomType('int'), new types_1.CustomType('real')]);
var intWordRealType = new types_1.TypeVariable('*iwr', true, 0, [new types_1.CustomType('int'), new types_1.CustomType('word'),
    new types_1.CustomType('real')]);
var anyType = new types_1.TypeVariable('*any', true, 0, [new types_1.CustomType('int'), new types_1.CustomType('word'),
    new types_1.CustomType('real'), new types_1.CustomType('string'), new types_1.CustomType('char')]);
var initialState = new state_1.State(0, undefined, new state_1.StaticBasis({
    'unit': [new state_1.TypeInformation(new types_1.FunctionType(new types_1.TupleType([]), new types_1.TupleType([])).simplify(), []), false],
    'bool': [new state_1.TypeInformation(new types_1.CustomType('bool'), ['true', 'false']), false],
    'int': [new state_1.TypeInformation(new types_1.CustomType('int'), []), false],
    'word': [new state_1.TypeInformation(new types_1.CustomType('word'), []), false],
    'real': [new state_1.TypeInformation(new types_1.CustomType('real'), []), false],
    'string': [new state_1.TypeInformation(new types_1.CustomType('string'), []), false],
    'char': [new state_1.TypeInformation(new types_1.CustomType('char'), []), false],
    'list': [new state_1.TypeInformation(new types_1.CustomType('list', [typeVar]), ['nil', '::']), false],
    'ref': [new state_1.TypeInformation(new types_1.CustomType('ref', [typeVar]), ['ref']), false],
    'exn': [new state_1.TypeInformation(new types_1.CustomType('exn'), []), false]
}, {
    'div': [functionType(intWordType), false],
    'mod': [functionType(intWordType), false],
    '*': [functionType(intWordRealType), false],
    '/': [functionType(realType), false],
    '+': [functionType(intWordRealType), false],
    '-': [functionType(intWordRealType), false],
    '<': [bfunctionType(anyType), false],
    '<=': [bfunctionType(anyType), false],
    '>': [bfunctionType(anyType), false],
    '>=': [bfunctionType(anyType), false],
    '=': [new types_1.FunctionType(new types_1.TupleType([eqTypeVar, eqTypeVar]), boolType).simplify(), false],
    '<>': [new types_1.FunctionType(new types_1.TupleType([eqTypeVar, eqTypeVar]), boolType).simplify(), false],
    // ':='
    // 'ref': new ValueIdentifier(new FunctionType(typeVar, new CustomType('ref', typeVar)),
    'true': [new types_1.CustomType('bool'), false],
    'false': [new types_1.CustomType('bool'), false],
    'nil': [new types_1.CustomType('list', [typeVar]), false],
    '::': [new types_1.FunctionType(new types_1.TupleType([typeVar, new types_1.CustomType('list', [typeVar])]), new types_1.CustomType('list', [typeVar])).simplify(), false],
    'Match': [new types_1.CustomType('exn'), false],
    'Bind': [new types_1.CustomType('exn'), false],
    'Div': [new types_1.CustomType('exn'), false],
    'Overflow': [new types_1.CustomType('exn'), false],
    '^': [functionType(stringType), false],
    'explode': [new types_1.FunctionType(stringType, new types_1.CustomType('list', [charType])).simplify(), false],
    'implode': [new types_1.FunctionType(new types_1.CustomType('list', [charType]), stringType).simplify(), false],
    '~': [new types_1.FunctionType(intRealType, intRealType), false],
    'abs': [new types_1.FunctionType(intRealType, intRealType), false],
}), new state_1.DynamicBasis({
    'unit': [[], false],
    'bool': [['true', 'false'], false],
    'int': [[], false],
    'word': [[], false],
    'real': [[], false],
    'string': [[], false],
    'char': [[], false],
    'list': [['nil', '::'], false],
    'ref': [['ref'], false],
    'exn': [[], false],
}, {
    'div': [new values_1.PredefinedFunction('div', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    if (val2.value === 0) {
                        return [new values_1.ExceptionConstructor('Div').construct(), true];
                    }
                    return [val1.divide(val2), false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    if (val2.value === 0) {
                        return [new values_1.ExceptionConstructor('Div').construct(), true];
                    }
                    return [val1.divide(val2), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "div" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    'mod': [new values_1.PredefinedFunction('mod', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    if (val2.value === 0) {
                        return [new values_1.ExceptionConstructor('Div').construct(), true];
                    }
                    return [val1.modulo(val2), false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    if (val2.value === 0) {
                        return [new values_1.ExceptionConstructor('Div').construct(), true];
                    }
                    return [val1.modulo(val2), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "mod" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '*': [new values_1.PredefinedFunction('*', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    var result = val1.multiply(val2);
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    var result = val1.multiply(val2);
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    var result = val1.multiply(val2);
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "*" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '/': [new values_1.PredefinedFunction('/', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    if (val2.value === 0) {
                        return [new values_1.ExceptionConstructor('Div').construct(), true];
                    }
                    return [val1.divide(val2), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "/" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '+': [new values_1.PredefinedFunction('+', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    var result = val1.add(val2);
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    var result = val1.add(val2);
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    var result = val1.add(val2);
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "+" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '-': [new values_1.PredefinedFunction('-', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    var result = val1.add(val2.negate());
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    var result = val1.add(val2.negate());
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    var result = val1.add(val2.negate());
                    if (result.hasOverflow()) {
                        return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                    }
                    return [result, false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "-" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '<': [new values_1.PredefinedFunction('<', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    return [new values_1.BoolValue(val1.compareTo(val2) < 0), false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    return [new values_1.BoolValue(val1.compareTo(val2) < 0), false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    return [new values_1.BoolValue(val1.compareTo(val2) < 0), false];
                }
                else if (val1 instanceof values_1.StringValue && val2 instanceof values_1.StringValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) < 0), false];
                }
                else if (val1 instanceof values_1.CharValue && val2 instanceof values_1.CharValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) < 0), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "<" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '>': [new values_1.PredefinedFunction('<', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    return [new values_1.BoolValue(val1.compareTo(val2) > 0), false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    return [new values_1.BoolValue(val1.compareTo(val2) > 0), false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    return [new values_1.BoolValue(val1.compareTo(val2) > 0), false];
                }
                else if (val1 instanceof values_1.StringValue && val2 instanceof values_1.StringValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) > 0), false];
                }
                else if (val1 instanceof values_1.CharValue && val2 instanceof values_1.CharValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) > 0), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called ">" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '<=': [new values_1.PredefinedFunction('<', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    return [new values_1.BoolValue(val1.compareTo(val2) <= 0), false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    return [new values_1.BoolValue(val1.compareTo(val2) <= 0), false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    return [new values_1.BoolValue(val1.compareTo(val2) <= 0), false];
                }
                else if (val1 instanceof values_1.StringValue && val2 instanceof values_1.StringValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) <= 0), false];
                }
                else if (val1 instanceof values_1.CharValue && val2 instanceof values_1.CharValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) <= 0), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "<=" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '>=': [new values_1.PredefinedFunction('<', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.Integer && val2 instanceof values_1.Integer) {
                    return [new values_1.BoolValue(val1.compareTo(val2) >= 0), false];
                }
                else if (val1 instanceof values_1.Word && val2 instanceof values_1.Word) {
                    return [new values_1.BoolValue(val1.compareTo(val2) >= 0), false];
                }
                else if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                    return [new values_1.BoolValue(val1.compareTo(val2) >= 0), false];
                }
                else if (val1 instanceof values_1.StringValue && val2 instanceof values_1.StringValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) >= 0), false];
                }
                else if (val1 instanceof values_1.CharValue && val2 instanceof values_1.CharValue) {
                    return [new values_1.BoolValue(val1.compareTo(val2) >= 0), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called ">=" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '=': [new values_1.PredefinedFunction('=', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                return [new values_1.BoolValue(val1.equals(val2)), false];
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "=" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '<>': [new values_1.PredefinedFunction('=', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                return [new values_1.BoolValue(!val1.equals(val2)), false];
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "<>" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    // ':='
    // 'ref': new ValueIdentifier(new FunctionType(typeVar, new CustomType('ref', typeVar)),
    'true': [new values_1.BoolValue(true), false],
    'false': [new values_1.BoolValue(false), false],
    'nil': [new values_1.ValueConstructor('nil').construct(), false],
    '::': [new values_1.ValueConstructor('::', 1), false],
    'Match': [new values_1.ExceptionConstructor('Match').construct(), false],
    'Bind': [new values_1.ExceptionConstructor('Bind').construct(), false],
    'Div': [new values_1.ExceptionConstructor('Div').construct(), false],
    'Overflow': [new values_1.ExceptionConstructor('Overflow').construct(), false],
    '^': [new values_1.PredefinedFunction('^', function (val) {
            if (val instanceof values_1.RecordValue) {
                var val1 = val.getValue('1');
                var val2 = val.getValue('2');
                if (val1 instanceof values_1.StringValue && val2 instanceof values_1.StringValue) {
                    return [val1.concat(val2), false];
                }
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "^" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    'explode': [new values_1.PredefinedFunction('explode', function (val) {
            if (val instanceof values_1.StringValue) {
                return [val.explode(), false];
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "explode" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    'implode': [new values_1.PredefinedFunction('implode', function (val) {
            if (val instanceof values_1.ConstructedValue) {
                return [values_1.StringValue.implode(val), false];
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "explode" on value of the wrong type (' + val.constructor.name + ').');
        }), false],
    '~': [new values_1.PredefinedFunction('~', function (val) {
            if (val instanceof values_1.Integer) {
                var result = val.negate();
                if (result.hasOverflow()) {
                    return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                }
                return [result, false];
            }
            else if (val instanceof values_1.Real) {
                var result = val.negate();
                if (result.hasOverflow()) {
                    return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                }
                return [result, false];
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "~" on something weird.');
        }), false],
    'abs': [new values_1.PredefinedFunction('~', function (val) {
            if (val instanceof values_1.Integer) {
                if (val.value >= 0) {
                    return [val, false];
                }
                var result = val.negate();
                if (result.hasOverflow()) {
                    return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                }
                return [result, false];
            }
            else if (val instanceof values_1.Real) {
                if (val.value >= 0) {
                    return [val, false];
                }
                var result = val.negate();
                if (result.hasOverflow()) {
                    return [new values_1.ExceptionConstructor('Overflow').construct(), true];
                }
                return [result, false];
            }
            throw new errors_1.InternalInterpreterError(-1, 'Called "~" on something weird.');
        }), false],
}), {
    'bool': new state_1.TypeNameInformation(0, true),
    'int': new state_1.TypeNameInformation(0, true),
    'real': new state_1.TypeNameInformation(0, false),
    'string': new state_1.TypeNameInformation(0, true),
    'char': new state_1.TypeNameInformation(0, true),
    'word': new state_1.TypeNameInformation(0, true),
    'list': new state_1.TypeNameInformation(1, true),
    'ref': new state_1.TypeNameInformation(1, true),
    'exn': new state_1.TypeNameInformation(0, false),
}, {
    'div': new state_1.InfixStatus(true, 7, false),
    'mod': new state_1.InfixStatus(true, 7, false),
    '*': new state_1.InfixStatus(true, 7, false),
    '/': new state_1.InfixStatus(true, 7, false),
    '+': new state_1.InfixStatus(true, 6, false),
    '-': new state_1.InfixStatus(true, 6, false),
    '<': new state_1.InfixStatus(true, 4, false),
    '>': new state_1.InfixStatus(true, 4, false),
    '<=': new state_1.InfixStatus(true, 4, false),
    '>=': new state_1.InfixStatus(true, 4, false),
    '::': new state_1.InfixStatus(true, 5, true),
    '=': new state_1.InfixStatus(true, 4, false),
    '<>': new state_1.InfixStatus(true, 4, false),
    ':=': new state_1.InfixStatus(true, 3, false),
    '^': new state_1.InfixStatus(true, 6, false),
}, {
    '=': state_1.RebindStatus.Never,
    'true': state_1.RebindStatus.Never,
    'false': state_1.RebindStatus.Never,
    'nil': state_1.RebindStatus.Never,
    '::': state_1.RebindStatus.Never,
    'print': state_1.RebindStatus.Never,
    'Match': state_1.RebindStatus.Half,
    'Bind': state_1.RebindStatus.Half,
    'Div': state_1.RebindStatus.Half,
    'Overflow': state_1.RebindStatus.Half,
}, {
    'nil': 1,
    '::': 1,
    'Match': 1,
    'Bind': 1,
    'Div': 1,
    'Overflow': 1
});
function getInitialState() {
    return initialState.getNestedState();
}
exports.getInitialState = getInitialState;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(2);
var values_1 = __webpack_require__(3);
var errors_1 = __webpack_require__(0);
var main_1 = __webpack_require__(8);
var intType = new types_1.CustomType('int');
var realType = new types_1.CustomType('real');
// let wordType = new CustomType('word');
// let boolType = new CustomType('bool');
// let stringType = new CustomType('string');
var charType = new types_1.CustomType('char');
function addMathLib(state) {
    state.setDynamicValue('Math.sqrt', new values_1.PredefinedFunction('Math.sqrt', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            if (value < 0) {
                return [new values_1.ExceptionConstructor('Domain').construct(), true];
            }
            return [new values_1.Real(Math.sqrt(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.sqrt', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.sin', new values_1.PredefinedFunction('Math.sin', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.sin(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.sin', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.cos', new values_1.PredefinedFunction('Math.cos', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.cos(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.cos', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.asin', new values_1.PredefinedFunction('Math.asin', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.asin(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.asin', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.acos', new values_1.PredefinedFunction('Math.acos', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.acos(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.acos', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.exp', new values_1.PredefinedFunction('Math.exp', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.exp(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.exp', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.pow', new values_1.PredefinedFunction('Math.sin', function (val) {
        if (val instanceof values_1.RecordValue) {
            var val1 = val.getValue('1');
            var val2 = val.getValue('2');
            if (val1 instanceof values_1.Real && val2 instanceof values_1.Real) {
                var value1 = val1.value;
                var value2 = val1.value;
                return [new values_1.Real(Math.pow(value1, value2)), false];
            }
            else {
                throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
            }
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.pow', new types_1.FunctionType(new types_1.TupleType([realType, realType]), realType).simplify());
    state.setDynamicValue('Math.ln', new values_1.PredefinedFunction('Math.ln', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.log(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.ln', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.log10', new values_1.PredefinedFunction('Math.log10', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            return [new values_1.Real(Math.log10(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Math.log10', new types_1.FunctionType(realType, realType));
    state.setDynamicValue('Math.pi', new values_1.Real(3.14159265359));
    state.setStaticValue('Math.pi', realType);
    state.setDynamicValue('Math.e', new values_1.Real(2.71828182846));
    state.setStaticValue('Math.e', realType);
    return state;
}
function addCharLib(state) {
    state.setDynamicValue('ord', new values_1.PredefinedFunction('ord', function (val) {
        if (val instanceof values_1.CharValue) {
            var value = val.value;
            return [new values_1.Integer(value.charCodeAt(0)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('ord', new types_1.FunctionType(charType, intType));
    state.setDynamicValue('chr', new values_1.PredefinedFunction('chr', function (val) {
        if (val instanceof values_1.Integer) {
            var value = val.value;
            if (value < 0 || value > 255) {
                return [new values_1.ExceptionConstructor('Chr').construct(), true];
            }
            return [new values_1.CharValue(String.fromCharCode(value)), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('chr', new types_1.FunctionType(intType, charType));
    return state;
}
function addRealLib(state) {
    state.setDynamicValue('Real.fromInt', new values_1.PredefinedFunction('Real.fromInt', function (val) {
        if (val instanceof values_1.Integer) {
            var value = val.value;
            return [new values_1.Real(value), false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.fromInt', new types_1.FunctionType(intType, realType));
    state.setDynamicValue('Real.round', new values_1.PredefinedFunction('Real.round', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            var integer = new values_1.Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [new values_1.ExceptionConstructor('Overflow').construct(), true];
            }
            return [integer, false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.round', new types_1.FunctionType(realType, intType));
    state.setDynamicValue('Real.floor', new values_1.PredefinedFunction('Real.floor', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            var integer = new values_1.Integer(Math.floor(value));
            if (integer.hasOverflow()) {
                return [new values_1.ExceptionConstructor('Overflow').construct(), true];
            }
            return [integer, false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.floor', new types_1.FunctionType(realType, intType));
    state.setDynamicValue('Real.ceil', new values_1.PredefinedFunction('Real.ceil', function (val) {
        if (val instanceof values_1.Real) {
            var value = val.value;
            var integer = new values_1.Integer(Math.round(value));
            if (integer.hasOverflow()) {
                return [new values_1.ExceptionConstructor('Overflow').construct(), true];
            }
            return [integer, false];
        }
        else {
            throw new errors_1.InternalInterpreterError(-1, 'std type mismatch');
        }
    }));
    state.setStaticValue('Real.ceil', new types_1.FunctionType(realType, intType));
    return state;
}
var code = "\nexception Domain;\nexception Empty;\nexception Subscript;\nexception Size;\nexception Chr;\n\nfun o (f,g) x = f (g x);\ninfix 3 o;\n\ndatatype order = LESS | EQUAL | GREATER;\n\nfun Int.compare (x, y: int) = if x<y then LESS else if x>y then GREATER else EQUAL;\nfun Real.compare (x, y: real) = if x<y then LESS else if x>y then GREATER else EQUAL;\n\nexception Option.Option;\ndatatype 'a option = NONE | SOME of 'a;\nfun valOf (SOME x) = x\n  | valOf NONE = raise Option.Option;\nfun isSome NONE = false\n  | isSome (SOME _) = true;\n\nval Int.minInt = SOME ~1073741824;\nval Int.maxInt = SOME 1073741823;\nfun Int.max (x, y) = if x < y then y else x : int;\n\nfun not true = false | not false = true;\n\nfun hd nil = raise Empty\n| hd (x::xr) = x;\nfun tl nil = raise Empty\n| tl (x::xr) = xr;\nfun null nil = true\n| null (x::xr) = false;\n\nfun map f nil = nil\n  | map f (x::xr) = (f x) :: (map f xr);\n\nfun @ (nil,ys) = ys\n| @((x::xr),ys) = x:: @(xr,ys);\ninfixr 5 @;\n\nfun length nil = 0\n  | length (x::xr) = 1 + length xr;\n\nfun rev nil = nil\n  | rev (x::xr) = rev xr @ [x];\n\nfun List.concat nil = nil\n  | List.concat (x::xr) = x @ List.concat xr;\n\nfun foldr f e []      = e\n  | foldr f e (x::xr) = f(x, foldr f e xr);\n\nfun foldl f e []      = e\n  | foldl f e (x::xr) = foldl f (f(x, e)) xr;\n\nfun List.tabulate (n, f) =\n  let fun h i = if i<n then f i :: h (i+1) else []\n  in if n<0 then raise Size else h 0 end;\n\nfun List.exists p []      = false\n  | List.exists p (x::xr) = p x orelse List.exists p xr;\n\nfun List.all p []      = true\n  | List.all p (x::xr) = p x andalso List.all p xr;\n\nfun List.filter p []      = []\n  | List.filter p (x::xr) = if p x then x :: List.filter p xr else List.filter p xr;\n\nfun List.collate (compare : 'a * 'a -> order) p = case p of\n    (nil, _::_) => LESS\n  | (nil, nil) => EQUAL\n  | (_::_, nil) => GREATER\n  | (x::xr, y::yr) => case compare(x,y) of\n         EQUAL => List.collate compare (xr,yr)\n       | s => s;\n\nfun List.nth (xs, n) =\n    let fun h []      _ = raise Subscript\n      | h (x::xr) n = if n=0 then x else h xr (n-1)\n    in if n<0 then raise Subscript else h xs n end;\n\nfun Char.isLower c  = #\"a\" <= c andalso c <= #\"z\";\nfun Char.isUpper c  = #\"A\" <= c andalso c <= #\"Z\";\nfun Char.isDigit c  = #\"0\" <= c andalso c <= #\"9\";\nfun Char.isAlpha c  = Char.isLower c orelse Char.isUpper c;\n";
function addStdLib(state) {
    state = main_1.Interpreter.interpret(code, state, true)[0];
    state = addMathLib(state);
    state = addCharLib(state);
    state = addRealLib(state);
    return state;
}
exports.addStdLib = addStdLib;


/***/ })
/******/ ]);