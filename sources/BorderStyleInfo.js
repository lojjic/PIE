/**
 * Handles parsing, caching, and detecting changes to border CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.BorderStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    sides: [ 'Top', 'Right', 'Bottom', 'Left' ],
    namedWidths: {
        thin: '1px',
        medium: '3px',
        thick: '5px'
    },

    parseCss: function( css ) {
        var w = {},
            s = {},
            c = {},
            el = this.element,
            cs = el.currentStyle,
            rs = el.runtimeStyle,
            rtColor = rs.borderColor,
            i = 0,
            active = false,
            colorsSame = true, stylesSame = true, widthsSame = true,
            style, color, width, lastStyle, lastColor, lastWidth, side, ltr;

        rs.borderColor = '';
        for( ; i < 4; i++ ) {
            side = this.sides[ i ];
            ltr = side.charAt(0).toLowerCase();
            style = s[ ltr ] = cs[ 'border' + side + 'Style' ];
            color = cs[ 'border' + side + 'Color' ];
            width = cs[ 'border' + side + 'Width' ];

            if( i > 0 ) {
                if( style !== lastStyle ) { stylesSame = false; }
                if( color !== lastColor ) { colorsSame = false; }
                if( width !== lastWidth ) { widthsSame = false; }
            }
            lastStyle = style;
            lastColor = color;
            lastWidth = width;

            c[ ltr ] = new PIE.Color( color );

            width = w[ ltr ] = new PIE.Length( s[ ltr ] === 'none' ? '0' : ( this.namedWidths[ width ] || width ) );
            if( width.pixels( this.element ) > 0 ) {
                active = true;
            }
        }
        rs.borderColor = rtColor;

        return active ? {
            widths: w,
            styles: s,
            colors: c,
            widthsSame: widthsSame,
            colorsSame: colorsSame,
            stylesSame: stylesSame
        } : null;
    },

    getCss: function() {
        var el = this.element,
            cs = el.currentStyle,
            rs = el.runtimeStyle,
            rtColor = rs.borderColor,
            css;

        rs.borderColor = '';
        css = cs.borderWidth + '|' + cs.borderStyle + '|' + cs.borderColor;
        rs.borderColor = rtColor;
        return css;
    }

} );
