/**
 * Wrapper for a CSS3 bg-position value. Takes up to 2 position keywords and 2 lengths/percentages.
 * @param tokens
 */
PIE.BgPosition = function( tokens ) {
    this.tokens = tokens;
};
PIE.BgPosition.prototype = {
    /**
     * Normalize the values into the form:
     * [ xOffsetSide, xOffsetLength, yOffsetSide, yOffsetLength ]
     * where: xOffsetSide is either 'left' or 'right',
     *        yOffsetSide is either 'top' or 'bottom',
     *        and x/yOffsetLength are both PIE.Length objects.
     */
    getValues: function() {
        if( !this._values ) {
            var tokens = this.tokens,
                len = tokens.length,
                ident_left = 'left',
                ident_top = 'top',
                ident_center = 'center',
                ident_right = 'right',
                ident_bottom = 'bottom',
                length_zero = PIE.Length.ZERO,
                length_fifty = new PIE.Length( '50%' ),
                type, value,
                vert_idents = { top: 1, center: 1, bottom: 1 },
                horiz_idents = { left: 1, center: 1, right: 1 },
                vals = [ ident_left, length_zero, ident_top, length_zero ];

            // If only one value, the second is assumed to be 'center'
            if( len === 1 ) {
                tokens.push( { type: 'IDENT', value: 'center' } );
                len++;
            }

            // Two values - CSS2
            if( len === 2 ) {
                // If both idents, they can appear in either order, so switch them if needed
                if( tokens[0].type === 'IDENT' && tokens[1].type === 'IDENT' &&
                    tokens[0].value in vert_idents && tokens[1].value in horiz_idents ) {
                    tokens.push( tokens.shift() );
                }
                if( tokens[0].type === 'IDENT' ) {
                    if( tokens[0].value === 'center' ) {
                        vals[1] = length_fifty;
                    } else {
                        vals[0] = tokens[0].value;
                    }
                }
                else if( tokens[0].type === 'LENGTH' || tokens[0].type === 'PERCENT' ) {
                    vals[1] = new PIE.Length( tokens[0].value );
                }
                if( tokens[1].type === 'IDENT' ) {
                    if( tokens[1].value === 'center' ) {
                        vals[3] = length_fifty;
                    } else {
                        vals[2] = tokens[1].value;
                    }
                }
                else if( tokens[1].type === 'LENGTH' || tokens[1].type === 'PERCENT' ) {
                    vals[3] = new PIE.Length( tokens[1].value );
                }
            }

            // Three or four values - CSS3
            else {
                // TODO
            }

            this._values = vals;
        }
        return this._values;
    },

    /**
     * Find the coordinates of the background image from the upper-left corner of the background area
     * @param {Element} el
     * @param {Number} width - the width for percentages (background area width minus image width)
     * @param {Number} height - the height for percentages (background area height minus image height)
     * @return {Object} { x: Number, y: Number }
     */
    coords: function( el, width, height ) {
        var vals = this.getValues(),
            pxX = vals[1].pixels( el, width ),
            pxY = vals[3].pixels( el, height );

        return {
            x: Math.round( vals[0] === 'right' ? width - pxX : pxX ),
            y: Math.round( vals[2] === 'bottom' ? height - pxY : pxY )
        };
    }
};
