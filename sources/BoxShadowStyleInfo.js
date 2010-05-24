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
            var props,
                Length = PIE.Length,
                Type = PIE.Tokenizer.Type,
                tokenizer;

            if( css ) {
                tokenizer = new PIE.Tokenizer( css );
                props = { outset: [], inset: [] };

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
                            return false;
                        }
                    }

                    len = lengths && lengths.length;
                    if( len > 1 && len < 5 ) {
                        ( inset ? props.inset : props.outset ).push( {
                            xOffset: new Length( lengths[0].value ),
                            yOffset: new Length( lengths[1].value ),
                            blur: new Length( lengths[2] ? lengths[2].value : '0' ),
                            spread: new Length( lengths[3] ? lengths[3].value : '0' ),
                            color: new PIE.Color( color || 'currentColor' )
                        } );
                        return true;
                    }
                    return false;
                }

                while( parseItem() ) {}
            }

            return props && ( props.inset.length || props.outset.length ) ? props : null;
        }
    } );

    return BoxShadowStyleInfo;
})();