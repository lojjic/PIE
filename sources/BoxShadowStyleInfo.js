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

        noneRE: /^\s*none\s*$/,
        insetRE: /(inset)/,
        lengthsRE: new RegExp( '\\s*(L)\\s+(L)(\\s+(L))?(\\s+(L))?\\s*'.replace( /L/g, PIE.StyleBase.lengthRE.source ) ),

        parseCss: function( css ) {
            var p = null, m,
                Length = PIE.Length;

            if( css && !this.noneRE.test( css ) ) {
                p = {};

                // check for inset keyword
                if( this.insetRE.test( css ) ) {
                    css = css.replace( this.insetRE, '' );
                    p.inset = true;
                }

                // get the color
                m = css.match( this.colorRE );
                if( m ) {
                    css = css.replace( this.colorRE, '' );
                    p.color = new PIE.Color( m[0] );
                } else {
                    p.color = new PIE.Color( this.element.currentStyle.color );
                }

                // all that's left should be lengths; map them to xOffset/yOffset/blurRadius/spreadRadius
                m = css.match( this.lengthsRE );
                if( m ) {
                    p.xOffset = new Length( m[1] );
                    p.yOffset = new Length( m[3] );
                    p.blur = new Length( m[6] || '0' );
                    p.spread = new Length( m[9] || '0' );
                } else {
                    // Something unknown was present; give up.
                    p = null;
                }
            }

            return p;
        }
    } );

    return BoxShadowStyleInfo;
})();