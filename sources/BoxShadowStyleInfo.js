/**
 * Handles parsing, caching, and detecting changes to box-shadow CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.BoxShadowStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    cssProperty: 'box-shadow',
    styleProperty: 'boxShadow',

    parseCss: function( css ) {
        var props,
            getLength = PIE.getLength,
            Type = PIE.Tokenizer.Type,
            tokenizer;

        if( css ) {
            tokenizer = new PIE.Tokenizer( css );
            props = { outset: [], inset: [] };

            function parseItem() {
                var token, type, value, color, lengths, inset, len;

                while( token = tokenizer.next() ) {
                    value = token.tokenValue;
                    type = token.tokenType;

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
                        xOffset: getLength( lengths[0].tokenValue ),
                        yOffset: getLength( lengths[1].tokenValue ),
                        blur: getLength( lengths[2] ? lengths[2].tokenValue : '0' ),
                        spread: getLength( lengths[3] ? lengths[3].tokenValue : '0' ),
                        color: PIE.getColor( color || 'currentColor' )
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
