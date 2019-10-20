const Lexer = require('../src/lexer');
const Token = require('../src/tokens');
const Errors = require('../src/errors');

const TestHelper = require("./test_helper.ts");
TestHelper.init();

it('very basic test', () => {
    expect(Lexer.lex('abc 1234')).toEqualWithType([new Token.AlphanumericIdentifierToken('abc'),
        new Token.NumericToken('1234', 1234)]);
});

it('code snippet', () => {
    let testcase: string = `(* Parsercomb -- Hutton/Paulson-style parser combinators for Moscow ML.
   Fritz Henglein, Ken Friis Larsen, Peter Sestoft.
   Documentation by sestoft@dina.kvl.dk.  Version 0.4 of 2000-04-30 *)

structure Parsercomb :> Parsercomb =
struct

    datatype 'elm stream =
	S of int * (int -> ('elm * 'elm stream) option)

    type ('elm,'res) parser = 'elm stream -> ('res * 'elm stream) option

    fun stream get src =
	let fun next src n =
	        case get src of
		    SOME(x, rest) => SOME(x, S(n+1, next rest))
		  | NONE          => NONE
	in S(0, next src) end

    fun getItem (S(n, next)) = next n

    exception Parse of string

    infix 6 $-- --$ #-- --#
    infix 5 --
    infix 3 >> >>*
    infix 2 >>=
    infix 0 ||

    fun commitChar expected par (strm as S(n, next)) =
	case par strm of
	    NONE =>
		raise Parse (String.concat
			     ["Expected <", expected, "> but found <",
			      (case next n of
				   NONE       => "eof>"
				 | SOME(c, _) => str c ^ ">"),
			      " at character number ", Int.toString n])
	  | res as SOME _ => res

    fun commitElem expected show par (strm as S(n, next)) =
	case par strm of
	    NONE =>
		raise Parse (String.concat
			     ["Expected <", expected, "> but found <",
			      (case next n of
				   NONE         => "eof>"
				 | SOME(elm, _) => show elm ^ ">"),
			      " at element number ", Int.toString n])
	  | res as SOME _ => res

    fun scan (scanner : ('a, 'a stream) StringCvt.reader -> 'a stream -> 'b) =
	scanner getItem

    fun (par1 >>= parf2) strm =
	case par1 strm of
	    SOME(b, strm1) => parf2 b strm1
	  | NONE           => NONE

    fun success x strm = SOME(x, strm)

    fun failure strm = NONE

    fun eof r strm =
	case getItem strm of
	    NONE       => SOME(r, strm)
	  | SOME(c, _) => NONE

    (* fun (par >> f) = par >>= (success o f) *)

    fun (par >> f) strm =
	case par strm of
	    SOME(x, strm1) => SOME(f x, strm1)
	  | _              => NONE

    fun (par >>* f) strm =
	case par strm of
	    SOME(x, strm1) =>
		(case f x of
		     SOME y => SOME(y, strm1)
		   | NONE   => NONE)
	  | _              => NONE

    (* fun (par1 -- par2) = par1 >>= (fn r1 => par2 >> (fn r2 => (r1, r2))) *)

    fun (par1 -- par2) strm =
	case par1 strm of
	    SOME(r1, strm1) => (case par2 strm1 of
				    SOME(r2 , strm2) => SOME((r1,r2), strm2)
				  | NONE => NONE)
	  | NONE => NONE

    (* fun (par1 #-- par2) = (par1 -- par2) >> #2 *)

    (* Define explicitly to make par2 a tail call; possible because no
       backtracking over par1: *)

    fun (par1 #-- par2) strm =
	case par1 strm of
	    SOME (_, strm1) => par2 strm1
	  | NONE            => NONE

    fun (par1 --# par2) = (par1 -- par2) >> #1

    fun (par1 || par2) strm =
	case par1 strm of
	    NONE => par2 strm
	  | res  => res

    fun skipWS par strm = par (StringCvt.skipWS getItem strm)

    fun optional par strm0 =
	case par strm0 of
	    SOME(x, strm1) => SOME(SOME x, strm1)
	  | NONE           => SOME(NONE,   strm0)

    fun repeat0 par strm =
	let fun loop strm0 res =
	        case par strm0 of
		    SOME(x, strm1) => loop strm1 (x::res)
		  | NONE           => SOME(List.rev res, strm0)
	in loop strm [] end

    fun repeat1 par = par -- repeat0 par

    fun $ s strm0 =
	let val len = size s
	    val sub = String.sub
	    infix sub
	    fun loop n strm =
		if n = len then SOME(s, strm)
		else (case getItem strm of
			  SOME(c, rest) =>
			      if c = (s sub n) then loop (n+1) rest
			      else NONE
			| NONE => NONE)
	in loop 0 strm0 end

    fun (s $-- par) = $ s -- par >> #2

    fun (par --$ s) = par -- $ s >> #1

    fun getChar pred strm =
	case getItem strm of
	    res as SOME(c, src) => if pred c then res
				   else NONE
	  | NONE => NONE

    fun $# elm strm =
	case getItem strm of
	    res as SOME(x, src) => if x = elm then res
				   else NONE
	  | NONE => NONE

    val getLit = $#

    fun getChars0 pred strm =
	SOME(StringCvt.splitl pred getItem strm)

    fun getChars1 pred strm =
	case StringCvt.splitl pred getItem strm of
	    ("", _) => NONE
	  | res     => SOME res

    fun getChars1 pred =
	repeat1 (getChar pred) >> op:: >> String.implode

    val getElem = getChar

    fun getElems0 pred = repeat0 (getElem pred)

    fun getElems1 pred = repeat1 (getElem pred)

    fun compose(par1, par2) strm =
	let val par1stream = stream par1 strm
	in par2 par1stream end

    fun parse (par : ('a, 'b) parser) (strm : 'a stream) : 'b option =
	case par strm of
	    NONE          => NONE
	  | SOME (res, _) => SOME res

    fun scanSubstr par sus = parse par (stream Substring.getc sus)

    fun scanString par s = scanSubstr par (Substring.all s)

    fun scanList par cs = parse par (stream List.getItem cs)
end`

    Lexer.lex(testcase);
});

