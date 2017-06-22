/* TODO: tests
*/

const API = require("../src/lexer");
const Errors = require("../src/errors");

const diff = require('jest-diff');

expect.extend({
  toEqualWithType(received, expected) {
    const pass = JSON.stringify(received) == JSON.stringify(expected);

    const message = pass
      ? () => this.utils.matcherHint('.not.toEqualWithType') + '\n\n' +
        `Expected value to not equal with type:\n` +
        `  ${this.utils.printExpected(expected)}\n` +
        `Received:\n` +
        `  ${this.utils.printReceived(received)}`
      : () => {
        const diffString = diff(expected, received, {
          expand: this.expand,
        });
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


it("very basic test", () => {
    expect(API.lex("abc 1234")).toEqual([new API.IdentifierToken("abc", 0), new API.NumericToken("1234", 4, 1234)]);
});

it("code snippet", () => {
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

    API.lex(testcase);
});

it("strings", () => {
    let testcase: string = ` "bla bla\\   \\ blub" "" "\\\\ \\" "`;
    expect(API.lex(testcase)).toEqual([
        new API.StringConstantToken('"bla bla\\   \\ blub"', 1, 'bla bla blub'),
        new API.StringConstantToken('""', 21, ''),
        new API.StringConstantToken('"\\\\ \\" "', 24, '\\ \" ')
    ]);
});

it("char with multiple characters", () => {
    let testcase: string = ` #"test" "`;
    expect(() => { API.lex(testcase); }).toThrow(API.LexerError);
});

it("floating point numbers", () => {
    let testcase: string = '1e2 1e 2'

    expect(API.lex(testcase)).toEqual([
        new API.RealConstantToken("1e2", 0, 100),
        new API.NumericToken("1", 4, 1),
        new API.AlphanumericIdentifierToken("e", 5),
        new API.NumericToken("2", 7, 2)
    ])
});

it("dots", () => {
    let testcase1: string = '.';
    let testcase2: string = '..';
    let testcase3: string = '...';

    expect(() => { API.lex(testcase1); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase2); }).toThrow(API.LexerError);

    expect(API.lex(testcase3)).toEqual([
        new API.KeywordToken("...", 0)
    ]);
});

it("reserved words", () => {
    let testcase: string = 'abstype and andalso as case datatype do else end exception fn fun handle if in infix infixr let local nonfix of op open orelse raise rec then type val with withtype while ( ) [ ] { } , : ; ... _ | = => -> #';

    expect(API.lex(testcase)).toEqual([
        new API.KeywordToken("abstype", 0),
        new API.KeywordToken("and", 8),
        new API.KeywordToken("andalso", 12),
        new API.KeywordToken("as", 20),
        new API.KeywordToken("case", 23),
        new API.KeywordToken("datatype", 28),
        new API.KeywordToken("do", 37),
        new API.KeywordToken("else", 40),
        new API.KeywordToken("end", 45),
        new API.KeywordToken("exception", 49),
        new API.KeywordToken("fn", 59),
        new API.KeywordToken("fun", 62),
        new API.KeywordToken("handle", 66),
        new API.KeywordToken("if", 73),
        new API.KeywordToken("in", 76),
        new API.KeywordToken("infix", 79),
        new API.KeywordToken("infixr", 85),
        new API.KeywordToken("let", 92),
        new API.KeywordToken("local", 96),
        new API.KeywordToken("nonfix", 102),
        new API.KeywordToken("of", 109),
        new API.KeywordToken("op", 112),
        new API.KeywordToken("open", 115),
        new API.KeywordToken("orelse", 120),
        new API.KeywordToken("raise", 127),
        new API.KeywordToken("rec", 133),
        new API.KeywordToken("then", 137),
        new API.KeywordToken("type", 142),
        new API.KeywordToken("val", 147),
        new API.KeywordToken("with",151),
        new API.KeywordToken("withtype", 156),
        new API.KeywordToken("while", 165),
        new API.KeywordToken("(", 171),
        new API.KeywordToken(")", 173),
        new API.KeywordToken("[", 175),
        new API.KeywordToken("]", 177),
        new API.KeywordToken("{", 179),
        new API.KeywordToken("}", 181),
        new API.KeywordToken(",", 183),
        new API.KeywordToken(":", 185),
        new API.KeywordToken(";", 187),
        new API.KeywordToken("...", 189),
        new API.KeywordToken("_", 193),
        new API.KeywordToken("|", 195),
        new API.EqualsToken(197),
        new API.KeywordToken("=>", 199),
        new API.KeywordToken("->", 202),
        new API.KeywordToken("#", 205)
    ])
});

it("integer constants decimal", () => {
    let testcase_zero: string = '0';
    let testcase_nonint: string = '~';
    let testcase_pos: string = '42';
    let testcase_neg: string = '~69';
    let testcase_pos_leadingzero: string = '0000042';
    let testcase_neg_leadingzero: string = '~0000023';
    let testcase_bigzero: string = '000000';

    expect(API.lex(testcase_zero)).toEqual([
        new API.NumericToken(testcase_zero, 0, 0)
    ]);
    expect(API.lex(testcase_nonint)).toEqual([
        new API.IdentifierToken("~", 0)
    ]);
    expect(API.lex(testcase_pos)).toEqual([
        new API.NumericToken(testcase_pos, 0, 42)
    ]);
    expect(API.lex(testcase_neg)).toEqual([
        new API.IntegerConstantToken(testcase_neg, 0, -69)
    ]);
    expect(API.lex(testcase_pos_leadingzero)).toEqual([
        new API.IntegerConstantToken(testcase_pos_leadingzero, 0, 42)
    ]);
    expect(API.lex(testcase_neg_leadingzero)).toEqual([
        new API.IntegerConstantToken(testcase_neg_leadingzero, 0, -23)
    ]);
    expect(API.lex(testcase_bigzero)).toEqual([
        new API.IntegerConstantToken(testcase_bigzero, 0, 0)
    ]);
});

it("integer constants hexadecimal wellformed", () => {
    let testcase_pos: string = '0x4a';
    let testcase_neg: string = '~0x6E';
    let testcase_pos_leadingzero: string = '0x000004F';
    let testcase_neg_leadingzero: string = '~0x00a';
    let testcase_bigzero: string = '0x00000';
    let testcase_all_chars1: string = '0x0123456789';
    let testcase_all_chars2: string = '0xabcdef';
    let testcase_all_chars3: string = '0xABCDEF';

    expect(API.lex(testcase_pos)).toEqual([
        new API.NumericToken(testcase_pos, 0, 0x4a)
    ]);
    expect(API.lex(testcase_neg)).toEqual([
        new API.IntegerConstantToken(testcase_neg, 0, -0x6e)
    ]);
    expect(API.lex(testcase_pos_leadingzero)).toEqual([
        new API.IntegerConstantToken(testcase_pos_leadingzero, 0, 0x4f)
    ]);
    expect(API.lex(testcase_neg_leadingzero)).toEqual([
        new API.IntegerConstantToken(testcase_neg_leadingzero, 0, -0xa)
    ]);
    expect(API.lex(testcase_bigzero)).toEqual([
        new API.IntegerConstantToken(testcase_bigzero, 0, 0)
    ]);
    expect(API.lex(testcase_all_chars1)).toEqual([
        new API.IntegerConstantToken(testcase_all_chars1, 0, 0x123456789)
    ]);
    expect(API.lex(testcase_all_chars2)).toEqual([
        new API.IntegerConstantToken(testcase_all_chars2, 0, 0xabcdef)
    ]);
    expect(API.lex(testcase_all_chars3)).toEqual([
        new API.IntegerConstantToken(testcase_all_chars3, 0, 0xabcdef)
    ]);
});

it("integer constants hexadecimal illformed", () => {
    let testcase_nonint: string = '~0x';
    let testcase_too_long_prefix: string = '00x42';
    let testcase_too_short_prefix: string = 'x42';
    let testcase_neg_too_long_prefix: string = '~00x69';
    let testcase_neg_too_short_prefix: string = '~x42';
    let testcase_not_hex: string = '0xabcgcba';
    let testcase_missing_x: string = '04a';
    let testcase_capital_x: string = '0X4a';
    let testcase_double_x: string = '0xx4a';

    expect(API.lex(testcase_nonint)).toEqual([
        new API.IntegerConstantToken("~0", 0, -0),
        new API.AlphanumericIdentifierToken("x", 2)
    ]);
    expect(API.lex(testcase_too_long_prefix)).toEqual([
        new API.IntegerConstantToken("00", 0, 0),
        new API.AlphanumericIdentifierToken("x42", 2)
    ]);
    expect(API.lex(testcase_too_short_prefix)).toEqual([
        new API.AlphanumericIdentifierToken("x42", 0)
    ]);
    expect(API.lex(testcase_neg_too_long_prefix)).toEqual([
        new API.IntegerConstantToken("~00", 0, -0),
        new API.AlphanumericIdentifierToken("x69", 3)
    ]);
    expect(API.lex(testcase_neg_too_short_prefix)).toEqual([
        new API.IdentifierToken("~", 0),
        new API.AlphanumericIdentifierToken("x42", 1)
    ]);
    expect(API.lex(testcase_not_hex)).toEqual([
        new API.IntegerConstantToken("0xabc", 0, 0xabc),
        new API.AlphanumericIdentifierToken("gcba", 5)
    ]);
    expect(API.lex(testcase_missing_x)).toEqual([
        new API.IntegerConstantToken("04", 0, 4),
        new API.AlphanumericIdentifierToken("a", 2)
    ]);
    expect(API.lex(testcase_capital_x)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("X4a", 1)
    ]);
    expect(API.lex(testcase_double_x)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("xx4a", 1)
    ]);
});

it("word constants decimal", () => {
    let testcase_noword: string = '0w';
    let testcase_pos: string = '0w42';
    let testcase_nohex: string = '0w9a';
    let testcase_capital_w: string = '0W1337';
    let testcase_zero_after_w: string = '0w01337';
    let testcase_leading_zero: string = '00w01';
    let testcase_neg: string = '~0w69';

    expect(API.lex(testcase_noword)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("w", 1)
    ]);
    expect(API.lex(testcase_pos)).toEqual([
        new API.WordConstantToken("0w42", 0, 42)
    ]);
    expect(API.lex(testcase_nohex)).toEqual([
        new API.WordConstantToken("0w9", 0, 9),
        new API.AlphanumericIdentifierToken("a", 3)
    ]);
    expect(API.lex(testcase_capital_w)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("W1337", 1)
    ]);
    expect(API.lex(testcase_zero_after_w)).toEqual([
        new API.WordConstantToken("0w01337", 0, 1337)
    ]);
    expect(API.lex(testcase_leading_zero)).toEqual([
        new API.IntegerConstantToken("00", 0, 0),
        new API.AlphanumericIdentifierToken("w01", 2)
    ]);
    expect(API.lex(testcase_neg)).toEqual([
        new API.IntegerConstantToken("~0", 0, -0),
        new API.AlphanumericIdentifierToken("w69", 2)
    ]);
});

