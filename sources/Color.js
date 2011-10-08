/**
 * Abstraction for colors values. Allows detection of rgba values. A singleton instance per unique
 * value is returned from PIE.getColor() - always use that instead of instantiating directly.
 * @constructor
 * @param {string} val The raw CSS string value for the color
 */
PIE.Color = (function() {
    var instances = {};

    function Color( val ) {
        this.val = val;
    }

    /**
     * Regular expression for matching rgba colors and extracting their components
     * @type {RegExp}
     */
    Color.rgbaRE = /\s*rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+|\d*\.\d+)\s*\)\s*/;

    Color.names = {
        "aliceblue":"F0F8FF", "antiquewhite":"FAEBD7", "aqua":"0FF",
        "aquamarine":"7FFFD4", "azure":"F0FFFF", "beige":"F5F5DC",
        "bisque":"FFE4C4", "black":"000", "blanchedalmond":"FFEBCD",
        "blue":"00F", "blueviolet":"8A2BE2", "brown":"A52A2A",
        "burlywood":"DEB887", "cadetblue":"5F9EA0", "chartreuse":"7FFF00",
        "chocolate":"D2691E", "coral":"FF7F50", "cornflowerblue":"6495ED",
        "cornsilk":"FFF8DC", "crimson":"DC143C", "cyan":"0FF",
        "darkblue":"00008B", "darkcyan":"008B8B", "darkgoldenrod":"B8860B",
        "darkgray":"A9A9A9", "darkgreen":"006400", "darkkhaki":"BDB76B",
        "darkmagenta":"8B008B", "darkolivegreen":"556B2F", "darkorange":"FF8C00",
        "darkorchid":"9932CC", "darkred":"8B0000", "darksalmon":"E9967A",
        "darkseagreen":"8FBC8F", "darkslateblue":"483D8B", "darkslategray":"2F4F4F",
        "darkturquoise":"00CED1", "darkviolet":"9400D3", "deeppink":"FF1493",
        "deepskyblue":"00BFFF", "dimgray":"696969", "dodgerblue":"1E90FF",
        "firebrick":"B22222", "floralwhite":"FFFAF0", "forestgreen":"228B22",
        "fuchsia":"F0F", "gainsboro":"DCDCDC", "ghostwhite":"F8F8FF",
        "gold":"FFD700", "goldenrod":"DAA520", "gray":"808080",
        "green":"008000", "greenyellow":"ADFF2F", "honeydew":"F0FFF0",
        "hotpink":"FF69B4", "indianred":"CD5C5C", "indigo":"4B0082",
        "ivory":"FFFFF0", "khaki":"F0E68C", "lavender":"E6E6FA",
        "lavenderblush":"FFF0F5", "lawngreen":"7CFC00", "lemonchiffon":"FFFACD",
        "lightblue":"ADD8E6", "lightcoral":"F08080", "lightcyan":"E0FFFF",
        "lightgoldenrodyellow":"FAFAD2", "lightgreen":"90EE90", "lightgrey":"D3D3D3",
        "lightpink":"FFB6C1", "lightsalmon":"FFA07A", "lightseagreen":"20B2AA",
        "lightskyblue":"87CEFA", "lightslategray":"789", "lightsteelblue":"B0C4DE",
        "lightyellow":"FFFFE0", "lime":"0F0", "limegreen":"32CD32",
        "linen":"FAF0E6", "magenta":"F0F", "maroon":"800000",
        "mediumauqamarine":"66CDAA", "mediumblue":"0000CD", "mediumorchid":"BA55D3",
        "mediumpurple":"9370D8", "mediumseagreen":"3CB371", "mediumslateblue":"7B68EE",
        "mediumspringgreen":"00FA9A", "mediumturquoise":"48D1CC", "mediumvioletred":"C71585",
        "midnightblue":"191970", "mintcream":"F5FFFA", "mistyrose":"FFE4E1",
        "moccasin":"FFE4B5", "navajowhite":"FFDEAD", "navy":"000080",
        "oldlace":"FDF5E6", "olive":"808000", "olivedrab":"688E23",
        "orange":"FFA500", "orangered":"FF4500", "orchid":"DA70D6",
        "palegoldenrod":"EEE8AA", "palegreen":"98FB98", "paleturquoise":"AFEEEE",
        "palevioletred":"D87093", "papayawhip":"FFEFD5", "peachpuff":"FFDAB9",
        "peru":"CD853F", "pink":"FFC0CB", "plum":"DDA0DD",
        "powderblue":"B0E0E6", "purple":"800080", "red":"F00",
        "rosybrown":"BC8F8F", "royalblue":"4169E1", "saddlebrown":"8B4513",
        "salmon":"FA8072", "sandybrown":"F4A460", "seagreen":"2E8B57",
        "seashell":"FFF5EE", "sienna":"A0522D", "silver":"C0C0C0",
        "skyblue":"87CEEB", "slateblue":"6A5ACD", "slategray":"708090",
        "snow":"FFFAFA", "springgreen":"00FF7F", "steelblue":"4682B4",
        "tan":"D2B48C", "teal":"008080", "thistle":"D8BFD8",
        "tomato":"FF6347", "turquoise":"40E0D0", "violet":"EE82EE",
        "wheat":"F5DEB3", "white":"FFF", "whitesmoke":"F5F5F5",
        "yellow":"FF0", "yellowgreen":"9ACD32"
    };

    Color.prototype = {
        /**
         * @private
         */
        parse: function() {
            if( !this._color ) {
                var me = this,
                    v = me.val,
                    vLower,
                    m = v.match( Color.rgbaRE );
                if( m ) {
                    me._color = 'rgb(' + m[1] + ',' + m[2] + ',' + m[3] + ')';
                    me._alpha = parseFloat( m[4] );
                }
                else {
                    if( ( vLower = v.toLowerCase() ) in Color.names ) {
                        v = '#' + Color.names[vLower];
                    }
                    me._color = v;
                    me._alpha = ( v === 'transparent' ? 0 : 1 );
                }
            }
        },

        /**
         * Retrieve the value of the color in a format usable by IE natively. This will be the same as
         * the raw input value, except for rgba values which will be converted to an rgb value.
         * @param {Element} el The context element, used to get 'currentColor' keyword value.
         * @return {string} Color value
         */
        colorValue: function( el ) {
            this.parse();
            return this._color === 'currentColor' ? el.currentStyle.color : this._color;
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