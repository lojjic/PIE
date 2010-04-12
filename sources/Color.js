/**
 * Abstraction for colors values. Allows detection of rgba values.
 * @constructor
 * @param {string} val The raw CSS string value for the color
 */
PIE.Color = function( val ) {
    this.val = val;
};

/**
 * Regular expression for matching rgba colors and extracting their components
 * @type {RegExp}
 */
PIE.Color.rgbaRE = /\s*rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+|\d*\.\d+)\s*\)\s*/;

PIE.Color.prototype = {
    /**
     * @private
     */
    parse: function() {
        if( !this._color ) {
            var v = this.val,
                m = v.match( PIE.Color.rgbaRE );
            if( m ) {
                this._color = 'rgb(' + m[1] + ',' + m[2] + ',' + m[3] + ')';
                this._alpha = parseFloat( m[4] );
            } else {
                this._color = v;
                this._alpha = 1;
            }
        }
    },

    /**
     * Retrieve the value of the color in a format usable by IE natively. This will be the same as
     * the raw input value, except for rgba values which will be converted to an rgb value.
     * @return {string} Color value
     */
    value: function() {
        this.parse();
        return this._color;
    },

    /**
     * Retrieve the alpha value of the color. Will be 1 for all values except for rgba values
     * with an alpha component.
     * @return {number} The alpha value, from 0 to 1.
     */
    alpha: function() {
        this.parse();
        return this._alpha;
    }
};
