/**
 * Handles parsing, caching, and detecting changes to border-image CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.BorderImageStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    cssProperty: 'border-image',
    styleProperty: 'borderImage',

    repeatIdents: { 'stretch':1, 'round':1, 'repeat':1, 'space':1 },

    parseCss: function( css ) {
        var p = null, tokenizer, token, type, value,
            slices, widths, outsets,
            slashCount = 0, cs,
            Type = PIE.Tokenizer.Type,
            IDENT = Type.IDENT,
            NUMBER = Type.NUMBER,
            LENGTH = Type.LENGTH,
            PERCENT = Type.PERCENT;

        if( css ) {
            tokenizer = new PIE.Tokenizer( css );
            p = {};

            function isSlash( token ) {
                return token && ( token.type & Type.OPERATOR ) && ( token.value === '/' );
            }

            function isFillIdent( token ) {
                return token && ( token.type & IDENT ) && ( token.value === 'fill' );
            }

            function collectSlicesEtc() {
                slices = tokenizer.until( function( tok ) {
                    return !( tok.type & ( NUMBER | PERCENT ) );
                } );

                if( isFillIdent( tokenizer.next() ) && !p.fill ) {
                    p.fill = true;
                } else {
                    tokenizer.prev();
                }

                if( isSlash( tokenizer.next() ) ) {
                    slashCount++;
                    widths = tokenizer.until( function( tok ) {
                        return !( token.type & ( NUMBER | PERCENT | LENGTH ) ) && !( ( token.type & IDENT ) && token.value === 'auto' );
                    } );

                    if( isSlash( tokenizer.next() ) ) {
                        slashCount++;
                        outsets = tokenizer.until( function( tok ) {
                            return !( token.type & ( NUMBER | LENGTH ) );
                        } );
                    }
                } else {
                    tokenizer.prev();
                }
            }

            while( token = tokenizer.next() ) {
                type = token.type;
                value = token.value;

                // Numbers and/or 'fill' keyword: slice values. May be followed optionally by width values, followed optionally by outset values
                if( type & ( NUMBER | PERCENT ) && !slices ) {
                    tokenizer.prev();
                    collectSlicesEtc();
                }
                else if( isFillIdent( token ) && !p.fill ) {
                    p.fill = true;
                    collectSlicesEtc();
                }

                // Idents: one or values for 'repeat'
                else if( ( type & IDENT ) && this.repeatIdents[value] && !p.repeat ) {
                    p.repeat = { h: value };
                    if( token = tokenizer.next() ) {
                        if( ( token.type & IDENT ) && this.repeatIdents[token.value] ) {
                            p.repeat.v = token.value;
                        } else {
                            tokenizer.prev();
                        }
                    }
                }

                // URL of the image
                else if( ( type & Type.URL ) && !p.src ) {
                    p.src =  value;
                }

                // Found something unrecognized; exit.
                else {
                    return null;
                }
            }

            // Validate what we collected
            if( !p.src || !slices || slices.length < 1 || slices.length > 4 ||
                ( widths && widths.length > 4 ) || ( slashCount === 1 && widths.length < 1 ) ||
                ( outsets && outsets.length > 4 ) || ( slashCount === 2 && outsets.length < 1 ) ) {
                return null;
            }

            // Fill in missing values
            if( !p.repeat ) {
                p.repeat = { h: 'stretch' };
            }
            if( !p.repeat.v ) {
                p.repeat.v = p.repeat.h;
            }

            function distributeSides( tokens, convertFn ) {
                return {
                    t: convertFn( tokens[0] ),
                    r: convertFn( tokens[1] || tokens[0] ),
                    b: convertFn( tokens[2] || tokens[0] ),
                    l: convertFn( tokens[3] || tokens[1] || tokens[0] )
                };
            }

            p.slice = distributeSides( slices, function( tok ) {
                return new PIE.Length( ( tok.type & NUMBER ) ? tok.value + 'px' : tok.value );
            } );

            p.width = widths && widths.length > 0 ?
                    distributeSides( widths, function( tok ) {
                        return tok.type & ( LENGTH | PERCENT ) ? new PIE.Length( tok.value ) : tok.value;
                    } ) :
                    ( cs = this.targetElement.currentStyle ) && {
                        t: new PIE.Length( cs.borderTopWidth ),
                        r: new PIE.Length( cs.borderRightWidth ),
                        b: new PIE.Length( cs.borderBottomWidth ),
                        l: new PIE.Length( cs.borderLeftWidth )
                    };

            p.outset = distributeSides( outsets || [ 0 ], function( tok ) {
                return tok.type & LENGTH ? new PIE.Length( tok.value ) : tok.value;
            } );
        }

        return p;
    }
} );