it("word constants hexadecimal", () => {
    let testcase_noword: string = '0wx';
    let testcase_pos: string = '0wx4aA';
    let testcase_capital_w: string = '0Wx1337';
    let testcase_zero_after_w: string = '0wx01337';
    let testcase_leading_zero: string = '00wx01';
    let testcase_neg: string = '~0wx69';
    let testcase_capital_x: string = '0wX4aA';
    let testcase_wrong_order: string = '0xwabc';
    let testcase_double_w: string = '0wwabc';

    expect(API.lex(testcase_noword)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("wx", 1)
    ]);
    expect(API.lex(testcase_pos)).toEqual([
        new API.WordConstantToken(testcase_pos, 0, 0x4aa)
    ]);
    expect(API.lex(testcase_capital_w)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("Wx1337", 1)
    ]);
    expect(API.lex(testcase_zero_after_w)).toEqual([
        new API.WordConstantToken(testcase_zero_after_w, 0, 0x1337)
    ]);
    expect(API.lex(testcase_leading_zero)).toEqual([
        new API.IntegerConstantToken("00", 0, 0),
        new API.AlphanumericIdentifierToken("wx01", 2)
    ]);
    expect(API.lex(testcase_neg)).toEqual([
        new API.IntegerConstantToken("~0", 0, -0),
        new API.AlphanumericIdentifierToken("wx69", 2)
    ]);
    expect(API.lex(testcase_capital_x)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("wX4aA", 1)
    ]);
    expect(API.lex(testcase_wrong_order)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("xwabc", 1)
    ]);
    expect(API.lex(testcase_double_w)).toEqual([
        new API.IntegerConstantToken("0", 0, 0),
        new API.AlphanumericIdentifierToken("wwabc", 1)
    ]);
});

