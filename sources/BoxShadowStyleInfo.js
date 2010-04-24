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

        cssProperty: 'box-shadow',
        styleProperty: 'boxShadow',

        parseCss: function( css ) {
            var p = null, m,
                Length = PIE.Length,
                Type = PIE.Tokenizer.Type,
                tokenizer, token, type, value, color, lengths, len;

            if( css ) {
                tokenizer = new PIE.Tokenizer( css );
                p = {};

                while( token = tokenizer.next() ) {
                    value = token.value;
                    type = token.type;

                    if( token.isLength() ) {
                        if( lengths ) {
                            return null;
                        }
                        tokenizer.prev();
                        lengths = tokenizer.until( function( token ) {
                            return !token.isLength();
                        } );
                    }
                    else if( type & Type.COLOR ) {
                        if( color ) {
                            return null;
                        }
                        color = value;
                    }
                    else if( type & Type.IDENT ) {
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