/**
 * Wrapper for length style values
 * @param val - the CSS string representing the length. It is assumed that this will already have
 *              been validated as a valid length or percentage syntax.
 */
PIE.Length = ( function() {
    function Length( val ) {
        this.val = val;
    }
    Length.prototype = {
        unitRE: /(px|em|ex|mm|cm|in|pt|pc|%)$/,

        getNumber: function() {
            var num = this._number;
            if( num === undefined ) {
                num = this._number = parseFloat( this.val );
            }
            return num;
        },

        getUnit: function() {
            var unit = this._unit, m;
            if( !unit ) {
                m = this.val.match( this.unitRE );
                unit = this._unit = ( m && m[0] ) || 'px';
            }
            return unit;
        },

        isPercentage: function() {
            return this.getUnit() === '%';
        },

        /**
         * Resolve this length into a number of pixels.
         * @param el - the context element, used to resolve font-relative values
         * @param pct100 - the number of pixels that equal a 100% percentage. This can be either a number or a
         *                 function which will be called to return the number.
         */
        pixels: function( el, pct100 ) {
            var num = this.getNumber(),
                unit = this.getUnit();
            switch( unit ) {
                case "px":
                    return num;
                case "%":
                    return num * ( typeof pct100 === 'function' ? pct100() : pct100 ) / 100;
                case "em":
                    return num * this.getEmPixels( el );
                case "ex":
                    return num * this.getEmPixels( el ) / 2;
                default:
                    return num * Length.conversions[ unit ];
            }
        },

        /**
         * The em and ex units are relative to the font-size of the current element,
         * however if the font-size is set using non-pixel units then we get that value
         * rather than a pixel conversion. To get around this, we keep a floating element
         * with width:1em which we insert into the target element and then read its offsetWidth.
         * But if the font-size *is* specified in pixels, then we use that directly to avoid
         * the expensive DOM manipulation.
         * @param el
         */
        getEmPixels: function( el ) {
            var fs = el.currentStyle.fontSize,
                tester, s, px;

            if( fs.indexOf( 'px' ) > 0 ) {
                return parseFloat( fs );
            } else {
                tester = this._tester;
                if( !tester ) {
                    tester = this._tester = el.document.createElement( 'length-calc' );
                    s = tester.style;
                    s.width = '1em';
                    s.position = 'absolute';
                    s.top = s.left = -9999;
                    s.visibility = 'hidden';
                }
                el.appendChild( tester );
                px = tester.offsetWidth;
                el.removeChild( tester );
                return px;
            }
        }
    };

    Length.conversions = (function() {
        var units = [ 'mm', 'cm', 'in', 'pt', 'pc' ],
            vals = {},
            parent = element.parentNode,
            i = 0, len = units.length, unit, el, s;
        for( ; i < len; i++ ) {
            unit = units[i];
            el = element.document.createElement( 'length-calc' );
            s = el.style;
            s.position = 'absolute';
            s.top = s.left = -9999;
            s.width = '100' + unit;
            parent.appendChild( el );
            vals[ unit ] = el.offsetWidth / 100;
            parent.removeChild( el );
        }
        return vals;
    })();

    Length.ZERO = new Length( '0' );

    return Length;
} )();