it("floating point constants", () => {
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

    expect(API.lex(testcase_good1)).toEqual([
        new API.RealConstantToken(testcase_good1, 0, 0)
    ]);
    expect(API.lex(testcase_good2)).toEqual([
        new API.RealConstantToken(testcase_good2, 0, 0)
    ]);
    expect(API.lex(testcase_good3)).toEqual([
        new API.RealConstantToken(testcase_good3, 0, 0)
    ]);
    expect(API.lex(testcase_leading_zero)).toEqual([
        new API.RealConstantToken(testcase_leading_zero, 0, 40)
    ]);
    expect(() => { API.lex(testcase_hex1); }).toThrow(API.LexerError);
    expect(API.lex(testcase_hex2)).toEqual([
        new API.RealConstantToken('01.0', 0, 1),
        new API.AlphanumericIdentifierToken('x9e03', 4)
    ]);
    expect(API.lex(testcase_hex3)).toEqual([
        new API.RealConstantToken('01.09e0', 0, 1.09),
        new API.AlphanumericIdentifierToken('x3', 7)
    ]);
    expect(() => { API.lex(testcase_double_dot); }).toThrow(API.LexerError);
    expect(API.lex(testcase_double_e)).toEqual([
        new API.RealConstantToken('12e34', 0, 12e34),
        new API.AlphanumericIdentifierToken('e56', 5)
    ]);
    expect(() => { API.lex(testcase_wrong_order); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_missing_component1); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_missing_component2); }).toThrow(API.LexerError);
    expect(API.lex(testcase_missing_component3)).toEqual([
        new API.RealConstantToken('12.34', 0, 12.34),
        new API.AlphanumericIdentifierToken('e', 5)
    ]);
});