it('strings', () => {
    let testcase: string = ' "bla bla\\   \\ blub" "" "\\\\ \\" "';
    expect(Lexer.lex(testcase)).toEqualWithType([
        new Token.StringConstantToken('"bla bla\\   \\ blub"', 'bla bla blub'),
        new Token.StringConstantToken('""', ''),
        new Token.StringConstantToken('"\\\\ \\" "', '\\ \" ')
    ]);
});

it('char with multiple characters', () => {
    let testcase: string = ` #"test" "`;
    expect(() => { Lexer.lex(testcase); }).toThrow(Errors.TokenError);
});

it('floating point numbers', () => {
    let testcase: string = '1e2 1e 2'

    expect(Lexer.lex(testcase)).toEqualWithType([
        new Token.RealConstantToken('1e2', 100),
        new Token.NumericToken('1', 1),
        new Token.AlphanumericIdentifierToken('e'),
        new Token.NumericToken('2', 2)
    ])
});

it('dots', () => {
    let testcase1: string = '.';
    let testcase2: string = '..';
    let testcase3: string = '...';

    expect(() => { Lexer.lex(testcase1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase2); }).toThrow(Errors.TokenError);

    expect(Lexer.lex(testcase3)).toEqualWithType([
        new Token.KeywordToken('...')
    ]);
});

