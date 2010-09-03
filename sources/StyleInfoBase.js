PIE.StyleInfoBase = {

    /**
     * Create a new StyleInfo class, with the standard constructor, and augmented by
     * the StyleInfoBase's members.
     * @param proto
     */
    newStyleInfo: function( proto ) {
        function StyleInfo( el ) {
            this.targetElement = el;
        }
        PIE.Util.merge( StyleInfo.prototype, PIE.StyleInfoBase, proto );
        StyleInfo._propsCache = {};
        return StyleInfo;
    },

    /**
     * Get an object representation of the target CSS style, caching it for each unique
     * CSS value string.
     * @return {Object}
     */
    getProps: function() {
        var css = this._lastCss = this.getCss(),
            cache = this.constructor._propsCache;
        return css ? ( css in cache ? cache[ css ] : ( cache[ css ] = this.parseCss( css ) ) ) : null;
    },

    /**
     * Get the raw CSS value for the target style
     * @return {string}
     */
    getCss: function() {
        var el = this.targetElement,
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
        return this._lastCss !== this.getCss();
    },

    lock: function() {
        this._locked = 1;
    },

    unlock: function() {
        this._locked = 0;
    }
};
