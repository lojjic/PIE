/**
 * Abstraction for colors values. Allows detection of rgba values.
 * @param el
 */
PIE.Color = (function() {
    function Color( val ) {
        this.val = val;
    }
    Color.rgbaRE = /\s*rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+|\d*\.\d+)\s*\)\s*/;
    Color.prototype = {
        parse: function() {
            if( !this._color ) {
                var v = this.val,
                    m = v.match( Color.rgbaRE );
                if( m ) {
                    this._color = 'rgb(' + m[1] + ',' + m[2] + ',' + m[3] + ')';
                    this._alpha = parseFloat( m[4] );
                } else {
                    this._color = v;
                    this._alpha = 1;
                }
            }
        },
        value: function() {
            this.parse();
            return this._color;
        },
        alpha: function() {
            this.parse();
            return this._alpha;
        }
    };
    return Color;
})();
