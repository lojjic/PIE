/**
 * Handles parsing, caching, and detecting changes to border-radius CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.BorderRadiusStyleInfo = (function() {
    function BorderRadiusStyleInfo( el ) {
        this.element = el;
    }
    PIE.Util.merge( BorderRadiusStyleInfo.prototype, PIE.StyleBase, {

        cssProperty: 'border-radius',
        styleProperty: 'borderRadius',

        parseRE: new RegExp(
            '^G(\\/G)?$'.replace( /G/g, '\\s*(L)(\\s+(L))?(\\s+(L))?(\\s+(L))?\\s*'.replace( /L/g, PIE.StyleBase.lengthRE.source + '|' + PIE.StyleBase.percentRE.source ) )
        ),

        parseCss: function( css ) {
            var p = null, x, y, c,
                hasNonZero = false,
                m = css && css.match( this.parseRE );

            function len( v ) {
                return new PIE.Length( v );
            }

            if( m ) {
                x = {
                    'tl': len( m[1] ),
                    'tr': len( m[4] || m[1] ),
                    'br': len( m[7] || m[1] ),
                    'bl': len( m[10] || m[4] || m[1] )
                };
                for( c in x ) {
                    if( x.hasOwnProperty( c ) && x[c].getNumber() !== 0 ) {
                        hasNonZero = true;
                    }
                }

                if( m[12] ) {
                    y = {
                        'tl': len( m[13] ),
                        'tr': len( m[16] || m[13] ),
                        'br': len( m[19] || m[13] ),
                        'bl': len( m[22] || m[16] || m[13] )
                    };
                    for( c in y ) {
                        if( y.hasOwnProperty( c ) && y[c].getNumber() !== 0 ) {
                            hasNonZero = true;
                        }
                    }
                } else {
                    y = x;
                }

                // Treat all-zero values the same as no value
                if( hasNonZero ) {
                    p = { x: x, y : y };
                }
            }

            return p;
        }
    } );

    return BorderRadiusStyleInfo;
})();