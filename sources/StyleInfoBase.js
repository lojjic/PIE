PIE.StyleInfoBase = {

    /**
     * Create a new StyleInfo class, with the standard constructor, and augmented by
     * the StyleInfoBase's members.
     * @param proto
     */
    newStyleInfo: function( proto ) {
        function StyleInfo( el ) {
            this.element = el;
        }
        PIE.Util.merge( StyleInfo.prototype, PIE.StyleInfoBase, proto );
        return StyleInfo;
    },

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
        var el = this.element,
            s = el.style,
            cs = el.currentStyle,
            cssProp = this.cssProperty,
            styleProp = this.styleProperty,
            prefixedCssProp = this._prefixedCssProp || ( this._prefixedCssProp = PIE.CSS_PREFIX + cssProp ),
            prefixedStyleProp = this._prefixedStyleProp || ( this._prefixedStyleProp = PIE.STYLE_PREFIX + styleProp.charAt(0).toUpperCase() + styleProp.substring(1) );
        return s[ prefixedStyleProp ] || cs.getAttribute( prefixedCssProp ) || s[ styleProp ] || cs.getAttribute( cssProp );
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
    }
};
