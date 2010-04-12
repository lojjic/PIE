PIE.StyleBase = {
    colorRE: /(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})|rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,\s*(\d+|\d*\.\d+))?\s*\)|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|purple|red|silver|teal|white|yellow/,
    lengthRE: /[\-\+]?\d*\.?\d*(px|em|ex|mm|cm|in|pt|pc)|[\-\+]?0/,
    percentRE: /[\-\+]?\d+\.?\d*%|[\-\+]?0/,
    angleRE: /[\-\+]?\d+(deg|rad|grad|turn)|[\-\+]?0/,
    urlRE: /^url\(\s*['"]?([^\s\)"]*)['"]?\s*\)$/,
    trimRE: /^\s*|\s*$/g,

    /**
     * Get an object representation of the target CSS style, caching it as long as the
     * underlying CSS value hasn't changed.
     * @return {Object}
     */
    getProps: function() {
        if( this.changed() ) {
            this._props = this.parseCss( this._css = this.getCss() );
        }
        return this._props;
    },

    /**
     * Get the raw CSS value for the target style
     * @return {string}
     */
    getCss: function() {
        return this.element.style[ this.styleProperty ] ||
               this.element.currentStyle.getAttribute( this.cssProperty );
    },

    /**
     * Determine whether the target CSS style is active.
     * @return {boolean}
     */
    isActive: function() {
        return !!this.getProps();
    },

    /**
     * Determine whether the target CSS style has changed since the last time it was parsed.
     * @return {boolean}
     */
    changed: function() {
        return this._css !== this.getCss();
    },

    /**
     * Trim a string
     * @param {string} str
     * @return {string}
     */
    trim: function( str ) {
        return str.replace( this.trimRE, '' );
    }
};
