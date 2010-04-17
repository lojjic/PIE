/**
 * A tokenizer for CSS value strings.
 * @constructor
 * @param {string} css The CSS value string
 */
PIE.Tokenizer = (function() {
    function Tokenizer( css ) {
        this.css = css;
        this.ch = 0;
        this.tokens = [];
        this.tokenIndex = 0;
    }

    /**
     * Enumeration of token type constants. The values are arbitrary.
     * @enum {number}
     */
    Tokenizer.Type = {
        ANGLE: 1,
        CHARACTER: 2,
        COLOR: 3,
        DIMEN: 4,
        FUNCTION: 5,
        IDENT: 6,
        LENGTH: 7,
        NUMBER: 8,
        OPERATOR: 9,
        PERCENT: 10,
        STRING: 11,
        URL: 12
    };

    /**
     * A single token
     * @constructor
     * @param {number} type The type of the token - see PIE.Tokenizer.Type
     * @param {string} value The value of the token
     */
    Tokenizer.Token = function( type, value ) {
        this.type = type;
        this.value = value;
    };

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
            'px': Tokenizer.Type.LENGTH, 'em': Tokenizer.Type.LENGTH, 'ex': Tokenizer.Type.LENGTH,
            'mm': Tokenizer.Type.LENGTH, 'cm': Tokenizer.Type.LENGTH, 'in': Tokenizer.Type.LENGTH,
            'pt': Tokenizer.Type.LENGTH, 'pc': Tokenizer.Type.LENGTH,
            'deg': Tokenizer.Type.ANGLE, 'rad': Tokenizer.Type.ANGLE, 'grad': Tokenizer.Type.ANGLE
        },

        colorNames: {
            'aqua':1, 'black':1, 'blue':1, 'fuchsia':1, 'gray':1, 'green':1, 'lime':1, 'maroon':1,
            'navy':1, 'olive':1, 'purple':1, 'red':1, 'silver':1, 'teal':1, 'white':1, 'yellow': 1,
            'currentColor': 1
        },

        colorFunctions: {
            'rgb': 1, 'rgba': 1, 'hsl': 1, 'hsla': 1
        },


        /**
         * Advance to and return the next token in the CSS string. If the end of the CSS string has
         * been reached, null will be returned.
         * @return {PIE.Tokenizer.Token}
         */
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
                var tok = new Tokenizer.Token( type, value );
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
                        return newToken( Tokenizer.Type.COLOR, match[0] );
                    }
                    break;

                case '"':
                case "'":
                    if( match = css.match( this.string ) ) {
                        this.ch += match[0].length;
                        return newToken( Tokenizer.Type.STRING, match[2] || match[3] || '' );
                    }
                    break;

                case "/":
                case ",":
                    this.ch++;
                    return newToken( Tokenizer.Type.OPERATOR, ch );

                case 'u':
                    if( match = css.match( this.url ) ) {
                        this.ch += match[0].length;
                        return newToken( Tokenizer.Type.URL, match[2] || match[3] || match[4] || '' );
                    }
            }

            // Numbers and values starting with numbers
            if( match = css.match( this.number ) ) {
                val = match[0];
                this.ch += val.length;

                // Check if it is followed by a unit
                if( css.charAt( val.length ) === '%' ) {
                    this.ch++;
                    return newToken( Tokenizer.Type.PERCENT, val + '%' );
                }
                if( match = css.substring( val.length ).match( this.ident ) ) {
                    val += match[0];
                    this.ch += match[0].length;
                    return newToken( this.unitTypes[ match[0].toLowerCase() ] || Tokenizer.Type.DIMEN, val );
                }

                // Plain ol' number
                return newToken( Tokenizer.Type.NUMBER, val );
            }

            // Identifiers
            if( match = css.match( this.ident ) ) {
                val = match[0];
                this.ch += val.length;

                // Named colors
                if( val.toLowerCase() in this.colorNames ) {
                    return newToken( Tokenizer.Type.COLOR, val );
                }

                // Functions
                if( css.charAt( val.length ) === '(' ) {
                    this.ch++;

                    // Color values in function format: rgb, rgba, hsl, hsla
                    if( val.toLowerCase() in this.colorFunctions ) {
                        if( ( next = this.next() ) && ( next.type === Tokenizer.Type.NUMBER || ( val.charAt(0) === 'r' && next.type === Tokenizer.Type.PERCENT ) ) &&
                            ( next = this.next() ) && next.value === ',' &&
                            ( next = this.next() ) && ( next.type === Tokenizer.Type.NUMBER || next.type === Tokenizer.Type.PERCENT ) &&
                            ( next = this.next() ) && next.value === ',' &&
                            ( next = this.next() ) && ( next.type === Tokenizer.Type.NUMBER || next.type === Tokenizer.Type.PERCENT ) &&
                            ( val === 'rgb' || val === 'hsa' || (
                                ( next = this.next() ) && next.value === ',' &&
                                ( next = this.next() ) && next.type === Tokenizer.Type.NUMBER )
                            ) &&
                            ( next = this.next() ) && next.value === ')' ) {
                            return newToken( Tokenizer.Type.COLOR, css.substring( 0, this.ch ) );
                        }
                        return null;
                    }

                    return newToken( Tokenizer.Type.FUNCTION, val + '(' );
                }

                // Other identifier
                return newToken( Tokenizer.Type.IDENT, val );
            }

            // Standalone character
            this.ch++;
            return newToken( Tokenizer.Type.CHARACTER, ch );
        },

        /**
         * Back up and return the previous token
         * @return {PIE.Tokenizer.Token}
         */
        prev: function() {
            return this.tokens[ this.tokenIndex-- - 2 ];
        },

        /**
         * Retrieve all the tokens in the CSS string
         * @return {Array<{PIE.Tokenizer.Token}>}
         */
        all: function() {
            while( this.next() ) {}
            return this.tokens;
        },

        /**
         * Return a list of tokens from the current position until the given function returns
         * true. The final token will be included in the list.
         * @param {function():boolean} func - test function
         * @param {boolean} require - if true, then if the end of the CSS string is reached
         *        before the test function returns true, null will be returned instead of the
         *        tokens that have been found so far.
         * @return {Array<{PIE.Tokenizer.Token}>}
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