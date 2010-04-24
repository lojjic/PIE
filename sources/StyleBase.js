PIE.StyleBase = {
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