it('reserved words core', () => {
    let testcase: string = 'abstype and andalso as case datatype do else end exception fn fun handle if in infix infixr let local nonfix of op open orelse raise rec then type val with withtype while ( ) [ ] { } , : ; ... _ | = => -> #';

    expect(Lexer.lex(testcase)).toEqualWithType([
        new Token.KeywordToken('abstype'),
        new Token.KeywordToken('and'),
        new Token.KeywordToken('andalso'),
        new Token.KeywordToken('as'),
        new Token.KeywordToken('case'),
        new Token.KeywordToken('datatype'),
        new Token.KeywordToken('do'),
        new Token.KeywordToken('else'),
        new Token.KeywordToken('end'),
        new Token.KeywordToken('exception'),
        new Token.KeywordToken('fn'),
        new Token.KeywordToken('fun'),
        new Token.KeywordToken('handle'),
        new Token.KeywordToken('if'),
        new Token.KeywordToken('in'),
        new Token.KeywordToken('infix'),
        new Token.KeywordToken('infixr'),
        new Token.KeywordToken('let'),
        new Token.KeywordToken('local'),
        new Token.KeywordToken('nonfix'),
        new Token.KeywordToken('of'),
        new Token.KeywordToken('op'),
        new Token.KeywordToken('open'),
        new Token.KeywordToken('orelse'),
        new Token.KeywordToken('raise'),
        new Token.KeywordToken('rec'),
        new Token.KeywordToken('then'),
        new Token.KeywordToken('type'),
        new Token.KeywordToken('val'),
        new Token.KeywordToken('with'),
        new Token.KeywordToken('withtype'),
        new Token.KeywordToken('while'),
        new Token.KeywordToken('('),
        new Token.KeywordToken(')'),
        new Token.KeywordToken('['),
        new Token.KeywordToken(']'),
        new Token.KeywordToken('{'),
        new Token.KeywordToken('}'),
        new Token.KeywordToken(','),
        new Token.KeywordToken(':'),
        new Token.KeywordToken(';'),
        new Token.KeywordToken('...'),
        new Token.KeywordToken('_'),
        new Token.KeywordToken('|'),
        new Token.EqualsToken(),
        new Token.KeywordToken('=>'),
        new Token.KeywordToken('->'),
        new Token.KeywordToken('#')
    ])
});

it('integer constants decimal', () => {
    let testcase_zero: string = '0';
    let testcase_nonint: string = '~';
    let testcase_pos: string = '42';
    let testcase_neg: string = '~69';
    let testcase_pos_leadingzero: string = '0000042';
    let testcase_neg_leadingzero: string = '~0000023';
    let testcase_bigzero: string = '000000';

    expect(Lexer.lex(testcase_zero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_zero, 0)
    ]);
    expect(Lexer.lex(testcase_nonint)).toEqualWithType([
        new Token.IdentifierToken('~')
    ]);
    expect(Lexer.lex(testcase_pos)).toEqualWithType([
        new Token.NumericToken(testcase_pos, 42)
    ]);
    expect(Lexer.lex(testcase_neg)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_neg, -69)
    ]);
    expect(Lexer.lex(testcase_pos_leadingzero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_pos_leadingzero, 42)
    ]);
    expect(Lexer.lex(testcase_neg_leadingzero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_neg_leadingzero, -23)
    ]);
    expect(Lexer.lex(testcase_bigzero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_bigzero, 0)
    ]);
});

it('integer constants hexadecimal wellformed', () => {
    let testcase_pos: string = '0x4a';
    let testcase_neg: string = '~0x6E';
    let testcase_pos_leadingzero: string = '0x000004F';
    let testcase_neg_leadingzero: string = '~0x00a';
    let testcase_bigzero: string = '0x00000';
    let testcase_all_chars1: string = '0x01234';
    let testcase_all_chars2: string = '0x56789';
    let testcase_all_chars3: string = '0xabcdef';
    let testcase_all_chars4: string = '0xABCDEF';

    expect(Lexer.lex(testcase_pos)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_pos, 0x4a)
    ]);
    expect(Lexer.lex(testcase_neg)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_neg, -0x6e)
    ]);
    expect(Lexer.lex(testcase_pos_leadingzero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_pos_leadingzero, 0x4f)
    ]);
    expect(Lexer.lex(testcase_neg_leadingzero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_neg_leadingzero, -0xa)
    ]);
    expect(Lexer.lex(testcase_bigzero)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_bigzero, 0)
    ]);
    expect(Lexer.lex(testcase_all_chars1)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_all_chars1, 0x1234)
    ]);
    expect(Lexer.lex(testcase_all_chars2)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_all_chars2, 0x56789)
    ]);
    expect(Lexer.lex(testcase_all_chars3)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_all_chars3, 0xabcdef)
    ]);
    expect(Lexer.lex(testcase_all_chars4)).toEqualWithType([
        new Token.IntegerConstantToken(testcase_all_chars4, 0xabcdef)
    ]);
});

