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

    var names = 'aliceblue|9ehhb|antiquewhite|9sgk7|aqua|1ekf|aquamarine|4zsno|azure|9eiv3|beige|9lhp8|bisque|9zg04|black|0|blanchedalmond|9zhe5|blue|73|blueviolet|5e31e|brown|6g016|burlywood|8ouiv|cadetblue|3qba8|chartreuse|4zshs|chocolate|87k0u|coral|9yvyo|cornflowerblue|3xael|cornsilk|9zjz0|crimson|8l4xo|cyan|1ekf|darkblue|3v|darkcyan|rkb|darkgoldenrod|776yz|darkgray|6mbhl|darkgreen|jr4|darkkhaki|7ehkb|darkmagenta|5f91n|darkolivegreen|3bzfz|darkorange|9yygw|darkorchid|5z6x8|darkred|5f8xs|darksalmon|9441m|darkseagreen|5lwgf|darkslateblue|2th1n|darkslategray|1ugcv|darkturquoise|14up|darkviolet|5rw7n|deeppink|9yavn|deepskyblue|11xb|dimgray|442g9|dodgerblue|16xof|firebrick|6y7tu|floralwhite|9zkds|forestgreen|1cisi|fuchsia|9y70f|gainsboro|8m8kc|ghostwhite|9pq0v|gold|9zda8|goldenrod|8j4f4|gray|50i2o|green|pa8|greenyellow|6senj|honeydew|9eiuo|hotpink|9yrp0|indianred|80gnw|indigo|2xcoy|ivory|9zldc|khaki|9edu4|lavender|90c8q|lavenderblush|9ziet|lawngreen|4vk74|lemonchiffon|9zkct|lightblue|6s73a|lightcoral|9dtog|lightcyan|8s1rz|lightgoldenrodyellow|9sjiq|lightgreen|5nkwg|lightgrey|89jo3|lightpink|9z6wx|lightsalmon|9z2ii|lightseagreen|19xgq|lightskyblue|5arju|lightslategray|4nwk9|lightsteelblue|6wau6|lightyellow|9zlcw|lime|1edc|limegreen|1zcxe|linen|9shk6|magenta|9y70f|maroon|4zsow|mediumauqamarine|40eju|mediumblue|5p|mediumorchid|79qkz|mediumpurple|5r3rs|mediumseagreen|2d9ip|mediumslateblue|4tcku|mediumspringgreen|1di2|mediumturquoise|2uabw|mediumvioletred|7rn9h|midnightblue|z980|mintcream|9ljp6|mistyrose|9zg0x|moccasin|9zfzp|navajowhite|9zest|navy|3k|oldlace|9wq92|olive|50hz4|olivedrab|42v4z|orange|9z3eo|orangered|9ykg0|orchid|8iu3a|palegoldenrod|9bl4a|palegreen|5yw0o|paleturquoise|6v4ku|palevioletred|8g0wj|papayawhip|9zi6t|peachpuff|9ze0p|peru|80oqn|pink|9z8wb|plum|8nba5|powderblue|6wgdi|purple|4zssg|red|9y6tc|rosybrown|7cv4f|royalblue|2jvtt|saddlebrown|5fmkz|salmon|9rvci|sandybrown|9jn1c|seagreen|1tdnb|seashell|9zje6|sienna|6973h|silver|7ir40|skyblue|5arjf|slateblue|45e4t|slategray|4e100|snow|9zke2|springgreen|1egv|steelblue|2r1kk|tan|87yx8|teal|pds|thistle|8ggk8|tomato|9yqfb|turquoise|2j4r4|violet|9b10u|wheat|9ld4j|white|9zldr|whitesmoke|9lhpx|yellow|9zl6o|yellowgreen|61fzm'.split('|'),
        i = 0, len = names.length, val;
    for(; i < len; i += 2) {
        val = parseInt(names[i + 1], 36).toString(16);
        Color.names[names[i]] = '#' + ('000000' + val).substr(val.length);
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