import { State, IdentifierStatus } from '../state';
import { FunctionType } from '../types';
import { CharValue, Integer, PredefinedFunction, Value } from '../values';
import { InternalInterpreterError } from '../errors';
import { EvaluationParameters } from '../evaluator';
import { Module, charType, intType, chrException } from '../stdlib';

function addCharLib(state: State): State {
    state.setDynamicValue('ord', new PredefinedFunction('ord', (val: Value, params: EvaluationParameters) => {
        if (val instanceof CharValue) {
            let value = (<CharValue> val).value;
            return [new Integer(value.charCodeAt(0)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    state.setStaticValue('ord', new FunctionType(charType, intType), IdentifierStatus.VALUE_VARIABLE);

    state.setDynamicValue('chr', new PredefinedFunction('chr', (val: Value, params: EvaluationParameters) => {
        if (val instanceof Integer) {
            let value = (<Integer> val).value;
            if (value < 0 || value > 255) {
                return [chrException.construct(), true, []];
            }
            return [new CharValue(String.fromCharCode(value)), false, []];
        } else {
            throw new InternalInterpreterError('std type mismatch');
        }
    }), IdentifierStatus.VALUE_VARIABLE);
    state.setStaticValue('chr', new FunctionType(intType, charType), IdentifierStatus.VALUE_VARIABLE);

    return state;
}

export let CHAR_LIB: Module = {
    'native': addCharLib,
    'code':  `structure Char = struct
        fun isLower c  = #"a" <= c andalso c <= #"z"
        fun isUpper c  = #"A" <= c andalso c <= #"Z"
        fun isDigit c  = #"0" <= c andalso c <= #"9"
        fun isAlpha c  = isLower c orelse isUpper c
        fun isHexDigit c = #"0" <= c andalso c <= #"9"
        orelse #"a" <= c andalso c <= #"f"
        orelse #"A" <= c andalso c <= #"F"
        fun isAlphaNum c = isAlpha c orelse isDigit c
        fun isPrint c  = c >= #" " andalso c < #"\\127"
        fun isSpace c  = c = #" " orelse #"\\009" <= c andalso c <= #"\\013"
        fun isGraph c  = isPrint c andalso not (isSpace c)
        fun isPunct c  = isGraph c andalso not (isAlphaNum c)
        fun isAscii c  = c <= #"\\127"
        fun isCntrl c  = c < #" " orelse c >= #"\\127"

        fun toLower c =
            if #"A" <= c andalso c <= #"Z" then chr (ord c + 32)
        else c;
        fun toUpper c =
            if #"a" <= c andalso c <= #"z" then chr (ord c - 32)
        else c;

        fun compare (a, b) = Int.compare(ord a, ord b);
        fun op< (a, b) = Int.compare(ord a, ord b) = LESS;
        fun op> (a, b) = Int.compare(ord a, ord b) = GREATER;
        fun op<= (a, b) = Int.compare(ord a, ord b) <> GREATER;
        fun op>= (a, b) = Int.compare(ord a, ord b) <> LESS;

        val ord = ord;
        val chr = chr;
        val maxOrd = 255;
        val maxChar = chr maxOrd;
        val minChar = chr 0;

        fun succ c = if c = maxChar then raise Chr else chr(ord c + 1)
        fun pred c = if c = minChar then raise Chr else chr(ord c - 1)

        fun contains s = let
            val table = Array.array(maxOrd + 1, false)
            val l = explode s
        in
            (List.app (fn x => Array.update(table, ord x, true)) l; fn c => Array.sub(table, ord c))
        end;
        fun notContains s = let
            val table = Array.array(maxOrd + 1, false)
            val l = explode s
        in
            (List.app (fn x => Array.update(table, ord x, true)) l; fn c => not (Array.sub(table, ord c)))
        end;
    end;`,
    'requires': ['Int', 'Array', 'List']
};