it('integer constants hexadecimal illformed', () => {
    let testcase_nonint: string = '~0x';
    let testcase_too_long_prefix: string = '00x42';
    let testcase_too_short_prefix: string = 'x42';
    let testcase_neg_too_long_prefix: string = '~00x69';
    let testcase_neg_too_short_prefix: string = '~x42';
    let testcase_not_hex: string = '0xabcgcba';
    let testcase_missing_x: string = '04a';
    let testcase_capital_x: string = '0X4a';
    let testcase_double_x: string = '0xx4a';

    expect(Lexer.lex(testcase_nonint)).toEqualWithType([
        new Token.IntegerConstantToken('~0', -0),
        new Token.AlphanumericIdentifierToken('x')
    ]);
    expect(Lexer.lex(testcase_too_long_prefix)).toEqualWithType([
        new Token.IntegerConstantToken('00', 0),
        new Token.AlphanumericIdentifierToken('x42')
    ]);
    expect(Lexer.lex(testcase_too_short_prefix)).toEqualWithType([
        new Token.AlphanumericIdentifierToken('x42')
    ]);
    expect(Lexer.lex(testcase_neg_too_long_prefix)).toEqualWithType([
        new Token.IntegerConstantToken('~00', -0),
        new Token.AlphanumericIdentifierToken('x69')
    ]);
    expect(Lexer.lex(testcase_neg_too_short_prefix)).toEqualWithType([
        new Token.IdentifierToken('~'),
        new Token.AlphanumericIdentifierToken('x42')
    ]);
    expect(Lexer.lex(testcase_not_hex)).toEqualWithType([
        new Token.IntegerConstantToken('0xabc', 0xabc),
        new Token.AlphanumericIdentifierToken('gcba')
    ]);
    expect(Lexer.lex(testcase_missing_x)).toEqualWithType([
        new Token.IntegerConstantToken('04', 4),
        new Token.AlphanumericIdentifierToken('a')
    ]);
    expect(Lexer.lex(testcase_capital_x)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('X4a')
    ]);
    expect(Lexer.lex(testcase_double_x)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('xx4a')
    ]);
});

it('word constants decimal', () => {
    let testcase_noword: string = '0w';
    let testcase_pos: string = '0w42';
    let testcase_nohex: string = '0w9a';
    let testcase_capital_w: string = '0W1337';
    let testcase_zero_after_w: string = '0w01337';
    let testcase_leading_zero: string = '00w01';
    let testcase_neg: string = '~0w69';

    expect(Lexer.lex(testcase_noword)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('w')
    ]);
    expect(Lexer.lex(testcase_pos)).toEqualWithType([
        new Token.WordConstantToken('0w42', 42)
    ]);
    expect(Lexer.lex(testcase_nohex)).toEqualWithType([
        new Token.WordConstantToken('0w9', 9),
        new Token.AlphanumericIdentifierToken('a')
    ]);
    expect(Lexer.lex(testcase_capital_w)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('W1337')
    ]);
    expect(Lexer.lex(testcase_zero_after_w)).toEqualWithType([
        new Token.WordConstantToken('0w01337', 1337)
    ]);
    expect(Lexer.lex(testcase_leading_zero)).toEqualWithType([
        new Token.IntegerConstantToken('00', 0),
        new Token.AlphanumericIdentifierToken('w01')
    ]);
    expect(Lexer.lex(testcase_neg)).toEqualWithType([
        new Token.IntegerConstantToken('~0', -0),
        new Token.AlphanumericIdentifierToken('w69')
    ]);
});

