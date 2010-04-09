/**
 * Wrapper for angle values; handles conversion to degrees from all allowed angle units
 * @param val
 */
PIE.Angle = function( val ) {
    this.val = val;
};
PIE.Angle.prototype = {
    unitRE: /(deg|rad|grad|turn)$/,

    getUnit: function() {
        return this._unit || ( this._unit = this.val.match( this.unitRE )[1] );
    },

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
