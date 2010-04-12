/**
 * Wrapper for angle values; handles conversion to degrees from all allowed angle units
 * @constructor
 * @param {string} val The raw CSS value for the angle. It is assumed it has been pre-validated.
 */
PIE.Angle = function( val ) {
    this.val = val;
};
PIE.Angle.prototype = {
    unitRE: /(deg|rad|grad|turn)$/,

    /**
     * @return {string} The unit of the angle value
     */
    getUnit: function() {
        return this._unit || ( this._unit = this.val.match( this.unitRE )[1] );
    },

    /**
     * Get the numeric value of the angle in degrees.
     * @return {number} The degrees value
     */
    degrees: function() {
        var deg = this._deg, u, n;
        if( !deg ) {
            u = this.getUnit();
            n = parseFloat( this.val, 10 );
            deg = this._deg = ( u === 'deg' ? n : u === 'rad' ? n / Math.PI * 180 : u === 'grad' ? n / 400 * 360 : u === 'turn' ? n * 360 : 0 );
        }
        return deg;
    }
};