it('word constants hexadecimal', () => {
    let testcase_noword: string = '0wx';
    let testcase_pos: string = '0wx4aA';
    let testcase_capital_w: string = '0Wx1337';
    let testcase_zero_after_w: string = '0wx01337';
    let testcase_leading_zero: string = '00wx01';
    let testcase_neg: string = '~0wx69';
    let testcase_capital_x: string = '0wX4aA';
    let testcase_wrong_order: string = '0xwabc';
    let testcase_double_w: string = '0wwabc';

    expect(Lexer.lex(testcase_noword)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('wx')
    ]);
    expect(Lexer.lex(testcase_pos)).toEqualWithType([
        new Token.WordConstantToken(testcase_pos, 0x4aa)
    ]);
    expect(Lexer.lex(testcase_capital_w)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('Wx1337')
    ]);
    expect(Lexer.lex(testcase_zero_after_w)).toEqualWithType([
        new Token.WordConstantToken(testcase_zero_after_w, 0x1337)
    ]);
    expect(Lexer.lex(testcase_leading_zero)).toEqualWithType([
        new Token.IntegerConstantToken('00', 0),
        new Token.AlphanumericIdentifierToken('wx01')
    ]);
    expect(Lexer.lex(testcase_neg)).toEqualWithType([
        new Token.IntegerConstantToken('~0', -0),
        new Token.AlphanumericIdentifierToken('wx69')
    ]);
    expect(Lexer.lex(testcase_capital_x)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('wX4aA')
    ]);
    expect(Lexer.lex(testcase_wrong_order)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('xwabc')
    ]);
    expect(Lexer.lex(testcase_double_w)).toEqualWithType([
        new Token.IntegerConstantToken('0', 0),
        new Token.AlphanumericIdentifierToken('wwabc')
    ]);
});

it('floating point constants', () => {
    let testcase_good1: string = '0.0e0';
    let testcase_good2: string = '0.0';
    let testcase_good3: string = '0E0';
    let testcase_leading_zero: string = '004e1';
    let testcase_hex1: string = '0x1.09e03';
    let testcase_hex2: string = '01.0x9e03';
    let testcase_hex3: string = '01.09e0x3';
    let testcase_double_dot: string = '12.34.56';
    let testcase_double_e: string = '12e34e56';
    let testcase_wrong_order: string = '12e34.56';
    let testcase_missing_component1: string = '.34e56';
    let testcase_missing_component2: string = '12.e56';
    let testcase_missing_component3: string = '12.34e';

    expect(Lexer.lex(testcase_good1)).toEqualWithType([
        new Token.RealConstantToken(testcase_good1, 0)
    ]);
    expect(Lexer.lex(testcase_good2)).toEqualWithType([
        new Token.RealConstantToken(testcase_good2, 0)
    ]);
    expect(Lexer.lex(testcase_good3)).toEqualWithType([
        new Token.RealConstantToken(testcase_good3, 0)
    ]);
    expect(Lexer.lex(testcase_leading_zero)).toEqualWithType([
        new Token.RealConstantToken(testcase_leading_zero, 40)
    ]);
    expect(() => { Lexer.lex(testcase_hex1); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_hex2)).toEqualWithType([
        new Token.RealConstantToken('01.0', 1),
        new Token.AlphanumericIdentifierToken('x9e03')
    ]);
    expect(Lexer.lex(testcase_hex3)).toEqualWithType([
        new Token.RealConstantToken('01.09e0', 1.09),
        new Token.AlphanumericIdentifierToken('x3')
    ]);
    expect(() => { Lexer.lex(testcase_double_dot); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_double_e)).toEqualWithType([
        new Token.RealConstantToken('12e34', 12e34),
        new Token.AlphanumericIdentifierToken('e56')
    ]);
    expect(() => { Lexer.lex(testcase_wrong_order); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_missing_component1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_missing_component2); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_missing_component3)).toEqualWithType([
        new Token.RealConstantToken('12.34', 12.34),
        new Token.AlphanumericIdentifierToken('e')
    ]);
});

