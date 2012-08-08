/**
 * Abstraction for colors values. Allows detection of rgba values. A singleton instance per unique
 * value is returned from PIE.getColor() - always use that instead of instantiating directly.
 * @constructor
 * @param {string} val The raw CSS string value for the color
 */
PIE.Color = (function() {

    /*
     * hsl2rgb from http://codingforums.com/showthread.php?t=11156
     * code by Jason Karl Davis (http://www.jasonkarldavis.com)
     * swiped from cssSandpaper by Zoltan Hawryluk (http://www.useragentman.com/blog/csssandpaper-a-css3-javascript-library/)
     * modified for formatting and size optimizations
     */
    function hsl2rgb( h, s, l ) {
        var m1, m2, r, g, b,
            round = Math.round;
        s /= 100;
        l /= 100;
        if ( !s ) { r = g = b = l * 255; }
        else {
            if ( l <= 0.5 ) { m2 = l * ( s + 1 ); }
            else { m2 = l + s - l * s; }
            m1 = l * 2 - m2;
            h = ( h % 360 ) / 360;
            r = hueToRgb( m1, m2, h + 1/3 );
            g = hueToRgb( m1, m2, h );
            b = hueToRgb( m1, m2, h - 1/3 );
        }
        return { r: round( r ), g: round( g ), b: round( b ) };
    }
    function hueToRgb( m1, m2, hue ) {
        var v;
        if ( hue < 0 ) { hue += 1; }
        else if ( hue > 1 ) { hue -= 1; }
        if ( 6 * hue < 1 ) { v = m1 + ( m2 - m1 ) * hue * 6; }
        else if ( 2 * hue < 1 ) { v = m2; }
        else if ( 3 * hue < 2 ) { v = m1 + ( m2 - m1 ) * ( 2/3 - hue ) * 6; }
        else { v = m1; }
        return 255 * v;
    }




    var instances = {};

    function Color( val ) {
        this.val = val;
    }

    /**
     * Regular expression for matching rgba colors and extracting their components
     * @type {RegExp}
     */
    Color.rgbOrRgbaRE = /\s*rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(\d+|\d*\.\d+))?\s*\)\s*/;
    Color.hslOrHslaRE = /\s*hsla?\(\s*(\d*\.?\d+)\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(,\s*(\d+|\d*\.\d+))?\s*\)\s*/;

    /**
     * Hash of color keyword names to their corresponding hex values. Encoded for
     * small size and expanded into a hash on startup.
     */
    Color.names = {};

    var names = 'black|0|navy|3k|darkblue|b|mediumblue|1u|blue|1e|darkgreen|jk1|green|5j4|teal|3k|darkcyan|26j|deepskyblue|ad0|darkturquoise|2xe|mediumspringgreen|8nd|lime|va|springgreen|3j|aqua|3k|cyan|0|midnightblue|xunl|dodgerblue|7ogf|lightseagreen|2zsb|forestgreen|2lbs|seagreen|guut|darkslategray|12pk|limegreen|4wkj|mediumseagreen|dwlb|turquoise|5v8f|royalblue|r2p|steelblue|75qr|darkslateblue|2fh3|mediumturquoise|ta9|indigo|32d2|darkolivegreen|emr1|cadetblue|ebu9|cornflowerblue|6z4d|mediumaquamarine|3459|dimgray|3nwf|slateblue|1bok|olivedrab|1opi|slategray|6y5p|lightslategray|9vk9|mediumslateblue|5g0l|lawngreen|27ma|chartreuse|48ao|aquamarine|5w|maroon|18|purple|3k|olive|p6o|gray|3k|lightslateblue|5j7j|skyblue|4q98|lightskyblue|f|blueviolet|3bhk|darkred|15we|darkmagenta|3v|saddlebrown|djc|darkseagreen|69vg|lightgreen|1og1|mediumpurple|3ivc|darkviolet|sfv|palegreen|6zt1|darkorchid|awk|yellowgreen|292e|sienna|7r3v|brown|6sxp|darkgray|6bgf|lightblue|5vlp|greenyellow|7k9|paleturquoise|2pxb|lightsteelblue|169c|powderblue|5jc|firebrick|1rgc|darkgoldenrod|8z55|mediumorchid|2jm0|rosybrown|34jg|darkkhaki|1mfw|silver|49jp|mediumvioletred|8w5h|indianred|8tef|peru|82r|violetred|3ntd|feldspar|212d|chocolate|16eh|tan|ewe|lightgrey|1kqv|palevioletred|6h8g|metle|fnp|orchid|2dj2|goldenrod|abu|crimson|20ik|gainsboro|13mo|plum|12pt|burlywood|1j8q|lightcyan|3794|lavender|8agr|darksalmon|3rsw|violet|6wz8|palegoldenrod|k3g|lightcoral|28k6|khaki|k5o|aliceblue|3n7|honeydew|1dd|azure|f|sandybrown|5469|wheat|1q37|beige|4kp|whitesmoke|p|mintcream|1z9|ghostwhite|46bp|salmon|25bn|antiquewhite|l7p|linen|zz|lightgoldenrodyellow|1yk|oldlace|46qc|red|1gka|magenta|73|fuchsia|0|deeppink|3v8|orangered|9kd|tomato|5zb|hotpink|19p|coral|49o|darkorange|2i8|lightsalmon|41m|orange|w6|lightpink|3i9|pink|1ze|gold|4dx|peachpuff|qh|navajowhite|s4|moccasin|16w|bisque|f|mistyrose|t|blanchedalmond|1d8|papayawhip|so|lavenderblush|80|seashell|zd|cornsilk|ku|lemonchiffon|dt|floralwhite|z|snow|a|yellow|sm|lightyellow|68|ivory|g|white|f'.split('|'),
        i = 0, len = names.length, color = 0, hexColor;
    for(; i < len; i += 2) {
        color += parseInt(names[i + 1], 36);
        hexColor = color.toString(16);
        Color.names[names[i]] = '#000000'.slice(0, -hexColor.length) + hexColor;
    }

    Color.prototype = {
        /**
         * @private
         */
        parse: function() {
            if( !this._color ) {
                var me = this,
                    color = me.val,
                    alpha, vLower, m, rgb;

                // RGB or RGBA colors
                if( m = color.match( Color.rgbOrRgbaRE ) ) {
                    color = me.rgbToHex( +m[1], +m[2], +m[3] );
                    alpha = m[5] ? +m[5] : 1;
                }
                // HSL or HSLA colors
                else if( m = color.match( Color.hslOrHslaRE ) ) {
                    rgb = hsl2rgb( m[1], m[2], m[3] );
                    color = me.rgbToHex( rgb.r, rgb.g, rgb.b );
                    alpha = m[5] ? +m[5] : 1;
                }
                else {
                    if( Color.names.hasOwnProperty( vLower = color.toLowerCase() ) ) {
                        color = Color.names[vLower];
                    }
                    alpha = ( color === 'transparent' ? 0 : 1 );
                }
                me._color = color;
                me._alpha = alpha;
            }
        },

        /**
         * Converts RGB color channels to a hex value string
         */
        rgbToHex: function( r, g, b ) {
            return '#' + ( r < 16 ? '0' : '' ) + r.toString( 16 ) +
                         ( g < 16 ? '0' : '' ) + g.toString( 16 ) +
                         ( b < 16 ? '0' : '' ) + b.toString( 16 );
        },

        /**
         * Retrieve the value of the color in a format usable by IE natively. This will be the same as
         * the raw input value, except for rgb(a) and hsl(a) values which will be converted to a hex value.
         * @param {Element} el The context element, used to get 'currentColor' keyword value.
         * @return {string} Color value
         */
        colorValue: function( el ) {
            this.parse();
            return this._color === 'currentColor' ? PIE.getColor( el.currentStyle.color ).colorValue( el ) : this._color;
        },

        /**
         * Retrieve the value of the color in a normalized six-digit hex format.
         * @param el
         */
        hexValue: function( el ) {
            var color = this.colorValue( el );
            // At this point the color should be either a 3- or 6-digit hex value, or the string "transparent".

            function ch( i ) {
                return color.charAt( i );
            }

            // Fudge transparent to black - should be ignored anyway since its alpha will be 0
            if( color === 'transparent' ) {
                color = '#000';
            }
            // Expand 3-digit to 6-digit hex
            if( ch(0) === '#' && color.length === 4 ) {
                color = '#' + ch(1) + ch(1) + ch(2) + ch(2) + ch(3) + ch(3);
            }
            return color;
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


    /**
     * Retrieve a PIE.Color instance for the given value. A shared singleton instance is returned for each unique value.
     * @param {string} val The CSS string representing the color. It is assumed that this will already have
     *                 been validated as a valid color syntax.
     */
    PIE.getColor = function(val) {
        return instances[ val ] || ( instances[ val ] = new Color( val ) );
    };

    return Color;
})();