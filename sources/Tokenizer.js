PIE.Tokenizer = (function() {

    var TYPE_IDENT = 'IDENT',
        TYPE_NUMBER = 'NUMBER',
        TYPE_LENGTH = 'LENGTH',
        TYPE_ANGLE = 'ANGLE',
        TYPE_PERCENT = 'PERCENT',
        TYPE_DIMEN = 'DIMEN',
        TYPE_COLOR = 'COLOR',
        TYPE_STRING = 'STRING',
        TYPE_URL = 'URL',
        TYPE_FUNCTION = 'FUNCTION',
        TYPE_OPERATOR = 'OPERATOR',
        TYPE_CHARACTER = 'CHAR';


    function Tokenizer( css ) {
        this.css = css;
        this.ch = 0;
        this.tokens = [];
        this.tokenIndex = 0;
    }
    Tokenizer.prototype = {
        whitespace: /\s/,
        number: /^[\+\-]?(\d*\.)?\d+/,
        url: /^url\(\s*("([^"]*)"|'([^']*)'|([!#$%&*-~]*))\s*\)/i,
        ident: /^\-?[_a-z][\w-]*/i,
        string: /^("([^"]*)"|'([^']*)')/,
        operator: /^[\/,]/,
        hash: /^#[\w]+/,
        hashColor: /^#([\da-f]{6}|[\da-f]{3})/i,

        unitTypes: {
            px: TYPE_LENGTH, em: TYPE_LENGTH, ex: TYPE_LENGTH, mm: TYPE_LENGTH,
            cm: TYPE_LENGTH, 'in': TYPE_LENGTH, pt: TYPE_LENGTH, pc: TYPE_LENGTH,
            deg: TYPE_ANGLE, rad: TYPE_ANGLE, grad: TYPE_ANGLE
        },

        colorNames: {
            aqua:1, black:1, blue:1, fuchsia:1, gray:1, green:1, lime:1, maroon:1,
            navy:1, olive:1, purple:1, red:1, silver:1, teal:1, white:1, yellow: 1,
            currentColor: 1
        },

        colorFunctions: {
            rgb: 1, rgba: 1, hsl: 1, hsla: 1
        },

        next: function() {
            var css, ch, match, type, val, next,
                me = this;

            // In case we previously backed up, return the stored token in the next slot
            if( this.tokenIndex < this.tokens.length ) {
                return this.tokens[ this.tokenIndex++ ];
            }

            // Move past leading whitespace characters
            while( this.whitespace.test( this.css.charAt( this.ch ) ) ) {
                this.ch++;
            }
            if( this.ch >= this.css.length ) {
                return null;
            }

            function newToken( type, value ) {
                var tok = { type: type, value: value };
                me.tokens.push( tok );
                me.tokenIndex++;
                return tok;
            }

            css = this.css.substring( this.ch );
            ch = css.charAt( 0 );
            switch( ch ) {
                case '#':
                    if( match = css.match( this.hashColor ) ) {
                        this.ch += match[0].length;
                        return newToken( TYPE_COLOR, match[0] );
                    }
                    break;

                case '"':
                case "'":
                    if( match = css.match( this.string ) ) {
                        this.ch += match[0].length;
                        return newToken( TYPE_STRING, match[2] || match[3] || '' );
                    }
                    break;

                case "/":
                case ",":
                    this.ch++;
                    return newToken( TYPE_OPERATOR, ch );

                case 'u':
                    if( match = css.match( this.url ) ) {
                        this.ch += match[0].length;
                        return newToken( TYPE_URL, match[2] || match[3] || match[4] || '' );
                    }
            }

            // Numbers and values starting with numbers
            if( match = css.match( this.number ) ) {
                val = match[0];
                this.ch += val.length;

                // Check if it is followed by a unit
                if( css.charAt( val.length ) === '%' ) {
                    this.ch++;
                    return newToken( TYPE_PERCENT, val + '%' );
                }
                if( match = css.substring( val.length ).match( this.ident ) ) {
                    val += match[0];
                    this.ch += match[0].length;
                    return newToken( this.unitTypes[ match[0].toLowerCase() ] || TYPE_DIMEN, val );
                }

                // Plain ol' number
                return newToken( TYPE_NUMBER, val );
            }

            // Identifiers
            if( match = css.match( this.ident ) ) {
                val = match[0];
                this.ch += val.length;

                // Named colors
                if( val.toLowerCase() in this.colorNames ) {
                    return newToken( TYPE_COLOR, val );
                }

                // Functions
                if( css.charAt( val.length ) === '(' ) {
                    this.ch++;

                    // Color values in function format: rgb, rgba, hsl, hsla
                    if( val.toLowerCase() in this.colorFunctions ) {
                        if( ( next = this.next() ) && ( next.type === TYPE_NUMBER || ( val.charAt(0) === 'r' && next.type === TYPE_PERCENT ) ) &&
                            ( next = this.next() ) && next.value === ',' &&
                            ( next = this.next() ) && ( next.type === TYPE_NUMBER || next.type === TYPE_PERCENT ) &&
                            ( next = this.next() ) && next.value === ',' &&
                            ( next = this.next() ) && ( next.type === TYPE_NUMBER || next.type === TYPE_PERCENT ) &&
                            ( val === 'rgb' || val === 'hsa' || (
                                ( next = this.next() ) && next.value === ',' &&
                                ( next = this.next() ) && next.type === TYPE_NUMBER )
                            ) &&
                            ( next = this.next() ) && next.value === ')' ) {
                            return newToken( TYPE_COLOR, css.substring( 0, this.ch ) );
                        }
                        return null;
                    }

                    return newToken( TYPE_FUNCTION, val + '(' );
                }

                // Other identifier
                return newToken( TYPE_IDENT, val );
            }

            // Standalone character
            this.ch++;
            return newToken( TYPE_CHARACTER, ch );
        },

        prev: function() {
            return this.tokens[ this.tokenIndex-- - 2 ];
        },

        all: function() {
            while( this.next() ) {}
            return this.tokens;
        },

        /**
         * Return a list of tokens until the given function returns true. The final token
         * will be included in the list.
         * @param {Function} func
         * @param {Boolean} require - if true, then if the end of the CSS string is reached
         *        before the test function returns true, null will be returned instead of the
         *        tokens that have been found so far.
         */
        until: function( func, require ) {
            var list = [], t, hit;
            while( t = this.next() ) {
                list.push( t );
                if( func( t ) ) {
                    hit = true;
                    break;
                }
            }
            return require && !hit ? null : list;
        }
    };

    return Tokenizer;
})();