it('string constants', () => {
    let testcase_empty: string = '""';
    let testcase_non_ending1: string = '"';
    let testcase_non_ending2: string = '"\\';
    let testcase_non_ending3: string = '"\\^';
    let testcase_non_ending4: string = '"\\"';
    let testcase_basic_string: string = '"The quick brown fox jumps over the lazy dog"';
    let testcase_newline: string = '"The quick brown fox \n jumps over the lazy dog"';
    let testcase_all_basic_escapes: string = '"\\a \\b \\t \\n \\v \\f \\r \\" \\\\"';
    let testcase_control_escapes: string = '"\\^@\\^J\\^^\\^_"';
    let testcase_invalid_control_escapes1: string = '"\\^?"';
    let testcase_invalid_control_escapes2: string = '"\\^j"';
    let testcase_invalid_control_escapes3: string = '"\\^`"';
    let testcase_invalid_escapes1: string = '"\\ "';
    let testcase_invalid_escapes2: string = '"\\,"';
    let testcase_invalid_escapes3: string = '"\\c"';
    let testcase_decimal_escape: string = '"\\042\\069\\106"';
    let testcase_decimal_escape_too_short1: string = '"\\42"';
    let testcase_decimal_escape_too_short2: string = '"\\4"';
    let testcase_decimal_escape_too_short3: string = '"\\0"';
    let testcase_decimal_escape_overlapping: string = '"\\000000"';
    let testcase_hex_escape: string = '"\\u0040\\u004a\\u004A"';
    let testcase_hex_escape_too_short1: string = '"\\u004"';
    let testcase_hex_escape_too_short2: string = '"\\u00"';
    let testcase_hex_escape_too_short3: string = '"\\u0"';
    let testcase_hex_escape_too_short4: string = '"\\u"';
    let testcase_capital_u: string = '"\\U0040"';
    let testcase_formatting_ignore1: string = '"\\ \\"';
    let testcase_formatting_ignore2: string = '"\\ \t\n \\working?"';
    let testcase_formatting_incomplete: string = '"\\ \n \t \t';
    let testcase_formatting_ignore_wrong: string = '"\\   a\\"';
    let testcase_bell_escape1: string = '"\\a"';
    let testcase_bell_escape2: string = '"\\^G"';

    expect(Lexer.lex(testcase_empty)).toEqualWithType([
        new Token.StringConstantToken(testcase_empty, '')
    ]);
    expect(() => { Lexer.lex(testcase_non_ending1); }).toThrow(Token.IncompleteError);
    expect(() => { Lexer.lex(testcase_non_ending2); }).toThrow(Token.IncompleteError);
    expect(() => { Lexer.lex(testcase_non_ending3); }).toThrow(Token.IncompleteError);
    expect(() => { Lexer.lex(testcase_non_ending4); }).toThrow(Token.IncompleteError);
    expect(Lexer.lex(testcase_basic_string)).toEqualWithType([
        new Token.StringConstantToken(testcase_basic_string, 'The quick brown fox jumps over the lazy dog')
    ]);
    expect(() => { Lexer.lex(testcase_newline); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_all_basic_escapes)).toEqualWithType([
        new Token.StringConstantToken(testcase_all_basic_escapes, '\x07 \b \t \n \v \f \r " \\')
    ]);
    expect(Lexer.lex(testcase_control_escapes)).toEqualWithType([
        new Token.StringConstantToken(testcase_control_escapes, '\x00\x0A\x1E\x1F')
    ]);
    expect(() => { Lexer.lex(testcase_invalid_control_escapes1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_invalid_control_escapes2); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_invalid_control_escapes3); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_invalid_escapes1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_invalid_escapes2); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_invalid_escapes3); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_decimal_escape)).toEqualWithType([
        new Token.StringConstantToken(testcase_decimal_escape, '*Ej')
    ]);
    expect(() => { Lexer.lex(testcase_decimal_escape_too_short1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_decimal_escape_too_short2); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_decimal_escape_too_short3); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_decimal_escape_overlapping)).toEqualWithType([
        new Token.StringConstantToken(testcase_decimal_escape_overlapping, '\x00000')
    ]);
    expect(Lexer.lex(testcase_hex_escape)).toEqualWithType([
        new Token.StringConstantToken(testcase_hex_escape, '@JJ')
    ]);
    expect(() => { Lexer.lex(testcase_hex_escape_too_short1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_hex_escape_too_short2); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_hex_escape_too_short3); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_hex_escape_too_short4); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_capital_u); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_formatting_ignore1)).toEqualWithType([
        new Token.StringConstantToken(testcase_formatting_ignore1, '')
    ]);
    expect(Lexer.lex(testcase_formatting_ignore2)).toEqualWithType([
        new Token.StringConstantToken(testcase_formatting_ignore2, 'working?')
    ]);
    expect(() => { Lexer.lex(testcase_formatting_incomplete); }).toThrow(Token.IncompleteError);
    expect(() => { Lexer.lex(testcase_formatting_ignore_wrong); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_bell_escape1)).toEqualWithType([
        new Token.StringConstantToken(testcase_bell_escape1, '\x07')
    ]);
    expect(Lexer.lex(testcase_bell_escape2)).toEqualWithType([
        new Token.StringConstantToken(testcase_bell_escape2, '\x07')
    ]);
});