it("string constants", () => {
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

    expect(API.lex(testcase_empty)).toEqual([
        new API.StringConstantToken(testcase_empty, 0, '')
    ]);
    expect(() => { API.lex(testcase_non_ending1); }).toThrow(API.IncompleteError);
    expect(() => { API.lex(testcase_non_ending2); }).toThrow(API.IncompleteError);
    expect(() => { API.lex(testcase_non_ending3); }).toThrow(API.IncompleteError);
    expect(() => { API.lex(testcase_non_ending4); }).toThrow(API.IncompleteError);
    expect(API.lex(testcase_basic_string)).toEqual([
        new API.StringConstantToken(testcase_basic_string, 0, 'The quick brown fox jumps over the lazy dog')
    ]);
    expect(() => { API.lex(testcase_newline); }).toThrow(API.LexerError);
    expect(API.lex(testcase_all_basic_escapes)).toEqual([
        new API.StringConstantToken(testcase_all_basic_escapes, 0, '\a \b \t \n \v \f \r " \\')
    ]);
    expect(API.lex(testcase_control_escapes)).toEqual([
        new API.StringConstantToken(testcase_control_escapes, 0, '\x00\x0A\x1E\x1F')
    ]);
    expect(() => { API.lex(testcase_invalid_control_escapes1); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_invalid_control_escapes2); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_invalid_control_escapes3); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_invalid_escapes1); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_invalid_escapes2); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_invalid_escapes3); }).toThrow(API.LexerError);
    expect(API.lex(testcase_decimal_escape)).toEqual([
        new API.StringConstantToken(testcase_decimal_escape, 0, '*Ej')
    ]);
    expect(() => { API.lex(testcase_decimal_escape_too_short1); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_decimal_escape_too_short2); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_decimal_escape_too_short3); }).toThrow(API.LexerError);
    expect(API.lex(testcase_decimal_escape_overlapping)).toEqual([
        new API.StringConstantToken(testcase_decimal_escape_overlapping, 0, '\x00000')
    ]);
    expect(API.lex(testcase_hex_escape)).toEqual([
        new API.StringConstantToken(testcase_hex_escape, 0, '@JJ')
    ]);
    expect(() => { API.lex(testcase_hex_escape_too_short1); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_hex_escape_too_short2); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_hex_escape_too_short3); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_hex_escape_too_short4); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_capital_u); }).toThrow(API.LexerError);
    expect(API.lex(testcase_formatting_ignore1)).toEqual([
        new API.StringConstantToken(testcase_formatting_ignore1, 0, '')
    ]);
    expect(API.lex(testcase_formatting_ignore2)).toEqual([
        new API.StringConstantToken(testcase_formatting_ignore2, 0, 'working?')
    ]);
    expect(() => { API.lex(testcase_formatting_incomplete); }).toThrow(API.IncompleteError);
    expect(() => { API.lex(testcase_formatting_ignore_wrong); }).toThrow(API.LexerError);
});

