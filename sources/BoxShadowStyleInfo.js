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
            var props, item,
                Length = PIE.Length,
                Type = PIE.Tokenizer.Type,
                tokenizer;

            if( css ) {
                tokenizer = new PIE.Tokenizer( css );
                props = [];

                function parseItem() {
                    var token, type, value, color, lengths, inset, len;

                    while( token = tokenizer.next() ) {
                        value = token.value;
                        type = token.type;

                        if( type & Type.OPERATOR && value === ',' ) {
                            break;
                        }
                        else if( token.isLength() && !lengths ) {
                            tokenizer.prev();
                            lengths = tokenizer.until( function( token ) {
                                return !token.isLength();
                            } );
                        }
                        else if( type & Type.COLOR && !color ) {
                            color = value;
                        }
                        else if( type & Type.IDENT && value === 'inset' && !inset ) {
                            inset = true;
                        }
                        else { //encountered an unrecognized token; fail.
                            return null;
                        }
                    }

                    len = lengths && lengths.length;
                    return ( len > 1 && len < 5 ) ? {
                        xOffset: new Length( lengths[0].value ),
                        yOffset: new Length( lengths[1].value ),
                        blur: new Length( lengths[2] ? lengths[2].value : '0' ),
                        spread: new Length( lengths[3] ? lengths[3].value : '0' ),
                        color: new PIE.Color( color || 'currentColor' ),
                        inset: !!inset
                    } : null;
                }

                while( tokenizer.hasNext() ) {
                    if( !( item = parseItem() ) ) {
                        // If parseItem() returned null that means it encountered something
                        // invalid, so throw away everything.
                        return null;
                    }
                    props.push( item );
                }
            }

            return props && props.length ? props : null;
        }
    } );

    return BoxShadowStyleInfo;
})();