it('character constants', () => {
    let testcase_empty: string = '#""';
    let testcase_non_ending1: string = '#"';
    let testcase_non_ending2: string = '#"a';
    let testcase_good: string = '#"a"';
    let testcase_escape: string = '#"\\u004A"';
    let testcase_ignores: string = '#"\\ \n \t  \\\\123\\   \n\\"';
    let testcase_too_long: string = '#"\\\\x"';

    expect(() => { Lexer.lex(testcase_empty); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_non_ending1); }).toThrow(Errors.IncompleteError);
    expect(() => { Lexer.lex(testcase_non_ending2); }).toThrow(Errors.IncompleteError);
    expect(Lexer.lex(testcase_good)).toEqualWithType([
        new Token.CharacterConstantToken(testcase_good, 'a')
    ]);
    expect(Lexer.lex(testcase_escape)).toEqualWithType([
        new Token.CharacterConstantToken(testcase_escape, 'J')
    ]);
    expect(Lexer.lex(testcase_ignores)).toEqualWithType([
        new Token.CharacterConstantToken(testcase_ignores, '{')
    ]);
    expect(() => { Lexer.lex(testcase_too_long); }).toThrow(Errors.TokenError);
});

it('comments', () => {
    let testcase_empty_comment: string = '(**)test';
    let testcase_normal_comment: string = '(*this is a comment *)test';
    let testcase_nested_comment: string = '(*this is a (* nested (* ? *) *) comment *)test';
    let testcase_non_ending1: string = '(* incomplete';
    let testcase_non_ending2: string = '(*';
    let testcase_unmatched: string = '*)test';

    expect(Lexer.lex(testcase_empty_comment)).toEqualWithType([
        new Token.AlphanumericIdentifierToken('test', 'test')
    ]);
    expect(Lexer.lex(testcase_normal_comment)).toEqualWithType([
        new Token.AlphanumericIdentifierToken('test', 'test')
    ]);
    expect(Lexer.lex(testcase_nested_comment)).toEqualWithType([
        new Token.AlphanumericIdentifierToken('test', 'test')
    ]);
    expect(() => { Lexer.lex(testcase_non_ending1); }).toThrow(Errors.IncompleteError);
    expect(() => { Lexer.lex(testcase_non_ending2); }).toThrow(Errors.IncompleteError);
});