it("character constants", () => {
    let testcase_empty: string = '#""';
    let testcase_non_ending1: string = '#"';
    let testcase_non_ending2: string = '#"a';
    let testcase_good: string = '#"a"';
    let testcase_escape: string = '#"\\u004A"';
    let testcase_ignores: string = '#"\\ \n \t  \\\\123\\   \n\\"';
    let testcase_too_long: string = '#"\\\\x"';

    expect(() => { API.lex(testcase_empty); }).toThrow(API.LexerError);
    expect(() => { API.lex(testcase_non_ending1); }).toThrow(Errors.IncompleteError);
    expect(() => { API.lex(testcase_non_ending2); }).toThrow(Errors.IncompleteError);
    expect(API.lex(testcase_good)).toEqual([
        new API.CharacterConstantToken(testcase_good, 0, 'a')
    ]);
    expect(API.lex(testcase_escape)).toEqual([
        new API.CharacterConstantToken(testcase_escape, 0, 'J')
    ]);
    expect(API.lex(testcase_ignores)).toEqual([
        new API.CharacterConstantToken(testcase_ignores, 0, '{')
    ]);
    expect(() => { API.lex(testcase_too_long); }).toThrow(API.LexerError);
});

it("comments", () => {
    let testcase_empty_comment: string = '(**)test';
    let testcase_normal_comment: string = '(*this is a comment *)test';
    let testcase_nested_comment: string = '(*this is a (* nested (* ? *) *) comment *)test';
    let testcase_non_ending1: string = '(* incomplete';
    let testcase_non_ending2: string = '(*';
    let testcase_unmatched: string = '*)test';

    expect(API.lex(testcase_empty_comment)).toEqual([
        new API.AlphanumericIdentifierToken('test', 4, 'test')
    ]);
    expect(API.lex(testcase_normal_comment)).toEqual([
        new API.AlphanumericIdentifierToken('test', 22, 'test')
    ]);
    expect(API.lex(testcase_nested_comment)).toEqual([
        new API.AlphanumericIdentifierToken('test', 43, 'test')
    ]);
    expect(() => { API.lex(testcase_non_ending1); }).toThrow(Errors.IncompleteError);
    expect(() => { API.lex(testcase_non_ending2); }).toThrow(Errors.IncompleteError);
    expect(() => { API.lex(testcase_non_ending2); }).toThrow(Errors.LexerError);
})
