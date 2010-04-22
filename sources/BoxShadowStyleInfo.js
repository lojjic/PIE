/**
 * Handles parsing, caching, and detecting changes to box-shadow CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.BoxShadowStyleInfo = (function() {
    function BoxShadowStyleInfo( el ) {
        this.element = el;
    }
    PIE.Util.merge( BoxShadowStyleInfo.prototype, PIE.StyleBase, {

        cssProperty: PIE.CSS_PREFIX + 'box-shadow',
        styleProperty: PIE.STYLE_PREFIX + 'BoxShadow',

        parseCss: function( css ) {
            var p = null, m,
                Length = PIE.Length,
                Type = PIE.Tokenizer.Type,
                tokenizer, token, type, value, color, lengths, len;

            function isLength( tok ) {
                return tok.type === Type.LENGTH || ( tok.type === Type.NUMBER && tok.value === '0' );
            }

            if( css ) {
                tokenizer = new PIE.Tokenizer( css );
                p = {};

                while( token = tokenizer.next() ) {
                    value = token.value;
                    type = token.type;

                    if( isLength( token ) ) {
                        if( lengths ) {
                            return null;
                        }
                        tokenizer.prev();
                        lengths = tokenizer.until( function( token ) {
                            return !isLength( token );
                        } );
                    }
                    else if( type === Type.COLOR ) {
                        if( color ) {
                            return null;
                        }
                        color = value;
                    }
                    else if( type === Type.IDENT ) {
                        if( value !== 'inset' || p.inset === true ) {
                            return null;
                        }
                        p.inset = true;
                    }
                }

                len = lengths.length;
                if( len < 2 || len > 4 ) {
                    return null;
                }

                p.xOffset = new Length( lengths[0].value );
                p.yOffset = new Length( lengths[1].value );
                p.blur = new Length( lengths[2] ? lengths[2].value : '0' );
                p.spread = new Length( lengths[3] ? lengths[3].value : '0' );
                
                p.color = new PIE.Color( color || 'currentColor' );
            }

            return p;
        }
    } );

    return BoxShadowStyleInfo;
})();