it('identifiers', () => {
    let testcase_empty: string = '';
    let testcase_alphanum: string = 'u12idADU12IA\'\'\'123';
    let testcase_symbolic: string = '!%&$#+-/:<=>?@\\~`^|*';
    let testcase_prime: string = '\'';
    let testcase_prime_symbolic: string = '\'!%!\'==';
    let testcase_double_prime: string = '\'\'';
    let testcase_triple_prime: string = '\'\'\'';
    let testcase_spacing: string = ' test identifier';
    let testcase_mixed: string = 'test!identifier';
    let testcase_underscore: string = '__hi';

    expect(Lexer.lex(testcase_empty)).toEqualWithType([]);
    expect(Lexer.lex(testcase_alphanum)).toEqualWithType([
        new Token.AlphanumericIdentifierToken(testcase_alphanum, testcase_alphanum)
    ]);
    expect(Lexer.lex(testcase_symbolic)).toEqualWithType([
        new Token.IdentifierToken(testcase_symbolic, testcase_symbolic)
    ]);
    expect(JSON.stringify(Lexer.lex(testcase_prime))).toEqualWithType(JSON.stringify([
        new Token.TypeVariableToken(testcase_prime, testcase_prime)
    ]));
    expect(Lexer.lex(testcase_prime_symbolic)).toEqualWithType([
        new Token.TypeVariableToken('\'', '\''),
        new Token.IdentifierToken('!%!', '!%!'),
        new Token.TypeVariableToken('\'', '\''),
        new Token.IdentifierToken('==', '==')
    ]);
    expect(Lexer.lex(testcase_double_prime)).toEqualWithType([
        new Token.EqualityTypeVariableToken(testcase_double_prime, testcase_double_prime)
    ]);
    expect(Lexer.lex(testcase_triple_prime)).toEqualWithType([
        new Token.EqualityTypeVariableToken(testcase_triple_prime, testcase_triple_prime)
    ]);
    expect(Lexer.lex(testcase_spacing)).toEqualWithType([
        new Token.AlphanumericIdentifierToken('test', 'test'),
        new Token.AlphanumericIdentifierToken('identifier', 'identifier')
    ]);
    expect(Lexer.lex(testcase_underscore)).toEqualWithType([
        new Token.KeywordToken('_')
        new Token.KeywordToken('_')
        new Token.AlphanumericIdentifierToken('hi', 'hi')
    ]);
});

it('long identifiers', () => {
    let testcase_small: string = 'lon.ident';
    let testcase_long: string = 'lon.hey10.der.ident';
    let testcase_space1: string = 'lon.hey10 .der.ident';
    let testcase_space2: string = 'lon.hey10. der.ident';
    let testcase_numeric: string = 'xxx0.10';
    let testcase_prime1: string = '\'lon.ident';
    let testcase_prime2: string = 'lon.\'ident';
    let testcase_double_prime1: string = '\'lon.ident';
    let testcase_double_prime2: string = 'lon.\'ident';
    let testcase_symbolic_good: string = 'lon.==';
    let testcase_symbolic_bad: string = '==.ident';

    expect(Lexer.lex(testcase_small)).toEqualWithType([
        new Token.LongIdentifierToken(testcase_small, [
            new Token.AlphanumericIdentifierToken('lon', 'lon')
        ], new Token.AlphanumericIdentifierToken('ident', 'ident'))
    ]);
    expect(Lexer.lex(testcase_long)).toEqualWithType([
        new Token.LongIdentifierToken(testcase_long, [
            new Token.AlphanumericIdentifierToken('lon', 'lon'),
            new Token.AlphanumericIdentifierToken('hey10', 'hey10'),
            new Token.AlphanumericIdentifierToken('der', 'der')
        ], new Token.AlphanumericIdentifierToken('ident', 'ident'))
    ]);
    expect(() => { Lexer.lex(testcase_space1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_space2); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_numeric); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_prime1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_prime2); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_double_prime1); }).toThrow(Errors.TokenError);
    expect(() => { Lexer.lex(testcase_double_prime2); }).toThrow(Errors.TokenError);
    expect(Lexer.lex(testcase_symbolic_good)).toEqualWithType([
        new Token.LongIdentifierToken(testcase_symbolic_good, [
            new Token.AlphanumericIdentifierToken('lon', 'lon')
        ], new Token.IdentifierToken('==', '=='))
    ]);
    expect(() => { Lexer.lex(testcase_symbolic_bad); }).toThrow(Errors.TokenError);
});

it('reserved words module', () => {
    let testcase: string = 'eqtype functor signature struct include sharing structure where sig :>';

    expect(Lexer.lex(testcase)).toEqualWithType([
        new Token.KeywordToken('eqtype'),
        new Token.KeywordToken('functor'),
        new Token.KeywordToken('signature'),
        new Token.KeywordToken('struct'),
        new Token.KeywordToken('include'),
        new Token.KeywordToken('sharing'),
        new Token.KeywordToken('structure'),
        new Token.KeywordToken('where'),
        new Token.KeywordToken('sig'),
        new Token.KeywordToken(':>'),
    ]);
});
