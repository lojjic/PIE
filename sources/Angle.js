/**
 * Wrapper for angle values; handles conversion to degrees from all allowed angle units
 * @constructor
 * @param {string} val The raw CSS value for the angle. It is assumed it has been pre-validated.
 */
PIE.Angle = (function() {
    function Angle( val ) {
        this.val = val;
    }
    Angle.prototype = {
        unitRE: /[a-z]+$/i,

        /**
         * @return {string} The unit of the angle value
         */
        getUnit: function() {
            return this._unit || ( this._unit = this.val.match( this.unitRE )[0].toLowerCase() );
        },

        getNumber: function() {
            return this._num || ( this._num = parseFloat( this.val, 10 ) );
        },

        /**
         * Get the numeric value of the angle in degrees.
         * @return {number} The degrees value
         */
        degrees: function() {
            var deg = this._deg, unit, number, undef;
            if( deg === undef ) {
                unit = this.getUnit();
                number = this.getNumber();
                deg = this._deg = ( unit === 'deg' ? number : unit === 'rad' ? number / Math.PI * 180 : unit === 'grad' ? number / 400 * 360 : unit === 'turn' ? number * 360 : 0 );
            }
            return deg;
        },

        radians: function() {
            var rad = this._rad, unit, number, undef;
            if( rad === undef ) {
                unit = this.getUnit();
                number = this.getNumber();
                rad = this._rad = ( unit === 'rad' ? number : this.degrees() / 180 * Math.PI );
            }
        }
    };

    return Angle;
})();