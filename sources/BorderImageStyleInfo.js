PIE.BorderImageStyleInfo = function( el ) {
    this.element = el;
};
PIE.Util.merge( PIE.BorderImageStyleInfo.prototype, PIE.StyleBase, {

    cssProperty: PIE.CSS_PREFIX + 'border-image',
    styleProperty: PIE.STYLE_PREFIX + 'BorderImage',

    //TODO this needs to be reworked to allow the components to appear in arbitrary order
    parseRE: new RegExp(
        '^\\s*url\\(\\s*([^\\s\\)]+)\\s*\\)\\s+N(\\s+N)?(\\s+N)?(\\s+N)?(\\s*\\/\\s*L(\\s+L)?(\\s+L)?(\\s+L)?)?RR\\s*$'
                .replace( /N/g, '(\\d+|' + PIE.StyleBase.percentRE.source + ')' )
                .replace( /L/g, PIE.StyleBase.lengthRE.source )
                .replace( /R/g, '(\\s+(stretch|round|repeat))?' )
    ),

    parseCss: function( css ) {
        var cs = this.element.currentStyle,
            p = null,
            Length = PIE.Length,
            m = css && css.match( this.parseRE );

        if( m ) {
            p = {
                src: m[1],

                slice: {
                    t: parseInt( m[2], 10 ),
                    r: parseInt( m[4] || m[2], 10 ),
                    b: parseInt( m[6] || m[2], 10 ),
                    l: parseInt( m[8] || m[4] || m[2], 10 )
                },

                width: m[9] ? {
                    t: new Length( m[10] ),
                    r: new Length( m[12] || m[10] ),
                    b: new Length( m[14] || m[10] ),
                    l: new Length( m[16] || m[12] || m[10] )
                } : {
                    t: new Length( cs.borderTopWidth ),
                    r: new Length( cs.borderRightWidth ),
                    b: new Length( cs.borderBottomWidth ),
                    l: new Length( cs.borderLeftWidth )
                },

                repeat: {
                    h: m[18] || 'stretch',
                    v: m[20] || m[18] || 'stretch'
                }
            };
        }

        return p;
    }
} );
